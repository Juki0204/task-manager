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


interface ReleaseNoteMeta {
  version: string;
  date: string;
}

interface ReleaseNoteData extends ReleaseNoteMeta {
  content?: string;
}

export default function DashboardPage() {
  const now = new Date();
  const [deadline, setDeadline] = useState<{ task_id: string, date: string }[]>([]);
  const todayDeadlineCount = deadline.filter((d) => d.date === now.toLocaleDateString("sv-SE")).length;

  // const { notes, isReady } = useTaskNotesRealtime();
  const [tasks, setTasks] = useState<Task[]>([]);

  const [releaseNotes, setReleaseNotes] = useState<ReleaseNoteData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [isTaskLoaded, setIsTaskLoaded] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

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

    console.log(fromDate, toDate);

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
  }

  useEffect(() => {
    getTasks();
  }, []);


  // タスク詳細モーダル開く
  const handleActiveTask = async (serial: string) => {
    const { data: task } = await supabase.from("tasks").select("*").eq("serial", serial).single();
    if (task) setActiveTask(task);

    setIsTaskLoaded(true);
  };

  return (
    <div className="p-1 py-4 sm:p-4 !pt-30 max-w-[1920px] m-auto">
      <div className="flex justify-between gap-4 mb-2 border-b-2 p-1 pb-2 border-neutral-700 min-w-375">
        <div className="flex justify-start items-end gap-4 w-full">
          <h2 className="flex justify-center items-center gap-4 py-0.5 px-1 text-white text-xl font-bold text-center">
            {/* ダッシュボード */}
            <span className="text-2xl">{now.getFullYear()}年 {now.getMonth() + 1}月 {now.getDate()}日</span>
            <span className={`flex items-center gap-1 py-0.5 px-4 text-base bg-neutral-100 rounded-md tracking-wider ${todayDeadlineCount > 0 ? "text-red-700" : "text-neutral-800"}`}>
              {deadline.length > 0 && todayDeadlineCount > 0 ? (
                <><FaTriangleExclamation />本日が期限のタスクが {todayDeadlineCount}件 あります</>
              ) : (
                <>本日が期限のタスクはありません</>
              )}
            </span>
            <span className={`flex items-center gap-1 py-0.5 px-4 text-base bg-neutral-100 rounded-md tracking-wider text-neutral-800`}>
              本日の新規依頼数：{tasks.filter((t) => new Date(t.created_at).toLocaleDateString("sv-SE") === now.toLocaleDateString("sv-SE") && t.status !== "削除済").length}件
            </span>
          </h2>
        </div>
      </div>


      <div className="flex gap-4 p-2 h-[714px]">

        {/* 今月の依頼状況 */}
        <div className="w-100 h-full bg-neutral-100 p-6 rounded-2xl">
          <h3 className="font-bold text-sm text-center mb-2">今月の依頼状況</h3>
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

          <div className="flex justify-center">
            <RequestGraph
              size={240}
              thickness={42}
              title="総依頼件数"
              segments={[
                { key: "未着手", value: Number(`${tasks.filter(t => t.status === "未着手").length}`), color: "#777777" },
                { key: "進行中", value: Number(`${tasks.filter(t => t.status !== "未着手" && t.status !== "完了").length}`), color: "#4c9759" },
                { key: "完了済", value: Number(`${tasks.filter(t => t.status === "完了").length}`), color: "#4668a5" },
                { key: "その他", value: Number(`${tasks.filter(t => t.status === "保留" || t.status === "詳細待ち" || t.status === "中止" || t.status === "保留").length}`), color: "#84538d" },
              ]}
            />
          </div>


          <h3 className="font-bold text-sm text-center mt-5 mb-2">店舗別依頼数</h3>
          <dl className="grid grid-cols-3">
            <dt className="col-span-1 p-1.75 font-bold text-sm text-center tracking-wider">難波秘密</dt>
            <dd className="col-span-2 p-1.75 pl-0 flex justify-between text-sm border-neutral-800 border-l text-right font-bold rounded-tr-md">
              <div
                style={{ width: `${Math.round(((tasks.filter(t => t.client === "難波秘密倶楽部").length) / tasks.length) * 200)}%` }}
                className={`
                bg-green-800
                `}
              />
              {tasks.filter(t => t.client === "難波秘密倶楽部").length}件
            </dd>

            <dt className="col-span-1 p-1.75 font-bold text-sm text-center tracking-wider">新大阪秘密</dt>
            <dd className="col-span-2 p-1.75 pl-0 flex justify-between text-sm border-neutral-800 border-l text-right font-bold rounded-tr-md">
              <div
                style={{ width: `${Math.round(((tasks.filter(t => t.client === "新大阪秘密倶楽部").length) / tasks.length) * 200)}%` }}
                className={`
                bg-green-800
                `}
              />
              {tasks.filter(t => t.client === "新大阪秘密倶楽部").length}件
            </dd>

            <dt className="col-span-1 p-1.75 font-bold text-sm text-center tracking-wider">谷町秘密</dt>
            <dd className="col-span-2 p-1.75 pl-0 flex justify-between text-sm border-neutral-800 border-l text-right font-bold rounded-tr-md">
              <div
                style={{ width: `${Math.round(((tasks.filter(t => t.client === "谷町秘密倶楽部").length) / tasks.length) * 200)}%` }}
                className={`
                bg-green-800
                `}
              />
              {tasks.filter(t => t.client === "谷町秘密倶楽部").length}件
            </dd>

            <dt className="col-span-1 p-1.75 font-bold text-sm text-center tracking-wider">谷町ゴールデン</dt>
            <dd className="col-span-2 p-1.75 pl-0 flex justify-between text-sm border-neutral-800 border-l text-right font-bold rounded-tr-md">
              <div
                style={{ width: `${Math.round(((tasks.filter(t => t.client === "谷町人妻ゴールデン").length) / tasks.length) * 200)}%` }}
                className={`
                bg-green-800
                `}
              />
              {tasks.filter(t => t.client === "谷町人妻ゴールデン").length}件
            </dd>

            <dt className="col-span-1 p-1.75 font-bold text-sm text-center tracking-wider">梅田人妻</dt>
            <dd className="col-span-2 p-1.75 pl-0 flex justify-between text-sm border-neutral-800 border-l text-right font-bold rounded-tr-md">
              <div
                style={{ width: `${Math.round(((tasks.filter(t => t.client === "梅田人妻秘密倶楽部").length) / tasks.length) * 200)}%` }}
                className={`
                bg-green-800
                `}
              />
              {tasks.filter(t => t.client === "梅田人妻秘密倶楽部").length}件
            </dd>

            <dt className="col-span-1 p-1.75 font-bold text-sm text-center tracking-wider">梅田ゴールデン</dt>
            <dd className="col-span-2 p-1.75 pl-0 flex justify-between text-sm border-neutral-800 border-l text-right font-bold rounded-tr-md">
              <div
                style={{ width: `${Math.round(((tasks.filter(t => t.client === "梅田ゴールデン").length) / tasks.length) * 200)}%` }}
                className={`
                bg-green-800
                `}
              />
              {tasks.filter(t => t.client === "梅田ゴールデン").length}件
            </dd>

            <dt className="col-span-1 p-1.75 font-bold text-sm text-center tracking-wider">中洲秘密</dt>
            <dd className="col-span-2 p-1.75 pl-0 flex justify-between text-sm border-neutral-800 border-l text-right font-bold rounded-tr-md">
              <div
                style={{ width: `${Math.round(((tasks.filter(t => t.client === "中洲秘密倶楽部").length) / tasks.length) * 200)}%` }}
                className={`
                bg-green-800
                `}
              />
              {tasks.filter(t => t.client === "中洲秘密倶楽部").length}件
            </dd>

            <dt className="col-span-1 p-1.75 font-bold text-sm text-center tracking-wider">玉乱堂</dt>
            <dd className="col-span-2 p-1.75 pl-0 flex justify-between text-sm border-neutral-800 border-l text-right font-bold rounded-tr-md">
              <div
                style={{ width: `${Math.round(((tasks.filter(t => t.client === "快楽玉乱堂").length) / tasks.length) * 200)}%` }}
                className={`
                bg-green-800
                `}
              />
              {tasks.filter(t => t.client === "快楽玉乱堂").length}件
            </dd>

            <dt className="col-span-1 p-1.75 font-bold text-sm text-center tracking-wider">奥様クラブ</dt>
            <dd className="col-span-2 p-1.75 pl-0 flex justify-between text-sm border-neutral-800 border-l text-right font-bold rounded-tr-md">
              <div
                style={{ width: `${Math.round(((tasks.filter(t => t.client === "奥様クラブ").length) / tasks.length) * 200)}%` }}
                className={`
                bg-green-800
                `}
              />
              {tasks.filter(t => t.client === "奥様クラブ").length}件
            </dd>
          </dl>
          <p className="text-xs p-0.5 mt-3 text-center">※社内案件数は度外視の為、あくまで目安の数値になります。</p>
        </div>

        <div className="flex flex-col flex-1 gap-4">
          {/* 最新のリリースノート */}
          <div className="w-full bg-neutral-100 p-6 rounded-2xl">
            {loading ? (
              <p className="text-center p-4">loading...</p>
            ) : (
              <>
                <hgroup className="flex gap-4 items-center justify-between w-full px-1 pb-1 mb-2 border-b border-neutral-400">
                  <h3 className="flex gap-2 items-center font-bold text-lg tracking-widest">
                    リリースノート {releaseNotes[0].version.replaceAll("_", ".")}
                    <span className="text-xs py-0.5 px-2 rounded-md bg-red-800 text-white">最新版</span>
                    <span className="text-sm">Released on {releaseNotes[0].date}</span>
                  </h3>
                  <p className="text-blue-700 text-xs cursor-pointer hover:opacity-80" onClick={() => router.push("/release-notes")}>過去の更新履歴はこちら</p>
                </hgroup>
                <div
                  className="release-note prose prose-sm max-w-none text-sm h-90 pr-2 [&_p]:!text-black overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-400"
                  dangerouslySetInnerHTML={{
                    __html: marked(releaseNotes[0].content ?? ""),
                  }}
                />
              </>
            )}
          </div>

          <div className="w-full h-full bg-neutral-100 p-6 pr-3 rounded-2xl">
            <p className="w-full h-full grid place-content-center text-3xl tracking-widest">まだ未定</p>
          </div>
        </div>

        {/* 変更履歴ログ */}
        <div className="w-160 h-full bg-neutral-100 p-6 pr-5 rounded-2xl relative">
          <h3 className="font-bold text-sm text-center mb-2">変更履歴ログ（直近50件）</h3>
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
          <DashboardNotesViewer SerialClick={(serial: string) => { handleActiveTask(serial); setIsOpen(true); }} />
        </div>
      </div>

      <Dialog
        open={isOpen}
        onClose={() => {
          setIsOpen(false);
          setTimeout(() => {
            setActiveTask(null);
            setIsTaskLoaded(false);
          }, 10);
        }}
        // transition
        className="relative z-50 transition duration-300 ease-out data-closed:opacity-0"
      >
        <DialogBackdrop className="fixed inset-0 bg-black/30" />

        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <DialogPanel className="relative w-120 space-y-4 rounded-2xl bg-neutral-100 p-6 pt-8">
            {!isTaskLoaded && (
              <div className="flex justify-center my-4" aria-label="読み込み中">
                <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
              </div>
            )}
            {/* 確認のみの為invoice用のものを流用 */}
            {activeTask && (
              <InvoiceTaskDetail
                task={activeTask}
                onClose={() => { setIsOpen(false); setActiveTask(null); setIsTaskLoaded(false); }}
              />
            )}
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  )
}