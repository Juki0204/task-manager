"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@headlessui/react";
import { AddTaskInput, AddTaskSelect } from "./ui/AddTaskForm";
import { MailRadio, OtherRadio, TelRadio } from "./ui/Radio";

import { supabase } from "@/utils/supabase/supabase";

import { Task } from "@/utils/types/task";
import { User } from "@/utils/types/user";

import { toast } from "sonner";

import { useTaskPresence } from "@/utils/hooks/useTaskPresence";
import { useInvoiceSync } from "@/utils/hooks/useInvoiceSync";
import { compareHistory } from "@/utils/function/comparHistory";
import { generateChangeMessage } from "@/utils/function/generateChangeMessage";

import AddTaskRemarks from "./ui/AddTaskRemarks";
import { useTaskUnread } from "./TaskUnreadProvider";

import { AlarmClock, Building, CalendarClock, CircleCheck, ClockAlert, Mail, NotebookPen, NotepadText, PenLine, Pickaxe, UserPen, UserPlus } from "lucide-react";

type UpdateTaskFormState = {
  client: string;
  requester: string;
  title: string;
  description: string;
  requestDate: string;
  finishDate: string;
  manager: string;
  status: string;
  priority: string;
  remarks: string;
  method: string;
  deadline: string;
};

type UpdateTaskOptions = {
  clients: string[];
  requesters: string[];
  users: string[];
};

interface UpdateTaskProps {
  task: Task;
  user: User;
  onCancel: () => void;
  onComplete: (task: Task) => void;
  onUnlock: () => void;
  deadlineList: { task_id: string; date: string }[];
}

const initialOptions: UpdateTaskOptions = {
  clients: [],
  requesters: [],
  users: [],
};

const createInitialForm = (task: Task, deadline = ""): UpdateTaskFormState => ({
  client: task.client,
  requester: task.requester,
  title: task.title,
  description: task.description,
  requestDate: task.request_date,
  finishDate: task.finish_date ?? "",
  manager: task.manager ?? "",
  status: task.status,
  priority: task.priority ?? "",
  remarks: task.remarks ?? "",
  method: task.method,
  deadline,
});

