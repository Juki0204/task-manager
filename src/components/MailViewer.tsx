"use client";

import { useEffect, useState } from "react";

interface MailParserProps {
  file: {
    filePath: string;
    fileName: string;
    fileType: string;
    storedName: string;
  };
}

type ParsedMail = {
  subject: string;
  from: string;
  to: string;
  date: string;
  text: string;
  html: string;
};

export default function MailViewer({ file }: MailParserProps) {
  const [mail, setMail] = useState<ParsedMail | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/parse-eml?path=${file.filePath}`);
      const json = await res.json();
      setMail(json);
    })();
  }, []);

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const pad = (n: number) => String(n).padStart(2, "0");

    return `${date.getFullYear()}年${pad(date.getMonth() + 1)}月${pad(date.getDate())}日 ` + `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  if (!mail) return <div className="text-center mt-4">読み込み中...</div>;

  return (
    <div className="space-y-4 max-h-150 pr-2 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300">
      <h3 className="font-bold text-lg">件名: {mail.subject}</h3>
      <p><b>送信者:</b> {mail.from}</p>
      <p><b>宛先:</b> {mail.to}</p>
      <p><b>日付:</b> {formatDate(mail.date)}</p>

      <hr className="my-4" />

      <div className="whitespace-pre-wrap [&_a]:text-blue-600 [&_a]:underline [&_p]:mb-4" dangerouslySetInnerHTML={{ __html: mail.html }}></div>

    </div>
  );

}