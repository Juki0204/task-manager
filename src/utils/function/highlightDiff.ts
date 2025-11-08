import { DIFF_DELETE, DIFF_INSERT } from "diff-match-patch";
import { DiffMatchPatch } from "diff-match-patch-typescript";


export function highlightDiff(oldText: string, newText: string): string {
  const dmp = new DiffMatchPatch();
  const diffs = dmp.diff_main(oldText || "", newText || "");
  dmp.diff_cleanupSemantic(diffs);

  return diffs
    .map(([type, text]) => {
      if (type === DIFF_INSERT) {
        return `<ins style="background:#21c0ff69;">${escapeHtml(text)}</ins>`;
      }
      if (type === DIFF_DELETE) {
        return `<del style="background:#ff2b2b33;">${escapeHtml(text)}</del>`;
      }
      return escapeHtml(text);
    })
    .join("");
}

function escapeHtml(str: string) {
  return str.replace(/[&<>"']/g, (tag) => {
    const chars: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return chars[tag] || tag;
  })
}