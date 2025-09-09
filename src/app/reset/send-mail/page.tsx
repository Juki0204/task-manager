"use client"

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Input } from "@headlessui/react";
import { CorrectBtn, OutlineBtn } from "@/components/ui/Btn";


import { supabase } from "@/utils/supabase/supabase";

interface ResetPassMailInput {
  email: string;
}

const ResetPassMail = () => {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isValid,
      isSubmitting
    }
  } = useForm<ResetPassMailInput>({
    defaultValues: {
      email: '',
    },
    mode: 'onBlur',
  });

  const [isSend, setIsSend] = useState<boolean>(false);

  const onSubmit: SubmitHandler<ResetPassMailInput> = async (data) => {
    const { email } = data;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://cdrive-task-manager.vercel.app/reset/reset-pass/'
    });
    if (error) {
      alert('エラーが発生しました');
    } else {
      setIsSend(true);
    }
  }

  if (isSend) {
    return (
      <main className="w-full max-w-xl m-auto min-h-screen text-center text-white p-4 pt-20">
        <h1 className="text-center pb-4 text-4xl font-bold">パスワード再登録</h1>
        <div>
          <p className="text-justify">入力したメールアドレス宛にメールを送信しました。<br />
            リンクよりパスワードを再設定して下さい。</p>
          <CorrectBtn onClick={() => router.push('/login')}>ログイン画面へ</CorrectBtn>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full max-w-xl m-auto min-h-screen text-center text-white p-4 pt-20">
      <h1 className="text-center pb-4 text-4xl font-bold">パスワードリセット</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2 flex-wrap p-4">
        <div className="w-full text-left relative">
          <label className="input input-bordered flex items-center gap-2 w-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="h-4 w-4 opacity-70 absolute left-3">
              <path
                d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z" />
              <path
                d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z" />
            </svg>
            <Input
              type="text"
              className="grow pl-10 p-2 bg-neutral-700 rounded-md focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-black/25"
              placeholder="メールアドレス"
              {...register('email', { required: true, pattern: /^[a-zA-Z]{1}[0-9a-zA-Z]+[\w\.-]+@[\w\.-]+\.\w{2,}$/ })}
            />
          </label>
          {errors.email &&
            <span className="text-xs text-red-600">メールアドレスを正しく入力して下さい</span>
          }
        </div>

        <CorrectBtn type="submit" disabled={!isValid || isSubmitting}>送信</CorrectBtn>
      </form>
      <OutlineBtn className="outline-white text-white" onClick={() => { router.push('/login') }}>ログイン画面へ</OutlineBtn>
    </main>
  )
}

export default ResetPassMail;