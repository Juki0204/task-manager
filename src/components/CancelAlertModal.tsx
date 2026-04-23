import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { useState } from "react";
import { IoWarningOutline } from "react-icons/io5";

interface CancelAlertModalProps {
  alertOpen: boolean;
  onModalClose: () => void;
}

export default function CancelAlertModal({ alertOpen, onModalClose }: CancelAlertModalProps) {
  const [isAlertOpen, setIsAlertOpen] = useState<boolean>(alertOpen);

  return (
    <Dialog
      open={isAlertOpen}
      onClose={() => setIsAlertOpen(false)}
      className="relative z-50 transition duration-300 ease-out data-closed:opacity-0"
    >
      <DialogBackdrop className="fixed inset-0 bg-black/30" />

      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="w-130 relative rounded-2xl bg-neutral-100 p-6 pt-8">

          <div className="relative w-full flex flex-wrap justify-between items-center gap-2 rounded-xl bg-slate-300/70 p-3 mb-1">
            <IoWarningOutline />
            <p>保存されていない変更は破棄されます</p>
            <IoWarningOutline />
          </div>
          <p>変更を破棄して閉じますか？</p>
          <div className="flex justify-center gap-2">
            <button onClick={() => onModalClose()} className="py-1 px-4 bg-blue-500 text-neutral-100">閉じる</button>
            <button className="py-1 px-4 bg-neutral-500 text-neutral-100">キャンセル</button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}