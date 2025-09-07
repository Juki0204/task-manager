import { simpleParser } from "mailparser";
import parse from 'html-react-parser';
import { useEffect, useState } from "react";

interface MailParserProps {
  file: {
    filePath: string;
    fileName: string;
    fileType: string;
    storedName: string;
  };
  publicUrl: string;
  taskId?: string;
}

export default function MailParser({ file, publicUrl }: MailParserProps) {
  const [parsedHtml, setParsedHtml] = useState<string | null>(null);
  const [plainText, setPlainText] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAndParseEml = async () => {
      console.log(publicUrl);
      try {
        const res = await fetch(publicUrl);
        const buffer = await res.arrayBuffer();
        const parsed = await simpleParser(Buffer.from(buffer));

        setParsedHtml(parsed.html || null);
        setPlainText(parsed.text || null);
      } catch (err) {
        console.error('EML parse error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (file.fileType === 'eml') {
      fetchAndParseEml();
    }
  }, [file, publicUrl]);

  if (loading) return <div>読み込み中...</div>;

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg">{file.fileName}</h3>

      {parsedHtml ? (
        <div className="prose max-w-none">{parse(parsedHtml)}</div>
      ) : (
        <pre className="bg-neutral-200 p-2 rounded">{plainText}</pre>
      )}
    </div>
  );

}