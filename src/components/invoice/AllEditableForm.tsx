import { supabase } from "@/utils/supabase/supabase";
import { Invoice } from "@/utils/types/invoice";
import { Field, Input, Label, Textarea } from "@headlessui/react";
import { useEffect, useState } from "react";
import { AiOutlinePicture } from "react-icons/ai";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { GrClose, GrFormNext, GrFormPrevious } from "react-icons/gr";
import { MdDevices } from "react-icons/md";


interface AllEditableFormProps {
  recordId: string | null;
  prevId: string | null;
  nextId: string | null;
  onClose: () => void;
  onChangeRecord: (recordId: string) => void;
}


export default function AllEditableForm({ recordId, prevId, nextId, onClose, onChangeRecord }: AllEditableFormProps) {
  const [invoiceData, setInvoiceData] = useState<Invoice | null>(null);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);

  const getCurrentInvoice = async (recordId: string) => {
    const { data: currentInvoice, error } = await supabase
      .from("invoice")
      .select("*")
      .eq("id", recordId)
      .single();

    if (!currentInvoice) return;
    setCurrentInvoice(currentInvoice);

    if (error) console.error("請求データの取得に失敗しました:", error);
  }

  useEffect(() => {
    if (!recordId) return;
    getCurrentInvoice(recordId);
  }, [recordId]);


  if (!currentInvoice) return (<div className="w-full h-full grid place-content-center"><span className="loading loading-spinner loading-lg"></span></div>)

  return (

    <div className="w-full h-full relative space-y-4 bg-neutral-100 px-2 py-14">
      <h2 className="absolute top-0 left-0 w-full h-14 flex items-center justify-between px-4 font-bold pr-10 bg-neutral-100 z-10">
        <span>請求データ一括入力</span><span className="py-0.5 px-4 bg-neutral-200 rounded-md">No. {currentInvoice.serial}</span>
        <GrClose onClick={onClose} className="absolute top-5 right-3 cursor-pointer" />
      </h2>
      <div className="w-full h-full relative space-y-4 bg-neutral-100 p-4 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-neutral-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-400">

        <div>
          <h3 className="flex items-center gap-1 text-sm pl-0.5 mb-1 text-neutral-500"><FaMagnifyingGlass />作業タイトル</h3>
          <Input type="text" value={currentInvoice.title} className="w-full bg-neutral-200 py-1 px-2 rounded-md" />
        </div>

        <div>
          <h3 className="flex items-center gap-1 text-sm pl-0.5 mb-1 text-neutral-500"><FaMagnifyingGlass />作業内容</h3>
          <Input type="text" value={currentInvoice.description} className="w-full bg-neutral-200 py-1 px-2 rounded-md" />
        </div>

        <div>
          <h3 className="flex items-center gap-1 text-sm pl-0.5 mb-1 text-neutral-500"><FaMagnifyingGlass />完了日</h3>
          <Input type="date" value={currentInvoice.finish_date} className="w-full bg-neutral-200 py-1 px-2 rounded-md" />
        </div>

        <hr className="text-neutral-300" />

        <div className="flex gap-x-2 flex-wrap">
          <h3 className="w-full flex items-center gap-1 text-sm pl-0.5 mb-1 text-neutral-500"><MdDevices />中カテゴリ選択</h3>
          <Field tabIndex={0} className="relative w-28 h-8 bg-neutral-200 text-neutral-700 rounded-sm overflow-hidden">
            <Input type="radio" name="DEVICE" id="RESPONSIVE" value="レスポンシブ" className="w-full h-full hidden peer" />
            <Label htmlFor="RESPONSIVE" className="absolute top-0 left-0 w-full aspect-square text-center p-1 text-neutral-800 peer-checked:bg-blue-300/70 transition duration-300">レスポンシブ</Label>
          </Field>
          <Field tabIndex={0} className="relative w-10 h-8 bg-neutral-200 text-neutral-700 rounded-sm overflow-hidden">
            <Input type="radio" name="DEVICE" id="PC" value="PC" className="w-full h-full hidden peer" />
            <Label htmlFor="PC" className="absolute top-0 left-0 w-full aspect-square text-center p-1 text-neutral-800 peer-checked:bg-blue-300/70 transition duration-300">PC</Label>
          </Field>
          <Field tabIndex={0} className="relative w-16 h-8 bg-neutral-200 text-neutral-700 rounded-sm overflow-hidden">
            <Input type="radio" name="DEVICE" id="SP" value="スマホ" className="w-full h-full hidden peer" />
            <Label htmlFor="SP" className="absolute top-0 left-0 w-full aspect-square text-center p-1 text-neutral-800 peer-checked:bg-blue-300/70 transition duration-300">スマホ</Label>
          </Field>
          <Field tabIndex={0} className="relative w-24 h-8 bg-neutral-200 text-neutral-700 rounded-sm overflow-hidden">
            <Input type="radio" name="DEVICE" id="MEMBER" value="会員サイト" className="w-full h-full hidden peer" />
            <Label htmlFor="MEMBER" className="absolute top-0 left-0 w-full aspect-square text-center p-1 text-neutral-800 peer-checked:bg-blue-300/70 transition duration-300">会員サイト</Label>
          </Field>
        </div>

        <div className="flex flex-wrap">
          <h3 className="w-full flex items-center gap-1 text-sm pl-0.5 mb-1 text-neutral-500"><AiOutlinePicture />作業カテゴリ選択</h3>

          <div className="overflow-x-auto pb-2 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-neutral-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-400">

            <div className="w-fit flex gap-x-2">

              <div className="p-2 bg-neutral-200 rounded-md w-50">
                <h3 className="flex items-center gap-1 text-sm pl-0.5 mb-1 font-bold text-center justify-center text-neutral-500">よく使う項目</h3>
                <ul className="flex flex-col gap-0.5">
                  <li data-id="1" className="py-1 px-2 rounded-md bg-neutral-300">カバー画像制作</li>
                  <li data-id="2" className="py-1 px-2 rounded-md bg-neutral-300">サイト変更(1h)</li>
                </ul>
              </div>

              <div className="p-2 bg-neutral-200 rounded-md w-50">
                <h3 className="flex items-center gap-1 text-sm pl-0.5 mb-1 font-bold text-center justify-center text-neutral-500">WEB</h3>
                <ul className="flex flex-col gap-0.5">
                  <li data-id="3" className="py-1 px-2 rounded-md bg-blue-300/70">バナー（大）</li>
                  <li data-id="4" className="py-1 px-2 rounded-md bg-neutral-300">新規サイト制作</li>
                </ul>
              </div>

              <div className="p-2 bg-neutral-200 rounded-md w-50">
                <h3 className="flex items-center gap-1 text-sm pl-0.5 mb-1 font-bold text-center justify-center text-neutral-500">印刷</h3>
                <ul className="flex flex-col gap-0.5">
                  <li data-id="5" className="py-1 px-2 rounded-md bg-neutral-300">A1ポスター制作</li>
                  <li data-id="6" className="py-1 px-2 rounded-md bg-neutral-300">チケットデザイン制作</li>
                </ul>
              </div>

              <div className="p-2 bg-neutral-200 rounded-md w-50">
                <h3 className="flex items-center gap-1 text-sm pl-0.5 mb-1 font-bold text-center justify-center text-neutral-500">出力</h3>
                <ul className="flex flex-col gap-0.5">
                  <li data-id="7" className="py-1 px-2 rounded-md bg-neutral-300">A1ポスター印刷</li>
                  <li data-id="8" className="py-1 px-2 rounded-md bg-neutral-300">A2ポスター印刷</li>
                </ul>
              </div>

              <div className="p-2 bg-neutral-200 rounded-md w-50">
                <h3 className="flex items-center gap-1 text-sm pl-0.5 mb-1 font-bold text-center justify-center text-neutral-500">その他</h3>
                <ul className="flex flex-col gap-0.5">
                  <li data-id="9" className="py-1 px-2 rounded-md bg-neutral-300">外注依頼</li>
                  <li data-id="10" className="py-1 px-2 rounded-md bg-neutral-300">画像補正</li>
                </ul>
              </div>

            </div>

          </div>

        </div>

        <hr className="text-neutral-300" />

        <div className="grid grid-cols-6 gap-2">
          <div className="col-span-2">
            <h3 className="flex items-center gap-1 text-sm pl-0.5 mb-1 text-neutral-500"><FaMagnifyingGlass />作業点数</h3>
            <Input type="text" value={currentInvoice.pieces} className="w-full bg-neutral-200 py-1 px-2 rounded-md" />
          </div>
          <div className="col-span-2">
            <h3 className="flex items-center gap-1 text-sm pl-0.5 mb-1 text-neutral-500"><FaMagnifyingGlass />修正度</h3>
            <Input type="text" value={currentInvoice.degree} className="w-full bg-neutral-200 py-1 px-2 rounded-md" />
          </div>
          <div className="col-span-2">
            <h3 className="flex items-center gap-1 text-sm pl-0.5 mb-1 text-neutral-500"><FaMagnifyingGlass />修正金額</h3>
            <Input type="text" value={currentInvoice.adjustment} className={`w-full bg-neutral-200 py-1 px-2 rounded-md ${currentInvoice.adjustment && currentInvoice.adjustment < 0 ? "text-red-600" : ""}`} />
          </div>

          <div className="col-span-3">
            <h3 className="flex items-center gap-1 text-sm pl-0.5 mb-1 text-neutral-500"><FaMagnifyingGlass />仮請求額</h3>
            <Input type="text" value={currentInvoice.amount} className="w-full bg-neutral-200 py-1 px-2 rounded-md" />
          </div>
          <div className="col-span-3">
            <h3 className="flex items-center gap-1 text-sm pl-0.5 mb-1 text-neutral-500"><FaMagnifyingGlass />本請求額</h3>
            <Input type="text" value={currentInvoice.total_amount} className="w-full bg-neutral-200 py-1 px-2 rounded-md" />
          </div>
        </div>

        <div>
          <h3 className="flex items-center gap-1 text-sm pl-0.5 mb-1 text-neutral-500"><FaMagnifyingGlass />備考欄</h3>
          <Textarea rows={4} value={currentInvoice.remarks} className="w-full bg-neutral-200 py-1 px-2 rounded-md" />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-14 flex items-center justify-between p-6">
        <button
          disabled={prevId ? false : true}
          onClick={() => {
            if (!prevId) return;
            onChangeRecord(prevId);
          }}
          className="flex gap-1 pl-2 pr-4 py-2 leading-none bg-sky-600 text-white rounded-md disabled:grayscale-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <GrFormPrevious />前のタスク
        </button>
        <button className="px-4 py-2 leading-none bg-sky-600 text-white rounded-md">確定</button>
        <button
          disabled={nextId ? false : true}
          onClick={() => {
            if (!nextId) return;
            onChangeRecord(nextId);
          }}
          className="flex gap-1 pl-4 pr-2 py-2 leading-none bg-sky-600 text-white rounded-md"
        >
          次のタスク<GrFormNext />
        </button>
      </div>
    </div>
  )
}