"use client"

import { useRouter } from "next/navigation";
import { supabase } from '@/utils/supabase/supabase';
import { OutlineBtn } from "@/components/ui/Btn";

export default function LogoutBtn() {
  const router = useRouter();

  const handleLogout = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error: signoutError } = await supabase.auth.signOut();
      if (signoutError) {
        alert('サインアウト処理中にエラーが発生しました');
      } else {
        alert('ログアウトしました');
        router.push('/login');
      }
    }
  };

  return (
    <OutlineBtn className="outline-white text-white !w-30 h-fit text-sm" onClick={handleLogout}>ログアウト</OutlineBtn>
  );
};