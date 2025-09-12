import { supabase } from "@/utils/supabase/supabase";
// import Image from "next/image";
import { useEffect, useState } from "react";
import MailViewer from "./MailViewer";

interface fileModalProps {
  file: {
    original_name: string,
    stored_name: string,
    file_type: string,
    file_path: string,
    size: string,
    ext: string,
  }
}

export default function FileModal({ file }: fileModalProps) {
  const [targetFile, setTargetFile] = useState<string>('');

  function getTargetFile() {
    const { data } = supabase.storage
      .from('shared-files')
      .getPublicUrl(file.file_path);

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
        file.ext === 'eml' ? (
          targetFile ? (
            <MailViewer file={file} />
          ) : (
            <div className="text-center">読み込み中...</div>
          )
        ) : file.ext === 'zip' ? (
          <a className="text-blue-600 underline" href={targetFile} target="_blank">{file.original_name}</a>
        ) : (
          targetFile ? (
            <img
              src={targetFile ? targetFile : '/file.svg'}
              className="w-full h-auto"
              alt={file.original_name}
            />
          ) : (
            <div className="text-center">読み込み中...</div>
          )
        )
      }
    </div>
  )
}