"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Button, Field } from "@headlessui/react";
import { AlarmClock, Building, CalendarClock, CircleCheck, ClockAlert, Mail, NotebookPen, NotepadText, PencilLine, Pickaxe, UserPen, UserPlus, X } from "lucide-react";
import { AddTaskInput, AddTaskSelect } from "./ui/AddTaskForm";
import { MailRadio, OtherRadio, TelRadio } from "./ui/Radio";

import AddTaskRemarks from "./ui/AddTaskRemarks";

import { supabase } from "@/utils/supabase/supabase";
import { useAuth } from "@/app/AuthProvider";
import { useInvoiceSync } from "@/utils/hooks/useInvoiceSync";
import { Task } from "@/utils/types/task";
import { useAddTaskPresence } from "./providers/AddTaskPresenceProvider";

//Form
type AddTaskFormState = {
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

//Select
type AddTaskOptions = {
  clients: string[];
  requesters: string[];
  users: string[];
};

//Clientのタスク番号情報
type ClientTaskMeta = {
  initial: string;
  taskNum: string;
};

interface AddTaskProps {
  task?: Task;
  onClose: () => void;
  onComplete: () => void;
}

const getToday = () =>
  new Date().toLocaleDateString("sv-SE");

const createInitialForm = (task?: Task, defaultClient = "難波秘密倶楽部"): AddTaskFormState => {
  if (task) {
    return {
      client: task.client ?? "",
      requester: task.requester ?? "",
      title: task.title ?? "",
      description: task.description ?? "",
      requestDate: task.request_date ?? getToday(),
      finishDate: task.finish_date ?? "",
      manager: task.manager ?? "",
      status: task.status ?? "未着手",
      priority: task.priority ?? "",
      remarks: task.remarks ?? "",
      method: task.method ?? "",
      deadline: "",
    };
  }

  return {
    client: defaultClient,
    requester: "",
    title: "",
    description: "",
    requestDate: getToday(),
    finishDate: "",
    manager: "",
    status: "未着手",
    priority: "",
    remarks: "",
    method: "",
    deadline: "",
  };
};

const initialOptions: AddTaskOptions = {
  clients: [],
  requesters: [],
  users: [],
};

const initialClientMeta: ClientTaskMeta = {
  initial: "",
  taskNum: "",
};

export default function AddTask({ task, onClose, onComplete }: AddTaskProps) {
  const { user } = useAuth();
  const { syncInvoiceWithTask } = useInvoiceSync();
  const { updateAddingTaskTitle, stopAddingTask } = useAddTaskPresence();

  const [form, setForm] = useState<AddTaskFormState>(createInitialForm(task));
  const [options, setOptions] = useState<AddTaskOptions>(initialOptions);
  const [clientMeta, setClientMeta] = useState<ClientTaskMeta>(initialClientMeta);

  const isCopyMode = Boolean(task);

  const [isSubmitting, setIsSubmitting] = useState(false);

  //フォーム更新共通関数
  const updateForm = <K extends keyof AddTaskFormState>(key: K, value: AddTaskFormState[K]) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  //必須項目判定
  const isValid = useMemo(() => {
    return Boolean(
      form.requester &&
      form.title &&
      form.description
    );
  }, [form.requester, form.title, form.description]);

  //初期データ取得
  const getInitialData = async () => {
    const [
      { data: clients },
      { data: users },
    ] = await Promise.all([
      supabase
        .from("clients")
        .select("*"),

      supabase
        .from("users")
        .select("*"),
    ]);

    const clientList = clients?.sort((a, b) => a.id - b.id).map((client) => client.name) ?? [];

    const userList = users?.filter((user) => user.name !== "Administrator").map((user) => user.name) ?? [];

    setOptions((prev) => ({
      ...prev,
      clients: clientList,
      users: userList,
    }));

    //初期Client
    if (clientList.length > 0) {
      setForm((prev) => ({
        ...prev,
        client: prev.client || clientList[0],
      }));
    }
  };

  //Clientに紐づく依頼担当者取得
  const getRequesters = async (client: string) => {
    if (!client) {
      setOptions((prev) => ({
        ...prev,
        requesters: [],
      }));

      return;
    }

    const { data, error } = await supabase
      .from("requesters")
      .select("*")
      .eq("company", client);

    if (error) {
      console.error(error);
      return;
    }

    setOptions((prev) => ({
      ...prev,
      requesters: data?.map((requester) => requester.name) ?? [],
    }));
  };

  //serial生成用Client情報取得
  const getClientTaskMeta = async (client: string) => {
    if (!client) {
      setClientMeta(initialClientMeta);

      return;
    }

    const { data, error } = await supabase
      .from("clients")
      .select("initial, task_num")
      .eq("name", client)
      .single();

    if (error) {
      console.error(error);
      return;
    }

    setClientMeta({
      initial: data.initial ?? "",
      taskNum: String(data.task_num ?? ""),
    });
  };

  //serial生成
  const generateSerial = () => {
    const serial = Number(clientMeta.taskNum).toString(16).padStart(4, "0").toUpperCase();

    return `${clientMeta.initial}-${serial}`;
  };

  //Form初期化
  const resetForm = () => {
    setForm(createInitialForm(task, options.clients[0] ?? "難波秘密倶楽部"));
    setClientMeta(initialClientMeta);
    setIsSubmitting(false);
  };

  //Drawer Close
  const completeForm = async () => {
    await stopAddingTask();
    onComplete();
    resetForm();
  };

  const cancelForm = async () => {
    await stopAddingTask();
    onClose();
  }

  //新規タスク追加
  const addTask = async () => {
    if (isSubmitting || !isValid || !user) {
      return;
    }

    setIsSubmitting(true);

    try {
      //タスク登録
      const { data: taskData, error: addTaskError } = await supabase
        .from("tasks")
        .insert({
          client: form.client,
          requester: form.requester,
          title: form.title,
          description: form.description,
          request_date: form.requestDate || getToday(),
          finish_date: form.finishDate,
          manager: form.manager,
          status: form.status,
          priority: form.priority,
          remarks: form.remarks,
          method: form.method || "other",
          created_manager: user.name,
          updated_manager: user.name,
          serial: generateSerial(),
        })
        .select()
        .single();

      if (addTaskError || !taskData) {
        throw (
          addTaskError ??
          new Error(
            "task insert failed"
          )
        );
      }

      //期限設定
      if (form.deadline) {
        const { error: deadlineError } = await supabase
          .from("deadline")
          .insert({
            task_id: taskData.id,
            date: form.deadline,
          });

        if (deadlineError) {
          console.error("期日の設定に失敗しました:", deadlineError);
        } else {
          //期限設定ログ
          const { error: deadlineNoteError } = await supabase
            .from("task_notes")
            .insert({
              task_serial: taskData.serial,
              message: `【${taskData.serial}】タスク「${taskData.title}」の期限日を${form.deadline}に設定しました。`,
              diff: {},
              old_record: {},
              new_record: {},

              changed_by: user.name,
              changed_at: new Date().toISOString(),

              type: "deadline",
            });

          if (deadlineNoteError) {
            console.error(deadlineNoteError);
          }
        }
      }

      //請求データ同期
      await syncInvoiceWithTask(taskData.id, taskData.status);

      //Clientのtask_num更新
      const { error: taskNumError } = await supabase
        .from("clients")
        .update({
          task_num: Number(clientMeta.taskNum) + 1,
        })
        .eq("name", form.client);

      if (taskNumError) {
        console.error("タスクナンバーの更新に失敗しました:", taskNumError);
      }

      //新規追加ログ
      const { error: addNoteError } = await supabase
        .from("task_notes")
        .insert({
          task_serial: taskData.serial,
          message: `【${taskData.serial}】タスク「${taskData.title}」を新規追加しました。`,
          diff: {},
          old_record: {},
          new_record: {},

          changed_by: user.name,
          changed_at: new Date().toISOString(),

          type: "added",
        });

      if (addNoteError) {
        console.error(addNoteError);
      }

      window.setTimeout(completeForm, 300);
    } catch (error) {
      console.error(error);

      alert("タスクの追加に失敗しました");

      setIsSubmitting(false);
    }
  };

  //初期データ取得
  useEffect(() => {
    getInitialData();
  }, []);

  //Client変更
  useEffect(() => {
    if (!form.client) {
      return;
    }

    void Promise.all([
      getRequesters(form.client),
      getClientTaskMeta(form.client),
    ]);
  }, [form.client]);

  //スクロールバー検知
  const contentRef = useRef<HTMLDivElement>(null);
  const [hasScrollbar, setHasScrollbar] = useState(false);

  useEffect(() => {
    const el = contentRef.current;

    if (!el) return;

    const check = () => {
      setHasScrollbar(el.scrollHeight > el.clientHeight);
    };

    check();

    const observer = new ResizeObserver(check);

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <div className="relative flex w-full gap-2 pb-3 pl-1">
        <h3 className="text-left text-xl font-bold">
          {isCopyMode ? `複製して新規追加（複製元:${task?.serial}）` : "新規タスク追加"}
        </h3>

        <X
          onClick={cancelForm}
          className="absolute right-1 top-1 cursor-pointer"
        />
      </div>

      <div className="relative mb-4 flex w-full flex-wrap items-center justify-between gap-2 rounded-md border border-neutral-300 bg-slate-300/50 p-3 dark:border-neutral-600 dark:bg-[#444444]">
        <div className="flex w-full gap-2">
          <AddTaskInput
            className="flex-1 text-sm [&_input]:bg-white [&_input]:dark:bg-neutral-800"
            name="TASK_TITLE"
            type="text"
            label="作業タイトル"
            placeholder="例：年末年始営業時間のご案内"
            icon={<PencilLine className="w-4.5 text-neutral-500" />}
            value={form.title}
            onChange={(e) => updateForm("title", e.target.value)}
            onBlur={() => updateAddingTaskTitle(form.title)}
          />

          <AddTaskInput
            className="w-36 text-sm [&_input]:bg-white [&_input]:dark:bg-neutral-800"
            name="REQUEST_DATE"
            type="date"
            max="9999-12-31"
            label="依頼日"
            icon={<CalendarClock className="w-4.5 text-neutral-500" />}
            value={form.requestDate}
            onChange={(e) => updateForm("requestDate", e.target.value)}
          />
        </div>

        <AddTaskInput
          className="w-full text-sm [&_input]:bg-white [&_input]:dark:bg-neutral-800"
          name="TASK_DESCRIPTION"
          type="text"
          label="作業内容"
          placeholder="例：バナー画像制作"
          icon={<NotepadText className="w-4.5 text-neutral-500" />}
          value={form.description}
          onChange={(e) => updateForm("description", e.target.value)}
        />
      </div>

      <div
        ref={contentRef}
        className={`${hasScrollbar ? "pr-2" : ""} pb-2 grid max-h-[calc(100svh-300px)] grid-cols-2 gap-y-2 overflow-auto overscroll-contain [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300`}
      >

        <div className="col-span-2 flex flex-wrap gap-x-2 pb-4">
          <div className="w-full flex gap-1 items-center mt-1">
            <span className="text-neutral-500 font-bold text-xs leading-none tracking-widest">META</span>
            <span className="block h-0.25 bg-neutral-400 dark:bg-neutral-300/30 w-full" />
          </div>

          <Field className="flex flex-col">
            <h3 className="flex w-full items-center gap-x-1 whitespace-nowrap py-1 pl-0.5 text-sm font-bold">
              <Mail className="w-4.5 text-neutral-500" />依頼手段
            </h3>

            <div className="flex gap-x-1">
              <MailRadio
                name="METHOD"
                id="mailRadio"
                checked={form.method === "mail"}
                onChange={() =>
                  updateForm("method", "mail")
                }
              />

              <TelRadio
                name="METHOD"
                id="telRadio"
                checked={form.method === "tel"}
                onChange={() => updateForm("method", "tel")}
              />

              <OtherRadio
                name="METHOD"
                id="otherRadio"
                checked={form.method === "other"}
                onChange={() => updateForm("method", "other")}
              />
            </div>
          </Field>

          <AddTaskSelect
            className="flex-2 text-sm"
            name="CLIENT"
            label="クライアント"
            icon={<Building className="w-4.5 text-neutral-500" />}
            value={form.client}
            onChange={(e) => {
              //Client変更時はrequesterをリセット
              setForm((prev) => ({
                ...prev,
                client: e.target.value,
                requester: "",
              }));
            }}
          >
            {options.clients.map((client) => (
              <option key={client} value={client}>{client}</option>
            ))}
          </AddTaskSelect>

          <AddTaskSelect
            className="flex-1 text-sm"
            name="REQUESTER"
            label="依頼者"
            icon={<UserPlus className="w-4.5 text-neutral-500" />}
            value={form.requester}
            onChange={(e) => updateForm("requester", e.target.value)}
          >
            <option disabled value="">-</option>

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

          <div className="flex flex-1 flex-wrap gap-2">
            <AddTaskSelect
              className="flex-1 text-sm"
              name="MANAGER"
              label="担当者"
              icon={<UserPen className="w-4.5 text-neutral-500" />}
              value={form.manager}
              onChange={(e) => updateForm("manager", e.target.value)}
            >
              {options.users.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}

              <option value="">未決定</option>
            </AddTaskSelect>

            <AddTaskSelect
              className="w-28 text-sm"
              name="PRIORITY"
              label="優先度"
              icon={<ClockAlert className="w-4.5 text-neutral-500" />}
              value={form.priority}
              onChange={(e) => updateForm("priority", e.target.value)}
            >
              <option value="" />
              <option value="急">至急</option>
              <option value="高">高</option>
              <option value="低">低</option>
            </AddTaskSelect>

            <AddTaskSelect
              className="w-full text-sm"
              name="STATUS"
              label="作業状況"
              icon={<Pickaxe className="w-4.5 text-neutral-500" />}
              value={form.status}
              onChange={(e) => updateForm("status", e.target.value)}
            >
              <option value="未着手">未着手</option>
              <option value="作業中">作業中</option>
              <option value="作業途中">作業途中</option>
              <option value="確認中">確認中</option>
              <option value="完了">完了</option>
              <option value="保留">保留</option>
              <option value="詳細待ち">詳細待ち</option>
            </AddTaskSelect>
          </div>

          <div className="flex w-36 flex-wrap gap-2">
            <AddTaskInput
              className={`w-full text-sm ${form.deadline ? "[&_input]:text-red-600" : ""}`}
              name="DEADLINE"
              type="date"
              max="9999-12-31"
              label="期限日"
              icon={<AlarmClock className="w-4.5 text-neutral-500" />}
              value={form.deadline}
              onChange={(e) => updateForm("deadline", e.target.value)}
            />

            <AddTaskInput
              className="w-full text-sm"
              name="FINISH_DATE"
              type="date"
              max="9999-12-31"
              label="完了日"
              icon={<CircleCheck className="w-4.5 text-neutral-500" />}
              value={form.finishDate}
              onChange={(e) => updateForm("finishDate", e.target.value)}
            />
          </div>
        </div>

        <div className="col-span-2 flex flex-col">
          <div className="w-full flex gap-1 items-center mt-1">
            <span className="text-neutral-500 font-bold text-xs leading-none tracking-widest">REMARKS</span>
            <span className="block h-0.25 bg-neutral-400 dark:bg-neutral-300/30 w-full" />
          </div>

          <h3 className="flex w-28 items-center gap-x-1 whitespace-nowrap py-1 pl-0.5 text-sm font-bold">
            <NotebookPen className="w-4.5 text-neutral-500" />備考欄
          </h3>

          <AddTaskRemarks
            value={form.remarks}
            onChange={(markdown) => updateForm("remarks", markdown)}
          />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 flex w-full flex-wrap justify-between gap-x-2 bg-white px-4 pb-3 pt-4 dark:bg-neutral-800">
        <Button
          onClick={cancelForm}
          className="cursor-pointer rounded px-8 py-2 text-sm outline-1 -outline-offset-1 data-hover:bg-neutral-200 data-hover:dark:text-neutral-700"
        >
          キャンセル
        </Button>

        <Button
          onClick={addTask}
          disabled={!isValid || isSubmitting}
          className="flex-1 cursor-pointer rounded bg-blue-700 dark:bg-blue-900 px-4 py-2 text-sm font-bold text-white data-hover:opacity-80 data-disabled:cursor-auto data-disabled:bg-neutral-400 data-disabled:dark:opacity-50"
        >
          {isSubmitting ? "処理中..." : isCopyMode ? "複製して追加" : "新規追加"}
        </Button>
      </div>
    </>
  );
}
