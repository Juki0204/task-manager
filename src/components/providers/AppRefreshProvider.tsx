"use client";

import { useEffect, useRef, useState } from "react";

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";

import { CorrectBtn } from "@/components/ui/Btn";
import { Repeat } from "lucide-react";

const REFRESH_THRESHOLD = 30 * 60 * 1000; //30分

const DEBUG_SHOW_MODAL = false; //デバッグ用

export default function AppRefreshProvider({ children }: { children: React.ReactNode }) {
  const [showRefreshModal, setShowRefreshModal] = useState(false);

  const hiddenAtRef = useRef<number | null>(null);

  //開発時のモーダル表示確認用
  useEffect(() => {
    if (DEBUG_SHOW_MODAL) {
      setShowRefreshModal(true);
    }
  }, []);

  //タブが非アクティブになった時間を記録し、
  //30分以上経過してから復帰した場合はリロードを促す
  useEffect(() => {
    const handleInactive = () => {
      hiddenAtRef.current = Date.now();
    }

    const handleActive = () => {
      if (hiddenAtRef.current === null) return;

      const elapsed = Date.now() - hiddenAtRef.current;

      hiddenAtRef.current = null;

      if (elapsed >= REFRESH_THRESHOLD) {
        setShowRefreshModal(true);
      }
    };

    window.addEventListener("blur", handleInactive);
    window.addEventListener("focus", handleActive);

    return () => {
      window.removeEventListener("blur", handleInactive);
      window.removeEventListener("focus", handleActive);
    };
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <>
      {children}

      <Dialog open={showRefreshModal} onClose={() => { }} className="fixed inset-0 z-150 flex items-center justify-center">
        <DialogBackdrop className="fixed inset-0 bg-black/30 dark:bg-black/70" aria-hidden="true" />

        <DialogPanel className="relative w-9/10 max-w-140 bg-white/90 dark:bg-neutral-700/90 p-8 shadow-xl">
          <DialogTitle className="text-lg font-bold text-center tracking-wider mb-3">
            最新の状態に更新してください
          </DialogTitle>

          <p className="text-sm text-center tracking-wider mb-6">
            長時間操作がなかったため、最新の情報を取得するためにページを更新してください。
          </p>

          <div className="flex justify-center">
            <CorrectBtn className="flex gap-1 justify-center font-bold cursor-pointer hover:opacity-70" onClick={handleRefresh}>
              <Repeat />ページを更新
            </CorrectBtn>
          </div>
        </DialogPanel>
      </Dialog>
    </>
  );
}