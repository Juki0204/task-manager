import Encoding from "encoding-japanese";

const NEXT_PART_MARK = "-------------- next part --------------";

//Mailmanの添付フッター開始位置で本文と分割
export function splitBodyAndFooter(input: string): { main: string; footer: string } {
  const idx = input.indexOf(NEXT_PART_MARK);
  if (idx === -1) return { main: input, footer: "" };
  return {
    main: input.slice(0, idx),
    footer: input.slice(idx),
  };
}

function decodeJisBytesLike(s: string): string {
  const bytes = Uint8Array.from(s, (c) => c.charCodeAt(0) & 0xff);
  const unicode = Encoding.convert(bytes, { from: "JIS", to: "UNICODE", type: "array" }) as number[];
  return Encoding.codeToString(unicode);
}

function decodeBareJisAfterLt(text: string): string {
  return text.replace(
    /<([!-~]{8,}?\$[!-~]{8,}?)(?=\s|$)/g, // "$" を含む長い塊だけ対象（誤爆しにくい）
    (m, payload: string) => {
      try {
        // ISO-2022-JPのJIS領域として解釈させるため、ESC$B ... ESC(B で包む
        const wrapped = `\u001b$B${payload}\u001b(B`;
        // wrapped は「latin1相当のバイト列」として扱えるので、そのまま変換へ
        // encoding-japanese は ESC 付きの JIS も処理できるので convert でOK
        const decoded = decodeJisBytesLike(wrapped);
        // 変換できたっぽい時だけ採用（全然変わらないなら元のまま）
        return decoded && decoded !== wrapped ? decoded : m;
      } catch {
        return m;
      }
    }
  );
}

function decodeEncodedWordIso2022JpB(input: string): string {
  return input.replace(/=\?iso-2022-jp\?B\?([^?]+)\?=/gi, (m, b64: string) => {
    try {
      const buf = Buffer.from(b64, "base64");
      const bytes = Uint8Array.from(buf);
      const unicode = Encoding.convert(bytes, { from: "JIS", to: "UNICODE", type: "array" }) as number[];
      return Encoding.codeToString(unicode);
    } catch {
      return m;
    }
  });
}

function decodeIso2022JpBlock(block: string): string {
  //JS文字列を「0-255 のバイト列」として扱う（latin1）
  const bytes = Uint8Array.from(block, (c) => c.charCodeAt(0) & 0xff);

  //JIS(= ISO-2022-JP) → UNICODE
  const unicodeCodes = Encoding.convert(bytes, {
    from: "JIS",
    to: "UNICODE",
    type: "array",
  }) as number[];

  return Encoding.codeToString(unicodeCodes);
}

export function decodeIso2022JpEscBlocks(input: string): string {
  const ESC = "\u001b";
  let out = "";
  let i = 0;

  while (i < input.length) {
    const start = input.indexOf(ESC, i);
    if (start === -1) {
      out += input.slice(i);
      break;
    }

    out += input.slice(i, start);

    //次の ESC(B までを塊として扱う（よくある終端）
    const end = input.indexOf("\u001b(B", start);
    const blockEnd = end !== -1 ? end + 3 : input.length;

    const block = input.slice(start, blockEnd);
    out += decodeIso2022JpBlock(block);

    i = blockEnd;
  }

  return out;
}


function stripStrayNumberBeforeLt(text: string): string {
  return text.replace(/、\s*\d+(?=<)/g, "、");
}

function stripListinfoUrls(text: string): string {
  //URLは「空白 or < or > or " or '」で区切られる前提で止める
  const url = /https?:\/\/[^\s<>"']*\/mailman\/listinfo\/[^\s<>"']*/gi;
  return text.replace(url, "");
}

function stripStrayNumberAfterComma(text: string): string {
  // "関して、2 添付" みたいなやつだけを "関して、 添付" にする
  return text.replace(/、\s*\d+\s+(?=\S)/g, "、 ");
}

//Mailmanが挿入した <A HREF="...">...</A> を URL文字列に置換
export function replaceMailmanAnchorsToUrl(text: string): string {
  //壊れた形: A HREF="...">...</A>
  const broken = text.replace(
    /A\s+HREF\s*=\s*"((?:https?:\/\/)[^"]+)"\s*>\s*.*?<\/A>/gi,
    "$1"
  );

  //正常なHTML: <a href="...">...</a>
  return broken.replace(
    /<a\s+[^>]*href\s*=\s*"((?:https?:\/\/)[^"]+)"[^>]*>.*?<\/a>/gi,
    "$1"
  );
}

function decodeNumericEntities(input: string): string {
  return input.replace(/&#(x?[0-9a-fA-F]+);/g, (_, code: string) => {
    const cp = code.startsWith("x") || code.startsWith("X")
      ? Number.parseInt(code.slice(1), 16)
      : Number.parseInt(code, 10);

    if (!Number.isFinite(cp)) return _;

    if (cp < 0 || cp > 0x10ffff) return _;
    try {
      return String.fromCodePoint(cp);
    } catch {
      return _;
    }
  });
}

function decodeEncodedWordUtf8(input: string): string {
  return input.replace(/=\?utf-8\?B\?([^?]+)\?=/gi, (m, b64: string) => {
    try {
      return Buffer.from(b64, "base64").toString("utf8");
    } catch {
      return m;
    }
  });
}

//プレーンテキストを安全にHTMLへ（エスケープ→リンク化→改行）
export function textToHtml(text: string | undefined | null): string {
  if (!text) return "";

  const normalized = decodeNumericEntities(text);

  const escaped = normalized
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

  const linkified = escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
  );

  return linkified.replaceAll("\n", "<br>");
}

function normalizeAngleUrl(text: string): string {
  //"URL: <http://... " の < を消す
  return text.replace(/URL:\s*<\s*(https?:\/\/\S+)/g, "URL: $1");
}

//最終変換
export function formatMailmanBodyToHtml(rawBody: string): string {
  const wordsDecoded = decodeEncodedWordUtf8(decodeEncodedWordIso2022JpB(rawBody));

  const jisDecoded = wordsDecoded.includes("\u001b")
    ? decodeIso2022JpEscBlocks(wordsDecoded)
    : wordsDecoded;

  const { main, footer } = splitBodyAndFooter(jisDecoded);

  let mainText = main;

  mainText = replaceMailmanAnchorsToUrl(mainText);
  mainText = stripListinfoUrls(mainText);
  mainText = stripStrayNumberBeforeLt(mainText);
  mainText = decodeBareJisAfterLt(mainText);

  const footerAnchors = replaceMailmanAnchorsToUrl(footer);

  const normalizedFooter = normalizeAngleUrl(footerAnchors);

  // return textToHtml(mainNorm + footerNorm);
  return textToHtml(mainText + normalizedFooter);
}