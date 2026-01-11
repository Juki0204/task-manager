"use client"

import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/supabase";
import { SubmitHandler, useForm } from 'react-hook-form';
import { Input } from "@headlessui/react";
import { CorrectBtn, OutlineBtn } from "@/components/ui/Btn";

interface LoginFormInput {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isValid,
      isSubmitting,
      touchedFields
    }
  } = useForm<LoginFormInput>({
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onChange',
    reValidateMode: 'onChange',
    criteriaMode: 'all',
  });

  const onLogin: SubmitHandler<LoginFormInput> = async (data) => {
    const { email, password } = data;

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    if (error) {
      alert('入力内容に誤りがあります');
    } else {
      router.push('/dashboard');
    }
  }


  return (
    <div className="w-full max-w-xl m-auto min-h-screen text-center text-white p-4 pt-20">
      <h1 className="text-center pb-4 text-4xl font-bold">ログイン</h1>
      <form onSubmit={handleSubmit(onLogin)} className="flex gap-2 flex-wrap p-4">
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
          {errors.email && touchedFields.email && (
            <span className="text-xs text-red-600">メールアドレスを正しく入力して下さい</span>
          )}
        </div>

        <div className="w-full text-left relative">
          <label className="input input-bordered flex items-center gap-2 w-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="h-4 w-4 opacity-70 absolute left-3">
              <path
                fillRule="evenodd"
                d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z"
                clipRule="evenodd" />
            </svg>
            <Input
              type="password"
              className="grow pl-10 p-2 bg-neutral-700 rounded-md focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-black/25"
              placeholder="パスワード"
              {...register('password', { required: true, pattern: /\w{6,}/ })}
            />
          </label>
          {errors.password && touchedFields.password && (
            <span className="text-xs text-red-600">半角英数字6文字以上で入力して下さい</span>
          )}
        </div>

        <CorrectBtn className="cursor-pointer" type="submit" disabled={!isValid || isSubmitting}>{isSubmitting ? "ログイン中..." : "ログイン"}</CorrectBtn>
      </form>
      <OutlineBtn className="outline-white text-white" onClick={() => { router.push('/signup') }}>新規登録へ</OutlineBtn>
      <div className="p-4">
        <a className="underline underline-offset-4" onClick={() => { router.push('/reset/send-mail') }}>パスワードを忘れた場合</a>
      </div>
    </div>
  )
}