export default function UpdateTask({ task, user, onCancel, onComplete, onUnlock, deadlineList }: UpdateTaskProps) {
  const currentDeadline = deadlineList?.find((deadline) => deadline.task_id === task.id);

  const [form, setForm] = useState<UpdateTaskFormState>(() => createInitialForm(task, currentDeadline?.date ?? ""));
  const [options, setOptions] = useState<UpdateTaskOptions>(initialOptions);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { syncInvoiceWithTask } = useInvoiceSync();
  const { upsertTaskStatus } = useTaskUnread();

  useTaskPresence(task.id, { id: user.id, name: user.name }, true);

  const updateForm = <K extends keyof UpdateTaskFormState>(key: K, value: UpdateTaskFormState[K]) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const isValid = useMemo(() => {
    return Boolean(form.title && form.description);
  }, [form.title, form.description]);

  const getInitialData = async () => {
    const [{ data: clients, error: clientsError }, { data: users, error: usersError }] = await Promise.all([
      supabase.from("clients").select("*"),
      supabase.from("users").select("*"),
    ]);

    if (clientsError) {
      console.error(clientsError);
    }

    if (usersError) {
      console.error(usersError);
    }

    const clientList = clients?.sort((a, b) => a.id - b.id).map((client) => client.name) ?? [];

    const userList = users?.filter((item) => item.name !== "Administrator").map((item) => item.name) ?? [];

    setOptions((prev) => ({
      ...prev,
      clients: clientList,
      users: userList,
    }));
  };

  const getRequesters = async (client: string) => {
    if (!client) {
      setOptions((prev) => ({
        ...prev,
        requesters: [],
      }));

      return;
    }

    const { data, error } = await supabase.from("requesters").select("*").eq("company", client);

    if (error) {
      console.error(error);
      return;
    }

    setOptions((prev) => ({
      ...prev,
      requesters: data?.map((requester) => requester.name) ?? [],
    }));
  };

  const updateTask = async (): Promise<Task | null> => {
    if (isSubmitting) return null;

    setIsSubmitting(true);

    try {
      const { data: oldTaskData, error: oldTaskError } = await supabase.from("tasks").select("*").eq("serial", task.serial).single();

      if (oldTaskError || !oldTaskData) {
        console.error("変更前のタスク取得に失敗しました:", oldTaskError);
        return null;
      }

      const finishDate = (form.status === "完了" || form.status === "確認中") && !form.finishDate ? new Date().toLocaleDateString("sv-SE") : form.finishDate;

      const { data: taskData, error: updateTaskError } = await supabase
        .from("tasks")
        .update({
          client: form.client,
          requester: form.requester,
          title: form.title,
          description: form.description,
          request_date: form.requestDate,
          finish_date: finishDate,
          manager: form.manager,
          status: form.status,
          priority: form.priority,
          remarks: form.remarks,
          method: form.method,
          updated_manager: user.name,
          updated_at: new Date().toLocaleDateString("sv-SE"),
        })
        .eq("serial", task.serial)
        .select()
        .single();

      if (updateTaskError || !taskData) {
        console.error("タスクの更新に失敗しました:", updateTaskError);
        alert("タスクの更新に失敗しました");
        return null;
      }

      if (form.deadline) {
        if (currentDeadline) {
          const { error } = await supabase.from("deadline").update({ date: form.deadline }).eq("task_id", task.id);

          if (error) {
            console.error("期日の更新に失敗しました:", error);
          }
        } else {
          const { error } = await supabase.from("deadline").insert({
            task_id: task.id,
            date: form.deadline,
          });

          if (error) {
            console.error("期日の追加に失敗しました:", error);
          }
        }
      } else if (currentDeadline) {
        const { error } = await supabase.from("deadline").delete().eq("task_id", task.id);

        if (error) {
          console.error("期日の削除に失敗しました:", error);
        }
      }

      await syncInvoiceWithTask(task.id, form.status);

      const diff = compareHistory(taskData, oldTaskData);

      if (diff.changedKeys.length > 0) {
        const message = generateChangeMessage(diff, taskData);

        if (message) {
          const { error } = await supabase.from("task_notes").insert({
            task_serial: task.serial,
            message,
            diff,
            old_record: oldTaskData,
            new_record: taskData,
            changed_by: user.name,
            changed_at: new Date().toISOString(),
            type: "changed",
          });

          if (error) {
            console.error(error);
          }
        }

        if (diff.changedKeys.includes("remarks")) {
          const updatedAt = new Date();

          const { error } = await supabase
            .from("tasks_status")
            .upsert(
              {
                task_id: task.id,
                updated_by: user.name,
                updated_at: updatedAt,
              },
              { onConflict: "task_id" }
            );

          if (error) {
            console.error(error);
          }

          upsertTaskStatus({
            task_id: task.id,
            updated_by: user.name,
            updated_at: updatedAt,
          });
        }
      }

      return taskData;
    } catch (error) {
      console.error(error);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;

    const updatedTask = await updateTask();

    if (!updatedTask) return;

    await onUnlock();

    onComplete(updatedTask);

    toast.info(`タスク【${task.serial}】を更新しました。`);
  };

  useEffect(() => {
    void getInitialData();
  }, []);

  useEffect(() => {
    if (!form.client) return;

    void getRequesters(form.client);
  }, [form.client]);

  useEffect(() => {
    setForm(createInitialForm(task, currentDeadline?.date ?? ""));
  }, [task.id]);

  useEffect(() => {
    updateForm("deadline", currentDeadline?.date ?? "");
  }, [currentDeadline?.date]);

  const contentRef = useRef<HTMLDivElement>(null);
  const [hasScrollbar, setHasScrollbar] = useState(false);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const check = () => {
      setHasScrollbar(el.scrollHeight > el.clientHeight);
    };

    check();

    const ro = new ResizeObserver(check);
    ro.observe(el);

    return () => {
      ro.disconnect();
    };
  }, []);

  return (
    <>
      <div className="relative w-full flex flex-wrap justify-between items-center gap-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-slate-300/50 dark:bg-[#444444] p-3 mb-4">
        <h3 className="font-bold text-left col-span-2 sticky">タスク編集</h3>

        <div className="w-full flex gap-2">
          <AddTaskInput className="flex-1 [&_input]:bg-white [&_input]:dark:bg-neutral-800 text-sm" name="TASK_TITLE" type="text" label="作業タイトル" icon={<PenLine className="w-4.5 text-neutral-500" />} value={form.title} onChange={(e) => updateForm("title", e.target.value)} />

          <AddTaskInput className="w-36 [&_input]:bg-white [&_input]:dark:bg-neutral-800 text-sm" name="REQUEST_DATE" type="date" max="9999-12-31" label="依頼日" icon={<CalendarClock className="w-4.5 text-neutral-500" />} value={form.requestDate} onChange={(e) => updateForm("requestDate", e.target.value)} />
        </div>

        <AddTaskInput className="w-full [&_input]:bg-white [&_input]:dark:bg-neutral-800 text-sm" name="TASK_DESCRIPTION" type="text" label="作業内容" icon={<NotepadText className="w-4.5 text-neutral-500" />} value={form.description} onChange={(e) => updateForm("description", e.target.value)} />
      </div>

      <div ref={contentRef} className={`${hasScrollbar ? "pr-2" : ""} max-h-[calc(100svh-300px)] grid grid-cols-2 gap-y-2 overflow-auto overscroll-contain [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300`}>
        <div className="col-span-2 flex flex-wrap gap-x-2 pb-4">
          <div className="w-full flex gap-1 items-center mt-1">
            <span className="text-neutral-500 font-bold text-xs leading-none tracking-widest">META</span>
            <span className="block h-0.25 bg-neutral-400 dark:bg-neutral-300/30 w-full" />
          </div>

          <div className="flex flex-col">
            <h3 className="w-full whitespace-nowrap pl-0.5 py-1 flex gap-x-1 items-center text-sm font-bold"><Mail className="w-4.5 text-neutral-500" /> 依頼手段</h3>

            <div className="flex gap-x-1">
              <MailRadio name="METHOD" id="mailRadio" checked={form.method === "mail"} onChange={() => updateForm("method", "mail")} />

              <TelRadio name="METHOD" id="telRadio" checked={form.method === "tel"} onChange={() => updateForm("method", "tel")} />

              <OtherRadio name="METHOD" id="otherRadio" checked={form.method === "other"} onChange={() => updateForm("method", "other")} />
            </div>
          </div>

          <AddTaskSelect className="flex-2 text-sm" name="CLIENT" label="クライアント" icon={<Building className="w-4.5 text-neutral-500" />} value={form.client} onChange={(e) => setForm((prev) => ({ ...prev, client: e.target.value, requester: "" }))}>
            {options.clients.map((client) => (
              <option key={client} value={client}>{client}</option>
            ))}
          </AddTaskSelect>

          <AddTaskSelect className="flex-1 text-sm" name="REQUESTER" label="依頼者" icon={<UserPlus className="w-4.5 text-neutral-500" />} value={form.requester} onChange={(e) => updateForm("requester", e.target.value)}>
            {options.requesters.map((requester) => (
              <option key={requester} value={requester}>{requester}</option>
            ))}
            <option value="不明">不明</option>
          </AddTaskSelect>
        </div>

        <div className="col-span-2 flex flex-wrap gap-x-2 pb-4">
          <div className="w-full flex gap-1 items-center mt-1">
            <span className="text-neutral-500 font-bold text-xs leading-none tracking-widest">DETAILS</span>
            <span className="block h-0.25 bg-neutral-400 dark:bg-neutral-300/30 w-full" />
          </div>

          <div className="flex flex-wrap gap-2 flex-1">
            <AddTaskSelect className="flex-1 text-sm" name="MANAGER" label="担当者" icon={<UserPen className="w-4.5 text-neutral-500" />} value={form.manager} onChange={(e) => updateForm("manager", e.target.value)}>
              {options.users.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
              <option value="">未決定</option>
            </AddTaskSelect>

            <AddTaskSelect className="w-28 text-sm" name="PRIORITY" label="優先度" icon={<ClockAlert className="w-4.5 text-neutral-500" />} value={form.priority} onChange={(e) => updateForm("priority", e.target.value)}>
              <option value=""></option>
              <option value="急">至急</option>
              <option value="高">高</option>
              <option value="低">低</option>
            </AddTaskSelect>

            <AddTaskSelect className="w-full text-sm" name="STATUS" label="作業状況" icon={<Pickaxe className="w-4.5 text-neutral-500" />} value={form.status} onChange={(e) => updateForm("status", e.target.value)}>
              <option value="未着手">未着手</option>
              <option value="作業中">作業中</option>
              <option value="作業途中">作業途中</option>
              <option value="確認中">確認中</option>
              <option value="完了">完了</option>
              <option value="保留">保留</option>
              <option value="中止">中止</option>
              <option value="詳細待ち">詳細待ち</option>
            </AddTaskSelect>
          </div>

          <div className="w-36 flex flex-wrap gap-2">
            <AddTaskInput className={`w-full text-sm ${form.deadline ? "[&_input]:text-red-600" : ""}`} name="DEADLINE" type="date" max="9999-12-31" label="期限日" icon={<AlarmClock className="w-4.5 text-neutral-500" />} value={form.deadline} onChange={(e) => updateForm("deadline", e.target.value)} />

            <AddTaskInput className="w-full text-sm" name="FINISH_DATE" type="date" max="9999-12-31" label="完了日" icon={<CircleCheck className="w-4.5 text-neutral-500" />} value={form.finishDate} onChange={(e) => updateForm("finishDate", e.target.value)} />
          </div>
        </div>

        <div className="flex flex-col col-span-2">
          <div className="w-full flex gap-1 items-center mt-1">
            <span className="text-neutral-500 font-bold text-xs leading-none tracking-widest">REMARKS</span>
            <span className="block h-0.25 bg-neutral-400 dark:bg-neutral-300/30 w-full" />
          </div>

          <h3 className="w-28 whitespace-nowrap pl-0.5 py-1 flex gap-x-1 items-center text-sm font-bold"><NotebookPen className="w-4.5 text-neutral-500" /> 備考欄</h3>

          <AddTaskRemarks value={form.remarks} onChange={(markdown) => updateForm("remarks", markdown)} />
        </div>
      </div>

      <div className="fixed bottom-0 right-0 w-full bg-white dark:bg-neutral-800 pt-4 px-4 pb-3 flex gap-x-2 flex-wrap justify-between col-span-2 mb-0">
        <Button onClick={onCancel} className="outline-1 -outline-offset-1 rounded px-8 py-2 text-sm data-hover:bg-neutral-200 data-hover:dark:text-neutral-700 cursor-pointer">
          キャンセル
        </Button>

        <Button disabled={!isValid || isSubmitting} onClick={handleSubmit} className="flex-1 bg-blue-700 dark:bg-blue-900 rounded px-4 py-2 text-sm text-white font-bold data-hover:opacity-80 cursor-pointer data-disabled:bg-neutral-400 data-disabled:cursor-auto">
          {isSubmitting ? "更新中..." : "更新"}
        </Button>
      </div>
    </>
  );
}