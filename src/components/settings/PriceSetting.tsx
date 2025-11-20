"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/supabase";
import { useAuth } from "@/app/AuthProvider";
import { toast } from "sonner";
import { Button, Input } from "@headlessui/react";
import { RiExchange2Line } from "react-icons/ri";
import { TbReload } from "react-icons/tb";

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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { CorrectBtn } from "../ui/Btn";
import SortablePriceItem from "./SortablePriceItem";

export interface PriceItem {
  id: number;
  order: number;
  work_name: string;
  price: number;
  category: string;
  sub_category: string | null;
  work_description: string;
}

type NewPriceItem = {
  work_name: string;
  price: string;
  work_description: string;
};

type FixPriceMap = Record<number, NewPriceItem>;

const CATEGORIES = ["WEB", "印刷", "出力", "その他"] as const;
const WEB_SUB_CATEGORIES = ["デザイン", "コーディング", "イベント関連"] as const;

export default function PriceSetting() {
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [newPrices, setNewPrices] = useState<{
    [key: string]: { [sub: string]: NewPriceItem };
  }>({
    WEB: {
      デザイン: { work_name: "", price: "", work_description: "" },
      コーディング: { work_name: "", price: "", work_description: "" },
      "イベント関連": { work_name: "", price: "", work_description: "" },
    },
    印刷: {
      default: { work_name: "", price: "", work_description: "" },
    },
    出力: {
      default: { work_name: "", price: "", work_description: "" },
    },
    その他: {
      default: { work_name: "", price: "", work_description: "" },
    },
  });

  const [fixPrices, setFixPrices] = useState<FixPriceMap>({});
  const [editingId, setEditingId] = useState<number | null>(null);

  const { user } = useAuth();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string>("");

  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  //最後にベクトル変換を行った日時の取得
  const getLastUpdate = async () => {
    const { data: lastUpdateDate } = await supabase
      .from("settings")
      .select("*")
      .eq("key", "last_embedding_run")
      .single();

    setLastUpdate(new Date(lastUpdateDate?.value).toLocaleString("sv-SE"));
  }

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

  //追加
  const addPrice = async (order: number, category: string, sub_category: string) => {
    const target = newPrices[category][sub_category];

    if (!target.work_name || !target.price) {
      alert("作業名・単価は入力必須です。");
      return;
    }

    const { error } = await supabase.from("prices").insert({
      order,
      category,
      sub_category,
      work_name: target.work_name,
      price: Number(target.price),
      work_description: target.work_description,
    });

    if (error) {
      alert("登録に失敗しました");
      return;
    }

    if (user) toast.success(`${user.name}さんが料金一覧を更新しました`);

    setNewPrices((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [sub_category]: {
          work_name: "",
          price: "",
          work_description: "",
        },
      },
    }));

    getPrices();
  };

  //削除
  const deletePrice = async (id: number) => {
    const { error } = await supabase
      .from("prices")
      .delete()
      .eq("id", id);

    if (error) {
      alert("削除に失敗しました");
      return;
    }

    if (user) toast(`${user.name}さんが料金一覧を更新しました`);
    getPrices();
  };

  //編集
  const updatePrice = async (id: number, updated: Partial<PriceItem>) => {
    const { error } = await supabase
      .from("prices")
      .update(updated)
      .eq("id", id);

    if (error) {
      alert("更新に失敗しました");
      return;
    }

    if (user) toast(`${user.name}さんが料金一覧を更新しました`);
    getPrices();
  };


  // 並び替え処理
  const updateOrder = async (list: PriceItem[]) => {
    const updates = list.map((p, index) =>
      supabase.from("prices").update({ order: index }).eq("id", p.id)
    );

    const results = await Promise.all(updates);
    const errors = results.filter((r) => r.error);

    if (errors.length > 0) console.error(errors);
  };

  //並び替え（ドラッグ操作）
  const handleDragEnd = (event: DragEndEvent, category: string, sub_category: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const targetList = prices.filter((p) => p.category === category && p.sub_category === sub_category).sort((a, b) => a.order - b.order);

    const oldIndex = targetList.findIndex((p) => p.id === active.id);
    const newIndex = targetList.findIndex((p) => p.id === over.id);

    const newList = arrayMove(targetList, oldIndex, newIndex);
    const updated = newList.map((p, index) => ({ ...p, order: index }));

    setPrices((prev) => [...prev.filter((p) => !(p.category === category && p.sub_category === sub_category)), ...updated,]);

    updateOrder(newList).catch((err) => {
      console.error(err);
      alert("順番の保存に失敗しました。");
    });
  };


  //ベクトル変換
  const handleGenerateEmbeddings = async () => {
    setIsProcessing(true);
    setMessage("ベクトル生成を開始しました。しばらくお待ちください...");

    try {
      const response = await fetch("/api/generate-embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`成功: ${data.message} (更新数: ${data.updated_count})`);
        console.log('ログ:', data.logs);
      } else {
        setMessage(`失敗: ${data.message} (エラー: ${data.error})`);
        console.error(data);
      }
    } catch (error) {
      setMessage(`致命的なエラーが発生しました。コンソールを確認してください。`);
      console.error('Fetch Error:', error);
    } finally {
      setIsProcessing(false);
      setLastUpdate(new Date().toLocaleString("sv-SE"));
      setTimeout(() => {
        setMessage("");
      }, 5000);
    }
  }



  useEffect(() => {
    getPrices();
    getLastUpdate();
  }, []);



  return (
    <div className="grid gap-2">
      <h2 className="text-white font-bold p-1 pt-0 text-center border-b border-white">
        請求単価一覧
      </h2>

      <div className="grid grid-cols-2 grid-rows-[min-content_1fr_min-content] gap-2">
        {CATEGORIES.map((cat) => {
          // カテゴリ内のレコード
          const categoryPrices = prices.filter((p) => p.category === cat);

          const isWeb = cat === "WEB";

          return (
            <div
              key={cat}
              className="bg-neutral-400 rounded-md p-2 grid grid-rows-[min-content_1fr_min-content] first-of-type:row-span-3"
            >
              <h3 className="text-center pb-1 font-bold">{cat}</h3>

              <div className="flex flex-col gap-3 py-1">

                {/* WEBの3つのsub_categoryを作成 */}
                {isWeb
                  ? WEB_SUB_CATEGORIES.map((sub) => {
                    const subList = categoryPrices
                      .filter((p) => p.sub_category === sub)
                      .sort((a, b) => a.order - b.order);

                    const newPrice = newPrices[cat][sub];

                    return (
                      <div key={sub} className={`p-2 rounded-md ${sub === "デザイン" ? "bg-purple-600/15" : sub === "コーディング" ? "bg-blue-600/15" : sub === "イベント関連" ? "bg-amber-600/20" : "bg-neutral-300"}`}>
                        <p className="font-bold text-center mb-1">{sub}</p>

                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={(e) =>
                            handleDragEnd(e, cat, sub)
                          }
                        >
                          <SortableContext
                            items={subList.map((p) => p.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <ul className="flex flex-col gap-1 pb-1">

                              <li className="grid grid-cols-8 gap-0.5 pl-5.5 bg-neutral-200 rounded-sm p-1 pr-0.5">
                                <span className="col-span-5 text-center border-r border-neutral-400">
                                  作業名
                                </span>
                                <span className="col-span-2 text-center border-r border-neutral-400">
                                  単価
                                </span>
                                <span className="col-span-1 text-center">編集</span>
                              </li>

                              {subList.map((item) => (
                                <SortablePriceItem
                                  key={item.id}
                                  item={item}
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

                        <div className="grid grid-cols-8 gap-1 border-t border-neutral-500 pt-2">
                          <Input
                            value={newPrice.work_name}
                            onChange={(e) =>
                              setNewPrices((prev) => ({
                                ...prev,
                                [cat]: {
                                  ...prev[cat],
                                  [sub]: {
                                    ...prev[cat][sub],
                                    work_name: e.target.value,
                                  },
                                },
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
                                [cat]: {
                                  ...prev[cat],
                                  [sub]: {
                                    ...prev[cat][sub],
                                    price: e.target.value,
                                  },
                                },
                              }))
                            }
                            type="tel"
                            placeholder="1000"
                            className="col-span-2 bg-white rounded-sm px-2 text-right"
                          />

                          <CorrectBtn
                            disabled={!newPrice.work_name || !newPrice.price}
                            onClick={() => {
                              const order = subList.length;
                              addPrice(order, cat, sub);
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
                                [cat]: {
                                  ...prev[cat],
                                  [sub]: {
                                    ...prev[cat][sub],
                                    work_description: e.target.value,
                                  },
                                },
                              }))
                            }
                            placeholder="作業内容の詳細説明を入力"
                            className="col-span-7 bg-white rounded-sm px-2"
                          />

                          <Button
                            onClick={() =>
                              setNewPrices((prev) => ({
                                ...prev,
                                [cat]: {
                                  ...prev[cat],
                                  [sub]: {
                                    work_name: "",
                                    price: "",
                                    work_description: "",
                                  },
                                },
                              }))
                            }
                            className="col-span-1 bg-red-700 p-1 rounded-md text-white text-sm cursor-pointer hover:opacity-60"
                          >
                            リセット
                          </Button>
                        </div>
                      </div>
                    );
                  })

                  /* WEB以外は従来通り */
                  : (() => {
                    const newPrice = newPrices[cat].default;
                    const list = categoryPrices
                      .sort((a, b) => a.order - b.order);

                    return (
                      <div className="bg-neutral-300 p-2 rounded-md">
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={(e) =>
                            handleDragEnd(e, cat, "default")
                          }
                        >
                          <SortableContext
                            items={list.map((p) => p.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <ul className="flex flex-col gap-1 pb-1">
                              <li className="grid grid-cols-8 gap-0.5 pl-5.5 bg-neutral-200 rounded-sm p-1 pr-0.5">
                                <span className="col-span-5 text-center border-r border-neutral-400">
                                  作業名
                                </span>
                                <span className="col-span-2 text-center border-r border-neutral-400">
                                  単価
                                </span>
                                <span className="col-span-1 text-center">編集</span>
                              </li>

                              {list.map((item) => (
                                <SortablePriceItem
                                  key={item.id}
                                  item={item}
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

                        <div className="grid grid-cols-8 gap-1 border-t border-neutral-500 pt-2">
                          <Input
                            value={newPrice.work_name}
                            onChange={(e) =>
                              setNewPrices((prev) => ({
                                ...prev,
                                [cat]: {
                                  default: {
                                    ...prev[cat].default,
                                    work_name: e.target.value,
                                  },
                                },
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
                                [cat]: {
                                  default: {
                                    ...prev[cat].default,
                                    price: e.target.value,
                                  },
                                },
                              }))
                            }
                            type="tel"
                            placeholder="1000"
                            className="col-span-2 bg-white rounded-sm px-2 text-right"
                          />

                          <CorrectBtn
                            disabled={!newPrice.work_name || !newPrice.price}
                            onClick={() => {
                              const order = list.length;
                              addPrice(order, cat, "default");
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
                                [cat]: {
                                  default: {
                                    ...prev[cat].default,
                                    work_description: e.target.value,
                                  },
                                },
                              }))
                            }
                            placeholder="作業内容の詳細説明を入力"
                            className="col-span-7 bg-white rounded-sm px-2"
                          />

                          <Button
                            onClick={() =>
                              setNewPrices((prev) => ({
                                ...prev,
                                [cat]: {
                                  default: {
                                    work_name: "",
                                    price: "",
                                    work_description: "",
                                  },
                                },
                              }))
                            }
                            className="col-span-1 bg-red-700 p-1 rounded-md text-white text-sm cursor-pointer hover:opacity-60"
                          >
                            リセット
                          </Button>
                        </div>
                      </div>
                    );
                  })()}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 justify-end border-t border-neutral-500 pt-2">
        <p className="w-fit text-white">Last Embedding: {lastUpdate}</p>
        <Button
          onClick={handleGenerateEmbeddings}
          disabled={isProcessing}
          className={`flex gap-1 items-center py-2 pl-4 text-sm text-white rounded-md font-bold cursor-pointer hover:bg-sky-700 ${isProcessing ? "bg-neutral-500 pr-4" : "bg-sky-800 pr-2"}`}
        >
          {isProcessing ?
            (
              <>
                <TbReload className="text-lg animate-spin" />ベクトル変換中...
              </>
            ) : (
              <>
                <RiExchange2Line className="text-lg" />ベクトル変換（Gemini-embedding-001）
              </>
            )
          }
        </Button>

        {message && <p className="w-full text-right text-xs text-white">{message}</p>}
      </div>
    </div>
  );
}
