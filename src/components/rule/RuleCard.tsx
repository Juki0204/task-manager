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

interface RuleCardProps {
  rule: Rule;
  acknowledgements: RuleAcknowledgement[] | null;
  users: User[];
  onClick: (r: Rule) => void;
}

export default function RuleCard({ rule, acknowledgements, users, onClick }: RuleCardProps) {
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
    <div onClick={() => onClick(rule)} className="flex flex-col w-374 border-b border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-100 gap-2 p-3 hover:bg-black/4 hover:dark:bg-white/10 hover:cursor-pointer">
      <div className="flex flex-col w-full">
        <div className="flex justify-between">
          <h3 className="flex flex-1 gap-1 items-center font-bold truncate tracking-widest">
            {isAcknowledged === "new" && <span className="bg-blue-400 px-3 pt-0.25 pb-0.5 rounded-full text-xs text-white font-medium">未読</span>}
            {isAcknowledged === "updated" && <span className="bg-red-400 px-3 pb-0.25 rounded-full text-sm text-white font-medium">追記</span>}
            <LuNewspaper />
            <span>{rule.title}</span>
          </h3>
          <div className="flex gap-1">
            <p className="w-44 bg-neutral-200 dark:bg-neutral-600 py-0.5 px-4 rounded-full text-[13px] text-center tracking-wider font-bold">{rule.target}</p>
            <p className="w-26 bg-neutral-200 dark:bg-neutral-600 py-0.5 px-4 rounded-full text-[13px] text-center tracking-wider font-bold">{rule.type}</p>
            <p className={`
              w-18 py-0.5 px-4 rounded-full text-[13px] text-white text-center tracking-wider font-bold brightness-105
              ${rule.importance === "重要" ? "bg-red-500/80" : "bg-green-400/70"}
            `}>
              {rule.importance}
            </p>
          </div>
        </div>
      </div>
      <div className="flex gap-4 justify-end">

        <div className="flex justify-between items-center p-0.5">
          <h3 className="flex items-center gap-1 text-[13px] whitespace-nowrap text-neutral-500 tracking-wider">
            <FaPenToSquare />{rule.created_by} {convertDate(rule.created_at)}
          </h3>
        </div>

        <div className="flex justify-between items-center p-0.5">
          <h3 className="flex items-center gap-1 text-[13px] whitespace-nowrap text-neutral-500 tracking-wider">
            <FaRepeat />{rule.updated_by} {convertDate(rule.updated_at)}
          </h3>
        </div>

        <div className="flex justify-between items-center p-0.5">
          <h3 className="flex items-center gap-1 text-[13px] whitespace-nowrap text-neutral-500 tracking-wider">
            <FaRegSmile />{readUsers.length} / {users.length}
          </h3>
        </div>
      </div>

      <div className={`h-0.5 rounded-full ${isAcknowledged === "new" ? "bg-blue-400" : isAcknowledged === "updated" ? "bg-red-400" : isAcknowledged === "read" ? "bg-neutral-400" : ""} `}></div>
    </div>
  )
}