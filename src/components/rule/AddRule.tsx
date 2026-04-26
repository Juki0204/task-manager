"use client";

import { supabase } from "@/utils/supabase/supabase";
import { useEffect, useState } from "react";

import { GrClose } from "react-icons/gr";
import { MdDriveFileRenameOutline, MdNotificationImportant, MdOutlineCategory } from "react-icons/md";
import { Input, Select } from "@headlessui/react";
import AddRuleEditor from "./AddRuleEditor";
import { FaBuilding, FaPenToSquare } from "react-icons/fa6";
import { FaRegSmile } from "react-icons/fa";
import { BsPersonCheck } from "react-icons/bs";
import { useAuth } from "@/app/AuthProvider";
import { FiPlusCircle } from "react-icons/fi";
import { LuNewspaper } from "react-icons/lu";
import { User } from "@/utils/types/user";
import CancelAlertModal from "../CancelAlertModal";
import { toast } from "sonner";

interface RuleDetailProps {
  users: User[];
  onClose: () => void;
}

export default function AddRule({ users, onClose }: RuleDetailProps) {
  const { user } = useAuth();
  const [clients, setClients] = useState<string[] | null>(null);

  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [target, setTarget] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [importance, setImportance] = useState<string>("通常");
  const [creator, setCreator] = useState<string>("");
  // const [date, setDate] = useState<string>(() => {
  //   const now = new Date().toLocaleDateString("sv-SE");
  //   return now;
  // });

  const [isSend, setIsSend] = useState<boolean>(false);
  const [isAlertOpen, setIsAlertOpen] = useState<boolean>(false);

  const getClient = async () => {
    const { data: clients } = await supabase
      .from("clients")
      .select("*");

    if (clients) {
      const clientList = clients?.map(c => c.name).sort();
      setClients(clientList);
    }
  }

  const addRule = async () => {
    setIsSend(true);

    try {
      const { data: ruleData, error: addErr } = await supabase
        .from("rules")
        .insert({
          title: title,
          content: content,
          target: target,
          type: type,
          importance: importance,
          created_by: creator,
          updated_by: creator,
        })
        .select()
        .single();

      if (addErr) console.error("新規ルールの追加に失敗しました。");

      const { error: historyErr } = await supabase
        .from("rules_histories")
        .insert({
          rule_id: ruleData.id,
          action_type: "created",
          acted_by: ruleData.created_by,
          acted_at: ruleData.created_at,
        });

      if (historyErr) console.error("ルール追加履歴の記録に失敗しました。");
    } catch (error) {
      console.error(error);
      toast.error("新規ルールの追加に失敗しました。");
    } finally {
      setTimeout(() => {
        onClose();
        setIsSend(false);
      }, 500);
    }
  }

  useEffect(() => {
    if (user) {
      setCreator(user.name);
    }
    getClient();
  }, [user]);

  return (
    <div className="relative grid grid-cols-22 gap-2 w-full rounded-xl bg-neutral-100 scheme-light">
      <h2 className="col-span-22 -mt-1 tracking-wider text-center font-bold">新規投稿</h2>
      <GrClose
        // onClick={onClose}
        onClick={() => setIsAlertOpen(true)}
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

        <button
          onClick={addRule}
          disabled={!content || !title || !creator || !target || !type || !importance || isSend}
          className="flex justify-center items-center gap-1 rounded-md bg-sky-600 text-center text-white font-bold text-sm py-2 mt-auto mb-0 tracking-wider hover:cursor-pointer hover:opacity-60 disabled:grayscale disabled:opacity-70"
        >
          {isSend ? "追加中..." : <><FiPlusCircle />投稿</>}
        </button>

      </div>

      <CancelAlertModal alertOpen={isAlertOpen} onModalClose={onClose} onCalcel={() => setIsAlertOpen(false)} />
    </div>
  )
}