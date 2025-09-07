import { supabase } from "@/utils/supabase/supabase";
import { DialogPanel, DialogTitle } from "@headlessui/react";
import Image from "next/image";
import { useEffect, useState } from "react";


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
        file.fileType === 'eml' ?
          <></>
          :
          <img
            src={targetFile}
            className="w-full h-auto"
            alt={file.fileName}
          />
      }
    </div>
  )
}