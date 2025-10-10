"use client";

import { supabase } from "@/utils/supabase/supabase";
import { Button, Input, Select } from "@headlessui/react";
import { useEffect, useState } from "react";
import { CorrectBtn } from "../ui/Btn";
import { toast } from "sonner";
import { useAuth } from "@/app/AuthProvider";

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

interface PriceItem {
  id: number;
  order: number;
  work_name: string;
  price: number;
  category: string;
}

interface updatePriceType {
  work_name: string;
  price: string;
}

const CATEGORIES = ["WEB", "印刷", "出力", "その他"];

export default function RequesterSetting() {
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [newPrices, setNewPrices] = useState<Record<string, { work_name: string; price: string }>>({
    WEB: { work_name: "", price: "" },
    印刷: { work_name: "", price: "" },
    出力: { work_name: "", price: "" },
    その他: { work_name: "", price: "" },
  });

  const [fixPrice, setFixPrice] = useState({ work_name: "", price: "" });
  const { user } = useAuth();

  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: {
      distance: 5,
    },
  }));

  const getPrices = async () => {
    const { data, error } = await supabase
      .from('prices')
      .select('*')
      .order("order", { ascending: true });

    if (error) {
      console.error(error);
      alert("料金データの取得に失敗しました。");
      return;
    }
    setPrices(data || []);
  };

  const addPrice = async (order: number, category: string) => {
    if (!newPrices[category].work_name || !newPrices[category].price) {
      alert("作業名・単価は入力必須です。");
      return;
    }

    const { error } = await supabase
      .from('prices')
      .insert({
        order: order,
        work_name: newPrices[category].work_name,
        price: Number(newPrices[category].price),
        category: category,
      });

    if (error) {
      alert("登録に失敗しました");
    } else {
      if (user) toast.success(`${user.name}さんが料金一覧を更新しました`);
      setNewPrices((prev) => ({ ...prev, [category]: { work_name: "", price: "" } }));
      getPrices();
    }
  }


  const deletePrice = async (id: number) => {
    const { error } = await supabase.from("prices").delete().eq("id", id);

    if (error) {
      alert("更新に失敗しました");
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

  //並び替え後にorderを更新する
  const updateOrder = async (categoryPrices: PriceItem[]) => {
    try {
      // 並列処理で一気に更新
      const updates = categoryPrices.map((p, index) =>
        supabase.from("prices").update({ order: index }).eq("id", p.id)
      );
      const results = await Promise.all(updates);

      const errors = results.filter((r) => r.error);
      if (errors.length > 0) {
        console.error(errors);
        throw new Error("一部のorder更新に失敗しました。");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDragEnd = (event: DragEndEvent, category: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const filtered = prices.filter((p) => p.category === category);
    const oldIndex = filtered.findIndex((p) => p.id === active.id);
    const newIndex = filtered.findIndex((p) => p.id === over.id);

    const newCategoryList = arrayMove(filtered, oldIndex, newIndex);
    const updatedCategoryList = newCategoryList.map((p, index) => ({
      ...p,
      order: index,
    }));

    setPrices((prev) => [
      ...prev.filter((p) => p.category !== category),
      ...updatedCategoryList,
    ]);

    updateOrder(newCategoryList).catch((err) => {
      console.error(err);
      alert("順番の保存に失敗しました。");
    });
  }

  useEffect(() => {
    getPrices();
  }, []);

  return (
    <div className="grid grid-cols-2 gap-2">
      <h2 className="col-span-2 text-white font-bold p-1 pt-0 text-center border-b border-white">請求単価一覧</h2>
      {CATEGORIES.map((cat) => {
        const categoryPrices = prices
          .filter((p) => p.category === cat)
          .sort((a, b) => a.order - b.order);

        const newPrice = newPrices[cat];

        return (
          <div key={cat} className="bg-neutral-400 rounded-md p-2 grid grid-rows-[min-content_1fr_min-content]">
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
                    <span className="col-span-4 pr-5.5 text-center border-r border-neutral-400">作業名</span>
                    <span className="col-span-2 text-center border-r border-neutral-400">単価</span>
                    <span className="col-span-1 text-center border-r border-neutral-400">更新</span>
                    <span className="col-span-1 text-center">削除</span>
                  </li>

                  {categoryPrices.map((p) => (
                    <SortablePriceItem
                      key={p.id}
                      item={p}
                      updatePrice={updatePrice}
                      deletePrice={deletePrice}
                      setFixPrice={setFixPrice}
                      fixPrice={fixPrice}
                    />
                  ))}
                </ul>

              </SortableContext>

            </DndContext>

            <div className="mb-0 grid grid-cols-8 gap-1 border-t border-neutral-500 pt-2">
              <Input
                value={newPrice.work_name || ""}
                onChange={(e) =>
                  setNewPrices((prev) => ({
                    ...prev,
                    [cat]: { ...prev[cat], work_name: e.target.value },
                  }))
                }
                type="text"
                placeholder="作業名を入力"
                className="col-span-4 bg-white rounded-sm px-2"
              />
              <Input
                value={newPrice.price || ""}
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
              <CorrectBtn onClick={() => {
                const priceIndex = [...prices].filter(p => p.category === "WEB").length;
                addPrice(priceIndex, cat);
                setNewPrices((prev) => ({
                  ...prev,
                  [cat]: { work_name: "", price: "" },
                }));
              }} className="col-span-2 !mt-0 text-sm !p-1 cursor-pointer hover:opacity-70">追加</CorrectBtn>
            </div>
          </div>
        );
      })}
    </div >
  )
}



interface SortablePriceItemProps {
  item: PriceItem;
  updatePrice: (id: number, updated: Partial<PriceItem>) => Promise<void>;
  deletePrice: (id: number) => Promise<void>;
  fixPrice: { work_name: string; price: string };
  setFixPrice: React.Dispatch<React.SetStateAction<{ work_name: string; price: string }>>;
}

function SortablePriceItem({ item, updatePrice, deletePrice, fixPrice, setFixPrice }: SortablePriceItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

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
        onChange={(e) => setFixPrice((prev: updatePriceType) => ({ ...prev, work_name: e.target.value }))}
        className="col-span-4 rounded-sm bg-neutral-200 px-1"
      />
      <Input
        type="tel"
        defaultValue={item.price}
        onChange={(e) => setFixPrice((prev: updatePriceType) => ({ ...prev, price: e.target.value }))}
        className="col-span-2 rounded-sm bg-neutral-200 px-1 text-right"
      />
      <Button
        onClick={() => updatePrice(item.id, {
          work_name: fixPrice.work_name || item.work_name,
          price: Number(fixPrice.price || item.price),
        })}
        className="col-span-1 bg-sky-700 px-2 rounded-md text-white text-sm cursor-pointer hover:opacity-60"
      >
        変更
      </Button>
      <Button
        onClick={() => deletePrice(item.id)}
        className="col-span-1 bg-red-700 px-2 rounded-md text-white text-sm cursor-pointer hover:opacity-60"
      >
        削除
      </Button>
    </li>
  )
}