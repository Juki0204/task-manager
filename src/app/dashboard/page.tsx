"use client"

import { useEffect, useState } from "react";

import { useTaskNotesRealtime } from "@/utils/hooks/useTaskNotesRealtime";
import { supabase } from "@/utils/supabase/supabase";
import { Task } from "@/utils/types/task";
import { marked } from "marked";
import { useRouter } from "next/navigation";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import InvoiceTaskDetail from "@/components/invoice/InvoiceTaskDetail";

import { FaTriangleExclamation } from "react-icons/fa6";
import { RequestGraph } from "@/components/ui/RequestGraph";
import DashboardNotesViewer from "@/components/DashboadNotesViewer";
import PriorityTasks from "@/components/PriorityTasks";
import UpdateTask from "@/components/UpdateTask";
import TaskDetail from "@/components/TaskDetail";
import { useAuth } from "../AuthProvider";


interface ReleaseNoteMeta {
  version: string;
  date: string;
}

interface ReleaseNoteData extends ReleaseNoteMeta {
  content?: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const now = new Date();
  const [deadline, setDeadline] = useState<{ task_id: string, date: string }[]>([]);
  const [todayDeadlineTasks, setTodayDeadlineTasks] = useState<Task[]>([]);
  const [isDeadlinePop, setIsDeadlinePop] = useState<boolean>(false);
  const [isNewTaskPop, setIsNewTaskPop] = useState<boolean>(false);

