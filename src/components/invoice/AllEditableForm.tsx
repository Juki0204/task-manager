import { supabase } from "@/utils/supabase/supabase";
import { Invoice } from "@/utils/types/invoice";
import { Input, Select, Textarea } from "@headlessui/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { AiOutlinePicture } from "react-icons/ai";
import { BsPersonCheck } from "react-icons/bs";
import { FaRegCheckCircle } from "react-icons/fa";
import { GrClose, GrFormNext, GrFormPrevious } from "react-icons/gr";
import { MdDriveFileRenameOutline, MdLaptopChromebook, MdOutlineCategory, MdTask, MdOutlineStickyNote2 } from "react-icons/md";
import { FaCalculator } from "react-icons/fa6";
import { PiPuzzlePiece } from "react-icons/pi";
import { HiOutlineAdjustments } from "react-icons/hi";
import { BiCalculator, BiCategoryAlt } from "react-icons/bi";
import { LuNotebookPen } from "react-icons/lu";

import { toast } from "sonner";
import { OutlineBtn } from "../ui/Btn";




interface AllEditableFormProps {
  recordId: string | null;
  prevId: string | null;
  nextId: string | null;
  priceList: { id: number, category: string, sub_category: string, work_name: string, price: number }[] | null;
  onClose: () => void;
  onChangeRecord: (recordId: string) => void;
  onCheckTask: () => void;
}


interface LPDataType {
  rows: number, //縦
  cols: number, //横
  rate: number, //比率
  alt_rate: number, //比率超過分
  decimal: number, //小数点以下指数
  total_amount: number, //請求金額
}

