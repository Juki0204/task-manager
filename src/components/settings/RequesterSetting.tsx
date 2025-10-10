"use client";

import { supabase } from "@/utils/supabase/supabase";
import { Button, Input } from "@headlessui/react";
import { useEffect, useState } from "react";
import { CorrectBtn } from "../ui/Btn";
import { toast } from "sonner";
import { useAuth } from "@/app/AuthProvider";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { MdDragIndicator } from "react-icons/md";

interface Client {
  id: number;
  name: string;
}

interface Requester {
  id: number;
  name: string;
  company: string;
  order: number;
}

export default function RequesterSetting() {
  const [clients, setClients] = useState<Client[]>([]);
  const [requesters, setRequesters] = useState<Requester[]>([]);
  const [newName, setNewName] = useState<{ [key: string]: string }>({});
  const { user } = useAuth();

  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: {
      distance: 5,
    },
  }));

  const getClientsAndRequesters = async () => {
    const { data: clientData } = await supabase
      .from('clients')
      .select('*')

    const { data: requesterData } = await supabase
      .from('requesters')
      .select('*')
      .order("order", { ascending: true });

    if (!clientData || !requesterData) return;
    setClients(clientData);
    setRequesters(requesterData);
  }

  const addRequester = async (client: string) => {
    if (!newName[client]) return;

    const existing = requesters.filter((r) => r.company === client);
    const order = existing.length; //末尾に追加

    const { error } = await supabase
      .from('requesters')
      .insert({
        name: newName[client],
        company: client,
        order,
      });

    if (error) {
      alert("依頼者の登録に失敗しました");
    } else if (user) {
      toast(`${user.name}さんが依頼者一覧を更新しました`);
      setNewName((prev) => ({ ...prev, [client]: "" }));
      getClientsAndRequesters();
    }
  }

  const deleteRequester = async (id: number) => {
    const { error } = await supabase.from('requesters').delete().eq('id', id);

    if (error) {
      alert("依頼者の削除に失敗しました");
    } else if (user) {
      toast(`${user.name}さんが依頼者一覧を更新しました`);
      getClientsAndRequesters();
    }
  }

  const updateOrder = async (company: string, sortedList: Requester[]) => {
    for (const [index, r] of sortedList.entries()) {
      await supabase
        .from("requesters")
        .update({ order: index })
        .eq("id", r.id)
        .eq("company", company);
    }
  };

  const handleDragEnd = (event: DragEndEvent, company: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const filtered = requesters.filter((r) => r.company === company);
    const oldIndex = filtered.findIndex((r) => r.id === active.id);
    const newIndex = filtered.findIndex((r) => r.id === over.id);

    const newSorted = arrayMove(filtered, oldIndex, newIndex);
    const others = requesters.filter((r) => r.company !== company);
    const all = [...others, ...newSorted];

    setRequesters(all); // UI即時反映
    updateOrder(company, newSorted); // DB更新（非同期）
  };

  useEffect(() => {
    getClientsAndRequesters();
  }, []);

  return (
    <div className="grid grid-cols-5 gap-2">
      <h2 className="col-span-5 text-white font-bold p-1 pt-0 text-center border-b border-white">依頼者一覧</h2>
      {clients
        .sort((a, b) => a.id - b.id)
        .map((client: Client) => {
          const companyRequesters = requesters
            .filter((r) => r.company === client.name)
            .sort((a, b) => a.order - b.order);

          return (
            <div
              key={client.id}
              className="bg-neutral-400 rounded-md p-2 grid grid-rows-[min-content_1fr_min-content]"
            >
              <h3 className="text-center pb-1 font-bold">{client.name}</h3>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(e) => handleDragEnd(e, client.name)}
              >
                <SortableContext
                  items={companyRequesters.map((r) => r.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="flex flex-col gap-1 py-2">
                    {companyRequesters.map((r) => (
                      <SortableRequesterItem
                        key={r.id}
                        item={r}
                        deleteRequester={deleteRequester}
                      />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>

              <div className="mb-0 flex justify-between gap-1 border-t border-neutral-500 pt-2">
                <Input value={newName[client.name] || ""} onChange={(e) => setNewName((prev) => ({ ...prev, [client.name]: e.target.value }))} type="text" placeholder="名前を入力" className="bg-white rounded-sm w-36 px-2"></Input>
                <CorrectBtn onClick={() => addRequester(client.name)} className="!mt-0 text-sm !p-1">追加</CorrectBtn>
              </div>
            </div>
          )
        })
      }
    </div>
  )
}



interface SrotableRequesterItemProps {
  item: Requester;
  deleteRequester: (id: number) => Promise<void>;
}

function SortableRequesterItem({ item, deleteRequester }: SrotableRequesterItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="flex justify-between bg-neutral-300 rounded-sm p-1 pl-6 relative"
    >
      <MdDragIndicator
        {...listeners}
        className="absolute top-1/2 left-1 -translate-y-1/2 text-neutral-500 cursor-grab active:cursor-grabbing"
      />
      <span>{item.name}</span>
      <Button
        onClick={() => deleteRequester(item.id)}
        className="bg-red-700 px-2 rounded-md text-white text-sm cursor-pointer hover:opacity-60"
      >
        削除
      </Button>
    </li>
  )
}