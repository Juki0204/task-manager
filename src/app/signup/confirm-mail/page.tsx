"use client"

import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/supabase";
import { useEffect } from "react";
import { CorrectBtn } from "@/components/ui/Btn";

export default function SignUpConfirmPage() {
  const router = useRouter();

  const registerUser = async () => {
    const { data: userData, error } = await supabase.auth.getUser();

    if (error || !userData?.user) {
      console.error('ユーザー情報の取得に失敗しました');
      return;
    }

    const userId = userData.user.id;
    const email = userData.user.email;

    // サインアップ時に保存しておいた name, employee を取得
    const name = localStorage.getItem('signup_name');
    const employee = localStorage.getItem('signup_employee');

    const { error: insertError } = await supabase.from('users').insert([
      {
        id: userId,
        name,
        email,
        employee,
      },
    ]);

    if (insertError) {
      console.error('ユーザー情報の登録に失敗しました', insertError);
    }
  }

  useEffect(() => {
    registerUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  return (
    <main className="w-full max-w-xl m-auto min-h-screen text-center text-white p-4 pt-20">
      <h1 className="text-center pb-4 text-4xl font-bold">新規登録</h1>
      <div>
        <p className="text-justify mb-4">ユーザー登録が完了しました。<br />
          ログイン画面より正常にログイン出来るかご確認下さい。</p>
        <CorrectBtn onClick={() => { router.push('/login') }}>ログイン画面へ</CorrectBtn>
      </div>
    </main>
  );
}