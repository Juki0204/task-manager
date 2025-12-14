"use client";

import { useEffect, useState } from "react";
import { marked } from "marked";
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { ChevronDownIcon } from "lucide-react";

interface ReleaseNoteMeta {
  version: string;
  date: string;
}

interface ReleaseNoteData extends ReleaseNoteMeta {
  content?: string;
}

export default function ReleaseNotesPage() {
  const [notes, setNotes] = useState<ReleaseNoteData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadNotes = async () => {
      try {
        const res = await fetch("/release-notes/release-notes.json");
        const metaList: ReleaseNoteMeta[] = await res.json();

        const fullNotes = await Promise.all(
          metaList.map(async (meta) => {
            try {
              const mdRes = await fetch(`/release-notes/${meta.version}.md`);
              const text = await mdRes.text();
              return { ...meta, content: text };
            } catch {
              return { ...meta, content: "リリースノートを取得できませんでした。" };
            }
          })
        );

        setNotes(fullNotes);
      } catch (err) {
        console.error("リリースノート一覧の取得に失敗しました。", err);
      } finally {
        setLoading(false);
      }
    };

    loadNotes();
  }, []);

  if (loading) return <p className="text-white text-center tracking-widest">読み込み中...</p>

  return (
    <div className="p-1 py-4 sm:p-4 sm:pb-20 !pt-30 max-w-[1600px] relative overflow-x-auto [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-neutral-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-500">
      <div className="flex justify-between gap-4 mb-2 border-b-2 p-1 pb-2 border-neutral-700 min-w-375">
        <div className="flex justify-start items-end gap-4">
          <h2 className="flex justify-center items-center gap-1 py-1 text-white text-xl font-bold text-center">
            アプリ更新履歴一覧
          </h2>
        </div>

        {/* <div className="flex gap-2">
          <AddTaskBtn onClick={() => { setIsOpen(true); setModalType("add"); }} />
        </div> */}
      </div>

      <div className="space-y-4">
        {notes.map((note, index) => (
          <Disclosure key={note.version}>
            {({ open }) => (
              <div className="px-5">
                <DisclosureButton className="flex w-fit gap-4 items-center justify-between p-2 text-left border-b-2 border-white">
                  <hgroup className="flex gap-4 items-center justify-between w-100">
                    <h3 className="flex gap-2 items-center font-bold text-lg text-white tracking-widest">
                      リリースノート {note.version.replaceAll("_", ".")} {index === 0 ? <span className="text-xs py-0.5 px-2 rounded-md bg-red-800">最新版</span> : ""}
                    </h3>
                    <p className="text-gray-200">{note.date}</p>
                  </hgroup>
                  <ChevronDownIcon className={`h-5 w-5 text-white transition-transform ${open ? "rotate-180" : ""}`} />
                </DisclosureButton>
                <DisclosurePanel className="p-2 text-white">
                  <div
                    className="release-note prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: marked(note.content ?? ""),
                    }}
                  />
                </DisclosurePanel>
              </div>
            )}
          </Disclosure>
        ))}
      </div>
    </div>
  );
}
