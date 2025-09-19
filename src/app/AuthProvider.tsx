"use client"

import { useEffect, useState, createContext, useContext } from "react";

import { supabase } from "@/utils/supabase/supabase";
import { usePathname, useRouter } from "next/navigation";

type UserData = {
  id: string;
  name: string;
  email: string;
  employee: string;
} | null;

type AuthContextType = {
  user: UserData;
  loading: boolean;
};

const AuthContect = createContext<AuthContextType>({
  user: null,
  loading: true,
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

  useEffect(() => {
    getCurrentSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <AuthContect.Provider value={{ user, loading }}>
      <div className={isLoaded ? "opacity-0 pointer-events-none w-full h-lvh grid place-content-center fixed top-0 left-0 transition-opacity bg-white z-[99999]"
        : "w-full h-lvh grid place-content-center fixed transition-opacity top-0 left-0 bg-white z-[99999] animate-loading-fade-out"}>
        <span className="loading loading-spinner loading-lg"></span>
      </div>
      {children}
    </AuthContect.Provider>
  )
}