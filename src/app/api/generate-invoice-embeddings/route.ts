import { GoogleGenAI } from "@google/genai";
import { supabase } from "@/utils/supabase/supabase";
import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("APIクライアントの初期化に失敗しました。GEMINI_API_KEYが設定されていません。");
}

const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY
});

//テキストから意味ベクトルへ変換
async function getEmbedding(text: string): Promise<number[]> {
  try {
    const result = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: text,
    });

    const vector = Array.from(result.embeddings?.[0]?.values || []);

    if (vector.length !== 3072) {
      throw new Error(`生成されたベクトル次元が不正です: ${vector.length}`);
    }

    return vector as number[];

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "ベクトル生成中に予期せぬエラーが発生しました。";
    throw new Error(`Gemini API呼び出しエラー: ${errorMessage}`);
  }
}


export async function POST(request: Request) {
  try {
    const { invoiceId, client, title, description } = await request.json();

    if (!invoiceId || !client || !title || !description) {
      return NextResponse.json({ message: "Required fields (invoiceId, client, title, description) are missing." }, { status: 400 });
    }

    //3つの項目を結合して単一のコンテキストを作成
    const contextText = `クライアント: ${client}. タイトル: ${title}. 説明: ${description}`;

    //結合テキストをベクトル化
    const invoiceVector = await getEmbedding(contextText);

    console.log(`DEBUG: ID ${invoiceId} のベクトル次元数: ${invoiceVector.length}`);
    console.log(`DEBUG: ベクトル先頭5要素: ${invoiceVector.slice(0, 5)}`);

    const { error: updateError } = await supabase
      .from("invoice")
      .update({ embedding: invoiceVector })
      .eq("id", invoiceId);

    if (updateError) {
      console.error("Supabase Update Error:", updateError);
      return NextResponse.json({ message: `請求書ID ${invoiceId} のベクトル更新に失敗しました。`, error: updateError.message }, { status: 500 });
    }

    console.log(`SUCCESS: 請求書ID ${invoiceId} のベクトルが正常に保存されました。`);
    return NextResponse.json({
      message: `請求書ID ${invoiceId} のベクトル保存が完了しました。`,
      invoiceId,
    }, { status: 200 });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "不明なエラーが発生しました。";

    console.error('請求書ベクトル生成処理エラー:', errorMessage);
    return NextResponse.json({
      message: '請求書ベクトル生成中に致命的なエラーが発生しました。',
      error: errorMessage
    }, { status: 500 });
  }
}