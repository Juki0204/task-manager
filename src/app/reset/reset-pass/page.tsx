"use client"

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Input } from "@headlessui/react";
import { CorrectBtn, OutlineBtn } from "@/components/ui/Btn";

import { supabase } from "@/utils/supabase/supabase";

interface ResetPassInput {
  password: string;
  passwordComfirmation: string;
}

const ResetPass = () => {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    getValues,
    formState: {
      errors,
      isValid,
      isSubmitting
    }
  } = useForm<ResetPassInput>({
    defaultValues: {
      password: '',
    },
    mode: 'onBlur',
  });

  const [isSend, setIsSend] = useState<boolean>(false);

  const onSubmit: SubmitHandler<ResetPassInput> = async (data) => {
    const { password } = data;

    const { error } = await supabase.auth.updateUser({ password });
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
          <p>パスワードの再設定が完了しました。<br />
            正常にログインが出来るかご確認下さい。</p>
          <CorrectBtn onClick={() => router.push('/login')}>ログイン画面へ</CorrectBtn>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full max-w-xl m-auto min-h-screen text-center text-white p-4 pt-20">
      <h1 className="text-center pb-4 text-4xl font-bold">パスワード再登録</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2 flex-wrap p-4">
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
          {errors.password &&
            <span className="text-xs text-red-600">半角英数字6文字以上で入力して下さい</span>
          }
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
              placeholder="パスワード（確認）"
              {...register('passwordComfirmation', { required: true, validate: (value) => value === getValues('password') })}
            />
          </label>
          {errors.passwordComfirmation &&
            <span className="text-xs text-red-600">パスワードが一致しません</span>
          }
        </div>

        <CorrectBtn type="submit" disabled={!isValid || isSubmitting}>送信</CorrectBtn>
      </form>
      <OutlineBtn className="outline-white text-white" onClick={() => { router.push('/login') }}>ログイン画面へ</OutlineBtn>
    </main>
  )
}

export default ResetPass;