"use client";

import { supabase } from "@/utils/supabase/supabase";
import { useEffect, useState } from "react";

import { GrClose } from "react-icons/gr";
import { MdDriveFileRenameOutline } from "react-icons/md";
import { Dialog, DialogBackdrop, DialogPanel, Input, Select } from "@headlessui/react";
import AddRuleEditor from "./AddRuleEditor";
import { FaPenToSquare, FaRegPenToSquare } from "react-icons/fa6";
import { MdNotificationImportant, MdOutlineCategory } from "react-icons/md";

import { FaBuilding, FaRegSmile } from "react-icons/fa";
import { BsPersonCheck } from "react-icons/bs";
import { useAuth } from "@/app/AuthProvider";
import { FiPlusCircle } from "react-icons/fi";
import { LuNewspaper } from "react-icons/lu";
import { User } from "@/utils/types/user";
import { Rule, RuleHistory } from "@/utils/types/rule";

interface RuleDetailProps {
  rule: Rule;
  users: User[];
  onClose: () => void;
  onCancel: () => void;
}

export default function EditRule({ rule, users, onClose, onCancel }: RuleDetailProps) {
  const { user } = useAuth();
  const [clients, setClients] = useState<string[] | null>(null);

  const [title, setTitle] = useState<string>(rule.title);
  const [content, setContent] = useState<string>(rule.content);
  const [target, setTarget] = useState<string>(rule.target);
  const [type, setType] = useState<string>(rule.type);
  const [importance, setImportance] = useState<string>(rule.importance);
  const [creator, setCreator] = useState<string>(rule.created_by);
  // const [date, setDate] = useState<string>(() => {
  //   const now = new Date().toLocaleDateString("sv-SE");
  //   return now;
  // });

  const [isSend, setIsSend] = useState<boolean>(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);

  const getClient = async () => {
    const { data: clients } = await supabase
      .from("clients")
      .select("*");

    if (clients) {
      const clientList = clients?.map(c => c.name).sort();
      setClients(clientList);
    }
  }

  const updateRule = async (updatedType: "major" | "minor") => {
    setIsSend(true);

    const updatePayload: Partial<Rule> = {
      title: title,
      content: content,
      target: target,
      type: type,
      importance: importance,
      updated_by: user?.name,
      updated_at: new Date(),
    };

    if (updatedType === "major") {
      updatePayload.confirmation_required_at = new Date();
    }

    const { data: ruleData, error: addErr } = await supabase
      .from("rules")
      .update(updatePayload)
      .eq("id", rule.id)
      .select()
      .single();

    if (addErr) console.error("新規ルールの追加に失敗しました。");

    const updateHistoryPayload: Partial<RuleHistory> = {
      rule_id: ruleData.id,
      acted_by: user?.name,
      acted_at: new Date(),
    };

    if (updatedType === "major") {
      updateHistoryPayload.action_type = "updated_major";
    } else if (updatedType === "minor") {
      updateHistoryPayload.action_type = "updated_minor";
    }

    const { error: historyErr } = await supabase
      .from("rules_histories")
      .upsert(updateHistoryPayload);

    if (historyErr) console.error("ルール追加履歴の記録に失敗しました。");

    setTimeout(() => {
      onCancel();
      setIsSend(false);
    }, 500);
  }

  useEffect(() => {
    getClient();
  }, [user]);

  return (
    <div className="relative grid grid-cols-22 gap-2 w-full rounded-xl bg-neutral-100">
      <h2 className="col-span-22 -mt-1 tracking-wider text-center font-bold">編集</h2>
      <GrClose
        onClick={onClose}
        className="absolute top-0 right-0 cursor-pointer"
      />
      <div className="col-span-16 flex flex-col gap-2">
        <div className="flex flex-col gap-1 p-3 bg-slate-300/70 rounded-xl">
          <h3 className="relative mb-2 rounded-md text-neutral-700 w-full font-bold text-base text-justify flex gap-1 items-center leading-none">
            <LuNewspaper className="absolute top-0 bottom-0 left-2 m-auto text-lg" />
            <Input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-neutral-100 w-full rounded-md p-2 pl-8" placeholder="タイトル" />
          </h3>
          <div className="flex-1 bg-neutral-100 rounded-md">
            <div className="w-full max-h-130 text-sm text-neutral-800 whitespace-pre-wrap tracking-wider text-justify overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-neutral-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-400">
              <AddRuleEditor value={content} onChange={(markdown) => setContent(markdown)} />
            </div>
          </div>
        </div>

      </div>


      <div className="col-span-6 flex flex-col gap-1 border-l border-neutral-300 pl-2">

        <div className="col-span-4 flex flex-col gap-1 p-2 bg-green-700/15 rounded-lg">
          <h4 className="whitespace-nowrap flex gap-1 items-center font-bold text-[13px] text-neutral-600"><FaBuilding />対象</h4>
          <Select className="bg-neutral-100 p-1 rounded-md text-[13px] tracking-wider" value={target} onChange={(e) => setTarget(e.target.value)}>
            <option value={""}>-</option>
            {clients && clients.map((c, index) => (<option key={index} value={c}>{c}</option>))}
          </Select>
        </div>

        <div className="col-span-4 flex flex-col gap-1 p-2 bg-green-700/15 rounded-lg">
          <h4 className="whitespace-nowrap flex gap-0.5 items-center font-bold text-[13px] text-neutral-600"><MdOutlineCategory className="text-base" />種別</h4>
          <Select className="bg-neutral-100 p-1 rounded-md text-[13px] tracking-wider" value={type} onChange={(e) => setType(e.target.value)}>
            <option value={""}>-</option>
            <option value={"正式運用"}>正式運用</option>
            <option value={"共有事項"}>共有事項</option>
          </Select>
          {type === "正式運用" ? (<p className="text-xs text-neutral-600">今後の標準ルール、改定内容、正式共有</p>)
            : type === "共有事項" ? (<p className="text-xs text-neutral-600">念押しの確認、参考情報、未確定寄りの共有</p>)
              : ""}
        </div>

        <div className="col-span-4 flex flex-col gap-1 p-2 bg-green-700/15 rounded-lg">
          <h4 className="whitespace-nowrap flex gap-0.5 items-center font-bold text-[13px] text-neutral-600"><MdNotificationImportant className="text-base" />重要度</h4>
          <Select className="bg-neutral-100 p-1 rounded-md text-[13px] tracking-wider" value={importance} onChange={(e) => setImportance(e.target.value)}>
            <option value={"通常"}>通常</option>
            <option value={"重要"}>重要</option>
          </Select>
        </div>

        {/* <div className="col-span-4 flex flex-col gap-1 p-2 bg-neutral-300/80 rounded-lg">
          <h4 className="whitespace-nowrap flex gap-1 items-center font-bold text-[13px] text-neutral-600"><FaPenToSquare className="text-sm" />作成日時</h4>
          <Input className="bg-neutral-100 p-1 rounded-md text-[13px] tracking-wider" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div> */}

        <div className="col-span-4 flex flex-col gap-1 p-2 bg-neutral-300/80 rounded-lg">
          <h4 className="whitespace-nowrap flex gap-0.5 items-center font-bold text-[13px] text-neutral-600"><BsPersonCheck className="text-base" />記入者</h4>
          <Select className="bg-neutral-100 p-1 rounded-md text-[13px] tracking-wider" value={creator} onChange={(e) => setCreator(e.target.value)}>
            <option value={""}>-</option>
            {users.map((u, index) => (<option key={index} value={u.name}>{u.name}</option>))}
          </Select>
        </div>

        <div className="col-span-4 grid grid-cols-5 gap-2 mt-auto mb-0">
          <button
            onClick={onCancel}
            disabled={!content || !title || !creator || !target || !type || !importance}
            className="col-span-2 outline-1 outline-neutral-700 rounded-md text-center text-neutral-700 font-bold text-sm py-2 tracking-wider hover:cursor-pointer hover:opacity-60"
          >
            キャンセル
          </button>
          <button
            onClick={() => setIsConfirmModalOpen(true)}
            disabled={!content || !title || !creator || !target || !type || !importance}
            className="col-span-3 flex justify-center items-center gap-1 rounded-md bg-sky-600 text-center text-white font-bold text-sm py-2 tracking-wider hover:cursor-pointer hover:opacity-60 disabled:grayscale disabled:opacity-70"
          >
            {isSend ? "変更中..." : <><FaRegPenToSquare />変更する</>}
          </button>
        </div>

      </div>


      <Dialog open={isConfirmModalOpen} onClose={() => { setIsConfirmModalOpen(false); setIsSend(false); }} className="relative z-50 transition duration-300 ease-out data-closed:opacity-0">
        <DialogBackdrop className="fixed inset-0 bg-black/30" />

        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <DialogPanel className="relative min-w-sm max-w-xl space-y-4 rounded-2xl bg-neutral-100 p-8 pr-6">
            <p className="text-center text-lg font-bold py-4 tracking-wider">更新を全体に通知しますか？</p>
            <p className="text-sm text-neutral-600 tracking-wider">誤字・脱字の修正や軽微な修正の場合は通知しなくてもOKです。<br />
              内容自体に変更が加わった・追加された場合などは基本的に通知するようにして下さい。</p>
            <p className="text-sm text-neutral-600 tracking-wider">全体に通知した場合は、当該投稿の全員の確認状態がリセットされます。</p>

            {isSend ? (
              <div className="flex gap-2">
                <button disabled onClick={() => updateRule("minor")} className="flex-1 p-2 rounded-md bg-red-600/60 text-white disabled:grayscale disabled:opacity-70">更新中...</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => updateRule("minor")} className="flex-1 p-2 rounded-md bg-red-600/60 text-white cursor-pointer hover:opacity-70">通知しない</button>
                <button onClick={() => updateRule("major")} className="flex-1 p-2 rounded-md bg-sky-600/80 text-white cursor-pointer hover:opacity-70">通知する</button>
              </div>
            )}
            <p onClick={() => { setIsConfirmModalOpen(false); setIsSend(false); }} className="-mt-1 -mb-2 w-fit text-sm m-auto tracking-wider text-neutral-600 cursor-pointer hover:opacity-70">キャンセル</p>
          </DialogPanel>
        </div>
      </Dialog >
    </div >
  )
}