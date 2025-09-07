import { FaRegBuilding, FaRegCheckCircle, FaRegQuestionCircle, FaRegImage } from "react-icons/fa";
import { RiCalendarScheduleLine } from "react-icons/ri";
import { MdMailOutline, MdLaptopChromebook, MdOutlineStickyNote2 } from "react-icons/md";
import { FiPhone } from "react-icons/fi";
import { IoDocumentAttachOutline, IoPersonAddOutline } from "react-icons/io5";
import { BsPersonCheck } from "react-icons/bs";
import { LuNotebookPen } from "react-icons/lu";

import { Dialog, DialogPanel, DialogTitle, DialogBackdrop, Button } from "@headlessui/react";
import { GrClose } from "react-icons/gr";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/supabase";
import FileModal from "./FileModal";

interface task {
  task: {
    id: string;
    client: string;
    requester: string;
    title: string;
    description: string;
    requireDate: string;
    finishDate?: string;
    manager?: string;
    status: string;
    priority?: string;
    remarks?: string;
    method: string;
  }
}

interface currentTaskFile {
  filePath: string;
  fileName: string;
  fileType: string;
  storedName: string;
}

export default function Card({ task, ...props }: task) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isFileOpen, setIsFileOpen] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<currentTaskFile | null>(null);

  const [priorityStyle, setPriorityStyle] = useState<string>('');
  const [statusStyle, setStatusStyle] = useState<string>('');

  const [currentTaskFile, setCurrentTaskFile] = useState<currentTaskFile[]>([]);

  function definePriorityStyle(priority: string | undefined) {
    if (priority === '急') {
      setPriorityStyle('bg-red-300 text-red-800');
    } else if (priority === '高') {
      setPriorityStyle('bg-orange-300 text-orange-800');
    } else if (priority === '低') {
      setPriorityStyle('bg-emerald-300 text-emerald-800');
    }
  }

  function defineStatusStyle(status: string) {
    if (status === '未着手') {
      setStatusStyle('bg-neutral-300 text-neutral-800');
    } else if (status === '作業中') {
      setStatusStyle('bg-blue-300 text-blue-800');
    } else if (status === '作業途中') {
      setStatusStyle('bg-blue-200 text-blue-800');
    } else if (status === '確認中') {
      setStatusStyle('bg-pink-300 text-pink-800');
    } else if (status === '完了') {
      setStatusStyle('bg-green-300 text-green-800');
    } else if (status === '保留') {
      setStatusStyle('bg-yellow-300 text-yellow-800');
    } else if (status === '中止') {
      setStatusStyle('bg-neutral-600 text-neutral-200');
    } else if (status === '詳細待ち') {
      setStatusStyle('bg-neutral-500 text-neutral-200');
    }
  }

  const getTaskFiles = async () => {
    const { data: fileMetadata } = await supabase
      .from('task_files')
      .select('*')
      .eq("task_id", task.id);

    if (fileMetadata) {
      const taskFileArray = [];
      console.log(fileMetadata);
      for (const file of fileMetadata[0].files) {
        const ext = file.original_name.split('.').pop();
        taskFileArray.push({
          filePath: file.file_path,
          fileName: file.original_name,
          fileType: ext,
          storedName: file.stored_name,
        });
      }

      setCurrentTaskFile(taskFileArray);
    }
  }

  useEffect(() => {
    definePriorityStyle(task.priority);
    defineStatusStyle(task.status)
  }, [task]);

  return (
    <>
      {/* カード（概要） */}
      <div onClick={() => { setIsOpen(true); getTaskFiles(); }} id={task.id} className="min-w-[400px] rounded-xl border-2 border-neutral-600 bg-neutral-800 p-4 text-white tracking-wide" {...props}>
        <div className="flex mb-1 justify-between">
          <h3 className="font-bold text-lg truncate flex items-center gap-1">
            {
              task.method === 'mail' ?
                <MdMailOutline />
                : task.method === 'tel' ?
                  <FiPhone />
                  :
                  <FaRegQuestionCircle />
            }
            {task.title}
          </h3>
          <div className="w-fit flex gap-1 items-center pl-1">
            {
              task.priority ?
                <span className={`py-1 px-2 h-fit rounded-md text-xs font-bold whitespace-nowrap ${priorityStyle}`}>{task.priority}</span>
                :
                <></>
            }
            <span className={`py-1 px-2 h-fit rounded-md text-xs font-bold whitespace-nowrap ${statusStyle}`}>{task.status}</span>
          </div>
        </div>
        <div className="line-clamp-2 w-full h-12 mb-3">
          {task.description}
        </div>
        <div className="grid gap-2 grid-cols-6">
          <div className="col-span-4 flex gap-1 items-center border-b border-neutral-600"><FaRegBuilding />{task.client} 《{task.requester}》</div>
          <div className="col-span-2 flex gap-1 items-center border-b border-neutral-600"><BsPersonCheck />{task.manager ? task.manager : "-"}</div>
          <div className="col-span-3 flex gap-1 items-center border-b border-neutral-600"><RiCalendarScheduleLine />{task.requireDate}</div>
          <div className="col-span-3 flex gap-1 items-center border-b border-neutral-600"><FaRegCheckCircle />{task.finishDate ? task.finishDate : "-"}</div>
        </div>
      </div>

      {/* モーダル（詳細） */}
      <Dialog open={isOpen} onClose={() => setIsOpen(false)} transition className="relative z-50 transition duration-300 ease-out data-closed:opacity-0">
        <DialogBackdrop className="fixed inset-0 bg-black/30" />

        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <DialogPanel className="relative w-11/12 max-w-md space-y-4 rounded-2xl bg-neutral-100 p-8">
            <DialogTitle className="font-bold text-left col-span-2 flex gap-1 items-center pr-8">
              <span className="w-4">
                {
                  task.method === 'mail' ?
                    <MdMailOutline />
                    : task.method === 'tel' ?
                      <FiPhone />
                      :
                      <FaRegQuestionCircle />
                }
              </span>
              {task.title}
            </DialogTitle>
            <div className="w-fit flex gap-1 items-center pl-1">
              {
                task.priority ?
                  <span className={`py-1 px-2 h-fit rounded-md text-xs font-bold whitespace-nowrap ${priorityStyle}`}>{task.priority}</span>
                  :
                  <></>
              }
              <span className={`py-1 px-2 h-fit rounded-md text-xs font-bold whitespace-nowrap ${statusStyle}`}>{task.status}</span>
            </div>
            <GrClose onClick={() => setIsOpen(false)} className="absolute top-8 right-8 cursor-pointer" />

            <ul className="relative grid grid-cols-2 gap-x-4 gap-y-2">
              <li className="flex flex-col border-b border-neutral-300">
                <h3 className="w-28 whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm"><FaRegBuilding /> クライアント</h3>
                <p>{task.client}</p>
              </li>

              <li className="flex flex-col border-b border-neutral-300">
                <h3 className="w-28 whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm"><IoPersonAddOutline /> 依頼者</h3>
                <p>{task.requester}</p>
              </li>

              <li className="flex flex-col col-span-2 border-b border-neutral-300">
                <h3 className="w-28 whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm"><MdOutlineStickyNote2 /> 作業内容</h3>
                <p>{task.description}</p>
              </li>

              <li className="flex flex-col border-b border-neutral-300">
                <h3 className="w-28 whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm"><RiCalendarScheduleLine /> 依頼日</h3>
                <p>{task.requireDate}</p>
              </li>

              <li className="flex flex-col border-b border-neutral-300">
                <h3 className="w-28 whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm"><FaRegCheckCircle /> 完了日</h3>
                <p>{task.finishDate ? task.finishDate : "-"}</p>
              </li>

              <li className="flex flex-col border-b border-neutral-300">
                <h3 className="w-28 whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm"><BsPersonCheck /> 作業担当者</h3>
                <p>{task.manager}</p>
              </li>

              <li className="flex flex-col border-b border-neutral-300">
                <h3 className="w-28 whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm"><MdLaptopChromebook /> 作業状況</h3>
                <p>{task.status}</p>
              </li>

              <li className="flex flex-col col-span-2 border-b border-neutral-300">
                <h3 className="w-28 whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm"><LuNotebookPen /> 備考欄</h3>
                <p>{task.remarks ? task.remarks : "-"}</p>
              </li>

              <li className="flex flex-col col-span-2 border-b border-neutral-300 pb-1">
                <h3 className="w-28 whitespace-nowrap py-1 flex gap-1 items-center font-bold text-sm"><IoDocumentAttachOutline /> 関連ファイル</h3>
                <div className="flex gap-1">
                  {currentTaskFile.map(file => (
                    <div
                      key={file.storedName}
                      onClick={() => {
                        setSelectedFile(file);
                        setIsFileOpen(true);
                      }}
                      className="flex gap-1 items-center text-sm p-1 w-full rounded-md bg-neutral-300 truncate"
                    >
                      {
                        file.fileType === 'eml' ?
                          <>
                            <MdMailOutline className="w-5 h-5" /> {file.fileName}
                          </>
                          : // 'jpg' || 'jpeg' || 'png' || 'gif'
                          <>
                            <FaRegImage /> {file.fileName}
                          </>
                      }
                    </div>
                  ))}
                </div>
              </li>
            </ul>

            <div className="flex gap-4 justify-end col-span-2">
              <Button
                onClick={() => setIsOpen(false)}
                className="outline-1 -outline-offset-1 rounded px-4 py-2 text-sm"
              >
                閉じる
              </Button>
            </div>
          </DialogPanel>
        </div >
      </Dialog >

      <Dialog
        open={isFileOpen}
        onClose={() => {
          setIsFileOpen(false);
          setSelectedFile(null);
        }}
        transition
        className="relative z-50 transition duration-300 ease-out data-closed:opacity-0"
      >
        <DialogBackdrop className="fixed inset-0 bg-black/30" />

        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <DialogPanel className="relative w-10/12 max-w-[400px] space-y-4 rounded-2xl bg-neutral-100 p-8">
            <DialogTitle className="font-bold text-left col-span-2 flex gap-1 items-center pr-8">
              {selectedFile?.fileName}
            </DialogTitle>

            <GrClose
              onClick={() => {
                setIsFileOpen(false);
                setSelectedFile(null);
              }}
              className="absolute top-8 right-8 cursor-pointer"
            />
            <FileModal file={selectedFile ? selectedFile : currentTaskFile[0]}></FileModal>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  )
}