"use client";

import { useEffect, useState } from "react";
import { marked } from "marked";
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { ChevronDownIcon } from "lucide-react";
import { PageLayout } from "../PageLayout";

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
    <PageLayout title="アプリ更新履歴一覧">

      <div className="space-y-4">
        {notes.map((note, index) => (
          <Disclosure key={note.version}>
            {({ open }) => (
              <div className="px-5">
                <DisclosureButton className="flex w-fit gap-4 items-center justify-between p-2 text-left border-b-2 border-neutral-700 dark:border-neutral-100">
                  <hgroup className="flex gap-4 items-center justify-between w-100">
                    <h3 className="flex gap-2 items-center font-bold text-lg text-neutral-700 dark:text-neutral-100 tracking-widest">
                      リリースノート {note.version.replaceAll("_", ".")} {index === 0 ? <span className="text-xs py-0.5 px-2 rounded-md text-white bg-red-800">最新版</span> : ""}
                    </h3>
                    <p className="text-neutral-700 dark:text-neutral-100">{note.date}</p>
                  </hgroup>
                  <ChevronDownIcon className={`h-5 w-5 text-neutral-700 dark:text-neutral-100 transition-transform ${open ? "rotate-180" : ""}`} />
                </DisclosureButton>
                <DisclosurePanel className="p-2 text-neutral-700 dark:text-neutral-100">
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
    </PageLayout>
  );
}
