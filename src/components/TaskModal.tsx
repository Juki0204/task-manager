import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { useState } from "react";
import AddTask from "./AddTask";
import TaskDetail from "./TaskDetail";
import { Task } from "@/utils/types/task";


interface TaskModalProps {
  activeTask: Task;
  modalType: "add" | "detail" | "edit";
  isOpen: boolean;
  onModalReset: () => void;
}


export default function TaskModal({ isOpen, activeTask, modalType, onModalReset }: TaskModalProps) {

  return (
    <Dialog open={isOpen} onClose={() => onModalReset} transition className="relative z-50 transition duration-300 ease-out data-closed:opacity-0">
      <DialogBackdrop className="fixed inset-0 bg-black/30" />

      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="relative min-w-sm max-w-xl space-y-4 rounded-2xl bg-neutral-100 p-8 pr-6">
          {modalType === "add" && <AddTask onClose={() => onModalReset} />}
          {modalType === "detail" && activeTask && (
            <TaskDetail
              task={activeTask}
              onClose={() => onModalReset}
              onEdit={() => setModalType("edit")}
            />
          )}
        </DialogPanel>
      </div>
    </Dialog>
  )
}