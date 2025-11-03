"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/supabase";
import { useAuth } from "@/app/AuthProvider";
import { toast } from "sonner";
import { Button, Input } from "@headlessui/react";
import { MdDragIndicator } from "react-icons/md";

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

import { CorrectBtn } from "../ui/Btn";


interface PriceItem {
  id: number;
  order: number;
  work_name: string;
  price: number;
  category: string;
  work_description: string;
}

type FixPriceMap = Record<
  number,
  {
    work_name: string;
    price: string;
    work_description: string;
  }
>;

const CATEGORIES = ["WEB", "印刷", "出力", "その他"];


export default function RequesterSetting() {
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [newPrices, setNewPrices] = useState<
    Record<string, { work_name: string; price: string; work_description: string }>
  >({
    WEB: { work_name: "", price: "", work_description: "" },
    印刷: { work_name: "", price: "", work_description: "" },
    出力: { work_name: "", price: "", work_description: "" },
    その他: { work_name: "", price: "", work_description: "" },
  });

  const [fixPrices, setFixPrices] = useState<FixPriceMap>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const { user } = useAuth();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));


  // Supabase CRUD
  const getPrices = async () => {
    const { data, error } = await supabase
      .from("prices")
      .select("*")
      .order("order", { ascending: true });

    if (error) {
      console.error(error);
      alert("料金データの取得に失敗しました。");
      return;
    }
    setPrices(data || []);
  };

  const addPrice = async (order: number, category: string) => {
    const target = newPrices[category];
    if (!target.work_name || !target.price) {
      alert("作業名・単価は入力必須です。");
      return;
    }

    const { error } = await supabase.from("prices").insert({
      order,
      work_name: target.work_name,
      price: Number(target.price),
      category,
      work_description: target.work_description,
    });

    if (error) {
      alert("登録に失敗しました");
    } else {
      if (user) toast.success(`${user.name}さんが料金一覧を更新しました`);
      setNewPrices((prev) => ({
        ...prev,
        [category]: { work_name: "", price: "", work_description: "" },
      }));
      getPrices();
    }
  };

  const deletePrice = async (id: number) => {
    const { error } = await supabase.from("prices").delete().eq("id", id);
    if (error) {
      alert("削除に失敗しました");
    } else {
      if (user) toast(`${user.name}さんが料金一覧を更新しました`);
      getPrices();
    }
  };

  const updatePrice = async (id: number, updated: Partial<PriceItem>) => {
    const { error } = await supabase.from("prices").update(updated).eq("id", id);
    if (error) {
      alert("更新に失敗しました");
    } else {
      if (user) toast(`${user.name}さんが料金一覧を更新しました`);
      getPrices();
    }
  };


  // 並び替え処理
  const updateOrder = async (categoryPrices: PriceItem[]) => {
    const updates = categoryPrices.map((p, index) =>
      supabase.from("prices").update({ order: index }).eq("id", p.id)
    );
    const results = await Promise.all(updates);
    const errors = results.filter((r) => r.error);
    if (errors.length > 0) console.error(errors);
  };

  const handleDragEnd = (event: DragEndEvent, category: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const filtered = prices.filter((p) => p.category === category);
    const oldIndex = filtered.findIndex((p) => p.id === active.id);
    const newIndex = filtered.findIndex((p) => p.id === over.id);

    const newCategoryList = arrayMove(filtered, oldIndex, newIndex);
    const updatedCategoryList = newCategoryList.map((p, index) => ({ ...p, order: index }));

    setPrices((prev) => [
      ...prev.filter((p) => p.category !== category),
      ...updatedCategoryList,
    ]);

    updateOrder(newCategoryList).catch((err) => {
      console.error(err);
      alert("順番の保存に失敗しました。");
    });
  };

  useEffect(() => {
    getPrices();
  }, []);



  return (
    <div className="grid grid-cols-2 gap-2">
      <h2 className="col-span-2 text-white font-bold p-1 pt-0 text-center border-b border-white">
        請求単価一覧
      </h2>

      {CATEGORIES.map((cat) => {
        const categoryPrices = prices
          .filter((p) => p.category === cat)
          .sort((a, b) => a.order - b.order);
        const newPrice = newPrices[cat];

        return (
          <div
            key={cat}
            className="bg-neutral-400 rounded-md p-2 grid grid-rows-[min-content_1fr_min-content]"
          >
            <h3 className="text-center pb-1 font-bold">{cat}</h3>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(e) => handleDragEnd(e, cat)}
            >
              <SortableContext
                items={categoryPrices.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="flex flex-col gap-1 py-2">
                  <li className="grid grid-cols-8 gap-0.5 pl-5.5 bg-neutral-300 rounded-sm p-1 pr-0.5">
                    <span className="col-span-5 text-center border-r border-neutral-400">
                      作業名
                    </span>
                    <span className="col-span-2 text-center border-r border-neutral-400">
                      単価
                    </span>
                    <span className="col-span-1 text-center">編集</span>
                  </li>

                  {categoryPrices.map((p) => (
                    <SortablePriceItem
                      key={p.id}
                      item={p}
                      updatePrice={updatePrice}
                      deletePrice={deletePrice}
                      fixPrices={fixPrices}
                      setFixPrices={setFixPrices}
                      editingId={editingId}
                      setEditingId={setEditingId}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>

            <div className="mb-0 grid grid-cols-8 gap-1 border-t border-neutral-500 pt-2">
              <Input
                value={newPrice.work_name}
                onChange={(e) =>
                  setNewPrices((prev) => ({
                    ...prev,
                    [cat]: { ...prev[cat], work_name: e.target.value },
                  }))
                }
                placeholder="作業名を入力"
                className="col-span-5 bg-white rounded-sm px-2"
              />
              <Input
                value={newPrice.price}
                onChange={(e) =>
                  setNewPrices((prev) => ({
                    ...prev,
                    [cat]: { ...prev[cat], price: e.target.value },
                  }))
                }
                type="tel"
                placeholder="1000"
                className="col-span-2 bg-white rounded-sm px-2 text-right"
              />
              <CorrectBtn
                disabled={!newPrice.work_name || !newPrice.price}
                onClick={() => {
                  const order = prices.filter((p) => p.category === cat).length;
                  addPrice(order, cat);
                }}
                className="col-span-1 text-sm !m-0 !p-1 rounded-md cursor-pointer hover:opacity-70 data-disabled:pointer-events-none"
              >
                追加
              </CorrectBtn>

              <Input
                value={newPrice.work_description}
                onChange={(e) =>
                  setNewPrices((prev) => ({
                    ...prev,
                    [cat]: { ...prev[cat], work_description: e.target.value },
                  }))
                }
                placeholder="作業内容の詳細説明を入力"
                className="col-span-7 bg-white rounded-sm px-2"
              />
              <Button
                onClick={() =>
                  setNewPrices((prev) => ({
                    ...prev,
                    [cat]: { work_name: "", price: "", work_description: "" },
                  }))
                }
                className="col-span-1 bg-red-700 p-1 rounded-md text-white text-sm cursor-pointer hover:opacity-60"
              >
                リセット
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}




interface SortablePriceItemProps {
  item: PriceItem;
  updatePrice: (id: number, updated: Partial<PriceItem>) => Promise<void>;
  deletePrice: (id: number) => Promise<void>;
  fixPrices: FixPriceMap;
  setFixPrices: React.Dispatch<React.SetStateAction<FixPriceMap>>;
  editingId: number | null;
  setEditingId: (id: number | null) => void;
}

function SortablePriceItem({
  item,
  updatePrice,
  deletePrice,
  fixPrices,
  setFixPrices,
  editingId,
  setEditingId,
}: SortablePriceItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.id,
  });

  const style = { transform: CSS.Transform.toString(transform), transition };
  const current = fixPrices[item.id] || { work_name: "", price: "", work_description: "" };
  const isEditable =
    editingId === item.id &&
    (current.work_name || current.price || current.work_description);

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="grid grid-cols-8 gap-1 bg-neutral-300 rounded-sm p-1 pl-5.5 relative"
    >
      <MdDragIndicator
        {...listeners}
        className="absolute top-1/2 left-1 -translate-y-1/2 text-neutral-500 cursor-grab active:cursor-grabbing"
      />

      <Input
        type="text"
        defaultValue={item.work_name}
        onChange={(e) => {
          setFixPrices((prev) => ({
            ...prev,
            [item.id]: { ...current, work_name: e.target.value },
          }));
          setEditingId(item.id);
        }}
        className="col-span-5 rounded-sm bg-neutral-200 px-1"
      />

      <Input
        type="tel"
        defaultValue={item.price}
        onChange={(e) => {
          setFixPrices((prev) => ({
            ...prev,
            [item.id]: { ...current, price: e.target.value },
          }));
          setEditingId(item.id);
        }}
        className="col-span-2 rounded-sm bg-neutral-200 px-1 text-right"
      />

      <Button
        disabled={!isEditable}
        onClick={() => {
          updatePrice(item.id, {
            work_name: current.work_name || item.work_name,
            price: Number(current.price || item.price),
            work_description: current.work_description || item.work_description,
          });
          setFixPrices((prev) => ({
            ...prev,
            [item.id]: { work_name: "", price: "", work_description: "" },
          }));
          setEditingId(null);
        }}
        className={`col-span-1 px-2 rounded-md text-white text-sm ${isEditable
          ? "bg-sky-700 hover:opacity-60 cursor-pointer"
          : "bg-gray-400 opacity-50"
          }`}
      >
        変更
      </Button>

      <Input
        type="text"
        defaultValue={item.work_description}
        placeholder="作業内容の詳細説明を記載"
        onChange={(e) => {
          setFixPrices((prev) => ({
            ...prev,
            [item.id]: { ...current, work_description: e.target.value },
          }));
          setEditingId(item.id);
        }}
        className="col-span-7 rounded-sm bg-neutral-200 px-1 placeholder:text-neutral-400"
      />

      <Button
        onClick={() => deletePrice(item.id)}
        className="col-span-1 bg-red-700 px-2 rounded-md text-white text-sm cursor-pointer hover:opacity-60"
      >
        削除
      </Button>
    </li>
  );
}
