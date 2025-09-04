"use client"

import { useEffect, useState } from "react";

import { supabase } from "@/utils/supabase/supabase";
import { usePathname, useRouter } from "next/navigation";

export default function AuthProvider({ children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const router = useRouter();
  const pathname = usePathname();
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const validPaths = ['/login', '/reset/send-mail', '/reset/reset-path', '/signup', '/signup/confirm-mail']

  const getCurrentSession = async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session !== null) {
      setIsLoaded(true);
    } else if (data.session == null) {
      //ログイン前の各画面ではリダイレクトしない
      if (validPaths.includes(pathname)) {
        setIsLoaded(true);
      } else {
        //ログイン後の画面でセッションがnullの場合はリダイレクトする
        router.push('/login');
      }
    }
  }

  useEffect(() => {
    getCurrentSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className={isLoaded ? "opacity-0 pointer-events-none w-full h-lvh grid place-content-center fixed top-0 left-0 transition-opacity bg-white z-[99999]"
        : "w-full h-lvh grid place-content-center fixed transition-opacity top-0 left-0 bg-white z-[99999] animate-loading-fade-out"}>
        <span className="loading loading-spinner loading-lg"></span>
      </div>
      {children}
    </>
  )
}