import { FaRegBuilding, FaRegCheckCircle, FaRegQuestionCircle } from "react-icons/fa";
import { RiCalendarScheduleLine, RiFlag2Fill } from "react-icons/ri";
import { MdAlarm, MdMailOutline } from "react-icons/md";
import { FiPhone } from "react-icons/fi";
import { BsPersonCheck } from "react-icons/bs";

import { useEffect, useRef, useState } from "react";
import { Task } from "@/utils/types/task";
import { useTaskPresence } from "@/utils/hooks/useTaskPresence";
import HighlightText from "./ui/HighlightText";
import { useTaskListPreferences } from "@/utils/hooks/TaskListPreferencesContext";
import { User } from "@/utils/types/user";
import { supabase } from "@/utils/supabase/supabase";
import { toast } from "sonner";
import { Tooltip } from "react-tooltip";
import { RemarksHoverMark } from "./ui/RemarksHoverMark";
import { tiptapMarkdownToHtml } from "@/utils/function/tiptapMarkdownToHtml";

interface CardPropd {
  task: Task;
  user: User;
  unreadIds?: string[];
  onClick: (task: Task) => void;
  onContextMenu: (e: React.MouseEvent, taskId: string, taskSerial: string) => void;
  onEdit: (t: Task) => void;
  deadlineList: { task_id: string, date: string }[];
}


