
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import { TextStyleKit } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";

export function tiptapMarkdownToHtml(markdown: string) {
  const editor = new Editor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Markdown,
      TaskList,
      TaskItem.configure({ nested: true }),
      Link,
      TextStyleKit,
      Color.configure({ types: ["textStyle"] }),
      Highlight.configure({ multicolor: true }),
    ],
    content: markdown ?? "",
    contentType: "markdown",
  });

  return editor.getHTML();
}
