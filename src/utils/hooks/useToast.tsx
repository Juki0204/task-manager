"use client";

import { useState } from "react";

export function useToast() {
  const [message, setMessage] = useState<string>('');

  const showToast = (msg: string, duration: number = 3000) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), duration);
  };

  const Toast = () =>
    message ? (
      <div className="w-70 text-xs fixed z-10 bottom-4 right-4 bg-sky-600 text-white p-4 rounded-sm">
        {message}
      </div>
    ) : null;

  return { showToast, Toast };
}