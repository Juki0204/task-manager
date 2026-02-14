import { NextResponse } from "next/server";
import { formatMailmanBodyToHtml } from "@/utils/function/mailFormat";

export const runtime = "nodejs";

type Obj = Record<string, unknown>;

function isObj(x: unknown): x is Obj {
  return typeof x === "object" && x !== null;
}

function hasDataBody(x: unknown): x is Obj & { data: Obj & { body: string } } {
  if (!isObj(x)) return false;
  const d = x["data"];
  return isObj(d) && typeof d["body"] === "string";
}

function basicAuthHeader(user: string, pass: string): string {
  const token = Buffer.from(`${user}:${pass}`, "utf8").toString("base64");
  return `Basic ${token}`;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get("domain") ?? "www.client.com";
    const prefixNo = searchParams.get("prefixNo") ?? "9123";

    const API_BASE = process.env.ML_JSON_API_BASE_URL;
    const API_USER = process.env.ML_JSON_API_USER;
    const API_PASS = process.env.ML_JSON_API_PASS;

    if (!API_BASE || !API_USER || !API_PASS) {
      return NextResponse.json({ error: "Server env not set" }, { status: 500 });
    }

    const upstreamUrl = `${API_BASE}/${encodeURIComponent(domain)}/${encodeURIComponent(prefixNo)}`;

    const res = await fetch(upstreamUrl, {
      headers: {
        Authorization: basicAuthHeader(API_USER, API_PASS),
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const contentType = res.headers.get("content-type") ?? "";
    const rawText = await res.text();

    if (!res.ok) {
      return NextResponse.json(
        {
          error: "Upstream request failed",
          upstreamStatus: res.status,
          upstreamStatusText: res.statusText,
          upstreamContentType: contentType,
          upstreamBodyHead: rawText.slice(0, 300),
        },
        { status: 502 }
      );
    }

    let upstreamJson: unknown;
    try {
      upstreamJson = JSON.parse(rawText) as unknown;
    } catch {
      return NextResponse.json(
        {
          error: "Upstream returned non-JSON",
          upstreamContentType: contentType,
          upstreamBodyHead: rawText.slice(0, 300),
        },
        { status: 502 }
      );
    }

    if (!hasDataBody(upstreamJson)) {
      return NextResponse.json(
        {
          error: "Upstream JSON shape mismatch (expected data.body:string)",
          topLevelKeys: isObj(upstreamJson) ? Object.keys(upstreamJson) : null,
          dataKeys: isObj(upstreamJson) && isObj(upstreamJson["data"]) ? Object.keys(upstreamJson["data"]) : null,
        },
        { status: 502 }
      );
    }

    const bodyRaw =
      typeof upstreamJson.data.body === "string"
        ? upstreamJson.data.body
        : "";
    const bodyHtml = formatMailmanBodyToHtml(bodyRaw);

    const replaced = {
      ...upstreamJson,
      data: {
        ...upstreamJson.data,
        body: bodyHtml,
      },
    };

    return NextResponse.json(replaced);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
