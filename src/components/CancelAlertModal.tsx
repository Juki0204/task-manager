import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { useEffect, useState } from "react";
import { IoWarningOutline } from "react-icons/io5";

interface CancelAlertModalProps {
  alertOpen: boolean;
  onModalClose: () => void;
  onCalcel: () => void;
}

export default function CancelAlertModal({ alertOpen, onModalClose, onCalcel }: CancelAlertModalProps) {
  const [isAlertOpen, setIsAlertOpen] = useState<boolean>(alertOpen);

  useEffect(() => {
    setIsAlertOpen(alertOpen);
  }, [alertOpen]);

  return (
    <Dialog
      open={isAlertOpen}
      onClose={() => setIsAlertOpen(false)}
      className="relative z-50 transition duration-300 ease-out data-closed:opacity-0"
    >
      <DialogBackdrop className="fixed inset-0 bg-black/30" />

      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="w-fit relative rounded-2xl bg-neutral-100 p-4 pb-6">

          <div className="relative w-full flex flex-wrap justify-center items-center gap-2 rounded-lg bg-yellow-300/60 py-2 px-6">
            <IoWarningOutline />
            <p>CAUTION</p>
            <IoWarningOutline />
          </div>
          <p className="text-center p-4">
            保存されていない変更は破棄されます<br />
            このまま閉じてもよろしいですか？
          </p>
          <div className="flex justify-center gap-2">
            <button onClick={() => { onModalClose(); onCalcel(); }} className="py-2 px-6 rounded-md bg-sky-600 text-neutral-100">閉じる</button>
            <button onClick={() => onCalcel()} className="py-2 px-6 rounded-md bg-neutral-500 text-neutral-100">キャンセル</button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}