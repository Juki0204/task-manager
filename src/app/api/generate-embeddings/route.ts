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

    const embeddings = result.embeddings;

    if (!embeddings || embeddings.length === 0) {
      throw new Error("意味ベクトルの値を取得できませんでした");
    }

    const valuesSource = embeddings[0].values;

    if (!valuesSource) {
      throw new Error("意味ベクトルの値が見つかりません");
    }

    return Array.from(valuesSource) as number[];
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Gemini API呼び出しエラー: ${error.message}`);
    }
    throw new Error("Geminiベクトル生成中に予期せぬエラーが発生しました。");
  }
}


export async function POST(request: Request) {
  try {
    //最終処理日時を取得
    const { data: settingData, error: settingError } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'last_embedding_run')
      .single();

    if (settingError && settingError.code !== 'PGRST116') throw settingError;

    //last_processed_at を取得。レコードがない場合は大昔の日時を使用
    const lastProcessedAt = settingData?.value || '2000-01-01T00:00:00.000Z';
    const currentRunTime = new Date().toISOString();

    //差分のある請求項目を取得
    const { data: prices, error: fetchError } = await supabase
      .from("prices")
      .select("id, work_name, work_description, updated_at")
      .gt('updated_at', lastProcessedAt);

    if (fetchError) throw fetchError;

    //対象がない場合は終了
    if (prices.length === 0) {
      return NextResponse.json({
        message: `更新対象の請求項目はありませんでした。最終処理日時: ${lastProcessedAt}`,
        total_items: 0,
        updated_count: 0,
      }, { status: 200 });
    }

    const updateLogs: string[] = [];
    let processedCount = 0;

    //各項目をループし、ベクトルを生成・更新
    for (const price of prices) {
      if (!price.work_description) {
        updateLogs.push(`SKIP: ID ${price.id} (${price.work_name}) - work_descriptionが空です。`);
        continue;
      }

      try {
        const vector = await getEmbedding(price.work_description);

        console.log(`DEBUG: ID ${price.id} のベクトル次元数: ${vector.length}`);
        console.log(`DEBUG: ベクトル先頭5要素: ${vector.slice(0, 5)}`);

        const { error: updateError } = await supabase
          .from("prices")
          .update({ embedding: vector, updated_at: currentRunTime })
          .eq("id", price.id);

        if (updateError) {
          updateLogs.push(`ERROR: ID ${price.id} (${price.work_name}) - ${updateError.message}`);
        } else {
          processedCount++;
          updateLogs.push(`SUCCESS: ID ${price.id} (${price.work_name}) - ベクトルを更新しました。`);
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "不明なベクトル生成エラー";
        updateLogs.push(`FATAL ERROR: ID ${price.id} (${price.work_name}) - ${errorMessage}`);
      }
    }

    //最終処理日時を更新
    if (processedCount > 0) {
      const { error: updateSettingError } = await supabase
        .from("settings")
        .update({ value: currentRunTime })
        .eq("key", "last_embedding_run");

      if (updateSettingError) {
        updateLogs.push(`WARNING: 最終処理日時の更新に失敗しました: ${updateSettingError.message}`);
      }
    }

    return NextResponse.json({
      message: `ベクトルの一括生成とDB更新が完了しました。`,
      total_items: prices.length,
      updated_count: processedCount,
      logs: updateLogs
    }, { status: 200 });

  } catch (err) {
    let errorMessage = '不明なエラーが発生しました。';

    if (err instanceof Error) {
      errorMessage = err.message;
    } else if (typeof err === 'string') {
      errorMessage = err;
    }

    console.error('一括生成処理エラー:', errorMessage);
    return NextResponse.json({
      message: '一括処理中に致命的なエラーが発生しました。',
      error: errorMessage
    }, { status: 500 });
  }
}