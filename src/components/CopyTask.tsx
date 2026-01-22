"use client";
import { useEffect, useRef, useState } from "react";

import { DialogTitle, Button } from "@headlessui/react";
import { GrClose } from "react-icons/gr";
import { AddTaskInput, AddTaskSelect } from "./ui/AddTaskForm";
import { supabase } from "@/utils/supabase/supabase";
import { MailRadio, OtherRadio, TelRadio } from "./ui/Radio";

import { FaRegBuilding, FaRegCheckCircle } from "react-icons/fa";
import { RiCalendarScheduleLine } from "react-icons/ri";
import { MdMailOutline, MdLaptopChromebook, MdOutlineStickyNote2, MdDriveFileRenameOutline, MdAlarm } from "react-icons/md";
import { IoPersonAddOutline } from "react-icons/io5";
import { BsPersonCheck } from "react-icons/bs";
import { TbClockExclamation } from "react-icons/tb";
import { LuNotebookPen } from "react-icons/lu";

import { Task } from "@/utils/types/task";
import { toast } from "sonner";
import { User } from "@/utils/types/user";
import AddTaskRemarks from "./ui/AddTaskRemarks";


interface task {
  task: Task;
  user: User;
  onClose: () => void;
}


export default function UpdateTask({ task, user, onClose }: task) {
  const [currentUserName, setCurrentUserName] = useState<string>('');

  const [clientList, setClientList] = useState<string[]>([]); //クライアント一覧
  const [requesterList, setRequesterList] = useState<string[]>([]); //依頼担当者一覧
  const [userNameList, setUserNameList] = useState<string[]>([]); //作業担当者名一覧

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


  const [deadline, setDeadline] = useState<string>(''); //期日

  const [currentTaskInit, setCurrentTaskInit] = useState<string>('');
  const [currentTaskNum, setCurrentTaskNum] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // const [uploadedFiles, setUploadedFiles] = useState<(File | null)[]>([null, null, null]); //添付ファイル
  // const allowedExtensions = ['eml', 'jpg', 'jpeg', 'png', 'gif', 'zip']; //添付ファイル識別用拡張子

  const [isValid, setIsValid] = useState<boolean>(true);

  //ファイル添付監視
  // const handleFileChange = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const newFile = e.target.files?.[0] || null;
  //   if (!newFile) return;

  //   //allowedExtensionsの拡張子以外は非対応
  //   const fileType = newFile.name.split('.').pop()?.toLowerCase();
  //   if (!fileType || !allowedExtensions.includes(fileType)) {
  //     alert(`このファイル形式（.${fileType}）はアップロードできません。`);
  //     e.target.value = '';
  //     return;
  //   }

  //   //添付ファイルをuploadFilesに格納
  //   setUploadedFiles(prev => {
  //     const copy = [...prev];
  //     copy[index] = newFile;
  //     return copy;
  //   });
  // }

  const getData = async () => {
    if (user) {
      setCurrentUserName(user.name);
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

  //タスクのシリアルナンバー生成用管理番号取得
  const getClientTaskNum = async (client: string) => {
    const { data: cl } = await supabase
      .from('clients')
      .select('*')
      .eq('name', client);

    if (cl && cl.length > 0) {
      setCurrentTaskNum(cl[0].task_num);
      setCurrentTaskInit(cl[0].initial);
    }
  }

  const generateSerial = (num: string): string => {
    const serial = Number(num).toString(16).padStart(4, '0').toUpperCase();
    return `${currentTaskInit}-${serial}`;
  };

  const addTask = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const { data: taskData, error: addTaskError } = await supabase
      .from('tasks')
      .insert({
        client: client,
        requester: requester,
        title: taskTitle,
        description: taskDescription,
        request_date: requestDate,
        finish_date: finishDate,
        manager: manager,
        status: status,
        priority: priority,
        remarks: remarks,
        method: method,
        created_manager: currentUserName,
        updated_manager: currentUserName,
        serial: generateSerial(currentTaskNum),
      })
      .select()
      .single();

    if (addTaskError || !taskData) {
      alert(`タスクの追加に失敗しました`);
      setIsSubmitting(false);
      return;
    }

    //期限日の追加
    if (deadline) {
      const { error } = await supabase
        .from("deadline")
        .insert({
          task_id: taskData.id,
          date: deadline,
        });

      if (error) {
        console.error("期日の設定に失敗しました:", error);
      }
    }

    //シリアルナンバー更新
    const { error: addTaskNumError } = await supabase
      .from('clients')
      .update({
        task_num: currentTaskNum + 1,
      })
      .eq('name', client);

    if (addTaskNumError) {
      alert('タスクナンバーの更新に失敗しました')
    }

    //追加ログ生成
    const { error } = await supabase.from("task_notes").insert({
      task_serial: taskData.serial,
      message: `【${taskData.serial}】タスク「${taskData.title}」を新規追加しました。`,
      diff: {},
      old_record: {},
      new_record: {},
      changed_by: currentUserName,
      changed_at: new Date().toISOString(),
      type: "added",
    });

    if (error) console.error(error);


    // const taskId = taskData.id;
    // await uploadTaskFiles(taskId, uploadedFiles);

    setTimeout(() => {
      onClose();
      // toast.success(`${user?.name}さんが新しいタスクを追加しました。`);
    }, 500);
    setTimeout(() => setIsSubmitting(false), 1000);
  }


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
    getClientTaskNum(client);
  }, [client]);

  useEffect(() => {
    handleContentCheck(taskTitle, taskDescription);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


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


  return (
    <>
      <div className="relative w-full flex flex-wrap justify-between items-center gap-2 rounded-xl bg-slate-300/70 p-3 mb-1">
        <DialogTitle className="font-bold text-left col-span-2 sticky">コピーして新規追加（コピー元:{task.serial}）</DialogTitle>
        <GrClose onClick={onClose} className="absolute top-3 right-3 cursor-pointer" />

        <div className="w-full flex gap-2">
          <AddTaskInput className="flex-1 [&_input]:bg-neutral-50 text-sm" name="TASK_TITLE" type="text" label="作業タイトル" icon={<MdDriveFileRenameOutline />} value={taskTitle} onChange={(e) => { setTaskTitle(e.target.value); handleContentCheck(e.target.value, taskDescription); }} />
          <AddTaskInput className="w-36 [&_input]:bg-neutral-50 text-sm" name="REQUEST_DATE" type="date" max="9999-12-31" label="依頼日" icon={<RiCalendarScheduleLine />} value={requestDate} onChange={(e) => setRequestDate(e.target.value)} />
        </div>


        <AddTaskInput className="w-full [&_input]:bg-neutral-50 text-sm" name="TASK_DESCRIPTION" type="text" label="作業内容" icon={<MdOutlineStickyNote2 />} value={taskDescription} onChange={(e) => { setTaskDescription(e.target.value); handleContentCheck(taskTitle, e.target.value); }} />
      </div>

      <div
        ref={contentRef}
        className={`
          ${hasScrollbar ? "pr-2" : ""}
          max-h-[70svh] grid grid-cols-2 mb-0 gap-2 overflow-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300
        `}
      >

        <div className="col-span-2 flex flex-wrap gap-x-2">
          <div className="w-full flex gap-1 mt-3 mb-1 items-center">
            <span className="text-neutral-400/60 text-xs leading-none tracking-widest">META</span>
            <span className="block h-[1px] bg-neutral-300 w-full" />
          </div>

          <div className="flex flex-col">
            <h3 className="w-full whitespace-nowrap pl-0.5 py-1 flex gap-x-1 items-center text-sm font-bold"><MdMailOutline /> 依頼手段</h3>
            <div className="flex gap-x-1">
              <MailRadio defaultChecked={task.method === 'mail' ? true : false} name="METHOD" id="mailRadio" onClick={(e) => setMethod(e.currentTarget.value)} />
              <TelRadio defaultChecked={task.method === 'tel' ? true : false} name="METHOD" id="telRadio" onClick={(e) => setMethod(e.currentTarget.value)} />
              <OtherRadio defaultChecked={task.method === 'other' ? true : false} name="METHOD" id="otherRadio" onClick={(e) => setMethod(e.currentTarget.value)} />
            </div>
          </div>

          <AddTaskSelect className="flex-2 text-sm" name="CLIENT" label="クライアント" icon={<FaRegBuilding />} value={client} onChange={(e) => setClient(e.target.value)}>
            {clientList.map(client => (
              <option key={client} value={client}>{client}</option>
            ))}
          </AddTaskSelect>

          <AddTaskSelect className="flex-1 text-sm" name="REQUESTER" label="依頼者" icon={<IoPersonAddOutline />} value={requester} onChange={(e) => setRequester(e.target.value)}>
            {requesterList.map(requester => (
              <option key={requester} value={requester}>{requester}</option>
            ))}
            <option value="不明">不明</option>
          </AddTaskSelect>
        </div>

        <div className="col-span-2 flex flex-wrap gap-x-2">
          <div className="w-full flex gap-1 items-center mt-2 mb-1">
            <span className="text-neutral-400/60 text-xs leading-none tracking-widest">STATUS</span>
            <span className="block h-[1px] bg-neutral-300 w-full" />
          </div>

          <div className="flex flex-wrap gap-2 flex-1">
            <AddTaskSelect className="flex-1 text-sm" name="MANAGER" label="担当者" icon={<BsPersonCheck />} value={manager} onChange={(e) => setManager(e.target.value)}>
              {userNameList.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
              <option value=''>未決定</option>
            </AddTaskSelect>

            <AddTaskSelect className="w-28 text-sm" name="PRIORITY" label="優先度" icon={<TbClockExclamation />} value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value=""></option>
              <option value="急">至急</option>
              <option value="高">高</option>
              <option value="低">低</option>
            </AddTaskSelect>

            <AddTaskSelect className="w-full text-sm" name="STATUS" label="作業状況" icon={<MdLaptopChromebook />} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="未着手">未着手</option>
              <option value="作業中">作業中</option>
              <option value="作業途中">作業途中</option>
              <option value="確認中">確認中</option>
              <option value="完了">完了</option>
              <option value="保留">保留</option>
              {/* <option value="中止">中止</option> */}
              <option value="詳細待ち">詳細待ち</option>
            </AddTaskSelect>
          </div>

          <div className="w-36 flex flex-wrap gap-2">
            <AddTaskInput className={`w-full text-sm ${deadline ? "[&_input]:text-red-600" : ""}`} name="DEADLINE" type="date" max="9999-12-31" label="期限日" icon={<MdAlarm />} value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            <AddTaskInput className="w-full text-sm" name="FINISH_DATE" type="date" max="9999-12-31" label="完了日" icon={<FaRegCheckCircle />} value={finishDate} onChange={(e) => setFinishDate(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-col col-span-2">
          <div className="col-span-2 flex gap-1 items-center mt-2 mb-1">
            <span className="text-neutral-400/60 text-xs leading-none tracking-widest">REMARKS</span>
            <span className="block h-[1px] bg-neutral-300 w-full" />
          </div>

          <h3 className="w-28 whitespace-nowrap pl-0.5 py-1 flex gap-x-1 items-center text-sm font-bold"><LuNotebookPen /> 備考欄</h3>
          <AddTaskRemarks value={remarks} onChange={(markdown) => setRemarks(markdown)} />
        </div>
      </div>

      <div className="flex gap-4 justify-end col-span-2 pt-2">
        <Button
          onClick={onClose}
          className="outline-1 -outline-offset-1 rounded px-4 py-2 text-sm data-hover:bg-neutral-200 cursor-pointer"
        >
          キャンセル
        </Button>
        <Button
          onClick={() => addTask()}
          disabled={isValid || isSubmitting}
          className="bg-sky-600 rounded px-4 py-2 text-sm text-white font-bold data-hover:opacity-80 cursor-pointer data-disabled:bg-neutral-400 data-disabled:cursor-auto"
        >
          {isSubmitting ? "追加中..." : "新規追加"}
        </Button>
      </div>
    </>
  );
}
