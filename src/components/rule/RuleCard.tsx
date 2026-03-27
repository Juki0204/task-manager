import { useAuth } from "@/app/AuthProvider";
import { Rule, RuleAcknowledgement } from "@/utils/types/rule";
import { User } from "@/utils/types/user";
import { useEffect, useMemo, useState } from "react";
import { BsPersonCheck } from "react-icons/bs";
import { FaRegSmile } from "react-icons/fa";
import { FaPenToSquare, FaRepeat } from "react-icons/fa6";
import { LuNewspaper } from "react-icons/lu";

import { MdDriveFileRenameOutline } from "react-icons/md";
import { RiCalendarScheduleLine } from "react-icons/ri";

interface RuleDetailProps {
  rule: Rule;
  acknowledgements: RuleAcknowledgement[] | null;
  users: User[];
  onClick: (r: Rule) => void;
}

export default function RuleDetail({ rule, acknowledgements, users, onClick }: RuleDetailProps) {
  const { user } = useAuth();
  const [currentAcknowledgements, setCurrentAcknowledgements] = useState<RuleAcknowledgement[] | null>(null);

  //既読ユーザー一覧・未読ユーザー一覧振り分け
  const validAcknowledgedUserIds = useMemo(() => {
    return new Set(
      (currentAcknowledgements ?? [])
        .filter((a) =>
          a.rule_id === rule.id &&
          a.acknowledged_at >= rule.confirmation_required_at)
        .map((a) => a.user_id)
    );
  }, [currentAcknowledgements, rule.id, rule.confirmation_required_at]);

  const readUsers = useMemo(() => {
    return users.filter((u) => validAcknowledgedUserIds.has(u.id));
  }, [users, validAcknowledgedUserIds]);

  //自分が既読済か未読か判定
  const isAcknowledged = useMemo(() => {
    const ack = currentAcknowledgements?.find(
      (a) => a.user_id === user?.id
    );

    let status: "new" | "updated" | "read";

    if (!ack) {
      status = "new";
    } else if (ack.acknowledged_at < rule.confirmation_required_at) {
      status = "updated";
    } else {
      status = "read";
    }
    return status;
  }, [currentAcknowledgements, user, rule]);


  const convertDate = (date: string | Date): string => {
    const baseDate = new Date(date);
    const localeDate = baseDate.toLocaleDateString();
    const localeTime = baseDate.toLocaleTimeString("sv-SE");
    const dateArr = localeDate.split("/");
    const jpDate = `${dateArr[0]}年${dateArr[1]}月${dateArr[2]}日`;

    // return `${localeDate} ${localeTime}`;
    return jpDate;
  }

  useEffect(() => {
    const filteredAcknowledgements = acknowledgements?.filter(r => r.rule_id === rule.id);
    if (filteredAcknowledgements) {
      setCurrentAcknowledgements(filteredAcknowledgements);
    }
  }, [acknowledgements]);


  return (
    <div onClick={() => onClick(rule)} className="flex w-375 gap-2 rounded-lg bg-neutral-200 p-3 hover:brightness-105 hover:cursor-pointer">
      <div className="flex flex-col w-[calc(100%-(320px+8px))] gap-2 rounded-md bg-neutral-300 p-2">
        <div className="flex justify-between">
          <h3 className="flex gap-1 items-center font-bold truncate text-neutral-800 tracking-wider">
            <LuNewspaper />
            <span>{rule.title}</span>
          </h3>
          <div className="flex gap-1">
            <p className="w-44 bg-neutral-100 py-0.5 px-4 rounded-full text-[13px] text-center tracking-wider font-bold">{rule.target}</p>
            <p className="w-26 bg-neutral-100 py-0.5 px-4 rounded-full text-[13px] text-center tracking-wider font-bold">{rule.type}</p>
            <p className={`w-18 py-0.5 px-4 rounded-full text-[13px] text-center tracking-wider font-bold brightness-105 ${rule.importance === "重要" ? "bg-yellow-300/80" : "bg-green-400/70"}`}>{rule.importance}</p>
          </div>
        </div>
        <p className="truncate rounded-md bg-neutral-100 px-1 py-0.5 text-[13px] tracking-wider">{rule.content}</p>
        <div className={`h-1 rounded-full ${isAcknowledged === "new" ? "bg-blue-400" : isAcknowledged === "updated" ? "bg-red-400" : isAcknowledged === "read" ? "bg-neutral-400" : ""} `}></div>
      </div>

      <div className="flex flex-col w-80 gap-1">

        <div className="col-span-2 flex justify-between items-center gap-1 p-0.5 border-b border-neutral-300">
          <h3 className="flex items-center gap-1 text-[13px] whitespace-nowrap text-neutral-500 tracking-wider"><FaPenToSquare />作成</h3>
          <p className="text-[13px] text-neutral-500 tracking-wider">{rule.created_by} {convertDate(rule.created_at)}</p>
        </div>

        <div className="col-span-2 flex justify-between items-center gap-1 p-0.5 border-b border-neutral-300">
          <h3 className="flex items-center gap-1 text-[13px] whitespace-nowrap text-neutral-500 tracking-wider"><FaRepeat />更新</h3>
          <p className="text-[13px] text-neutral-500 tracking-wider">{rule.updated_by} {convertDate(rule.updated_at)}</p>
        </div>

        <div className="col-span-2 flex justify-between items-center gap-1 p-0.5 border-b border-neutral-300">
          <h3 className="flex items-center gap-1 text-[13px] whitespace-nowrap text-neutral-500 tracking-wider"><FaRegSmile />確認</h3>
          <p className="text-[13px] text-neutral-500 tracking-wider">{readUsers.length} / {users.length}</p>
        </div>
      </div>
    </div>
  )
}