export default function Card({ task, user, unreadIds, onClick, onContextMenu, onEdit, deadlineList, ...props }: CardPropd) {
  // const editingUser = useTaskPresence(task.id, { id: user.id, name: user.name }, false);
  const { filters } = useTaskListPreferences();

  const [hasRemarksInfo, setHasRemarksInfo] = useState<boolean>(false);
  // const [isUnread, setIsUnread] = useState<boolean>(false);

  const [priorityStyle, setPriorityStyle] = useState<string>('');
  const [statusStyle, setStatusStyle] = useState<string>('');

  const [personalBorder, setPersonalBorder] = useState<string>('');
  const [personalBg, setPersonalBg] = useState<string>('');

  const currentDeadline = deadlineList?.filter(d => d.task_id === task.id)[0];

  const managerStyles: Record<string, { border: string; bg: string; }> = {
    "谷": { border: "taniBorder", bg: "taniBg" },
    "飯塚": { border: "iiBorder", bg: "iiBg" },
    "浜口": { border: "hamaBorder", bg: "hamaBg" },
    "田口": { border: "taguBorder", bg: "taguBg" },
    "西谷": { border: "nishiBorder", bg: "nishiBg" },
  } as const;

  function definePersonalColor(manager: string) {
    const style = managerStyles[manager] ?? {
      border: "defaultBorder",
      bg: "defaultBg",
    };

    setPersonalBorder(style.border);
    setPersonalBg(style.bg);
  }

  const priorityStyles: Record<string, string> = {
    "急": "bg-red-300 text-red-800",
    "高": "bg-orange-300 text-orange-800",
    "低": "bg-emerald-300 text-emerald-800",
  } as const;

  function definePriorityStyle(priority: string | null) {
    if (priority) {
      const style = priorityStyles[priority] ?? ""
      setPriorityStyle(style);
    }
  }

  const statusStyles: Record<string, string> = {
    "未着手": "bg-neutral-300 text-neutral-800",
    "作業中": "bg-blue-300 text-blue-800",
    "作業途中": "bg-blue-200 text-blue-800",
    "確認中": "bg-pink-300 text-pink-800",
    "完了": "bg-green-300 text-green-800",
    "保留": "bg-yellow-300 text-yellow-800",
    "中止": "bg-neutral-600 text-neutral-200",
    "詳細待ち": "bg-neutral-500 text-neutral-200",
  }

  function defineStatusStyle(status: string) {
    const style = statusStyles[status];
    setStatusStyle(style);
  }


  //備考欄にメールID以外の情報が入力されているか判定
  const remarksCheck = (remarks: string | null | undefined) => {
    if (!remarks) return false;
    const trimmed = remarks.trim();

    //空白or空の場合
    if (!trimmed) return false;

    const host = `www\\.[A-Za-z0-9-]+(?:\\.[A-Za-z0-9-]+)+`;
    const digits = `\\d+`;

    const plain = `\\[${host}\\s+${digits}\\]`;

    const mdLink = `\\[\\[${host}\\]\\((?:https?:\\/\\/)${host}\\)\\s+${digits}\\]`;

    const block = `(?:${plain}|${mdLink})`;

    const onlyMailIds = new RegExp(`^${block}(?:\\s+${block})*$`);

    //idのみの場合
    if (onlyMailIds.test(trimmed)) return false;

    return true;
  }


  useEffect(() => {
    definePriorityStyle(task.priority);
    defineStatusStyle(task.status);
    definePersonalColor(task.manager ? task.manager : "");

    setHasRemarksInfo(remarksCheck(task.remarks));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task]);


  //編集ロック
  const lockedTaskHandler = async () => {
    const { data } = await supabase
      .from('tasks')
      .update({
        locked_by_id: user.id,
        locked_by_name: user.name,
        locked_by_at: new Date().toISOString(),
      })
      .eq("id", task.id)
      .is("locked_by_id", null)
      .select();

    if (!data?.length) {
      toast.error('他のユーザーが編集中です', { position: "top-center" });
      return false;
    }

    console.log("locked task: taskId =", task.id);
    return true;
  }

  // クリック判定(シングル・ダブル)
  const DOUBLE_CLICK_GRACE = 200;
  const timerRef = useRef<NodeJS.Timeout>(null);
  const handleDoubleClick = async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    //console.log("ダブルクリックです");
    const ok = await lockedTaskHandler();
    if (!ok) return;

    // if (!) {
      onEdit(task);
    // }
  }

  const handleSingleClick = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      return;
    }

    timerRef.current = setTimeout(() => {
      //console.log("シングルクリックです");
      onClick(task);
      timerRef.current = null;
    }, DOUBLE_CLICK_GRACE);
  }

  return (
    <div
      onContextMenu={(e) => onContextMenu(e, task.id, task.serial)}
      className={`${task.locked_by_id ? "rolling-border" : `static-border ${personalBorder}`} ${task.status === "作業中" ? "inprogress" : ""} min-w-[1868px] shadow-xs shadow-black/30 hover:brightness-125`}>
      {task.locked_by_id && <div className="editing-overlay"><span className="editing-overlay-text">{task.locked_by_name}さんが編集中...</span></div>}
      {/* カード（概要） */}
      <div
        onClick={handleSingleClick}
        onDoubleClick={handleDoubleClick}
        id={task.id}
        className={`${personalBg} w-full p-4 text-white tracking-wide cursor-pointer relative grid [grid-template-areas:'id_cli_ttl_dis_mana_status_date'] items-center grid-cols-[120px_240px_300px_600px_120px_120px_auto] py-2`}
        {...props}
      >
        {/* {unreadIds && unreadIds.includes(task.id) && (
          <div className="absolute left-2 w-1 h-8 bg-[#ffff00]" />
        )} */}
        <div className="text-xs flex items-center gap-1.5">
          <div className="flex items-center gap-1">
            <HighlightText text={task.serial} keyword={filters.searchKeywords} />
            {user.important_task_id && user.important_task_id.includes(task.id) && (
              <RiFlag2Fill className="text-red-500/80 text-lg ml-0.5 mt-0.5" />
            )}
            {currentDeadline && (
              <>
                <MdAlarm tabIndex={-1} className="text-yellow-300 text-lg -ml-0.5 mt-0.5" data-tooltip-id="deadline" data-tooltip-content={`期日が${currentDeadline.date.split("-")[1]}月${currentDeadline.date.split("-")[2]}日に設定されています。`} />
                <Tooltip id="deadline" place="top-start" variant="warning" style={{ color: "#333", fontWeight: "bold", fontSize: "14px" }} />
              </>
            )}
          </div>
        </div>

        <div className="text-sm [grid-area:cli] flex gap-1 items-center"><FaRegBuilding />{task.client} 【<HighlightText text={task.requester} keyword={filters.searchKeywords} />】</div>

        <h3 className="font-bold flex items-center gap-1 [grid-area:ttl] text-sm">
          {
            task.method === 'mail' ?
              <MdMailOutline />
              : task.method === 'tel' ?
                <FiPhone />
                :
                <FaRegQuestionCircle />
          }
          <span className="truncate flex-1 pr-3">
            <HighlightText text={task.title} keyword={filters.searchKeywords} />
          </span>
        </h3>

        <div className="w-fit flex gap-1 items-center [grid-area:status] pl-3">
          {
            task.priority ?
              <span className={`py-1 px-2 h-fit rounded-sm text-xs font-bold whitespace-nowrap ${priorityStyle}`}>{task.priority}</span>
              :
              <span className="w-7 h-6 opacity-0"></span>
          }
          <span className={`py-1 px-2 h-fit w-16.5 text-center rounded-sm text-xs font-bold whitespace-nowrap ${statusStyle}`}>{task.status}</span>
        </div>

        <div className="relative line-clamp-2 w-full text-sm pr-18 truncate [grid-area:dis]">
          <HighlightText text={task.description} keyword={filters.searchKeywords} />
          {hasRemarksInfo && task.remarks && (
            <RemarksHoverMark className="absolute inset-y-0 right-4">
              <div className={`whitespace-pre-wrap tiptap-base tiptap-viewer bg-neutral-100 py-1 px-2 rounded-md text-sm`} dangerouslySetInnerHTML={{ __html: tiptapMarkdownToHtml(task.remarks) }} />
            </RemarksHoverMark>
          )}
        </div>

        <div className="text-sm [grid-area:mana] flex gap-1 items-center"><BsPersonCheck />{task.manager ? task.manager : "-"}</div>

        <div className="grid gap-2 text-sm grid-cols-6 [grid-area:date]">
          <div className="col-span-3 flex gap-1 items-center"><RiCalendarScheduleLine />{task.request_date}</div>
          <div className="col-span-3 flex gap-1 items-center"><FaRegCheckCircle />{task.finish_date ? task.finish_date : "-"}</div>
        </div>
      </div>
    </div>
  )

}

