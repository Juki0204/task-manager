"use client"

import { useRouter } from "next/navigation";
import { supabase } from '@/utils/supabase/supabase';
import { OutlineBtn } from "@/components/ui/Btn";
import { MdLogout } from "react-icons/md";
import { User } from "@/utils/types/user";

export default function LogoutBtn() {
  const router = useRouter();

  const allUnlockedHandler = async (user: User) => {
    const { data, error } = await supabase
      .from("tasks")
      .update({
        locked_by_id: null,
        locked_by_name: null,
        locked_by_at: null,
      })
      .eq("locked_by_id", user.id)
      .select("id");

    if (error) {
      console.error(error);
      return;
    }

    if (!data || data.length === 0) return;
  }

  const handleLogout = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await allUnlockedHandler(user as unknown as User);

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
    // <OutlineBtn className="flex items-center gap-1 outline-neutral-800 text-neutral-800 px-4 !w-30 h-fit text-sm cursor-pointer" onClick={handleLogout}><MdLogout /><span className="flex-1">ログアウト</span></OutlineBtn>
    <button className="flex items-center gap-1 outline-white text-white py-[2px] px-4 h-fit text-sm cursor-pointer" onClick={handleLogout}><MdLogout /><span className="flex-1">ログアウト</span></button>
  );
};