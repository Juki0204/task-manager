"use client";

import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { MdDragIndicator } from "react-icons/md";
import { Button, Input } from "@headlessui/react";
import type { PriceItem } from "./PriceSetting";

interface NewPriceItem {
  work_name: string;
  price: string;
  work_description: string;
}

interface SortablePriceItemProps {
  item: PriceItem;
  updatePrice: (id: number, updated: Partial<PriceItem>) => Promise<void>;
  deletePrice: (id: number) => Promise<void>;
  fixPrices: Record<number, NewPriceItem>;
  setFixPrices: React.Dispatch<React.SetStateAction<Record<number, NewPriceItem>>>;
  editingId: number | null;
  setEditingId: (id: number | null) => void;
}

export default function SortablePriceItem({
  item,
  updatePrice,
  deletePrice,
  fixPrices,
  setFixPrices,
  editingId,
  setEditingId,
}: SortablePriceItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: item.id,
    });

  const style = { transform: CSS.Transform.toString(transform), transition };

  const current =
    fixPrices[item.id] || {
      work_name: "",
      price: "",
      work_description: "",
    };

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
      {/* ----- DnD ハンドル ----- */}
      <MdDragIndicator
        {...listeners}
        className="absolute top-1/2 left-1 -translate-y-1/2 text-neutral-500 cursor-grab active:cursor-grabbing"
      />

      {/* ----- 作業名 ----- */}
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

      {/* ----- 単価 ----- */}
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

      {/* ----- 変更ボタン ----- */}
      <Button
        disabled={!isEditable}
        onClick={() => {
          updatePrice(item.id, {
            work_name: current.work_name || item.work_name,
            price: Number(current.price || item.price),
            work_description:
              current.work_description || item.work_description,
          });

          setFixPrices((prev) => ({
            ...prev,
            [item.id]: {
              work_name: "",
              price: "",
              work_description: "",
            },
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

      {/* ----- 作業説明欄（2段目） ----- */}
      <Input
        type="text"
        defaultValue={item.work_description}
        placeholder="作業内容の詳細説明を記載"
        onChange={(e) => {
          setFixPrices((prev) => ({
            ...prev,
            [item.id]: {
              ...current,
              work_description: e.target.value,
            },
          }));
          setEditingId(item.id);
        }}
        className="col-span-7 rounded-sm bg-neutral-200 px-1 placeholder:text-neutral-400"
      />

      {/* ----- 削除ボタン ----- */}
      <Button
        onClick={() => deletePrice(item.id)}
        className="col-span-1 bg-red-800/80 px-2 rounded-md text-white text-sm cursor-pointer hover:opacity-60"
      >
        削除
      </Button>
    </li>
  );
}
