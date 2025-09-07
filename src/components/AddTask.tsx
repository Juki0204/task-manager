"use client";
import { useEffect, useState } from "react";

import { Dialog, DialogPanel, DialogTitle, DialogBackdrop, Button } from "@headlessui/react";
import { GrAddCircle, GrClose } from "react-icons/gr";
import { AddTaskInput, AddTaskSelect, AddTaskTextarea } from "./ui/addTaskInput";
import { supabase } from "@/utils/supabase/supabase";
import { getCurrentUser } from "@/app/function/getCurrentUser";
import { MailRadio, OtherRadio, TelRadio } from "./ui/Radio";

import { FaRegBuilding, FaRegCheckCircle } from "react-icons/fa";
import { RiCalendarScheduleLine } from "react-icons/ri";
import { MdMailOutline, MdLaptopChromebook, MdOutlineStickyNote2, MdDriveFileRenameOutline } from "react-icons/md";
import { IoPersonAddOutline, IoDocumentAttachOutline } from "react-icons/io5";
import { BsPersonCheck } from "react-icons/bs";
import { TbClockExclamation } from "react-icons/tb";
import { LuNotebookPen } from "react-icons/lu";

import { v4 as uuidv4 } from 'uuid';


export default function AddTask() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isSend, setIsSend] = useState<boolean>(false);
  const [clientList, setClientList] = useState<string[]>([]); //クライアント一覧
  const [requesterList, setRequesterList] = useState<string[]>([]); //依頼担当者一覧
  const [userNameList, setUserNameList] = useState<string[]>([]); //作業担当者名一覧

  const [client, setClient] = useState<string>(''); //クライアント
  const [requester, setRequester] = useState<string>(''); //依頼担当者
  const [taskTitle, setTaskTitle] = useState<string>(''); //作業タイトル
  const [taskDescription, setTaskDescription] = useState<string>(''); //作業内容
  const [requestDate, setRequestDate] = useState<string>(''); //依頼日
  const [finishDate, setFinishDate] = useState<string>(''); //完了日
  const [manager, setManager] = useState<string>(''); //作業担当者
  const [status, setStatus] = useState<string>('未着手'); //作業状況
  const [priority, setPriority] = useState<string>(''); //優先度
  const [remarks, setRemarks] = useState<string>(''); //備考欄
  const [method, setMethod] = useState<string>(''); //依頼手段

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]); //添付ファイル
  const allowedExtensions = ['eml', 'jpg', 'jpeg', 'png', 'gif']; //添付ファイル識別用拡張子


  //ファイル添付監視
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFile = e.target.files?.[0];
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
      const filterd = prev.filter(file => file.name === newFile.name);
      return [...filterd, newFile].slice(0, 3);
    });
    console.log(uploadedFiles);
  }


  const getData = async () => {
    const currentUser = await getCurrentUser();
    if (currentUser) {
      setManager(currentUser.name);
    }

    //クライアント一覧取得
    const { data: clients } = await supabase
      .from('clients')
      .select('*')

    if (clients) {
      const clientNameList: string[] = [];
      console.log(clients);
      clients.forEach(client => {
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
      console.log(requesters);
      const requesterNameList: string[] = [];
      requesters.forEach(requester => {
        requesterNameList.push(requester.name);
      });
      setRequesterList(requesterNameList);
    }
  }


  const addTask = async () => {
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
        method: method
      })
      .select()
      .single();

    if (addTaskError || !taskData) {
      alert('タスクの追加に失敗しました');
    } else {
      setIsSend(true);
    }

    const taskId = taskData.id;
    await uploadTaskFiles(taskId, uploadedFiles);
  }

  async function uploadTaskFiles(taskId: string, files: File[]) {
    const bucket = 'shared-files';
    const metadataArray = [];

    for (const file of files) {
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
      });
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

  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    getRequesters(client);
  }, [client]);


  return (
    <>
      <Button onClick={() => { setIsOpen(true) }} className="flex items-center gap-2 ml-auto mr-0 rounded bg-sky-600 px-4 py-2 text-sm text-white font-bold data-active:bg-sky-700 data-hover:bg-sky-500"><GrAddCircle />新規追加</Button>
      <Dialog open={isOpen} onClose={() => { setIsOpen(false); setTimeout(() => { setIsSend(false); }, 500); }} transition className="relative z-50 transition duration-300 ease-out data-closed:opacity-0">
        <DialogBackdrop className="fixed inset-0 bg-black/30" />

        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <DialogPanel className="relative max-w-xl space-y-4 rounded-2xl bg-neutral-100 p-8 grid grid-cols-2 gap-x-4 gap-y-2">
            <DialogTitle className="font-bold text-left col-span-2">新規タスク追加</DialogTitle>
            <GrClose onClick={() => { setIsOpen(false); setTimeout(() => { setIsSend(false); }, 500); }} className="absolute top-8 right-8 cursor-pointer" />

            {
              isSend ?
                <>
                  <p>登録が完了しました。</p>
                  <div className="flex gap-4 justify-end col-span-2">
                    <Button
                      onClick={() => {
                        setIsOpen(false);
                        setTimeout(() => { setIsSend(false); }, 500);
                      }}
                      className="bg-sky-600 rounded px-4 py-2 text-sm text-white font-bold"
                    >
                      閉じる
                    </Button>
                  </div>
                </>
                :
                <>
                  <AddTaskSelect name="CLIENT" label="クライアント" icon={<FaRegBuilding />} value={client} onChange={(e) => setClient(e.target.value)}>
                    {clientList.map(client => (
                      <option key={client} value={client}>{client}</option>
                    ))}
                  </AddTaskSelect>

                  <AddTaskSelect name="REQUESTER" label="依頼者" icon={<IoPersonAddOutline />} value={requester} onChange={(e) => setRequester(e.target.value)}>
                    {requesterList.map(requester => (
                      <option key={requester} value={requester}>{requester}</option>
                    ))}
                  </AddTaskSelect>

                  <AddTaskInput col={2} name="TASK_TITLE" type="text" label="作業タイトル" icon={<MdDriveFileRenameOutline />} onChange={(e) => setTaskTitle(e.target.value)}></AddTaskInput>

                  <AddTaskInput col={2} name="TASK_DESCRIPTION" type="text" label="作業内容" icon={<MdOutlineStickyNote2 />} onChange={(e) => setTaskDescription(e.target.value)}></AddTaskInput>

                  <AddTaskInput name="REQUEST_DATE" type="date" label="依頼日" icon={<RiCalendarScheduleLine />} onChange={(e) => setRequestDate(e.target.value)}></AddTaskInput>

                  <AddTaskInput name="FINISH_DATE" type="date" label="完了日" icon={<FaRegCheckCircle />} onChange={(e) => setFinishDate(e.target.value)}></AddTaskInput>

                  <AddTaskSelect name="MANAGER" label="担当者" icon={<BsPersonCheck />} value={manager} onChange={(e) => setManager(e.target.value)}>
                    <option value=''>未決定</option>
                    {userNameList.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </AddTaskSelect>

                  <AddTaskSelect name="STATUS" label="作業状況" icon={<MdLaptopChromebook />} onChange={(e) => setStatus(e.target.value)}>
                    <option value="未着手">未着手</option>
                    <option value="作業中">作業中</option>
                    <option value="作業途中">作業途中</option>
                    <option value="確認中">確認中</option>
                    <option value="完了">完了</option>
                    <option value="保留">保留</option>
                    <option value="中止">中止</option>
                    <option value="詳細待ち">詳細待ち</option>
                  </AddTaskSelect>

                  <AddTaskSelect name="PRIORITY" label="優先度" icon={<TbClockExclamation />} onChange={(e) => setPriority(e.target.value)}>
                    <option value=""></option>
                    <option value="至急">至急</option>
                    <option value="高">高</option>
                    <option value="低">低</option>
                  </AddTaskSelect>

                  <div className="col-span-1 flex flex-wrap gap-x-1">
                    <h3 className="w-full whitespace-nowrap pl-0.5 py-1 flex gap-x-1 items-center"><MdMailOutline /> 依頼手段</h3>
                    <MailRadio name="METHOD" id="mailRadio" onClick={(e) => setMethod(e.currentTarget.value)}></MailRadio>
                    <TelRadio name="METHOD" id="telRadio" onClick={(e) => setMethod(e.currentTarget.value)}></TelRadio>
                    <OtherRadio name="METHOD" id="otherRadio" onClick={(e) => setMethod(e.currentTarget.value)}></OtherRadio>
                  </div>

                  <div className="col-span-2 grid grid-cols-3 gap-x-1">
                    <h3 className="col-span-3 w-full whitespace-nowrap pl-0.5 py-1 flex gap-x-1 items-center"><IoDocumentAttachOutline /> 関連ファイル</h3>
                    <input type="file" onChange={handleFileChange} className="file:py-1 file:px-2 file:bg-neutral-300 file:rounded-md file:block focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-black/25" />
                    <input type="file" onChange={handleFileChange} className="file:py-1 file:px-2 file:bg-neutral-300 file:rounded-md file:block focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-black/25" />
                    <input type="file" onChange={handleFileChange} className="file:py-1 file:px-2 file:bg-neutral-300 file:rounded-md file:block focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-black/25" />
                  </div>

                  <AddTaskTextarea col={2} rows={5} name="REMARKS" label="備考欄" icon={<LuNotebookPen />} onChange={(e) => setRemarks(e.target.value)}></AddTaskTextarea>

                  <div className="flex gap-4 justify-end col-span-2">
                    <Button
                      onClick={() => { setIsOpen(false); setTimeout(() => { setIsSend(false); }, 500); }}
                      className="outline-1 -outline-offset-1 rounded px-4 py-2 text-sm"
                    >
                      キャンセル
                    </Button>
                    <Button
                      onClick={() => {
                        addTask();
                      }
                      }
                      className="bg-sky-600 rounded px-4 py-2 text-sm text-white font-bold"
                    >
                      新規追加
                    </Button>
                  </div>
                </>
            }
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
