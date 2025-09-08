import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { simpleParser } from "mailparser";
import type { AddressObject } from "mailparser";
import { supabase } from "@/utils/supabase/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get('path');
  if (!path) {
    return NextResponse.json({ error: "Missing path" }, { status: 400 });
  }

  const { data, error } = await supabase.storage
    .from('shared-files')
    .download(path);

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Download failed" }, { status: 500 });
  }

  const buffer = Buffer.from(await data.arrayBuffer());

  const parsed = await simpleParser(buffer);

  function formatAddress(addr: AddressObject | AddressObject[] | undefined | null): string {
    if (!addr) return "";
    if (Array.isArray(addr)) {
      return addr.map(a => a.text).join(", ");
    }
    return addr.text;
  }

  function addTargetBlank(html: string): string {
    return html.replace(
      /<a\s+(?![^>]*\btarget=)([^>]*href=['"][^'"]+['"][^>]*)>/gi,
      '<a $1 target="_blank" rel="noopener noreferrer">'
    );
  }

  return NextResponse.json({
    subject: parsed.subject || "",
    from: parsed.from?.text || "",
    to: formatAddress(parsed.to),
    date: parsed.date || "",
    text: parsed.text || "",
    html: addTargetBlank(parsed.html || parsed.textAsHtml || ""),
  });
}