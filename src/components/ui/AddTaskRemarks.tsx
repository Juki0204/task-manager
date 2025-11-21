"use client";

import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import { TextStyleKit } from '@tiptap/extension-text-style';
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";

import { useState } from "react";
import { Button } from "@headlessui/react";
import { FaListUl, FaBold, FaItalic, FaLink } from "react-icons/fa6";
import { FaCheckSquare } from "react-icons/fa";
import { LuHeading1, LuHeading2, LuHeading3 } from "react-icons/lu";
import { MdBorderColor } from "react-icons/md";


import { Image as ImageIcon, Link as LinkIcon, Mail as MailIcon } from "lucide-react";


export default function AddTaskRemarks({ value, onChange }: { value: string, onChange: (value: string) => void }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Markdown,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({
        placeholder: "備考を入力（MarkDown対応）",
      }),
      Link.configure({ openOnClick: true }),
      TextStyleKit,
      Color.configure({ types: ["textStyle"] }),
      Highlight.configure({ multicolor: true }),
    ],
    content: value || "",
    contentType: "markdown",
    onUpdate: ({ editor }) => {
      const md = editor.getMarkdown();
      onChange(md);
    },
    onSelectionUpdate: () => {
      // カーソル位置や選択範囲が変わるたびに再レンダリング
      setSelectionVersion((v) => v + 1);
    },
  });

  const [showTextColor, setShowTextColor] = useState<boolean>(false);
  const [showBgColor, setShowBgColor] = useState<boolean>(false);
  const [showLinkInput, setShowLinkInput] = useState<boolean>(false);
  const [linkUrl, setLinkUrl] = useState("");

  const colors = [
    "#000000",
    "#e11d48",
    "#2563eb",
    "#16a34a",
    "#f59e0b",
    "#6366f1",
    "#d946ef",
  ];

  const [selectedIcon, setSelectedIcon] = useState<"image" | "link" | "mail" | null>(null);

  const iconMap = {
    image: "🖼️ ",
    link: "🔗 ",
    mail: "✉️ ",
  } as const;

  const [selectionVersion, setSelectionVersion] = useState(0); //カーソル移動で再レンダリングする用

  if (!editor) return null;

  return (
    <div onClick={() => {
      if (showTextColor) setShowTextColor(false);
      if (showBgColor) setShowBgColor(false);
      if (showLinkInput) setShowLinkInput(false);
      setSelectedIcon(null);
    }}
      className="bg-neutral-200 rounded-md p-2 pt-1.5"
    >
      <div className="flex flex-wrap gap-0.5 mb-1 pb-1 items-center border-b border-neutral-300">
        <Button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`grid place-content-center w-7 h-7 rounded hover:bg-neutral-300 ${editor.isActive("bold") ? "bg-neutral-300" : ""}`}
        >
          <FaBold className="text-sm" />
        </Button>

        <Button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`grid place-content-center w-7 h-7 rounded hover:bg-neutral-300 ${editor.isActive("italic") ? "bg-neutral-300" : ""}`}
        >
          <FaItalic className="text-sm" />
        </Button>

        <Button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`grid place-content-center w-7 h-7 rounded hover:bg-neutral-300 ${editor.isActive("heading", { level: 1 }) ? "bg-neutral-300" : ""}`}
        >
          <LuHeading1 className="text-xl" />
        </Button>

        <Button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`grid place-content-center w-7 h-7 rounded hover:bg-neutral-300 ${editor.isActive("heading", { level: 2 }) ? "bg-neutral-300" : ""}`}
        >
          <LuHeading2 className="text-xl" />
        </Button>

        <Button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`grid place-content-center w-7 h-7 rounded hover:bg-neutral-300 ${editor.isActive("heading", { level: 3 }) ? "bg-neutral-300" : ""}`}
        >
          <LuHeading3 className="text-xl" />
        </Button>

        <Button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`grid place-content-center w-7 h-7 rounded hover:bg-neutral-300 ${editor.isActive("bulletList") ? "bg-neutral-300" : ""}`}
        >
          <FaListUl />
        </Button>

        <Button
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={`grid place-content-center w-7 h-7 rounded hover:bg-neutral-300 ${editor.isActive("taskList") ? "bg-neutral-300" : ""}`}
        >
          <FaCheckSquare />
        </Button>

        <Button
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={`grid place-content-center w-7 h-7 rounded hover:bg-neutral-300 ${editor.isActive("highlight") ? "bg-neutral-300" : ""}`}
        >
          <MdBorderColor />
        </Button>

        <div className="relative">
          <Button
            onClick={() => {
              const current = editor.getAttributes("link").href;
              setLinkUrl(current || "");
              setShowLinkInput(!showLinkInput);
            }}
            className={`grid place-content-center w-7 h-7 rounded hover:bg-neutral-300 ${editor.isActive("link") ? "bg-neutral-300" : ""}`}
          >
            <FaLink />
          </Button>
          {showLinkInput && (
            <div onClick={(e) => e.stopPropagation()} className="absolute right-1/2 translate-x-1/2 p-2 pt-1 bg-white rounded shadow-md mt-1 z-10 w-70">
              <label className="text-xs font-bold">リンクを挿入</label>
              <input
                type="text"
                value={linkUrl}
                placeholder="https://example.com"
                className="bg-neutral-200 p-1 mb-1 w-full rounded text-sm focus:outline"
                onChange={(e) => setLinkUrl(e.target.value)}
              />

              <div className="flex justify-between text-sm">
                <div className="flex gap-1 text-neutral-600">
                  <button
                    onClick={() => setSelectedIcon("image")}
                    className={`p-1 rounded hover:bg-neutral-300 ${selectedIcon === "image" ? "bg-neutral-300" : ""}`}
                  >
                    <ImageIcon size={16} />
                  </button>
                  <button
                    onClick={() => setSelectedIcon("link")}
                    className={`p-1 rounded hover:bg-neutral-300 ${selectedIcon === "link" ? "bg-neutral-300" : ""}`}
                  >
                    <LinkIcon size={16} />
                  </button>
                  <button
                    onClick={() => setSelectedIcon("mail")}
                    className={`p-1 rounded hover:bg-neutral-300 ${selectedIcon === "mail" ? "bg-neutral-300" : ""}`}
                  >
                    <MailIcon size={16} />
                  </button>
                </div>

                <div className="flex gap-1">
                  {editor.getAttributes("link").href && (
                    <button
                      onClick={() => {
                        editor.chain().focus().unsetLink().run();
                        setShowLinkInput(false);
                        setLinkUrl("");
                      }}
                      className="bg-red-700 px-2 py-1 rounded-md text-white text-xs cursor-pointer hover:opacity-60"
                    >
                      削除
                    </button>
                  )}

                  <Button
                    onClick={() => {
                      setShowLinkInput(false);
                      setLinkUrl("");
                      setSelectedIcon(null);
                    }}
                    className="px-2 py-1 text-xs border rounded hover:bg-gray-100"
                  >
                    キャンセル
                  </Button>

                  <button
                    onClick={() => {
                      if (linkUrl) {
                        const { from, to } = editor.state.selection;
                        const icon = selectedIcon ? iconMap[selectedIcon] : "";

                        editor.chain().focus().insertContentAt(from, icon).setTextSelection({ from, to: to + icon.length }).setLink({ href: linkUrl }).run();
                      }
                      setShowLinkInput(false);
                      setSelectedIcon(null);
                      setLinkUrl("");
                    }}
                    className="bg-sky-700 text-white w-fit px-2 py-1 rounded text-xs hover:opacity-60"
                  >
                    適用
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <EditorContent
        editor={editor}
        className={`min-h-[200px] w-full cursor-text focus:outline-none prose prose-sm max-w-none [&_*]:min-h-[1.5rem] [&>div]:min-h-[200px] [&>div]:focus:outline-none [&>div]:p-0.5
          [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:has-[li[data-checked]]:pl-0
          [&_li[data-checked]]:list-none [&_li[data-checked]]:flex [&_li[data-checked]]:items-start [&_li[data-checked]]:gap-2 [&_li[data-checked]>label]:flex [&_li[data-checked]>label]:items-start [&_li[data-checked]>div]:flex-1
          [&_li[data-checked='true']>div]:line-through [&_li[data-checked='true']>div]:text-gray-400
          [&_a]:text-blue-600 [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:cursor-pointer
          [&_h1]:text-3xl [&_h2]:text-2xl [&_h3]:text-xl`} />
    </div>
  )
}