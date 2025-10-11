"use client";

import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/supabase";
import { marked } from "marked";
import { Dialog, DialogPanel, DialogTitle, DialogBackdrop } from "@headlessui/react";
import { CorrectBtn } from "@/components/ui/Btn";
import { usePathname, useRouter } from "next/navigation";

const CURRENT_APP_VERSION = "v1_0_0"; //アップデートの度に手動で更新＋mdファイル作成

export default function VersionCheckProvider({ children }: { children: React.ReactNode }) {
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);
  const [releaseNote, setReleaseNote] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const excludedPaths = [
    '/login',
    '/reset/send-mail',
    '/reset/reset-path',
    '/signup',
    '/signup/confirm-mail'
  ];

  const checkVersion = useCallback(() => {
    if (excludedPaths.includes(pathname)) return;

    const lastVersion = localStorage.getItem("lastVersion");
    const pendingVersion = localStorage.getItem("pendingVersion");

    // 再ログイン後 ⇒ pendingVersion がある場合リリースノート表示
    if (pendingVersion === CURRENT_APP_VERSION) {
      fetch(`/release-notes/${CURRENT_APP_VERSION}.md`)
        .then((res) => res.text())
        .then((text) => {
          setReleaseNote(text);
        })
        .catch(() =>
          setReleaseNote("リリースノートの読み込みに失敗しました。")
        );
    }

    // 初回利用時
    if (!lastVersion) {
      localStorage.setItem("lastVersion", CURRENT_APP_VERSION);
      return;
    }

    // バージョン変更時 ⇒ 再ログインモーダル表示
    if (lastVersion !== CURRENT_APP_VERSION) {
      setShowUpdateModal(true);
    }
  }, [pathname]);

  //再ログイン
  const handleReLogin = async () => {
    try {
      localStorage.setItem('pendingVersion', CURRENT_APP_VERSION);
      localStorage.setItem("lastVersion", CURRENT_APP_VERSION);
      await supabase.auth.signOut();
      router.push('/login');
      setShowUpdateModal(false);
    } catch (error) {
      alert("ログアウトに失敗しました");
      console.error("ログアウト失敗", error);
    }
  }

  const handleCloseReleaseNote = () => {
    setReleaseNote(null);
    localStorage.setItem("lastVersion", CURRENT_APP_VERSION);
    localStorage.removeItem("pendingVersion");
  }

  // 初回 + ページ遷移時に実行
  useEffect(() => {
    checkVersion();
  }, [checkVersion, pathname]);

  return (
    <>
      {children}

      {/* バージョンアップ通知モーダル */}
      <Dialog
        open={showUpdateModal}
        onClose={() => { }}
        className="fixed inset-0 z-50 flex items-center justify-center"
      >
        <DialogBackdrop className="fixed inset-0 bg-black/60" aria-hidden="true" />
        <DialogPanel className="relative w-80 rounded-2xl bg-white p-6 shadow-xl">
          <DialogTitle className="text-lg font-bold text-center mb-3">アプリが更新されました</DialogTitle>
          <p className="text-sm text-gray-600 text-center mb-6">
            続行するには再度ログインしてください。
          </p>
          <div className="flex justify-center">
            <CorrectBtn className="cursor-pointer hover:opacity-70" onClick={handleReLogin}>再ログインする</CorrectBtn>
          </div>
        </DialogPanel>
      </Dialog>

      {/* リリースノートモーダル */}
      <Dialog
        open={!!releaseNote}
        onClose={() => setReleaseNote(null)}
        className="fixed inset-0 z-50 flex items-center justify-center"
      >
        <DialogBackdrop className="fixed inset-0 bg-black/60" aria-hidden="true" />
        <DialogPanel className="relative w-150 rounded-2xl bg-white p-6 shadow-xl">
          <DialogTitle className="text-lg font-bold text-center mb-3">リリースノート {CURRENT_APP_VERSION.replaceAll("_", ".")}</DialogTitle>
          <div className="md-textarea" dangerouslySetInnerHTML={{ __html: marked(releaseNote ?? "") }} />
          <p onClick={() => router.push('/release-notes')} className="text-sky-700 text-sm w-fit ml-auto mr-0 mb-4 cursor-pointer hover:opacity-70">過去の更新履歴を見る</p>
          <div className="flex justify-center">
            <CorrectBtn onClick={() => handleCloseReleaseNote()} className="!m-0 !w-40 cursor-pointer hover:opacity-70">閉じる</CorrectBtn>
          </div>
        </DialogPanel>
      </Dialog>
    </>
  )
}