import { supabase } from "@/utils/supabase/supabase";
// import Image from "next/image";
import { useEffect, useState } from "react";
import MailViewer from "./MailViewer";

interface fileModalProps {
  file: {
    filePath: string;
    fileName: string;
    fileType: string;
    storedName: string;
  };
}

export default function FileModal({ file }: fileModalProps) {
  const [targetFile, setTargetFile] = useState<string>('');

  function getTargetFile() {
    const { data } = supabase.storage
      .from('shared-files')
      .getPublicUrl(file.filePath);

    if (data) {
      console.log(data);
      setTargetFile(data.publicUrl);
    }
  }

  useEffect(() => {
    getTargetFile();
  }, []);

  return (
    <div className="relative w-full">
      {
        file.fileType === 'eml' ? (
          targetFile ? (
            <MailViewer file={file} />
          ) : (
            <div className="text-center">読み込み中...</div>
          )
        ) : file.fileType === 'zip' ? (
          <a className="text-blue-600 underline" href={targetFile} target="_blank">{file.fileName}</a>
        ) : (
          <img
            src={targetFile ? targetFile : '/file.svg'}
            className="w-full h-auto"
            alt={file.fileName}
          />
        )
      }
    </div>
  )
}