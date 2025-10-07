import React from "react";

type HighlightProps = {
  text: string;
  keyword: string | null;
}

export default function HighlightText({ text, keyword }: HighlightProps) {
  if (!keyword) return <>{text}</>

  const regex = new RegExp(`(${keyword})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark key={index} className="bg-yellow-200">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}