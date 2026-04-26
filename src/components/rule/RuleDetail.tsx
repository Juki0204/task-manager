"use client";

import { Rule, RuleAcknowledgement } from "@/utils/types/rule";
import { FaRegSmile, FaRegCheckCircle, FaCheckCircle } from "react-icons/fa";

import { FaPenToSquare, FaRepeat } from "react-icons/fa6";
import { GrClose } from "react-icons/gr";
import { MdDriveFileRenameOutline } from "react-icons/md";
import { LuNewspaper } from "react-icons/lu";
import { User } from "@/utils/types/user";
import { useAuth } from "@/app/AuthProvider";
import { tiptapMarkdownToHtml } from "@/utils/function/tiptapMarkdownToHtml";
import { useMemo, useState } from "react";
import { supabase } from "@/utils/supabase/supabase";

interface RuleDetailProps {
  rule: Rule;
  acknowledgements: RuleAcknowledgement[] | null;
  users: User[];
  onClose: () => void;
  onEdit: () => void;
}

export default function RuleDetail({ rule, acknowledgements, users, onClose, onEdit }: RuleDetailProps) {
  const { user } = useAuth();
  const [isConfirming, setIsConfirming] = useState<boolean>(false);

  //既読ユーザー一覧・未読ユーザー一覧振り分け
  const validAcknowledgedUserIds = useMemo(() => {
    return new Set(
      (acknowledgements ?? [])
        .filter((a) => a.acknowledged_at >= rule.confirmation_required_at)
        .map((a) => a.user_id)
    );
  }, [acknowledgements, rule.confirmation_required_at]);

  const { readUsers, unreadUsers } = useMemo(() => {
    const read: User[] = [];
    const unread: User[] = [];

    users.forEach((u) => {
      if (validAcknowledgedUserIds.has(u.id)) {
        read.push(u);
      } else {
        unread.push(u);
      }
    });

    return { readUsers: read, unreadUsers: unread };
  }, [users, validAcknowledgedUserIds]);

  //自分が既読済か未読か判定
  const isAcknowledged = useMemo(() => {
    if (!user?.id) return false;
    return validAcknowledgedUserIds.has(user.id);
  }, [validAcknowledgedUserIds, user?.id]);

  const convertDate = (date: string | Date): string => {
    const baseDate = new Date(date);
    const localeDate = baseDate.toLocaleDateString();
    const localeTime = baseDate.toLocaleTimeString("sv-SE");
    // const dateArr = localeDate.split("/");
    // const jpDate = `${dateArr[0]}年${dateArr[1]}月${dateArr[2]}日`;

    return `${localeDate} ${localeTime}`;
  }

  const handleConfirm = async () => {
    setIsConfirming(true);

    const { error } = await supabase
      .from("rules_acknowledgements")
      .upsert({
        rule_id: rule.id,
        user_id: user?.id,
        acknowledged_at: new Date(),
      },
        {
          onConflict: "rule_id,user_id",
        });

    if (error) console.error("確認フラグの登録に失敗しました。", error);

    setIsConfirming(false);
  }


  return (
    <div className="grid grid-cols-22 gap-2 w-full rounded-xl bg-neutral-100 scheme-light">
      <h2 className="col-span-22 -mt-1 tracking-wider text-center font-bold">詳細内容</h2>
      <GrClose
        onClick={onClose}
        className="absolute top-6 right-6 cursor-pointer"
      />

      <div className="col-span-16 flex flex-col gap-2">
        <div className="relative flex flex-col gap-1 p-3 bg-slate-300/70 rounded-xl">
          <div className="flex gap-1">
            <p className="bg-neutral-100 py-1 px-4 rounded-full text-xs text-center tracking-wider font-bold">{rule.target}</p>
            <p className="bg-neutral-100 py-1 px-4 rounded-full text-xs text-center tracking-wider font-bold">{rule.type}</p>
            <p className={`py-1 px-4 rounded-full text-xs text-center tracking-wider font-bold brightness-105 ${rule.importance === "重要" ? "bg-yellow-300/80" : "bg-green-400/70"}`}>{rule.importance}</p>
          </div>
          <h3 className="p-1 rounded-md text-neutral-700 w-full font-bold text-lg text-justify flex gap-1 items-center leading-none">
            <LuNewspaper />
            <span>{rule.title}</span>
          </h3>
          <div className="flex-1 bg-neutral-100 p-2 rounded-md">
            <div
              className="tiptap-base tiptap-viewer w-full !min-h-87 max-h-130 py-1.5 px-2 text-sm text-neutral-800 whitespace-pre-wrap tracking-wider text-justify overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-neutral-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-400"
              dangerouslySetInnerHTML={{ __html: tiptapMarkdownToHtml(rule.content) }}
            />
          </div>
        </div>

      </div>

      <div className="col-span-6 flex flex-col gap-1 border-l border-neutral-300 pl-2">

        <div className="col-span-4 flex justify-between gap-1 p-1 border-b border-neutral-300">
          <h4 className="whitespace-nowrap flex gap-1 items-center font-bold text-[13px] text-neutral-600"><FaPenToSquare />作成</h4>
          <p className="bg-neutral-100 rounded-md text-[13px] tracking-wider">{rule.created_by} {convertDate(rule.created_at)}</p>
        </div>

        <div className="col-span-4 flex justify-between gap-1 p-1 border-b border-neutral-300">
          <h4 className="whitespace-nowrap flex gap-1 items-center font-bold text-[13px] text-neutral-600"><FaRepeat />更新</h4>
          <p className="bg-neutral-100 rounded-md text-[13px] tracking-wider">{rule.updated_by} {convertDate(rule.updated_at)}</p>
        </div>

        <div className="col-span-8 flex flex-col gap-1 bg-neutral-300/60 rounded-md p-1.5 pl-2">
          <h4 className="whitespace-nowrap flex gap-1 items-center font-bold text-[13px] text-neutral-600"><FaRegSmile /> 確認</h4>
          {unreadUsers.length > 0 && (
            <div className="flex-1 flex flex-col gap-1 rounded-md bg-neutral-100 p-1">
              <h4 className="text-sm font-bold text-center text-neutral-600 border-b border-neutral-200">未読</h4>
              <div className="flex-1 grid grid-cols-2 gap-1 py-0.25 text-[13px] text-center tracking-wider">
                {unreadUsers.map((u) => (
                  <span key={u.id} className="rounded-md bg-sky-700/20 py-0.5">{u.name}</span>
                ))}
              </div>
            </div>
          )}

          {readUsers.length > 0 && (
            <div className="flex-1 flex flex-col gap-1 rounded-md bg-neutral-100 p-1">
              <h4 className="text-sm font-bold text-center text-neutral-600 border-b border-neutral-200">既読</h4>
              <div className="flex-1 grid grid-cols-2 gap-1 py-0.25 text-[13px] text-center tracking-wider">
                {readUsers.map((u) => (
                  <span key={u.id} className="rounded-md bg-green-600/20 py-0.5">{u.name}</span>
                ))}
              </div>
            </div>
          )}

          {isAcknowledged ? (
            <button disabled className="flex justify-center items-center gap-1 rounded-md bg-green-600 text-center text-white text-sm py-2 tracking-wider"><FaCheckCircle />確認済</button>
          ) : (
            <button disabled={isConfirming} onClick={handleConfirm} className="flex justify-center items-center gap-1 rounded-md bg-sky-600 text-center text-white text-sm py-2 tracking-wider hover:cursor-pointer hover:opacity-60 disabled:grayscale disabled:opacity-70">
              {isConfirming ? "反映中..." : (<><FaRegCheckCircle />確認しました</>)}
            </button>
          )}
        </div>

        <button onClick={onEdit} className="flex justify-center items-center gap-1 rounded-md bg-neutral-900 text-center text-white text-sm py-2 mt-auto mb-0 tracking-wider hover:cursor-pointer hover:opacity-60"><MdDriveFileRenameOutline className="text-lg" />編集</button>
      </div>

    </div>
  )
}