export default function AllEditableForm({ recordId, prevId, nextId, priceList, onClose, onChangeRecord, onCheckTask }: AllEditableFormProps) {
  const [invoiceData, setInvoiceData] = useState<Invoice | null>(null);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [tempInvoiceValue, setTempInvoiceValue] = useState<Invoice>();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const [unitPrice, setUnitPrice] = useState<number | null>(null); //計算用単価

  const [activeColumnIndex, setActiveColumnIndex] = useState<number>(0);
  const [activeItemIndex, setActiveItemIndex] = useState<number>(0);
  const categoryRefs = useRef<HTMLDivElement[]>([]);

  //中カテゴリ
  const mediaOptions = [
    { id: "SALES", label: "営業", width: "w-14" },
    { id: "RECRUIT", label: "求人", width: "w-14" },
    { id: "RECEPTION", label: "受付", width: "w-14" },
    { id: "MEMBER", label: "会員", width: "w-14" },
    { id: "OTHER", label: "その他", width: "w-16" },
  ];

  //TABで飛ぶ用のRef
  const firstSmallCategoryRef = useRef<HTMLLIElement | null>(null); //小カテゴリ先頭
  const piecesRef = useRef<HTMLInputElement | null>(null); //作業点数

  //ラジオボタン群の捜査用 refs
  const radioRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  //よく使う項目
  const FAVORITE_IDS = [32, 23, 41, 45, 44, 7, 27, 28, 42, 43];
  const favoriteList = priceList?.filter(p => FAVORITE_IDS.includes(p.id));

  //小カテゴリ左右移動時のスクロール制御用
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  //請求データ差分チェック用（未保存防止）
  const compareKeys: (keyof Invoice)[] = [
    "client",
    "requester",
    "title",
    "description",
    "finish_date",
    "manager",
    "remarks",
    "work_name",
    "amount",
    "category",
    "media",
    "pieces",
    "degree",
    "adjustment",
  ];

  //請求データ差分チェックロジック
  const hasInvoiceChanged = (
    original: Invoice | null,
    edited: Invoice | null
  ): boolean => {
    if (!original || !edited) return false;

    return compareKeys.some((key) => {
      return original[key] !== edited[key];
    });
  };

  const isDirty = useMemo(() => {
    if (!tempInvoiceValue) return;
    return hasInvoiceChanged(currentInvoice, tempInvoiceValue);
  }, [currentInvoice, tempInvoiceValue]);

  //中カテゴリ　キー操作
  function handleMediaKey(e: React.KeyboardEvent<HTMLDivElement>) {
    const lastIndex = mediaOptions.length - 1;

    if (e.key === "ArrowRight") {
      e.preventDefault();
      setSelectedIndex((prev) => {
        const next = Math.min(prev + 1, lastIndex);
        radioRefs.current[next]?.focus();
        return next;
      });
    }

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setSelectedIndex((prev) => {
        const next = Math.max(prev - 1, 0);
        radioRefs.current[next]?.focus();
        return next;
      });
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const id = mediaOptions[selectedIndex].id;
      document.getElementById(id)?.click();
    }

    if (e.key === "Tab") {
      if (!e.shiftKey) {
        e.preventDefault();
        //小カテゴリにフォーカス移動
        if (firstSmallCategoryRef.current) {
          firstSmallCategoryRef.current.focus();
        }
      }
    }
  }

  //小カテゴリ　キー操作
  const handleSmallCategoryKey = (e: React.KeyboardEvent<HTMLLIElement>) => {
    const cols = categoryRefs.current;

    if (cols.length === 0) return;

    const currentColumn = cols[activeColumnIndex];
    const items = currentColumn.querySelectorAll("li");

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveItemIndex((prev) => {
        const next = Math.min(items.length - 1, prev + 1);
        focusItem(activeColumnIndex, next);
        return next;
      });
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveItemIndex((prev) => {
        const next = Math.max(0, prev - 1);
        focusItem(activeColumnIndex, next);
        return next;
      });
    }

    if (e.key === "ArrowRight") {
      e.preventDefault();
      moveColumn(1);
    }

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      moveColumn(-1);
    }


    if (e.key === "Enter") {
      e.preventDefault();
      handleSelectActiveItem();
    }

    if (e.key === "Tab") {
      e.preventDefault();
      setActiveColumnIndex(0);
      setActiveItemIndex(0);

      if (e.shiftKey) { //中カテゴリの先頭へ飛ぶ
        if (radioRefs.current[0]) {
          radioRefs.current[0].focus();
        }
      } else {
        if (piecesRef.current) {
          piecesRef.current.focus();
        }
      }
    }

  }

  //小カテゴリ　カラム移動
  const moveColumn = (dir: number) => {
    const cols = categoryRefs.current;
    const container = scrollContainerRef.current;

    if (!container || cols.length === 0) return;

    const next = activeColumnIndex + dir;

    if (next < 0 || next >= cols.length) return; // はみ出し防止

    const nextCol = cols[next];
    const colLeft = (nextCol as HTMLElement).offsetLeft;

    const items = nextCol.querySelectorAll("li");
    if (items.length === 0) return;

    container.scrollTo({
      left: colLeft - 16,
      behavior: "smooth",
    });

    setActiveColumnIndex(next);
    setActiveItemIndex(0);

    // 少し遅らせてフォーカス
    waitForScrollEnd(container, () => {
      focusItem(next, 0);
    });
  };

  //カラム内アイテムにフォーカス
  const focusItem = (colIndex: number, itemIndex: number) => {
    const col = categoryRefs.current[colIndex];
    if (!col) return;

    const items = col.querySelectorAll("li");
    const target = items[itemIndex] as HTMLElement | undefined;

    target?.focus();
  };

  //Enter押下時の処理
  const handleSelectActiveItem = () => {
    const col = categoryRefs.current[activeColumnIndex];
    if (!col) return;

    const items = col.querySelectorAll("li");
    const item = items[activeItemIndex] as HTMLElement | null;

    if (!item) return;

    const workName = item.textContent ?? "";
    const category = item.getAttribute("data-category") ?? "";
    const amount = priceList?.find(price => price.work_name === workName)?.price ?? 0;

    setUnitPrice(amount);

    setTempInvoiceValue((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        work_name: workName,
        category,
        // amount: amount,
      };
    });
  };

  //クリック選択用
  const handleClickItem = (id: string, workName: string, category: string) => {
    const amount = priceList?.find(price => price.work_name === workName)?.price ?? 0;

    setUnitPrice(amount);

    setTempInvoiceValue((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        work_name: workName,
        category,
        // amount: amount,
      };
    });
  };

  //左右スクロールが止まったかどうか検知
  const waitForScrollEnd = (el: HTMLElement, callback: () => void) => {
    let last = el.scrollLeft;
    let count = 0;

    const check = () => {
      const now = el.scrollLeft;

      if (Math.abs(now - last) < 1) {
        count++;
        if (count >= 3) { // 3フレーム連続で停止
          callback();
          return;
        }
      } else {
        count = 0;
        last = now;
      }
      requestAnimationFrame(check);
    };

    requestAnimationFrame(check);
  };

  /*---------------------------------小カテゴリ関連ここまで----------------------------------*/

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const saveAllValue = async () => {
    if (!tempInvoiceValue) return;
    setIsSaving(true);

    try {
      const { data, error } = await supabase
        .from("invoice")
        .update(tempInvoiceValue)
        .eq("id", recordId)
        .select("*")
        .single();

      if (error) {
        toast.error("請求データの保存に失敗しました。");
        throw error;
      }

      if (!data) return;

      toast.success("請求データの保存が完了しました。");
      setCurrentInvoice(data);
      setTempInvoiceValue(data);
    } finally {
      setIsSaving(false);
    }
  }

  //請求額計算
  const calcAmount = () => {
    setTempInvoiceValue((prev) => {
      if (!prev) return prev;
      if (unitPrice == null) return prev;

      const mediaFactor = prev.media === "会員" ? 1.5 : 1;
      const pieces = prev.pieces ?? 1;
      const degree = prev.degree ?? 100;
      const adjustment = prev.adjustment ?? 0;

      const temporaryAmount = unitPrice * pieces * mediaFactor * (degree * 0.01)
      const totalAmount = temporaryAmount + adjustment;

      console.log(totalAmount);
      return {
        ...prev,
        amount: temporaryAmount,
        total_amount: totalAmount,
      }
    });
  }

  //当該請求の取得
  const getCurrentInvoice = async (recordId: string) => {
    const { data: currentInvoice, error } = await supabase
      .from("invoice")
      .select("*")
      .eq("id", recordId)
      .single();

    if (!currentInvoice) return;
    setCurrentInvoice(currentInvoice);
    setTempInvoiceValue(currentInvoice);

    if (error) console.error("請求データの取得に失敗しました:", error);
  }

  const scrollToTop = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = 0;
  }

  useEffect(() => {
    if (!recordId) return;
    getCurrentInvoice(recordId);
    scrollToTop();
  }, [recordId]);

  //-------------------マウント時に小カテゴリの項目をフォーカス＆X軸のスクロール位置合わせ---------------

  const getColumnByCategory = (category: string) => {
    return categoryRefs.current.find(
      (col) => col?.getAttribute("data-category") === category
    );
  };

  const findTargetItem = (workName: string, category: string)
    : { colEl: HTMLElement; itemEl: HTMLElement } | null => {
    //favorite を最優先で探す
    const favoriteCol = getColumnByCategory("favorite");
    if (favoriteCol) {
      const item = Array.from(favoriteCol.querySelectorAll("li"))
        .find((el) => el.textContent === workName);

      if (item) {
        return {
          colEl: favoriteCol,
          itemEl: item as HTMLElement,
        };
      }
    }

    //なければ本来のカテゴリ
    const normalCol = getColumnByCategory(category);
    if (normalCol) {
      const item = Array.from(normalCol.querySelectorAll("li"))
        .find((el) => el.textContent === workName);

      if (item) {
        return {
          colEl: normalCol,
          itemEl: item as HTMLElement,
        };
      }
    }

    return null;
  };

  const scrollItemToTop = (itemEl: HTMLElement, gap = 8) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const itemRect = itemEl.getBoundingClientRect();

    const itemTopInContainer = container.scrollTop + (itemRect.top - containerRect.top);

    const maxTop = container.scrollHeight - container.clientHeight;
    const targetTop = Math.max(0, Math.min(itemTopInContainer - gap, maxTop));

    container.scrollTo({
      top: targetTop,
    });
  };

  useEffect(() => {
    if (!priceList || !currentInvoice?.work_name) {
      scrollContainerRef.current?.scrollTo({
        top: 0,
        left: 0,
      });

      return;
    }

    const currentPrice = priceList?.filter(price => price.work_name === currentInvoice?.work_name)[0];
    if (!currentPrice) return;

    const result = findTargetItem(
      currentPrice.work_name,
      currentPrice.category
    );

    console.log(result);

    if (!result) return;

    const { colEl, itemEl } = result;

    requestAnimationFrame(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current?.scrollTo({
          left: colEl.offsetLeft - 16,
        });
      }

      scrollItemToTop(itemEl);
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceList, currentInvoice?.work_name]);


  //マウント時に中カテゴリにフォーカス
  useEffect(() => {
    setTimeout(() => {
      if (radioRefs.current[0]) {
        radioRefs.current[0].focus();
      }
    }, 300);
  }, []);

  useEffect(() => {
    if (!tempInvoiceValue) return;
    if (!unitPrice) return;
    calcAmount();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tempInvoiceValue?.media,
    tempInvoiceValue?.pieces,
    tempInvoiceValue?.degree,
    // tempInvoiceValue?.amount,
    tempInvoiceValue?.adjustment,
    unitPrice
  ]);

  useEffect(() => {
    if (tempInvoiceValue?.work_name) {
      setUnitPrice(
        priceList?.find(p => p.work_name === tempInvoiceValue.work_name)?.price ?? 0
      );
    }
  }, [tempInvoiceValue?.work_name]);

  const [LPCalcOpen, setLPCalcOpen] = useState<boolean>(false);
  const [LPData, setLPData] = useState<LPDataType>({
    rows: 0,
    cols: 0,
    rate: 0,
    alt_rate: 0,
    decimal: 0,
    total_amount: 0,
  });

  const calcLPData = () => {
    setLPData((prev) => {
      if (!prev) return prev;
      if (prev.rows === 0 || prev.cols === 0) return prev;

      const rate = prev.cols / prev.rows;
      const alt_rate = Math.trunc(rate - 3);
      const decimal = rate - Math.trunc(rate) < 0.5 ? 0 : 1;

      const total_amount = rate < 3
        ? Number(priceList?.filter(price => price.work_name === "WEBポップ")[0].price) //比率3以下はWEBポップ金額
        : 25000 + (alt_rate * 2500) + (decimal * 1000);

      return {
        ...prev,
        rate,
        alt_rate,
        decimal,
        total_amount,
      }
    });
  }

  if (!currentInvoice || !tempInvoiceValue) return (<div className="w-full h-full grid place-content-center"><span className="loading loading-spinner loading-lg"></span></div>)

  return (

    <div className="w-full h-full relative space-y-4 bg-neutral-100 px-2 pt-14 pb-16">
      <h2 className="absolute top-0 left-0 w-full h-14 flex items-center justify-start gap-2 pl-3 font-bold pr-10 bg-neutral-100 z-10">
        請求データ一括入力
        <span className="text-xs text-neutral-400">TABキー, TAB + SHIFTキー押下で項目移動可能</span>
        <div onClick={() => setLPCalcOpen(true)} className="flex gap-1 items-center absolute top-3.5 right-10 cursor-pointer text-xs py-0.5 px-1.5 rounded-sm bg-neutral-300 text-neutral-800 hover:opacity-60">
          <FaCalculator />LP計算機
        </div>
        <GrClose onClick={onClose} className="absolute top-4 right-2 cursor-pointer" />
      </h2>
      <div
        ref={scrollRef}
        className="w-full h-full relative space-y-4 bg-neutral-100 p-1 pr-2 pb-1 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-neutral-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-400"
      >

        <div className="grid grid-cols-5 gap-2">
          {/* 作業担当者 */}
          <div className="col-span-1">
            <h3 className="flex items-center gap-1 text-sm pl-0.5 mb-1 text-neutral-500"><BsPersonCheck />タスクNo<span className="text-xs">（クリックで元タスク確認）</span></h3>
            <div
              className="flex gap-1 items-center py-1 px-2 bg-neutral-200 rounded-md cursor-pointer"
              onClick={onCheckTask}
            >
              <MdTask />{currentInvoice.serial}
            </div>
          </div>

          {/* 作業担当者 */}
          <div className="col-span-1">
            <h3 className="flex items-center gap-1 text-sm pl-0.5 mb-1 text-neutral-500"><BsPersonCheck />店舗名</h3>
            <Input
              tabIndex={-1}
              type="text"
              readOnly
              value={tempInvoiceValue.client}
              className="w-full bg-neutral-300 py-1 px-2 rounded-md pointer-events-none"
            />
          </div>

          {/* 作業担当者 */}
          <div className="col-span-1 pr-2 relative after:h-full after:w-[1px] after:bg-neutral-200 after:absolute after:-right-0 after:bottom-0">
            <h3 className="flex items-center gap-1 text-sm pl-0.5 mb-1 text-neutral-500"><BsPersonCheck />依頼者</h3>
            <Input
              tabIndex={-1}
              type="text"
              readOnly
              value={tempInvoiceValue.requester}
              className="w-full bg-neutral-300 py-1 px-2 rounded-md pointer-events-none"
            />
          </div>

          {/* 作業担当者 */}
          <div className="col-span-1">
            <h3 className="flex items-center gap-1 text-sm pl-0.5 mb-1 text-neutral-500"><BsPersonCheck />作業担当者</h3>
            <Input
              tabIndex={-1}
              type="text"
              readOnly
              value={tempInvoiceValue.manager}
              className="w-full bg-neutral-300 py-1 px-2 rounded-md pointer-events-none"
            />
          </div>

          {/* 完了日 */}
          <div className="col-span-1">
            <h3 className="flex items-center gap-1 text-sm pl-0.5 mb-1 text-neutral-500"><FaRegCheckCircle />完了日</h3>
            <Input
              tabIndex={-1}
              type="date"
              max="9999-12-31"
              value={tempInvoiceValue.finish_date}
              onChange={(e) => setTempInvoiceValue({
                ...tempInvoiceValue,
                finish_date: e.target.value
              })}
              className="w-full bg-neutral-200 py-1 px-2 rounded-md cursor-pointer"
            />
          </div>

        </div>

        <div className="grid grid-cols-4 gap-2">
          {/* 作業タイトル */}
          <div className="col-span-1">
            <h3 className="flex items-center gap-1 text-sm pl-0.5 mb-1 text-neutral-500"><MdDriveFileRenameOutline />作業タイトル</h3>
            <Input
              tabIndex={-1}
              type="text"
              value={tempInvoiceValue.title}
              onChange={(e) => setTempInvoiceValue({
                ...tempInvoiceValue,
                title: e.target.value
              })}
              className="w-full bg-neutral-200 py-1 px-2 rounded-md"
            />
          </div>

          {/* 作業内容 */}
          <div className="col-span-3">
            <h3 className="flex items-center gap-1 text-sm pl-0.5 mb-1 text-neutral-500"><MdOutlineStickyNote2 />作業内容</h3>
            <Input
              tabIndex={-1}
              type="text"
              value={tempInvoiceValue.description}
              onChange={(e) => setTempInvoiceValue({
                ...tempInvoiceValue,
                description: e.target.value
              })}
              className="w-full bg-neutral-200 py-1 px-2 rounded-md"
            />
          </div>

        </div>

        <hr className="text-neutral-300" />

        <div className="grid grid-cols-12 gap-2">
          {/* 大カテゴリ */}
          <div className="col-span-3">
            <h3 className="flex items-center gap-1 text-sm pl-0.5 mb-1 text-neutral-500"><BiCategoryAlt />大カテゴリ</h3>
            <Input
              tabIndex={-1}
              type="text"
              readOnly
              value={tempInvoiceValue.category ?? "-"}
              className="w-full bg-neutral-300 py-1 px-2 rounded-md pointer-events-none"
            />
          </div>

          {/* 中カテゴリ */}
          <div className="flex gap-x-2 flex-wrap col-span-9 border-l border-neutral-200 pl-2">
            <h3 className="w-full flex items-center gap-1 text-sm pl-0.5 mb-1 text-neutral-500"><MdLaptopChromebook />中カテゴリ選択</h3>

            {mediaOptions.map((opt, index) => (
              <div
                key={opt.id}
                tabIndex={0}
                ref={(el) => { radioRefs.current[index] = el; }}
                onKeyDown={handleMediaKey}
                onClick={() => {
                  document.getElementById(opt.id)?.click();
                }}
                className={`relative ${opt.width} h-8 bg-neutral-200 text-neutral-700 rounded-sm overflow-hidden focus:outline-2 focus:outline-neutral-500`}
              >
                <input
                  type="radio"
                  name="MEDIA"
                  id={opt.id}
                  value={opt.label}
                  checked={opt.label === tempInvoiceValue.media}
                  onChange={(e) => {
                    setTempInvoiceValue({
                      ...tempInvoiceValue,
                      media: e.target.value
                    });
                    calcAmount();
                  }}
                  className="w-full h-full hidden peer"
                />
                <label
                  htmlFor={opt.label}
                  className="absolute top-0 left-0 w-full h-full aspect-square text-center py-1.5 px-2 text-sm text-neutral-800 peer-checked:bg-blue-300/70 transition duration-300 cursor-pointer"
                >
                  {opt.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* 小カテゴリ */}
        <div className="flex flex-wrap">
          <h3 className="w-full flex items-center gap-1 text-sm pl-0.5 mb-1 text-neutral-500">
            <AiOutlinePicture />
            作業カテゴリ選択
            <span
              className={`pb-1 pt-0.5 px-2 text-black text-xs rounded-md cursor-pointer ${!tempInvoiceValue.work_name ? "bg-blue-300/70" : "bg-neutral-300"}`}
              onClick={() => {
                setTempInvoiceValue({
                  ...tempInvoiceValue,
                  work_name: ""
                });
                setUnitPrice(0);
              }
              }>請求なし
            </span>
            <span className="ml-4 text-xs tracking-wide">※項目は矢印キーで選択可能。また、選択領域はSHIFT + スクロールホイールで横方向にスクロール可能</span>
          </h3>

          <div
            ref={(el: HTMLDivElement) => { scrollContainerRef.current = el; }}
            className="h-94 overflow-auto pb-2 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-neutral-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-400"
          >

            <div className="w-fit flex gap-x-2">

              <div
                data-category="favorite"
                ref={(el: HTMLDivElement) => { categoryRefs.current[0] = el; }}
                className="p-2 bg-neutral-200 rounded-md w-48"
              >
                <h3 className="flex items-center gap-1 text-sm pl-0.5 mb-1 font-bold text-center justify-center text-neutral-500">よく使う項目</h3>
                <ul className="flex flex-col gap-0.5">
                  {favoriteList && (
                    favoriteList.sort((a, b) => a.work_name.localeCompare(b.work_name, "ja"))
                      .map((p, index) => (
                        <li
                          ref={index === 0 ? firstSmallCategoryRef : null}
                          key={p.id}
                          data-id={p.id}
                          data-category={p.category}
                          tabIndex={0}
                          onKeyDown={handleSmallCategoryKey}
                          onClick={() => handleClickItem(String(p.id), p.work_name, p.category)}
                          className={`py-1.5 px-2 text-sm rounded-md cursor-default focus:outline-2 focus:outline-neutral-500 ${p.work_name === tempInvoiceValue.work_name ? "bg-blue-300/70" : "bg-neutral-300"}`}
                        >
                          {p.work_name}
                        </li>
                      ))
                  )}
                </ul>
              </div>

              <div
                data-category="WEB"
                ref={(el: HTMLDivElement) => { categoryRefs.current[1] = el; }}
                className="p-2 bg-neutral-200 rounded-md w-48">
                <h3 className="flex items-center gap-1 text-sm pl-0.5 mb-1 font-bold text-center justify-center text-neutral-500">WEB</h3>
                <ul className="flex flex-col gap-0.5">
                  {priceList && (
                    priceList.filter((price) => price.category === "WEB" && price.sub_category !== "イベント関連")
                      .sort((a, b) => a.work_name.localeCompare(b.work_name, "ja"))
                      .map((p) => (
                        <li
                          key={p.id}
                          data-id={p.id}
                          data-category={p.category}
                          tabIndex={0}
                          onKeyDown={handleSmallCategoryKey}
                          onClick={() => handleClickItem(String(p.id), p.work_name, p.category)}
                          className={`py-1.5 px-2 text-sm rounded-md cursor-default focus:outline-2 focus:outline-neutral-500 ${p.work_name === tempInvoiceValue.work_name ? "bg-blue-300/70" : "bg-neutral-300"}`}
                        >
                          {p.work_name}
                        </li>
                      ))
                  )}
                </ul>
              </div>

              <div
                data-category="WEB"
                ref={(el: HTMLDivElement) => { categoryRefs.current[2] = el; }}
                className="p-2 bg-neutral-200 rounded-md w-48">
                <h3 className="flex items-center gap-1 text-sm pl-0.5 mb-1 font-bold text-center justify-center text-neutral-500">イベント</h3>
                <ul className="flex flex-col gap-0.5">
                  {priceList && (
                    priceList.filter((price) => price.category === "WEB" && price.sub_category === "イベント関連")
                      .sort((a, b) => a.work_name.localeCompare(b.work_name, "ja"))
                      .map((p) => (
                        <li
                          key={p.id}
                          data-id={p.id}
                          data-category={p.category}
                          tabIndex={0}
                          onKeyDown={handleSmallCategoryKey}
                          onClick={() => handleClickItem(String(p.id), p.work_name, p.category)}
                          className={`py-1.5 px-2 text-sm rounded-md cursor-default focus:outline-2 focus:outline-neutral-500 ${p.work_name === tempInvoiceValue.work_name ? "bg-blue-300/70" : "bg-neutral-300"}`}
                        >
                          {p.work_name}
                        </li>
                      ))
                  )}
                </ul>
              </div>

              <div
                data-category="印刷"
                ref={(el: HTMLDivElement) => { categoryRefs.current[3] = el; }}
                className="p-2 bg-neutral-200 rounded-md w-48"
              >
                <h3 className="flex items-center gap-1 text-sm pl-0.5 mb-1 font-bold text-center justify-center text-neutral-500">印刷</h3>
                <ul className="flex flex-col gap-0.5">
                  {priceList && (
                    priceList.filter((price) => price.category === "印刷")
                      .sort((a, b) => a.work_name.localeCompare(b.work_name, "ja"))
                      .map((p) => (
                        <li
                          key={p.id}
                          data-id={p.id}
                          data-category={p.category}
                          tabIndex={0}
                          onKeyDown={handleSmallCategoryKey}
                          onClick={() => handleClickItem(String(p.id), p.work_name, p.category)}
                          className={`py-1.5 px-2 text-sm rounded-md cursor-default focus:outline-2 focus:outline-neutral-500 ${p.work_name === tempInvoiceValue.work_name ? "bg-blue-300/70" : "bg-neutral-300"}`}
                        >
                          {p.work_name}
                        </li>
                      ))
                  )}
                </ul>
              </div>

              <div
                data-category="出力"
                ref={(el: HTMLDivElement) => { categoryRefs.current[4] = el; }}
                className="p-2 bg-neutral-200 rounded-md w-48"
              >
                <h3 className="flex items-center gap-1 text-sm pl-0.5 mb-1 font-bold text-center justify-center text-neutral-500">出力</h3>
                <ul className="flex flex-col gap-0.5">
                  {priceList && (
                    priceList.filter((price) => price.category === "出力")
                      .sort((a, b) => a.work_name.localeCompare(b.work_name, "ja"))
                      .map((p) => (
                        <li
                          key={p.id}
                          data-id={p.id}
                          data-category={p.category}
                          tabIndex={0}
                          onKeyDown={handleSmallCategoryKey}
                          onClick={() => handleClickItem(String(p.id), p.work_name, p.category)}
                          className={`py-1.5 px-2 text-sm rounded-md cursor-default focus:outline-2 focus:outline-neutral-500 ${p.work_name === tempInvoiceValue.work_name ? "bg-blue-300/70" : "bg-neutral-300"}`}
                        >
                          {p.work_name}
                        </li>
                      ))
                  )}
                </ul>
              </div>

              <div
                data-category="その他"
                ref={(el: HTMLDivElement) => { categoryRefs.current[5] = el; }}
                className="p-2 bg-neutral-200 rounded-md w-48"
              >
                <h3 className="flex items-center gap-1 text-sm pl-0.5 mb-1 font-bold text-center justify-center text-neutral-500">その他</h3>
                <ul className="flex flex-col gap-0.5">
                  {priceList && (
                    priceList.filter((price) => price.category === "その他")
                      .sort((a, b) => a.work_name.localeCompare(b.work_name, "ja"))
                      .map((p) => (
                        <li
                          key={p.id}
                          data-id={p.id}
                          data-category={p.category}
                          tabIndex={0}
                          onKeyDown={handleSmallCategoryKey}
                          onClick={() => handleClickItem(String(p.id), p.work_name, p.category)}
                          className={`py-1.5 px-2 text-sm rounded-md cursor-default focus:outline-2 focus:outline-neutral-500 ${p.work_name === tempInvoiceValue.work_name ? "bg-blue-300/70" : "bg-neutral-300"}`}
                        >
                          {p.work_name}
                        </li>
                      ))
                  )}
                </ul>
              </div>

            </div>

          </div>

        </div>

        <hr className="text-neutral-300" />

        <div className="grid grid-cols-12 gap-2">

          {/* 作業点数 */}
          <div className="col-span-2">
            <h3 className="flex items-center gap-1 text-sm pl-0.5 mb-1 text-neutral-500"><PiPuzzlePiece />作業点数</h3>
            <Input
              tabIndex={0}
              ref={piecesRef}
              type="tel"
              inputMode="numeric"
              value={tempInvoiceValue.pieces ?? ""}
              onChange={(e) => {
                const v = e.target.value;

                if (v === "") {
                  setTempInvoiceValue({ ...tempInvoiceValue, pieces: null });
                  return;
                }

                if (/\d+$/.test(v)) {    // 数字のみ許可
                  setTempInvoiceValue({ ...tempInvoiceValue, pieces: Number(v) });
                  // calcAmount();
                }
              }}
              pattern="[0-9]*"
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Tab") {
                  if (e.shiftKey && firstSmallCategoryRef.current) {
                    e.preventDefault();
                    firstSmallCategoryRef.current.focus();
                  }
                }
              }}
              className="w-full bg-neutral-200 py-1 px-2 rounded-md focus:outline-2 focus:outline-neutral-500"
            />
          </div>

          {/* 修正度 */}
          <div className="col-span-2">
            <h3 className="flex items-center gap-1 text-sm pl-0.5 mb-1 text-neutral-500"><HiOutlineAdjustments />修正度</h3>
            <Select
              tabIndex={0}
              value={tempInvoiceValue.degree ?? "100"}
              onChange={(e) => {
                setTempInvoiceValue({
                  ...tempInvoiceValue,
                  degree: e.target.value === "" ? null : Number(e.target.value),
                });
                calcAmount();
              }}
              className="w-full bg-neutral-200 py-1 px-2 rounded-md focus:outline-2 focus:outline-neutral-500"
            >
              <option value="">-</option>
              <option value="50">50</option>
              <option value="80">80</option>
              <option value="120">120</option>
            </Select>
          </div>

          {/* 仮請求額 */}
          <div className="col-span-3">
            <h3 className="flex items-center gap-1 text-sm pl-0.5 mb-1 text-neutral-500"><BiCalculator />仮請求額</h3>
            <Input
              tabIndex={-1}
              type="number"
              value={tempInvoiceValue.amount ?? 0}
              readOnly
              pattern="[0-9]*"
              className="w-full bg-neutral-300 py-1 px-2 rounded-md text-right pointer-events-none"
            />
          </div>

          {/* 修正金額 */}
          <div className="col-span-2">
            <h3 className="flex items-center gap-1 text-sm pl-0.5 mb-1 text-neutral-500"><BiCalculator />修正金額</h3>
            <Input
              tabIndex={0}
              type="tel"
              inputMode="numeric"
              value={tempInvoiceValue.adjustment ?? ""}
              onChange={(e) => {
                const v = e.target.value;

                if (v === "") {
                  setTempInvoiceValue({ ...tempInvoiceValue, adjustment: null });
                  return;
                }

                //"-" 単体の入力も許可するならここでハンドリング
                if (v === "-") {
                  setTempInvoiceValue({ ...tempInvoiceValue, adjustment: "-" as unknown as number });
                  return;
                }

                if (/^-?\d+$/.test(v)) {    // 数字 or -数字のみ許可
                  setTempInvoiceValue({ ...tempInvoiceValue, adjustment: Number(v) });
                  // calcAmount();
                }
              }}
              pattern="[0-9]*"
              className={`
                w-full bg-neutral-200 py-1 px-2 rounded-md text-right focus:outline-2 focus:outline-neutral-500
                ${tempInvoiceValue.adjustment && tempInvoiceValue.adjustment < 0 ? "text-red-600" : ""}
              `}
            />
          </div>

          {/* 本請求額 */}
          <div className="col-span-3">
            <h3 className="flex items-center gap-1 text-sm pl-0.5 mb-1 text-neutral-500"><BiCalculator />本請求額</h3>
            <Input
              tabIndex={-1}
              type="number"
              value={tempInvoiceValue.total_amount ?? 0}
              readOnly
              pattern="[0-9]*"
              className="w-full bg-neutral-300 py-1 px-2 rounded-md text-right pointer-events-none"
            />
          </div>
        </div>

        {/* 備考欄 */}
        <div>
          <h3 className="flex items-center gap-1 text-sm pl-0.5 mb-1 text-neutral-500"><LuNotebookPen />備考欄</h3>
          <Textarea
            tabIndex={0}
            rows={4}
            value={tempInvoiceValue.remarks ?? ""}
            onChange={(e) => setTempInvoiceValue({
              ...tempInvoiceValue,
              remarks: e.target.value
            })}
            className="w-full bg-neutral-200 py-1 px-2 rounded-md focus:outline-2 focus:outline-neutral-500"
          />
        </div>
      </div>

      {/* 確定ボタンたち */}
      <div className="absolute bottom-0 left-0 w-full h-fit grid grid-cols-4 gap-2 items-center justify-between p-3 bg-neutral-100 mb-0">
        <button
          disabled={prevId ? false : true}
          onClick={() => {
            if (!prevId) return;
            onChangeRecord(prevId);
          }}
          className="flex gap-1 pl-2 pr-4 py-2 leading-none bg-sky-600 text-white tracking-wider rounded-md cursor-pointer hover:opacity-90 focus:outline-2 focus:outline-sky-900 disabled:grayscale-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <GrFormPrevious />
          <span className="flex-1 text-center">前の請求</span>
        </button>

        <button
          disabled={!isDirty || isSaving}
          onClick={() => {
            console.log(tempInvoiceValue);
            saveAllValue();
          }}
          className="w-full col-span-2 px-4 py-2 leading-none tracking-wider bg-sky-600 text-white rounded-md cursor-pointer hover:opacity-90 focus:outline-2 focus:outline-sky-900 disabled:grayscale-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <><span></span>保存中...</>
          ) : (
            <>変更内容を保存</>
          )}
        </button>

        <button
          disabled={nextId ? false : true}
          onClick={() => {
            if (!nextId) return;
            onChangeRecord(nextId);
          }}
          className="flex gap-1 pl-4 pr-2 py-2 leading-none bg-sky-600 text-white tracking-wider rounded-md cursor-pointer hover:opacity-90 focus:outline-2 focus:outline-sky-900 disabled:grayscale-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="flex-1 text-center">次の請求</span>
          <GrFormNext />
        </button>
      </div>

      <div className={`
        absolute top-0 p-4 rounded-xl bg-neutral-50 w-80 transition-all duration-300 -z-10
        ${LPCalcOpen ? "left-[calc(100%+2rem)]" : "left-0"}
      `}>
        <h2 className="mb-2 font-bold text-center">縦長バナー料金計算機</h2>
        <div className="text-[13px] flex flex-col gap-2 border-b border-neutral-300 text-justify pb-2">
          <p>作成した画像の縦：横のサイズ(px)を入力して<br />
            1:Xの縦の比率が3倍を超えた時点で縦長バナー用の請求金額を独自の計算式を基に組み立てます。</p>
          <p>ベースを25,000円とし、縦の比率が1倍増える毎に+2,500円、比率の小数点以下が0.5以上の場合は切り上げや切り捨てではなく+1,000円とします。</p>
          <p>比率が3倍を超えない場合はWEBポップと同等の金額になります。</p>
        </div>
        <div className="grid grid-cols-8 gap-4 pt-2 pb-1">
          <div className="col-span-4">
            <h3 className="text-[13px] px-0.5">縦 ( px )</h3>
            <input
              className="w-full py-1 px-2 rounded-md bg-neutral-200 text-right"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              value={LPData.rows}
              onChange={(e) => {
                setLPData((prev) => {
                  return {
                    ...prev,
                    rows: Number(e.target.value),
                  }
                });
                calcLPData();
              }}
            />
          </div>
          <div className="col-span-4">
            <h3 className="text-[13px] px-0.5">横 ( px )</h3>
            <input
              className="w-full py-1 px-2 rounded-md bg-neutral-200 text-right"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              value={LPData.cols}
              onChange={(e) => {
                setLPData((prev) => {
                  return {
                    ...prev,
                    cols: Number(e.target.value),
                  }
                });
                calcLPData();
              }}
            />
          </div>
          <div className="col-span-3 relative after:content-['：'] after:absolute after:left-full after:bottom-0 after:block after:py-1 after:px-[1px]">
            <h3 className="text-[13px] px-0.5">比率(縦)</h3>
            <input className="w-full py-1 px-2 rounded-md bg-neutral-300 text-right pointer-events-none" type="tel" inputMode="numeric" pattern="[0-9]*" value={1} readOnly />
          </div>
          <div className="col-span-5">
            <h3 className="text-[13px] px-0.5">比率(横) X</h3>
            <input className="w-full py-1 px-2 rounded-md bg-neutral-300 pointer-events-none" type="tel" inputMode="numeric" pattern="[0-9]*" value={LPData.rate} readOnly />
          </div>
          <div className="col-span-4">
            <h3 className="text-[13px] px-0.5">縦比率超過分(X - 3)</h3>
            <input className="w-full py-1 px-2 rounded-md bg-neutral-300 text-right pointer-events-none" type="tel" inputMode="numeric" pattern="[0-9]*" value={LPData.alt_rate} readOnly />
          </div>
          <div className="col-span-4">
            <h3 className="text-[13px] px-0.5">小数点以下指数</h3>
            <input className="w-full py-1 px-2 rounded-md bg-neutral-300 text-right pointer-events-none" type="tel" inputMode="numeric" pattern="[0-9]*" value={LPData.decimal} readOnly />
          </div>
          <div className="col-span-8">
            <h3 className="text-[13px] px-0.5">請求金額</h3>
            <input
              className="w-full py-1 px-2 rounded-md bg-blue-500/20 text-right"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              value={LPData.total_amount}
              readOnly
            />
            {LPData.total_amount > 0 && LPData.total_amount !== 20000 && (
              <p className="text-xs px-0.5 pt-1 text-right">内訳：25000 + ({LPData.alt_rate} * 2500) + ({LPData.decimal} * 1000) = {LPData.total_amount}</p>
            )}
          </div>
          <div className="col-span-8 flex justify-end gap-2">
            <button
              className="px-4 py-2 text-sm bg-red-300 rounded-md cursor-pointer hover:opacity-90"
              onClick={() => {
                setLPData({
                  rows: 0,
                  cols: 0,
                  rate: 0,
                  alt_rate: 0,
                  decimal: 0,
                  total_amount: 0,
                })
              }}
            >
              リセット
            </button>
            <OutlineBtn
              className="text-sm px-4 !w-fit cursor-pointer"
              onClick={() => {
                setLPCalcOpen(false)
              }}
            >
              閉じる
            </OutlineBtn>
          </div>
        </div>
      </div>
    </div>
  )
}