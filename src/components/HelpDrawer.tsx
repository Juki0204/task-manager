"use client";

import { useEffect, useState } from "react";
import { FaRegLightbulb } from "react-icons/fa6";
import { IoMdHelpCircle } from "react-icons/io";



export default function HelpDrawer() {
  // const [notes, setNotes] = useState();
  // const [loading, setLoading] = useState<boolean>(true);

  // useEffect(() => {
  //   const loadNotes = async () => {
  //     try {
  //       const res = await fetch("/release-notes/release-notes.json");
  //       const metaList = await res.json();

  //       const fullNotes = await Promise.all(
  //         metaList.map(async (meta) => {
  //           try {
  //             const mdRes = await fetch(`/release-notes/${meta.version}.md`);
  //             const text = await mdRes.text();
  //             return { ...meta, content: text };
  //           } catch {
  //             return { ...meta, content: "リリースノートを取得できませんでした。" };
  //           }
  //         })
  //       );

  //       setNotes(fullNotes);
  //     } catch (err) {
  //       console.error("リリースノート一覧の取得に失敗しました。", err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   loadNotes();
  // }, []);

  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  return (
    <>
      <div onClick={() => setIsDrawerOpen(true)} className="grid place-content-center w-6 h-6">
        <IoMdHelpCircle className="text-xl text-neutral-200" />
      </div>
      <div className="w-100 h-[calc(100svh-6.5rem)] p-2 bg-neutral-700 shadow-2xl shadow-black fixed top-26 right-0 z-40">
        
      </div>
    </>
  )
}