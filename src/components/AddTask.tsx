"use client";
import { useEffect, useState } from "react";

import { Dialog, DialogPanel, DialogTitle, DialogBackdrop, Button } from "@headlessui/react";
import { GrAddCircle, GrClose } from "react-icons/gr";
import { AddTaskInput, AddTaskSelect, AddTaskTextarea } from "./ui/addTaskInput";
import { supabase } from "@/utils/supabase/supabase";
import { getCurrentUser } from "@/app/function/getCurrentUser";


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
  const [remarks, setRemarks] = useState<string>(''); //優先度


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
    const { error: addTaskError } = await supabase
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
        remarks: remarks
      });

    if (addTaskError) {
      alert('タスクの追加に失敗しました');
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
          <DialogPanel className="relative max-w-3xl space-y-4 rounded-2xl bg-neutral-100 p-8 grid grid-cols-2 gap-x-4 gap-y-2">
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
                  <AddTaskSelect name="CLIENT" label="クライアント" value={client} onChange={(e) => setClient(e.target.value)}>
                    {clientList.map(client => (
                      <option key={client} value={client}>{client}</option>
                    ))}
                  </AddTaskSelect>

                  <AddTaskSelect name="REQUESTER" label="依頼者" value={requester} onChange={(e) => setRequester(e.target.value)}>
                    {requesterList.map(requester => (
                      <option key={requester} value={requester}>{requester}</option>
                    ))}
                  </AddTaskSelect>

                  <AddTaskInput col={2} name="TASK_TITLE" type="text" label="作業タイトル" onChange={(e) => setTaskTitle(e.target.value)}></AddTaskInput>

                  <AddTaskInput col={2} name="TASK_DESCRIPTION" type="text" label="作業内容" onChange={(e) => setTaskDescription(e.target.value)}></AddTaskInput>

                  <AddTaskInput name="REQUEST_DATE" type="date" label="依頼日" onChange={(e) => setRequestDate(e.target.value)}></AddTaskInput>

                  <AddTaskInput name="FINISH_DATE" type="date" label="完了日" onChange={(e) => setFinishDate(e.target.value)}></AddTaskInput>

                  <AddTaskSelect name="MANAGER" label="担当者" value={manager} onChange={(e) => setManager(e.target.value)}>
                    {userNameList.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </AddTaskSelect>

                  <AddTaskSelect name="STATUS" label="作業状況" onChange={(e) => setStatus(e.target.value)}>
                    <option value="未着手">未着手</option>
                    <option value="作業中">作業中</option>
                    <option value="作業途中">作業途中</option>
                    <option value="確認中">確認中</option>
                    <option value="完了">完了</option>
                    <option value="保留">保留</option>
                    <option value="中止">中止</option>
                    <option value="詳細待ち">詳細待ち</option>
                  </AddTaskSelect>

                  <AddTaskSelect col={2} name="PRIORITY" label="優先度" onChange={(e) => setPriority(e.target.value)}>
                    <option value=""></option>
                    <option value="至急">至急</option>
                    <option value="高">高</option>
                    <option value="低">低</option>
                  </AddTaskSelect>

                  <AddTaskTextarea col={2} rows={5} name="REMARKS" label="備考欄" onChange={(e) => setRemarks(e.target.value)}></AddTaskTextarea>

                  <div className="flex gap-4 justify-end col-span-2">
                    <Button
                      onClick={() => { setIsOpen(false); setTimeout(() => { setIsSend(false); }, 500); }}
                      className="outline-1 -outline-offset-1 rounded px-4 py-2 text-sm"
                    >
                      キャンセル
                    </Button>
                    <Button
                      onClick={() => {
                        setIsSend(true);
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
