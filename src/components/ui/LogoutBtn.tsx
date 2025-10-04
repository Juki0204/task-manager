"use client"

import { useRouter } from "next/navigation";
import { supabase } from '@/utils/supabase/supabase';
import { OutlineBtn } from "@/components/ui/Btn";
import { MdLogout } from "react-icons/md";

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
    <OutlineBtn className="flex items-center gap-1 outline-white text-white px-4 !w-30 h-fit text-sm cursor-pointer" onClick={handleLogout}><MdLogout /><span className="flex-1">ログアウト</span></OutlineBtn>
  );
};