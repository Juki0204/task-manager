"use client";

import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";

import { useState } from "react";
import { Button } from "@headlessui/react";


import { Bold, Heading1, Heading2, Heading3, Image as ImageIcon, Italic, Lightbulb, Link, Link as LinkIcon, List, Mail as MailIcon, PenLine, SquareCheck } from "lucide-react";


export default function AddRuleEditor({ value, onChange }: { value: string, onChange: (value: string) => void }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: true },
      }),
      Markdown,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({
        placeholder: "備考を入力（MarkDown対応）",
      }),
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

  const [hintOpen, setHintOpen] = useState<boolean>(false);

  const [showTextColor, setShowTextColor] = useState<boolean>(false);
  const [showBgColor, setShowBgColor] = useState<boolean>(false);
  const [showLinkInput, setShowLinkInput] = useState<boolean>(false);
  const [linkUrl, setLinkUrl] = useState("");

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
      className="bg-neutral-100 dark:bg-[#313131] rounded-md p-2 pt-1.5 h-full"
    >
      <div className="flex justify-between mb-1 border-b border-neutral-300">
        <div className="flex flex-wrap gap-0.5 pb-1 items-center">
          <Button
            tabIndex={-1}
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`grid place-content-center w-7 h-7 rounded hover:bg-neutral-300 hover:dark:bg-neutral-800 ${editor.isActive("bold") ? "bg-neutral-300 dark:bg-neutral-800" : ""}`}
          >
            <Bold className="w-5" />
          </Button>

          <Button
            tabIndex={-1}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`grid place-content-center w-7 h-7 rounded hover:bg-neutral-300 hover:dark:bg-neutral-800 ${editor.isActive("italic") ? "bg-neutral-300 dark:bg-neutral-800" : ""}`}
          >
            <Italic className="w-5" />
          </Button>

          <Button
            tabIndex={-1}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`grid place-content-center w-7 h-7 rounded hover:bg-neutral-300 hover:dark:bg-neutral-800 ${editor.isActive("heading", { level: 1 }) ? "bg-neutral-300 dark:bg-neutral-800" : ""}`}
          >
            <Heading1 className="w-5" />
          </Button>

          <Button
            tabIndex={-1}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`grid place-content-center w-7 h-7 rounded hover:bg-neutral-300 hover:dark:bg-neutral-800 ${editor.isActive("heading", { level: 2 }) ? "bg-neutral-300 dark:bg-neutral-800" : ""}`}
          >
            <Heading2 className="w-5" />
          </Button>

          <Button
            tabIndex={-1}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`grid place-content-center w-7 h-7 rounded hover:bg-neutral-300 hover:dark:bg-neutral-800 ${editor.isActive("heading", { level: 3 }) ? "bg-neutral-300 dark:bg-neutral-800" : ""}`}
          >
            <Heading3 className="w-5" />
          </Button>

          <Button
            tabIndex={-1}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`grid place-content-center w-7 h-7 rounded hover:bg-neutral-300 hover:dark:bg-neutral-800 ${editor.isActive("bulletList") ? "bg-neutral-300 dark:bg-neutral-800" : ""}`}
          >
            <List className="w-5" />
          </Button>

          <Button
            tabIndex={-1}
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={`grid place-content-center w-7 h-7 rounded hover:bg-neutral-300 hover:dark:bg-neutral-800 ${editor.isActive("taskList") ? "bg-neutral-300 dark:bg-neutral-800" : ""}`}
          >
            <SquareCheck className="w-5" />
          </Button>

          <Button
            tabIndex={-1}
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={`grid place-content-center w-7 h-7 rounded hover:bg-neutral-300 hover:dark:bg-neutral-800 ${editor.isActive("highlight") ? "bg-neutral-300 dark:bg-neutral-800" : ""}`}
          >
            <PenLine className="w-5" />
          </Button>

          <div className="relative">
            <Button
              tabIndex={-1}
              onClick={() => {
                const current = editor.getAttributes("link").href;
                setLinkUrl(current || "");
                setShowLinkInput(!showLinkInput);
              }}
              className={`grid place-content-center w-7 h-7 rounded hover:bg-neutral-300 hover:dark:bg-neutral-800 ${editor.isActive("link") ? "bg-neutral-300 dark:bg-neutral-800" : ""}`}
            >
              <Link className="w-5" />
            </Button>
            {showLinkInput && (
              <div onClick={(e) => e.stopPropagation()} className="absolute right-1/2 translate-x-1/2 p-2 pt-1 bg-white dark:bg-neutral-800 rounded shadow-md mt-1 z-10 w-70">
                <h4 className="text-xs font-bold text-left mb-1">リンクを挿入</h4>
                <input
                  type="text"
                  value={linkUrl}
                  placeholder="https://example.com"
                  className="bg-neutral-200 dark:bg-neutral-900 p-1 mb-1 w-full rounded text-sm focus:outline"
                  onChange={(e) => setLinkUrl(e.target.value)}
                />

                <div className="flex justify-between text-sm">
                  <div className="flex gap-1 text-neutral-600 dark:text-neutral-300">
                    <button
                      onClick={() => setSelectedIcon("image")}
                      className={`p-1 rounded hover:bg-neutral-300 dark:hover:bg-neutral-900 ${selectedIcon === "image" ? "bg-neutral-300 dark:bg-neutral-900" : ""}`}
                    >
                      <ImageIcon className="w-5" />
                    </button>
                    <button
                      onClick={() => setSelectedIcon("link")}
                      className={`p-1 rounded hover:bg-neutral-300 dark:hover:bg-neutral-900 ${selectedIcon === "link" ? "bg-neutral-300 dark:bg-neutral-900" : ""}`}
                    >
                      <LinkIcon className="w-5" />
                    </button>
                    <button
                      onClick={() => setSelectedIcon("mail")}
                      className={`p-1 rounded hover:bg-neutral-300 dark:hover:bg-neutral-900 ${selectedIcon === "mail" ? "bg-neutral-300 dark:bg-neutral-900" : ""}`}
                    >
                      <MailIcon className="w-5" />
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
                      className="px-2 py-1 text-xs border rounded hover:bg-gray-100 dark:hover:bg-neutral-700"
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

        <div>
          <Button tabIndex={-1} onClick={() => setHintOpen(!hintOpen)} className={`grid place-content-center w-7 h-7 rounded hover:bg-neutral-300 hover:dark:bg-neutral-800 ${hintOpen ? "bg-neutral-300 dark:bg-neutral-800" : ""}`}>
            <Lightbulb className={`${hintOpen ? "text-amber-500 dark:text-amber-200" : "text-yellow-700 dark:text-yellow-500"} w-5`} />
          </Button>
        </div>
      </div>

      <EditorContent
        editor={editor}
        className={`tiptap-base tiptap-editor text-sm [&>div]:!max-h-[calc(100svh-196px)] [&>div]:overscroll-contain`}
      />

      <div className={`${hintOpen ? "opacity-100" : "opacity-0"} w-[calc(25%-14px)] absolute z-110 right-0 top-7 shadow-md bg-neutral-100 dark:bg-neutral-700 rounded-md p-4 whitespace-nowrap transition-all duration-300 pointer-events-none`}>
        <h3 className="pb-1 mb-1 text-center text-sm font-bold">使用可能な記法一覧</h3>
        <div className="grid grid-cols-2 text-sm font-bold text-center mb-1">
          <p>記法</p>
          <p>結果</p>
        </div>
        <dl className="grid grid-cols-2 text-sm items-center border border-neutral-300 leading-none">
          <dt className="border-b border-r border-neutral-300 px-1 py-2">**テキスト**</dt>
          <dd className="font-bold border-b border-neutral-300 px-1 py-2">太字</dd>

          <dt className="border-b border-r border-neutral-300 px-1 py-2">*テキスト*</dt>
          <dd className="italic border-b border-neutral-300 px-1 py-2">斜体</dd>

          <dt className="border-b border-r border-neutral-300 px-1 py-2 h-full flex items-center"># テキスト</dt>
          <dd className="font-bold text-xl border-b border-neutral-300 px-1 py-2">見出し1</dd>

          <dt className="border-b border-r border-neutral-300 px-1 py-2 h-full flex items-center">## テキスト</dt>
          <dd className="font-bold text-lg border-b border-neutral-300 px-1 py-2">見出し2</dd>

          <dt className="border-b border-r border-neutral-300 px-1 py-2 h-full flex items-center">### テキスト</dt>
          <dd className="font-bold text-md border-b border-neutral-300 px-1 py-2">見出し3</dd>

          <dt className="border-b border-r border-neutral-300 px-1 py-2 h-full flex items-center">- テキスト</dt>
          <dd className="flex flex-wrap items-center gap-2 border-b border-neutral-300 px-1 py-2">
            <div className="flex items-center gap-2 w-full pl-1"><span className="w-1.5 h-1.5 bg-black rounded-full"></span>リスト</div>
            <div className="flex items-center gap-2 w-full pl-1"><span className="w-1.5 h-1.5 bg-black rounded-full"></span>リスト</div>
            <div className="flex items-center gap-2 w-full pl-1"><span className="w-1.5 h-1.5 bg-black rounded-full"></span>リスト</div>
          </dd>

          <dt className="border-b border-r border-neutral-300 px-1 py-2 h-full flex items-center">[] テキスト</dt>
          <dd className="flex flex-wrap items-center gap-2 border-b border-neutral-300 px-1 py-2">
            <div className="flex items-center gap-2 w-full"><input type="checkbox" />リスト</div>
            <div className="flex items-center gap-2 w-full"><input type="checkbox" />リスト</div>
            <div className="flex items-center gap-2 w-full"><input type="checkbox" />リスト</div>
          </dd>

          <dt className="border-b border-r border-neutral-300 px-1 py-2">==テキスト==</dt>
          <dd className="border-b border-neutral-300 px-1 py-2"><span className="bg-[#ffff00]">ハイライト</span></dd>

          <dt className="border-b border-r border-neutral-300 px-1 py-2">~~テキスト~~</dt>
          <dd className="line-through border-b border-neutral-300 px-1 py-2">打ち消し</dd>

          <dt className="border-b border-r border-neutral-300 px-1 py-2 h-full flex items-center">`テキスト`</dt>
          <dd className="border-b border-neutral-300 px-1 py-2"><span className="inline-block p-1 rounded-md bg-neutral-700 text-white">インラインコード</span></dd>

          <dt className="border-b border-r border-neutral-300 px-1 py-2 h-full flex items-center">&gt; テキスト</dt>
          <dd className="border-b border-neutral-300 px-1 py-2"><span className="inline-block border-l-4 border-neutral-400 px-1 py-2">引用</span></dd>

          <dt className="border-r border-neutral-300 px-1 py-2">---</dt>
          <dd className="px-1 py-2 h-full flex items-center"><hr className="text-neutral-400 m-0 w-full" /></dd>
        </dl>
      </div>
    </div>
  )
}