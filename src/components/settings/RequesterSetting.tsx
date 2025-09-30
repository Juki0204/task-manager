"use client";

import { supabase } from "@/utils/supabase/supabase";
import { Button, Input } from "@headlessui/react";
import { useEffect, useState } from "react";
import { CorrectBtn } from "../ui/Btn";
import { toast } from "sonner";
import { useAuth } from "@/app/AuthProvider";

interface Client {
  id: number;
  name: string;
}

interface Requester {
  id: number;
  name: string;
  company: string;
}

export default function RequesterSetting() {
  const [clients, setClients] = useState<Client[]>([]);
  const [requesters, setRequesters] = useState<Requester[]>([]);
  const [newName, setNewName] = useState<{ [key: string]: string }>({});

  const { user } = useAuth();

  const getClientsAndRequesters = async () => {
    const { data: clientData } = await supabase
      .from('clients')
      .select('*')

    const { data: requesterData } = await supabase
      .from('requesters')
      .select('*')

    if (!clientData || !requesterData) return;
    setClients(clientData);
    setRequesters(requesterData);
  }

  const addRequester = async (client: string) => {
    if (!newName[client]) return;

    console.log(client, newName[client]);

    const { error } = await supabase
      .from('requesters')
      .insert({
        name: newName[client],
        company: client
      });

    if (error) {
      alert("依頼者の登録に失敗しました");
    } else {
      if (!user) return;
      toast(`${user.name}さんが依頼者一覧を更新しました`);
    }

    setNewName((prev) => ({ ...prev, [client]: "" }));
    getClientsAndRequesters();
  }

  const deleteRequester = async (requester: string, client: string) => {
    const { error } = await supabase.from('requesters').delete().eq('name', requester).eq('company', client);

    if (error) {
      alert("依頼者の削除に失敗しました");
    } else {
      if (!user) return;
      toast(`${user.name}さんが依頼者一覧を更新しました`);
    }

    getClientsAndRequesters();
  }

  useEffect(() => {
    getClientsAndRequesters();
  }, []);

  return (
    <div className="grid grid-cols-5 gap-2">
      {
        [...clients]
          .sort((a, b) => a.id - b.id)
          .map((client: Client) => (
            <div key={client.id} className="bg-neutral-400 rounded-md p-2 grid grid-rows-[min-content_1fr_min-content]">
              <h3 className="text-center pb-1 font-bold">{client.name}</h3>
              <ul className="flex flex-col gap-1 py-2">
                {requesters.filter(r => r.company === client.name)
                  .map(r => (
                    <li key={r.id} className="flex justify-between bg-neutral-300 rounded-sm p-1 pl-2">
                      {r.name}
                      <Button onClick={() => deleteRequester(r.name, client.name)} className="bg-red-700 px-2 rounded-md text-white text-sm cursor-pointer hover:opacity-60">削除</Button>
                    </li>
                  ))}
              </ul>

              <div className="mb-0 flex justify-between gap-1 border-t border-neutral-500 pt-2">
                <Input value={newName[client.name] || ""} onChange={(e) => setNewName((prev) => ({ ...prev, [client.name]: e.target.value }))} type="text" placeholder="名前を入力" className="bg-white rounded-sm w-36 px-2"></Input>
                <CorrectBtn onClick={() => addRequester(client.name)} className="!mt-0 text-sm !p-1">追加</CorrectBtn>
              </div>
            </div>
          ))
      }
    </div>
  )
}