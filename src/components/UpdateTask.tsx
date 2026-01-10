"use client";
import { useEffect, useRef, useState } from "react";

import { DialogTitle, Button, Label, Input, Field } from "@headlessui/react";
import { AddTaskInput, AddTaskSelect, AddTaskTextarea } from "./ui/AddTaskForm";
import { supabase } from "@/utils/supabase/supabase";
import { MailRadio, OtherRadio, TelRadio } from "./ui/Radio";

import { FaRegBuilding, FaRegCheckCircle } from "react-icons/fa";
import { RiCalendarScheduleLine } from "react-icons/ri";
import { MdMailOutline, MdLaptopChromebook, MdOutlineStickyNote2, MdDriveFileRenameOutline, MdAlarm } from "react-icons/md";
import { IoPersonAddOutline, IoDocumentAttachOutline } from "react-icons/io5";
import { BsPersonCheck } from "react-icons/bs";
import { TbClockExclamation } from "react-icons/tb";
import { LuNotebookPen } from "react-icons/lu";

import { v4 as uuidv4 } from 'uuid';
import { Task } from "@/utils/types/task";
import { toast } from "sonner";
import { useTaskPresence } from "@/utils/hooks/useTaskPresence";
import { useInvoiceSync } from "@/utils/hooks/useInvoiceSync";
import { User } from "@/utils/types/user";
import { compareHistory } from "@/utils/function/comparHistory";
import { generateChangeMessage } from "@/utils/function/generateChangeMessage";
import AddTaskRemarks from "./ui/AddTaskRemarks";
import { useTaskRealtime } from "@/utils/hooks/useTaskRealtime";


interface task {
  task: Task;
  user: User;
  onCancel: () => void;
  onComplete: () => void;
  onUnlock: () => void;
  deadlineList: { task_id: string, date: string }[];
}

interface taskFileMeta {
  original_name: string,
  stored_name: string,
  file_type: string,
  file_path: string,
  size: string,
  ext: string,
}



