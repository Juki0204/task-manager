"use client";
import { textToHtml } from "@/utils/function/mailFormat";
import { useEffect, useState } from "react";

interface MailConverterProps {
  domain: string;
  prefixNo: number;
}

interface MailJSON {
  subject: string;
  from_name: string;
  from_email: string;
  sent_at: string;
  body: string;
}

export default function MailConverter({ domain, prefixNo }: MailConverterProps) {
  const [currentMail, setCurrentMail] = useState<MailJSON | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const getMail = async () => {
    setIsLoaded(false);
    const res = await fetch(`/api/mail-json?domain=${domain}&prefixNo=${prefixNo}`, { cache: "no-cache" });
    if (!res.ok) {
      setIsLoaded(true);
      return;
    }

    const text = await res.text();
    const json = JSON.parse(text);

    setCurrentMail(json.data || {});
    console.log(json);

    setIsLoaded(true);
  }

  useEffect(() => {
    getMail();
  }, [domain, prefixNo]);

  if (!currentMail && !isLoaded) return (
    <div className="flex justify-center items-center w-full h-full min-h-100 bg-neutral-50/70" aria-label="読み込み中">
      <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
    </div>
  )

  if (!currentMail && isLoaded) return <p className="min-h-100 grid place-content-center">メールを取得できませんでした。</p>

  return (
    <div className="relative min-h-100 flex flex-col w-full h-full pr-2 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-neutral-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-400">
      {!isLoaded &&
        <div className="absolute flex justify-center items-center w-full h-full bg-white/70" aria-label="読み込み中">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      }
      {currentMail && (
        <>
          <div className="w-full sticky top-0 bg-white">
            <h3 className="border-b border-neutral-300 text-base font-bold leading-loose">{textToHtml(currentMail.subject)}</h3>
            <p className="text-sm flex gap-1 leading-loose">
              <span>{currentMail.from_name}</span>
              <span className="text-neutral-500">&lt;{currentMail.from_email}&gt;</span>
            </p>
            <p className="text-right text-sm text-neutral-400 mb-0.5">{new Date(currentMail.sent_at).toLocaleString("sv-SE")}</p>
          </div>


          <div className="flex-1 text-sm tracking-wide p-2 rounded-lg bg-neutral-200">
            <div
              dangerouslySetInnerHTML={{ __html: currentMail.body }}
              className="mail-base w-full p-2"
            ></div>
          </div>
        </>
      )}

    </div>
  )
}