  // const { notes, isReady } = useTaskNotesRealtime();
  const [tasks, setTasks] = useState<Task[]>([]);
  const todayNewTasks = [...tasks].filter((t) =>
    new Date(t.created_at).toLocaleDateString("sv-SE") === now.toLocaleDateString("sv-SE") && t.status !== "削除済"
  )
    .sort((a, b) => { return new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); });

  const [releaseNotes, setReleaseNotes] = useState<ReleaseNoteData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [isTaskLoaded, setIsTaskLoaded] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const [modalType, setModalType] = useState<"detail" | "edit" | null>(null);
  const [unreadIds, setUnreadIds] = useState<string[]>([]);

  const router = useRouter();

  useEffect(() => {
    const loadNotes = async () => {
      try {
        const res = await fetch("/release-notes/release-notes.json");
        const metaList: ReleaseNoteMeta[] = await res.json();

        const fullNotes = await Promise.all(
          metaList.map(async (meta) => {
            try {
              const mdRes = await fetch(`/release-notes/${meta.version}.md`);
              const text = await mdRes.text();
              return { ...meta, content: text };
            } catch {
              return { ...meta, content: "リリースノートを取得できませんでした。" };
            }
          })
        );

        setReleaseNotes(fullNotes);
      } catch (err) {
        console.error("リリースノート一覧の取得に失敗しました。", err);
      } finally {
        setLoading(false);
      }
    };

    loadNotes();
  }, []);

  const getTasks = async () => {
    const nowDate = new Date();
    const year = String(nowDate.getFullYear());
    const month = String(nowDate.getMonth() + 1).padStart(2, "0");

    const fromDate = `${year}-${month}-01`;
    const toDate = `${year}-${month}-31`;

    // console.log(fromDate, toDate);

    const { data } = await supabase
      .from('tasks')
      .select('*')
      .gte("request_date", fromDate)
      .lte("request_date", toDate);

    if (!data) return;

    setTasks(data);

    const { data: deadline } = await supabase
      .from("deadline")
      .select("*");

    if (!deadline) return;

    setDeadline(deadline);

    const todayDeadlineTaskIds = deadline.filter((d) => d.date === now.toLocaleDateString("sv-SE")).map(d => d.task_id);
    // console.log(todayDeadlineTaskIds);

    const { data: deadlineTasks } = await supabase
      .from('tasks')
      .select('*')
      .in("id", todayDeadlineTaskIds);

    // console.log(deadlineTasks);
    if (!deadlineTasks) return;

    setTodayDeadlineTasks(deadlineTasks);
  }

  useEffect(() => {
    getTasks();
  }, []);


  //タスク詳細モーダル開く
  const handleActiveTask = async (serial: string) => {
    const { data: task } = await supabase.from("tasks").select("*").eq("serial", serial).single();
    if (task) setActiveTask(task);

    setIsTaskLoaded(true);
  };

  //タスク詳細モーダル開く(今日が期限日のタスク用)
  const handleTodayTask = async (currentTask: Task) => {
    if (!currentTask) return;

    setActiveTask(currentTask);
    setIsTaskLoaded(true);
  };


  /* -------------- モーダル関連 -------------- */

  //モーダルロック解除
  const unlockTaskHandler = async () => {
    if (!activeTask || !user) return;
    const { error } = await supabase
      .from('tasks')
      .update({
        locked_by_id: null,
        locked_by_name: null,
        locked_by_at: null,
      })
      .eq("id", activeTask.id)
      .eq("locked_by_id", user.id);

    if (error) {
      console.error("unlock failed");
    }
    // else {
    //   console.log("unlocked task: taskId =", activeTask.id);
    // }
  }

  // 既読処理関数
  const markAsRead = async (taskId: string) => {
    // フロント即時反映
    setUnreadIds((prev) => prev.filter((id) => id !== taskId));

    // Supabase更新
    const updatedIds = unreadIds.filter((id) => id !== taskId);
    await supabase
      .from("users")
      .update({ unread_task_id: updatedIds })
      .eq("id", user?.id);
  };

  useEffect(() => {
    if (user?.unread_task_id) {
      setUnreadIds(user.unread_task_id);
    }
  }, [user]);

  /* -------------- モーダル関連 -------------- */

  return (
    <div className="p-1 py-4 sm:p-4 !pt-14 max-w-[1920px] m-auto">
      <div className="flex justify-between gap-4 mb-2 border-b-2 p-1 pb-2 border-neutral-700 min-w-375">
        <div className="flex justify-start items-center-safe gap-2 w-full">
          <h2 className="flex justify-center items-center gap-4 py-0.5 px-1 text-white text-xl font-bold text-center">
            <span className="text-2xl">{now.getFullYear()}年 {now.getMonth() + 1}月 {now.getDate()}日</span>
          </h2>

          <div className="flex justify-center items-center gap-4 py-0.5 px-1 text-white text-xl font-bold text-center">
            <div onMouseEnter={() => setIsDeadlinePop(true)} onMouseLeave={() => setIsDeadlinePop(false)} className={`relative flex items-center gap-1 py-0.5 px-4 text-base bg-neutral-200 rounded-md tracking-wider cursor-default ${todayDeadlineTasks.length > 0 ? "text-red-700" : "text-neutral-800"}`}>
              {deadline.length > 0 && todayDeadlineTasks.length > 0 ? (
                <><FaTriangleExclamation />本日が期限のタスクが {todayDeadlineTasks.length}件 あります</>
              ) : (
                <>本日が期限のタスクはありません</>
              )}
              {todayDeadlineTasks.length > 0 && (
                <div className={`absolute top-full left-0 pt-1 transition-opacity duration-100 z-10 ${isDeadlinePop ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                  <div className={`flex flex-col gap-1 p-1 text-sm rounded-md text-left text-neutral-900 bg-neutral-200 shadow-md`}>
                    {todayDeadlineTasks.map(t => (
                      <div
                        key={t.id}
                        onClick={() => { handleTodayTask(t); setIsOpen(true); setModalType("detail"); }}
                        className="rounded-md p-1 px-2 cursor-pointer hover:bg-neutral-300 whitespace-nowrap"
                      >
                        【{t.serial}】 {t.title}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div onMouseEnter={() => setIsNewTaskPop(true)} onMouseLeave={() => setIsNewTaskPop(false)} className={`relative flex items-center gap-1 py-0.5 px-4 text-base bg-neutral-200 rounded-md tracking-wider text-neutral-800 cursor-default`}>
              本日の新規依頼数：{todayNewTasks.length}件
              {todayNewTasks && todayNewTasks.length > 0 && (
                <div className={`absolute top-full left-0 pt-1 transition-opacity duration-100 z-10 ${isNewTaskPop ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                  <div className={`flex flex-col gap-1 p-1 text-sm rounded-md text-left text-neutral-900 bg-neutral-200 shadow-md`}>
                    {todayNewTasks.map(t => (
                      <div
                        key={t.id}
                        onClick={() => { handleTodayTask(t); setIsOpen(true); setModalType("detail"); }}
                        className="flex gap-1 rounded-md p-1 px-2 cursor-pointer hover:bg-neutral-300 whitespace-nowrap"
                      >
                        <span className="w-11 whitespace-nowrap text-neutral-500 font-normal">{new Date(t.created_at).toTimeString().substring(0, 5)}</span>
                        <span>【{t.serial}】 {t.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


      <div className="flex gap-4 p-2 h-[780px]">

        {/* 今月の依頼状況 */}
        <div className="w-88 h-full bg-neutral-200 p-4 rounded-2xl">
          <h3 className="font-bold text-center mb-2">今月の依頼状況</h3>
          {/* <dl className="grid grid-cols-3">
            <dt className="col-span-2 p-2 bg-neutral-600 text-white font-bold text-center tracking-wider border border-neutral-800 rounded-tl-md">総依頼件数</dt>
            <dd className="col-span-1 p-2 border border-neutral-800 border-l-0 text-right font-bold rounded-tr-md">{tasks.length}件</dd>
            <dt className="col-span-2 p-2 bg-slate-600 text-white font-bold text-center tracking-wider border border-neutral-800 border-t-0">未着手</dt>
            <dd className="col-span-1 p-2 border border-neutral-800 border-l-0 border-t-0 text-right font-bold">{tasks.filter(t => t.status === "未着手").length}件</dd>
            <dt className="col-span-2 p-2 bg-green-950/80 text-white font-bold text-center tracking-wider border border-neutral-800 border-t-0">進行中</dt>
            <dd className="col-span-1 p-2 border border-neutral-800 border-l-0 border-t-0 text-right font-bold">{tasks.filter(t => t.status !== "未着手" && t.status !== "完了").length}件</dd>
            <dt className="col-span-2 p-2 bg-yellow-950/80 text-white font-bold text-center tracking-wider border border-neutral-800 border-t-0 rounded-bl-md">完了済み</dt>
            <dd className="col-span-1 p-2 border border-neutral-800 border-l-0 border-t-0 text-right font-bold rounded-br-md">{tasks.filter(t => t.status === "完了").length}件</dd>
          </dl> */}

          <div className="flex justify-center bg-neutral-100 rounded-xl p-4">
            <RequestGraph
              size={240}
              thickness={42}
              title="総依頼件数"
              segments={[
                { key: "未着手", value: Number(`${tasks.filter(t => t.status === "未着手").length}`), color: "#777777" },
                { key: "進行中", value: Number(`${tasks.filter(t => t.status === "作業中" || t.status === "作業途中" || t.status === "確認中").length}`), color: "#4c9759" },
                { key: "完了済", value: Number(`${tasks.filter(t => t.status === "完了").length}`), color: "#4668a5" },
                { key: "その他", value: Number(`${tasks.filter(t => t.status === "保留" || t.status === "詳細待ち" || t.status === "中止" || t.status === "保留").length}`), color: "#84538d" },
              ]}
            />
          </div>


          <h3 className="font-bold text-center mt-5 mb-2">店舗別依頼数</h3>
          <dl className="grid grid-cols-[80px_1fr] palt bg-neutral-100 rounded-xl p-4">
            <dt className="p-1.75 pr-2.5 font-bold text-sm text-center tracking-wider [text-align-last:justify] border-b border-neutral-200">難波</dt>
            <dd className="p-1.75 pl-0 flex justify-between text-sm border-neutral-800 border-l text-right font-bold border-b border-b-neutral-200">
              <div
                style={{ width: `${Math.round(((tasks.filter(t => t.client === "難波秘密倶楽部").length) / tasks.length) * 200)}%` }}
                className={`
                bg-green-800
                `}
              />
              {tasks.filter(t => t.client === "難波秘密倶楽部").length}件
            </dd>

            <dt className="p-1.75 pr-2.5 font-bold text-sm text-center tracking-wider [text-align-last:justify] border-b border-neutral-200">新大阪</dt>
            <dd className="p-1.75 pl-0 flex justify-between text-sm border-neutral-800 border-l text-right font-bold border-b border-b-neutral-200">
              <div
                style={{ width: `${Math.round(((tasks.filter(t => t.client === "新大阪秘密倶楽部").length) / tasks.length) * 200)}%` }}
                className={`
                bg-green-800
                `}
              />
              {tasks.filter(t => t.client === "新大阪秘密倶楽部").length}件
            </dd>

            <dt className="p-1.75 pr-2.5 font-bold text-sm text-center tracking-wider [text-align-last:justify] border-b border-neutral-200">谷町</dt>
            <dd className="p-1.75 pl-0 flex justify-between text-sm border-neutral-800 border-l text-right font-bold border-b border-b-neutral-200">
              <div
                style={{ width: `${Math.round(((tasks.filter(t => t.client === "谷町秘密倶楽部").length) / tasks.length) * 200)}%` }}
                className={`
                bg-green-800
                `}
              />
              {tasks.filter(t => t.client === "谷町秘密倶楽部").length}件
            </dd>

            <dt className="p-1.75 pr-2.5 font-bold text-sm text-center tracking-wider [text-align-last:justify] border-b border-neutral-200">谷町G</dt>
            <dd className="p-1.75 pl-0 flex justify-between text-sm border-neutral-800 border-l text-right font-bold border-b border-b-neutral-200">
              <div
                style={{ width: `${Math.round(((tasks.filter(t => t.client === "谷町人妻ゴールデン").length) / tasks.length) * 200)}%` }}
                className={`
                bg-green-800
                `}
              />
              {tasks.filter(t => t.client === "谷町人妻ゴールデン").length}件
            </dd>

            <dt className="p-1.75 pr-2.5 font-bold text-sm text-center tracking-wider [text-align-last:justify] border-b border-neutral-200">梅田</dt>
            <dd className="p-1.75 pl-0 flex justify-between text-sm border-neutral-800 border-l text-right font-bold border-b border-b-neutral-200">
              <div
                style={{ width: `${Math.round(((tasks.filter(t => t.client === "梅田人妻秘密倶楽部").length) / tasks.length) * 200)}%` }}
                className={`
                bg-green-800
                `}
              />
              {tasks.filter(t => t.client === "梅田人妻秘密倶楽部").length}件
            </dd>

            <dt className="p-1.75 pr-2.5 font-bold text-sm text-center tracking-wider [text-align-last:justify] border-b border-neutral-200">梅田G</dt>
            <dd className="p-1.75 pl-0 flex justify-between text-sm border-neutral-800 border-l text-right font-bold border-b border-b-neutral-200">
              <div
                style={{ width: `${Math.round(((tasks.filter(t => t.client === "梅田ゴールデン").length) / tasks.length) * 200)}%` }}
                className={`
                bg-green-800
                `}
              />
              {tasks.filter(t => t.client === "梅田ゴールデン").length}件
            </dd>

            <dt className="p-1.75 pr-2.5 font-bold text-sm text-center tracking-wider [text-align-last:justify] border-b border-neutral-200">中洲</dt>
            <dd className="p-1.75 pl-0 flex justify-between text-sm border-neutral-800 border-l text-right font-bold border-b border-b-neutral-200">
              <div
                style={{ width: `${Math.round(((tasks.filter(t => t.client === "中洲秘密倶楽部").length) / tasks.length) * 200)}%` }}
                className={`
                bg-green-800
                `}
              />
              {tasks.filter(t => t.client === "中洲秘密倶楽部").length}件
            </dd>

            <dt className="p-1.75 pr-2.5 font-bold text-sm text-center tracking-wider [text-align-last:justify] border-b border-neutral-200">玉乱堂</dt>
            <dd className="p-1.75 pl-0 flex justify-between text-sm border-l-neutral-800 border-l text-right font-bold border-b border-b-neutral-200">
              <div
                style={{ width: `${Math.round(((tasks.filter(t => t.client === "快楽玉乱堂").length) / tasks.length) * 200)}%` }}
                className={`
                bg-green-800
                `}
              />
              {tasks.filter(t => t.client === "快楽玉乱堂").length}件
            </dd>

            <dt className="p-1.75 pr-2.5 font-bold text-sm text-center tracking-wider [text-align-last:justify]">奥様</dt>
            <dd className="p-1.75 pl-0 flex justify-between text-sm border-neutral-800 border-l text-right font-bold">
              <div
                style={{ width: `${Math.round(((tasks.filter(t => t.client === "奥様クラブ").length) / tasks.length) * 200)}%` }}
                className={`
                bg-green-800
                `}
              />
              {tasks.filter(t => t.client === "奥様クラブ").length}件
            </dd>
          </dl>
          <p className="text-xs p-0.5 mt-1 text-center">※社内案件は度外視の為、数値はあくまで目安です。</p>
        </div>

        <div className="flex flex-col flex-1 gap-4">
          {/* 最新のリリースノート */}
          <div className="w-full bg-neutral-200 p-6 rounded-2xl">
            {loading ? (
              <p className="h-99.25 grid place-content-center">loading...</p>
            ) : (
              <>
                <hgroup className="flex gap-4 items-center justify-between w-full px-1 pb-1 mb-2 border-b border-neutral-400">
                  <h3 className="flex gap-2 items-center font-bold tracking-widest">
                    リリースノート {releaseNotes[0].version.replaceAll("_", ".")}
                    <span className="text-xs py-0.5 px-2 rounded-md bg-red-800 text-white">最新版</span>
                    <span className="text-sm">Released on {releaseNotes[0].date}</span>
                  </h3>
                  <p className="text-blue-700 text-xs cursor-pointer hover:opacity-80" onClick={() => router.push("/release-notes")}>過去の更新履歴はこちら</p>
                </hgroup>
                <div
                  className="release-note prose prose-sm max-w-none text-sm h-90 pr-2 palt [&_p]:!text-black overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-400"
                  dangerouslySetInnerHTML={{
                    __html: marked(releaseNotes[0].content ?? ""),
                  }}
                />
              </>
            )}
          </div>

          <div className="w-full h-full bg-neutral-200 p-6 rounded-2xl">
            <h3 className="font-bold tracking-widest px-1 pb-1 mb-1 border-b border-neutral-400">優先度の高いタスク<span className="text-xs">（特に作業を強制するものではありません。依頼状況に応じて作業決めの参考にしてください。）</span></h3>
            <p className="tracking-wider leading-normal text-xs p-1 mb-1 palt">「優先度が<span className="text-red-600 font-bold">【高】または【急】</span>のタスク」、「依頼日から<span className="text-red-600 font-bold">1週間以上経過</span>しているタスク」、「期限日設定あり＋<span className="text-red-600 font-bold">期限日まで残り3日を切っている</span>タスク」<br />の中で<span className="text-red-600 font-bold">担当者が未決定</span>のタスクが優先的に表示されます。(ここではクリックしても詳細確認はできません)</p>
            <div className="w-200 h-[calc(100%-4.5rem)] overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-400">
              <PriorityTasks />
            </div>
          </div>
        </div>

        {/* 変更履歴ログ */}
        <div className="w-160 h-full bg-neutral-200 p-6 rounded-2xl relative">
          <h3 className="font-bold text-center mb-2">変更履歴ログ（直近50件）</h3>
          {/* {notes && notes.length > 0 ? (
            <div className="h-[calc(100%-1.5rem)] pr-3 text-sm overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-400">
              {[...notes].reverse().map(note => (
                <div key={note.id} className="not-[:last-of-type]:border-b border-neutral-300 py-1.5 text-justify tracking-wider">
                  <span className="block text-neutral-400">{new Date(note.changed_at).toLocaleString("sv-SE")}</span>
                  <p className={`tracking-wider ${note.type === "added" ? "text-blue-800" : note.type === "changed" ? "text-green-800" : note.type === "delete" ? "text-red-700" : "text-black"}`}>
                    <span className="font-bold">{note.changed_by}さん</span>が 【<span className="text-blue-600 underline cursor-pointer" onClick={() => { handleActiveTask(note.task_serial); setIsOpen(true); }}>{note.task_serial}</span>】 の{note.message.substring(10)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-black text-center p-4">読み込み中...</p>
          )} */}
          <DashboardNotesViewer SerialClick={(serial: string) => { handleActiveTask(serial); setIsOpen(true); setModalType("detail"); }} />
        </div>
      </div>


      {/* 共通モーダル */}
      <Dialog
        open={isOpen}

        onClose={() => {
          if (modalType === "edit") unlockTaskHandler();
          setIsOpen(false);
          setTimeout(() => {
            setActiveTask(null);
            setModalType(null);
            setIsTaskLoaded(false);
          }, 10);
        }}
        // transition
        className="relative z-50 transition duration-300 ease-out data-closed:opacity-0"
      >
        <DialogBackdrop className="fixed inset-0 bg-black/30" />

        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <DialogPanel className="w-130 relative space-y-4 rounded-2xl bg-neutral-100 p-6 pt-6.5">
            {!isTaskLoaded && (
              <div className="flex justify-center my-4" aria-label="読み込み中">
                <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
              </div>
            )}

            {modalType === "detail" && activeTask && user && (
              <TaskDetail
                user={user}
                task={activeTask}
                unreadIds={unreadIds}
                onClose={() => { setIsOpen(false); markAsRead(activeTask.id); setActiveTask(null); setIsTaskLoaded(false); setTimeout(() => setModalType(null), 500); }}
                onEdit={(t: Task) => {
                  const latest = tasks.find(x => x.id === t.id) ?? t;
                  setActiveTask(latest);
                  setModalType("edit");
                }}
                deadlineList={deadline}
              />
            )}

            {modalType === "edit" && activeTask && user && (
              <UpdateTask
                user={user}
                task={activeTask}
                onComplete={() => setModalType("detail")}
                onCancel={() => setModalType("detail")}
                onUnlock={unlockTaskHandler}
                deadlineList={deadline}
              />
            )}
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  )

}