export default function UpdateTask({ task, user, onCancel, onComplete, onUnlock, deadlineList }: task) {

  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const [clientList, setClientList] = useState<string[]>([]); //クライアント一覧
  const [requesterList, setRequesterList] = useState<string[]>([]); //依頼担当者一覧
  const [userNameList, setUserNameList] = useState<string[]>([]); //作業担当者名一覧

  const taskId = task.id; //id
  const [client, setClient] = useState<string>(task.client); //クライアント
  const [requester, setRequester] = useState<string>(task.requester); //依頼担当者
  const [taskTitle, setTaskTitle] = useState<string>(task.title); //作業タイトル
  const [taskDescription, setTaskDescription] = useState<string>(task.description); //作業内容
  const [requestDate, setRequestDate] = useState<string>(task.request_date); //依頼日
  const [finishDate, setFinishDate] = useState<string>(task.finish_date ? task.finish_date : ''); //完了日
  const [manager, setManager] = useState<string>(task.manager ? task.manager : ''); //作業担当者
  const [status, setStatus] = useState<string>(task.status); //作業状況
  const [priority, setPriority] = useState<string>(task.priority ? task.priority : ''); //優先度
  const [remarks, setRemarks] = useState<string>(task.remarks ? task.remarks : ''); //備考欄
  const [method, setMethod] = useState<string>(task.method); //依頼手段
  const serial = task.serial; //識別番号

  const editingUser = useTaskPresence(task.id, { id: user.id, name: user.name }, true);
  const [isValid, setIsValid] = useState<boolean>(true);
  const { syncInvoiceWithTask } = useInvoiceSync();

  const currentDeadline = deadlineList?.filter(d => d.task_id === task.id)[0];
  const [deadline, setDeadline] = useState<string>("");

  const getData = async () => {
    if (user) {
      setCurrentUserName(user.name);
      setCurrentUserId(user.id);
    }

    //クライアント一覧取得
    const { data: clients } = await supabase
      .from('clients')
      .select('*')

    if (clients) {
      const clientNameList: string[] = [];
      // console.log(clients);
      clients.sort((a, b) => a.id - b.id).forEach(client => {
        clientNameList.push(client.name);
      });
      setClientList(clientNameList);
    }

    //作業担当者一覧取得
    const { data: users } = await supabase
      .from('users')
      .select('*')

    if (users) {
      const nameList: string[] = [];
      users.forEach(user => {
        nameList.push(user.name);
      });
      setUserNameList(nameList);
    }
  }

  const getRequesters = async (client: string) => {
    //依頼担当者一覧取得
    const { data: requesters } = await supabase
      .from('requesters')
      .select('*')
      .eq('company', client);

    //依頼担当者一覧取得
    if (requesters) {
      // console.log(requesters);
      const requesterNameList: string[] = [];
      requesters.forEach(requester => {
        requesterNameList.push(requester.name);
      });
      setRequesterList(requesterNameList);
    }
  }

  const updateTask = async () => {
    //変更前のタスク
    const { data: oldTaskData } = await supabase
      .from("tasks")
      .select("*")
      .eq("serial", serial)
      .single();

    //変更処理と変更後のタスク
    const { data: taskData, error: updateTaskError } = await supabase
      .from('tasks')
      .update({
        client: client,
        requester: requester,
        title: taskTitle,
        description: taskDescription,
        request_date: requestDate,
        finish_date: (status === "完了" || status === "確認中") && !finishDate ? new Date().toLocaleDateString("sv-SE") : finishDate,
        manager: manager,
        status: status,
        priority: priority,
        remarks: remarks,
        method: method,
        updated_manager: currentUserName,
        updated_at: new Date().toLocaleDateString("sv-SE"),
      })
      .eq('serial', serial)
      .select()
      .single();

    if (updateTaskError || !taskData) {
      alert('タスクの追加に失敗しました');
      console.error('タスクの追加に失敗しました:', updateTaskError);
      return;
    }

    //期日の更新
    if (deadline) {
      if (currentDeadline) { //編集時にすでに期日があった場合
        await supabase
          .from("deadline")
          .update({ date: deadline })
          .eq("task_id", task.id);
      } else { //ない場合新規
        await supabase
          .from("deadline")
          .insert({
            task_id: task.id,
            date: deadline
          });
      }
    } else { //期日入力がない場合
      if (currentDeadline) { //編集時にすでに期日があった場合 = 期日の削除
        await supabase
          .from("deadline")
          .delete()
          .eq("task_id", task.id);
      }
    }

    //請求タスク判定
    await syncInvoiceWithTask(taskId, status);

    //差分比較～変更ログ生成
    const diff = compareHistory(taskData, oldTaskData);
    if (diff.changedKeys.length === 0) return;

    const message = generateChangeMessage(diff, taskData);
    if (!message) return;

    const { error } = await supabase.from("task_notes").insert({
      task_serial: serial,
      message,
      diff,
      old_record: oldTaskData,
      new_record: taskData,
      changed_by: currentUserName,
      changed_at: new Date().toISOString(),
      type: "changed",
    });

    if (error) console.error(error);

    //備考欄変更通知
    if (remarks) await addUnreadTask(taskData);

  }


  //remarks変更時の他者への通知
  async function addUnreadTask(task: Task) {
    try {
      const taskId = task.id;
      if (!taskId) return;

      if (!task.manager) {
        // managerが未決定の時は全ユーザーに通知
        const { data: users, error } = await supabase
          .from("users")
          .select("id, unread_task_id")
          .not("id", "eq", currentUserId);

        if (error) throw error;
        if (!users || users.length === 0) {
          console.warn("No users found");
          return;
        }

        // 各ユーザーの unread_task_id に taskId を追加して更新
        const updates = users.map(async (user) => {
          const currentIds = Array.isArray(user.unread_task_id)
            ? user.unread_task_id
            : [];
          const updatedIds = Array.from(new Set([...currentIds, taskId]));

          console.log(`Updating user ${user.id} with ${updatedIds.length} unread tasks`);

          const { error: updateError } = await supabase
            .from("users")
            .update({ unread_task_id: updatedIds })
            .eq("id", user.id);

          if (updateError) console.error(`Failed to update user ${user.id}:`, updateError);
        });

        await Promise.all(updates);
        return;
      }

      // managerが決まっている場合は担当者のみ通知
      const { data: user, error } = await supabase
        .from("users")
        .select("id, unread_task_id")
        .eq("name", task.manager)
        .single();

      if (error) throw error;

      if (!user) {
        console.warn(`No user found for manager: ${task.manager}`);
        return;
      }

      const currentIds = Array.isArray(user.unread_task_id)
        ? user.unread_task_id
        : [];
      const updatedIds = Array.from(new Set([...currentIds, taskId]));

      const { error: updateError } = await supabase
        .from("users")
        .update({ unread_task_id: updatedIds })
        .eq("id", user.id);

      if (updateError) console.error(`Failed to update manager ${user.id}:`, updateError);
    } catch (err) {
      console.error("Error updating unread_task_id:", err);
    }
  }

  //簡易validate
  const handleContentCheck = (taskTitle: string, taskDescription: string) => {
    if (taskTitle && taskDescription) {
      setIsValid(false);
    } else {
      setIsValid(true);
    }
  }

  useEffect(() => {
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    getRequesters(client);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

  useEffect(() => {
    handleContentCheck(taskTitle, taskDescription);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  //スクロールバーの有無を検知（padding調整用）
  const contentRef = useRef<HTMLDivElement>(null);
  const [hasScrollbar, setHasScrollbar] = useState(false);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const check = () => {
      const sc = el.scrollHeight > el.clientHeight;
      setHasScrollbar(sc);
      console.log(sc);
    };

    check();

    // 中身が変化した時にも反応させる
    const ro = new ResizeObserver(check);
    ro.observe(el);

    el.addEventListener("resize", check);

    return () => {
      ro.disconnect();
      el.removeEventListener("resize", check);
    };
  }, []);

  useEffect(() => {
    if (currentDeadline) {
      setDeadline(currentDeadline.date);
    }
  }, [deadlineList, currentDeadline]);

  return (
    <>
      <DialogTitle className="font-bold text-center col-span-2 sticky">タスク編集</DialogTitle>

      <div
        ref={contentRef}
        className={`
          ${hasScrollbar ? "pr-2" : ""}
          max-h-[70svh] py-2 grid grid-cols-2 gap-4 overflow-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300
        `}
      >

        <div className="col-span-2 flex gap-4">
          <div className="flex flex-col w-fit">
            <h3 className="w-fit whitespace-nowrap pl-0.5 py-1 flex gap-x-1 items-center text-sm font-bold"><MdMailOutline /> 依頼手段</h3>
            <div className="flex gap-x-1 w-fit">
              <MailRadio defaultChecked={task.method === 'mail' ? true : false} name="METHOD" id="mailRadio" onClick={(e) => setMethod(e.currentTarget.value)} />
              <TelRadio defaultChecked={task.method === 'tel' ? true : false} name="METHOD" id="telRadio" onClick={(e) => setMethod(e.currentTarget.value)} />
              <OtherRadio defaultChecked={task.method === 'other' ? true : false} name="METHOD" id="otherRadio" onClick={(e) => setMethod(e.currentTarget.value)} />
            </div>
          </div>

          <AddTaskSelect className="flex-2" name="CLIENT" label="クライアント" icon={<FaRegBuilding />} value={client} onChange={(e) => setClient(e.target.value)}>
            {clientList.map(client => (
              <option key={client} value={client}>{client}</option>
            ))}
          </AddTaskSelect>

          <AddTaskSelect className="flex-1" name="REQUESTER" label="依頼者" icon={<IoPersonAddOutline />} value={requester} onChange={(e) => setRequester(e.target.value)}>
            {requesterList.map(requester => (
              <option key={requester} value={requester}>{requester}</option>
            ))}
            <option value="不明">不明</option>
          </AddTaskSelect>
        </div>

        <AddTaskInput col={2} name="TASK_TITLE" type="text" label="作業タイトル" icon={<MdDriveFileRenameOutline />} value={taskTitle} onChange={(e) => { setTaskTitle(e.target.value); handleContentCheck(e.target.value, taskDescription); }} />

        <AddTaskInput col={2} name="TASK_DESCRIPTION" type="text" label="作業内容" icon={<MdOutlineStickyNote2 />} value={taskDescription} onChange={(e) => { setTaskDescription(e.target.value); handleContentCheck(taskTitle, e.target.value); }} />

        <div className="col-span-2 flex gap-x-4">
          <AddTaskInput className="flex-1" name="REQUEST_DATE" type="date" max="9999-12-31" label="依頼日" icon={<RiCalendarScheduleLine />} value={requestDate} onChange={(e) => setRequestDate(e.target.value)} />

          <AddTaskInput className={`flex-1 ${deadline ? "[&_input]:text-red-600" : ""}`} name="DEADLINE" type="date" max="9999-12-31" label="期限日" icon={<MdAlarm />} value={deadline} onChange={(e) => setDeadline(e.target.value)} />

          <AddTaskInput className="flex-1" name="FINISH_DATE" type="date" max="9999-12-31" label="完了日" icon={<FaRegCheckCircle />} value={finishDate} onChange={(e) => setFinishDate(e.target.value)} />
        </div>

        <div className="col-span-2 flex gap-x-4">
          <AddTaskSelect className="flex-1" name="MANAGER" label="担当者" icon={<BsPersonCheck />} value={manager} onChange={(e) => setManager(e.target.value)}>
            {userNameList.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
            <option value=''>未決定</option>
          </AddTaskSelect>

          <AddTaskSelect className="flex-1" name="STATUS" label="作業状況" icon={<MdLaptopChromebook />} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="未着手">未着手</option>
            <option value="作業中">作業中</option>
            <option value="作業途中">作業途中</option>
            <option value="確認中">確認中</option>
            <option value="完了">完了</option>
            <option value="保留">保留</option>
            <option value="中止">中止</option>
            <option value="詳細待ち">詳細待ち</option>
          </AddTaskSelect>

          <AddTaskSelect className="flex-1" name="PRIORITY" label="優先度" icon={<TbClockExclamation />} value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value=""></option>
            <option value="急">至急</option>
            <option value="高">高</option>
            <option value="低">低</option>
          </AddTaskSelect>
        </div>

        <div className="flex flex-col col-span-2">
          <h3 className="w-28 whitespace-nowrap pl-0.5 py-1 flex gap-x-1 items-center text-sm font-bold"><LuNotebookPen /> 備考欄</h3>
          <AddTaskRemarks value={remarks} onChange={(markdown) => setRemarks(markdown)} />
        </div>

      </div>

      <div className="flex gap-4 justify-end col-span-2">
        <Button
          onClick={() => { onCancel(); onUnlock(); }}
          className="outline-1 -outline-offset-1 rounded px-4 py-2 text-sm data-hover:bg-neutral-200 cursor-pointer"
        >
          キャンセル
        </Button>
        <Button
          disabled={isValid}
          onClick={() => {
            updateTask();
            onUnlock();
            setTimeout(() => {
              onComplete();
              // toast.info(`${user.name}さんが、タスク:${task.serial}を更新しました。`);
            }, 500);
          }
          }
          className="bg-sky-600 rounded px-4 py-2 text-sm text-white font-bold data-hover:opacity-80 cursor-pointer data-disabled:bg-neutral-400 data-disabled:cursor-auto"
        >
          更新
        </Button>
      </div>
    </>
  );
}
