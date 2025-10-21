"use client";
import { useEffect, useState } from "react";

import { DialogTitle, Button, Field, Input } from "@headlessui/react";
import { GrClose } from "react-icons/gr";
import { AddTaskInput, AddTaskSelect, AddTaskTextarea } from "./ui/AddTaskForm";
import { supabase } from "@/utils/supabase/supabase";
import { MailRadio, OtherRadio, TelRadio } from "./ui/Radio";

import { FaRegBuilding, FaRegCheckCircle } from "react-icons/fa";
import { RiCalendarScheduleLine } from "react-icons/ri";
import { MdMailOutline, MdLaptopChromebook, MdOutlineStickyNote2, MdDriveFileRenameOutline } from "react-icons/md";
import { IoPersonAddOutline, IoDocumentAttachOutline } from "react-icons/io5";
import { BsPersonCheck } from "react-icons/bs";
import { TbClockExclamation } from "react-icons/tb";
import { LuNotebookPen } from "react-icons/lu";

import { v4 as uuidv4 } from 'uuid';
import { useAuth } from "@/app/AuthProvider";
import { toast } from "sonner";


interface AddTaskProps {
  onClose: () => void;
}

export default function AddTask({ onClose }: AddTaskProps) {
  const { user } = useAuth();

  const [currentUserName, setCurrentUserName] = useState<string>('');

  const [clientList, setClientList] = useState<string[]>([]); //クライアント一覧
  const [requesterList, setRequesterList] = useState<string[]>([]); //依頼担当者一覧
  const [userNameList, setUserNameList] = useState<string[]>([]); //作業担当者名一覧

  const [client, setClient] = useState<string>(''); //クライアント
  const [requester, setRequester] = useState<string>(''); //依頼担当者
  const [taskTitle, setTaskTitle] = useState<string>(''); //作業タイトル
  const [taskDescription, setTaskDescription] = useState<string>(''); //作業内容
  const [requestDate, setRequestDate] = useState<string>(new Date().toLocaleDateString('sv-SE')); //依頼日
  const [finishDate, setFinishDate] = useState<string>(''); //完了日
  const [manager, setManager] = useState<string>(''); //作業担当者
  const [status, setStatus] = useState<string>('未着手'); //作業状況
  const [priority, setPriority] = useState<string>(''); //優先度
  const [remarks, setRemarks] = useState<string>(''); //備考欄
  const [method, setMethod] = useState<string>(''); //依頼手段

  const [currentTaskInit, setCurrentTaskInit] = useState<string>('');
  const [currentTaskNum, setCurrentTaskNum] = useState<string>('');

  const [uploadedFiles, setUploadedFiles] = useState<(File | null)[]>([null, null, null]); //添付ファイル
  const allowedExtensions = ['eml', 'jpg', 'jpeg', 'png', 'gif', 'zip']; //添付ファイル識別用拡張子

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isValid, setIsValid] = useState<boolean>(true);


  //ファイル添付監視
  const handleFileChange = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFile = e.target.files?.[0] || null;
    if (!newFile) return;

    //allowedExtensionsの拡張子以外は非対応
    const fileType = newFile.name.split('.').pop()?.toLowerCase();
    if (!fileType || !allowedExtensions.includes(fileType)) {
      alert(`このファイル形式（.${fileType}）はアップロードできません。`);
      e.target.value = '';
      return;
    }

    //添付ファイルをuploadFilesに格納
    setUploadedFiles(prev => {
      const copy = [...prev];
      copy[index] = newFile;
      // const filterd = prev.filter(file => file.name !== newFile.name);
      // return [...filterd, newFile].slice(0, 3);
      return copy;
    });
    // console.log(uploadedFiles);
  }


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
      setClient(clientNameList[0]);
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
      setRequester(requesterNameList[0]);
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
        request_date: requestDate ? requestDate : new Date().toLocaleDateString("sv-SE"),
        finish_date: finishDate,
        manager: manager,
        status: status,
        priority: priority,
        remarks: remarks,
        method: method ? method : "other",
        created_manager: currentUserName,
        updated_manager: currentUserName,
        serial: generateSerial(currentTaskNum),
      })
      .select()
      .single();

    if (addTaskError || !taskData) {
      alert('タスクの追加に失敗しました');
      setIsSubmitting(false);
      return;
    }

    const { error: addTaskNumError } = await supabase
      .from('clients')
      .update({
        task_num: currentTaskNum + 1,
      })
      .eq('name', client);

    if (addTaskNumError) {
      alert('タスクナンバーの更新に失敗しました')
    }


    const taskId = taskData.id;
    await uploadTaskFiles(taskId, uploadedFiles);

    setTimeout(() => {
      onClose();
      toast.success(`${user?.name}さんが新しいタスクを追加しました。`);
    }, 500);
    setTimeout(() => setIsSubmitting(false), 1000);
  }

  async function uploadTaskFiles(taskId: string, files: (File | null)[]) {
    const bucket = 'shared-files';
    const metadataArray = [];

    for (const file of files) {
      if (file) {
        const ext = file.name.split('.').pop();
        const safeFileName = `${uuidv4()}.${ext}`;
        const filePath = `${taskId}/${safeFileName}`;

        const { error } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, { upsert: true });

        if (error) {
          alert('ファイルアップロードに失敗しました');
          continue;
        }

        metadataArray.push({
          original_name: file.name,
          stored_name: safeFileName,
          file_type: file.type,
          file_path: filePath,
          size: file.size,
          ext: ext,
        });
      }
    }

    const { error: insertError } = await supabase
      .from('task_files').insert([
        {
          task_id: taskId,
          files: metadataArray,
        }
      ]);

    if (insertError) {
      alert('メタデータの登録に失敗しました');
    }
  }

  // const resetForm = () => {
  //   setClient(clientList[0]); //クライアント
  //   setRequester(''); //依頼担当者
  //   setTaskTitle(''); //作業タイトル
  //   setTaskDescription(''); //作業内容
  //   setRequestDate(''); //依頼日
  //   setFinishDate(''); //完了日
  //   setManager(''); //作業担当者
  //   setStatus('未着手'); //作業状況
  //   setPriority(''); //優先度
  //   setRemarks(''); //備考欄
  //   setMethod(''); //依頼手段
  //   setUploadedFiles([]); //添付ファイル
  // }

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
  }, []);

  useEffect(() => {
    getRequesters(client);
    getClientTaskNum(client);
  }, [client]);

  // useEffect(() => {
  //   console.log(client, requester);
  // }, [requester]);

  return (
    <>
      <DialogTitle className="font-bold text-left col-span-2 sticky">新規タスク追加</DialogTitle>
      <GrClose onClick={onClose} className="absolute top-8 right-8 cursor-pointer" />

      <div className=" max-h-[70svh] py-2 pr-2 grid grid-cols-2 gap-4 overflow-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300">

        <AddTaskSelect name="CLIENT" label="クライアント" icon={<FaRegBuilding />} value={client} onChange={(e) => setClient(e.target.value)}>
          {clientList.map(client => (
            <option key={client} value={client}>{client}</option>
          ))}
        </AddTaskSelect>

        <AddTaskSelect name="REQUESTER" label="依頼者" icon={<IoPersonAddOutline />} value={requester} onChange={(e) => setRequester(e.target.value)}>
          {requesterList.map(requester => (
            <option key={requester} value={requester}>{requester}</option>
          ))}
          <option value="不明">不明</option>
        </AddTaskSelect>

        <AddTaskInput col={2} name="TASK_TITLE" type="text" label="作業タイトル" placeholder="例：年末年始営業時間のご案内" icon={<MdDriveFileRenameOutline />} value={taskTitle} onChange={(e) => { setTaskTitle(e.target.value); handleContentCheck(e.target.value, taskDescription); }} />

        <AddTaskInput col={2} name="TASK_DESCRIPTION" type="text" label="作業内容" placeholder="例：バナー画像制作" icon={<MdOutlineStickyNote2 />} value={taskDescription} onChange={(e) => { setTaskDescription(e.target.value); handleContentCheck(taskTitle, e.target.value); }} />

        <AddTaskInput name="REQUEST_DATE" type="date" label="依頼日" icon={<RiCalendarScheduleLine />} value={requestDate} onChange={(e) => setRequestDate(e.target.value)} />

        <AddTaskInput name="FINISH_DATE" type="date" label="完了日" icon={<FaRegCheckCircle />} value={finishDate} onChange={(e) => setFinishDate(e.target.value)} />

        <AddTaskSelect name="MANAGER" label="担当者" icon={<BsPersonCheck />} value={manager} onChange={(e) => setManager(e.target.value)}>
          {userNameList.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
          <option value=''>未決定</option>
        </AddTaskSelect>

        <AddTaskSelect name="STATUS" label="作業状況" icon={<MdLaptopChromebook />} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="未着手">未着手</option>
          <option value="作業中">作業中</option>
          <option value="作業途中">作業途中</option>
          <option value="確認中">確認中</option>
          {/* <option value="完了">完了</option> */}
          <option value="保留">保留</option>
          {/* <option value="中止">中止</option> */}
          <option value="詳細待ち">詳細待ち</option>
        </AddTaskSelect>

        <AddTaskSelect name="PRIORITY" label="優先度" icon={<TbClockExclamation />} value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value=""></option>
          <option value="急">至急</option>
          <option value="高">高</option>
          <option value="低">低</option>
        </AddTaskSelect>

        <Field className="col-span-1 flex flex-wrap gap-x-1">
          <h3 className="w-full whitespace-nowrap pl-0.5 py-1 flex gap-x-1 items-center"><MdMailOutline /> 依頼手段</h3>
          <MailRadio name="METHOD" id="mailRadio" onClick={(e) => setMethod(e.currentTarget.value)} />
          <TelRadio name="METHOD" id="telRadio" onClick={(e) => setMethod(e.currentTarget.value)} />
          <OtherRadio name="METHOD" id="otherRadio" onClick={(e) => setMethod(e.currentTarget.value)} />
        </Field>

        <AddTaskTextarea col={2} rows={5} name="REMARKS" label="備考欄" icon={<LuNotebookPen />} value={remarks} onChange={(e) => setRemarks(e.target.value)} />

        <Field className="col-span-2 grid grid-cols-3 gap-x-1">
          <h3 className="col-span-3 w-full whitespace-nowrap pl-0.5 py-1 flex gap-x-1 items-center"><IoDocumentAttachOutline /> 関連ファイル</h3>
          <Input type="file" onChange={handleFileChange(0)} className="file:py-1 file:px-2 file:bg-neutral-300 file:rounded-md file:block focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-black/25" />
          <Input type="file" onChange={handleFileChange(1)} className="file:py-1 file:px-2 file:bg-neutral-300 file:rounded-md file:block focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-black/25" />
          <Input type="file" onChange={handleFileChange(2)} className="file:py-1 file:px-2 file:bg-neutral-300 file:rounded-md file:block focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-black/25" />
        </Field>

      </div>

      <div className="flex gap-4 justify-end col-span-2 pr-3">
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
