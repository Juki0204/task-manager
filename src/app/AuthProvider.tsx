"use client"

import { useEffect, useState, createContext, useContext } from "react";

import { supabase } from "@/utils/supabase/supabase";
import { usePathname, useRouter } from "next/navigation";
import { User } from "@/utils/types/user";

type UserData = User | null;

type AuthContextType = {
  user: UserData;
  loading: boolean;
  refetchUser: () => Promise<void>;
};

const AuthContect = createContext<AuthContextType>({
  user: null,
  loading: true,
  refetchUser: async () => { },
});

export const useAuth = () => useContext(AuthContect);

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {

  const router = useRouter();
  const pathname = usePathname();
  const validPaths = [
    '/login',
    '/reset/send-mail',
    '/reset/reset-path',
    '/signup',
    '/signup/confirm-mail'
  ];

  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [user, setUser] = useState<UserData>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const getCurrentSession = async () => {
    const { data: sessionData } = await supabase.auth.getSession();

    if (sessionData.session !== null) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (data) {
          setUser({
            id: data.id,
            name: data.name,
            email: data.email,
            employee: data.employee,
            unread_task_id: data.unread_task_id,
            important_task_id: data.important_task_id,
          });
        }
      }
      setIsLoaded(true);
      setLoading(false);

    } else {
      //ログインページでローダーは出さない
      if (pathname === '/login' || validPaths.includes(pathname)) {
        setIsLoaded(true);
        setLoading(false);
      } else {
        //ログイン後の画面でセッションがnullの場合はリダイレクトする
        router.push('/login');
      }
    }
  }

  //初回
  useEffect(() => {
    getCurrentSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // //ポーリング ユーザーデータが更新される度に各所データに再リクエストが走るため一旦ストップ
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     getCurrentSession();
  //   }, 15000);

  //   return () => clearInterval(interval);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  //フォーカス時にアクセストークン確認・必要ならリフレッシュ
  useEffect(() => {
    const handleFocus = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("フォーカス時のセッション取得エラー:", error);
        await supabase.auth.refreshSession();
        return;
      }

      // セッション切れてた場合だけリフレッシュ試みる
      if (!data.session) {
        await supabase.auth.refreshSession();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  //アプリ全体で右クリック禁止
  useEffect(() => {
    const prohibitedContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    }

    document.addEventListener('contextmenu', prohibitedContextMenu);

    return () => document.removeEventListener('contextmenu', prohibitedContextMenu);
  }, []);

  return (
    <AuthContect.Provider value={{ user, loading, refetchUser: getCurrentSession }}>
      <div className={isLoaded ? "opacity-0 pointer-events-none w-full h-lvh grid place-content-center fixed top-0 left-0 transition-opacity bg-white z-[99999]"
        : "w-full h-lvh grid place-content-center fixed transition-opacity top-0 left-0 bg-white z-[99999] animate-loading-fade-out"}>
        <span className="loading loading-spinner loading-lg"></span>
      </div>
      {children}
    </AuthContect.Provider>
  )
}