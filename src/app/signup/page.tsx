"use client"

import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/supabase";
import { SubmitHandler, useForm } from 'react-hook-form';
import { useState } from "react";
import { Input, Button } from "@headlessui/react";
import { CorrectBtn, OutlineBtn } from "@/components/ui/Btn";

interface SignUpFormInput {
  name: string;
  email: string;
  password: string;
  passwordComfirmation: string;
  employee: string;
}

export default function SignUpPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    getValues,
    formState: {
      errors,
      isValid,
      isSubmitting,
      touchedFields
    }
  } = useForm<SignUpFormInput>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      employee: '',
    },
    mode: 'onChange',
    reValidateMode: 'onChange',
    criteriaMode: 'all',
  });

  const onSignUp: SubmitHandler<SignUpFormInput> = async (data) => {
    const { name, email, password, employee } = data;

    const { error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        emailRedirectTo: 'https://cdrive-task-manager.vercel.app/signup/confirm-mail/',
      },
    });

    if (error) {
      alert('入力内容に不備があります');
      return;
    } else {
      setIsSend(true);
      localStorage.setItem('signup_name', name);
      localStorage.setItem('signup_employee', employee);
    }
  }

  const [isSend, setIsSend] = useState<boolean>(false);

  if (isSend) {
    return (
      <main className="w-full max-w-xl m-auto text-center text-white min-h-screen p-4 pt-20">
        <h1 className="text-center pb-4 text-4xl font-bold">新規登録</h1>
        <div>
          <p className="text-justify mb-4">入力したメールアドレス宛にメールを送信しました。<br />
            リンクよりメールアドレスの確認操作を完了して下さい。</p>
          <Button className="bg-sky-700 text-white p-2 rounded w-full max-w-60" onClick={() => { router.push('/login') }}>ログイン画面へ</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full max-w-xl m-auto text-center text-white min-h-screen p-4 pt-20">
      <h1 className="text-center pb-4 text-4xl font-bold">新規登録</h1>
      <form onSubmit={handleSubmit(onSignUp)} className="flex gap-2 flex-wrap p-4">
        <div className="w-full text-left relative">
          <label className="input input-bordered flex items-center gap-2 w-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="h-4 w-4 opacity-70 absolute left-3">
              <path
                d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
            </svg>
            <Input
              type="text"
              className="grow pl-10 p-2 bg-neutral-700 rounded-md focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-black/25"
              placeholder="お名前"
              {...register('name', { required: true })}
            />
          </label>
          {errors.name && touchedFields.name && (
            <span className="text-xs text-red-600">入力必須です</span>
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
          {errors.passwordComfirmation && touchedFields.passwordComfirmation && (
            <span className="text-xs text-red-600">パスワードが一致しません</span>
          )}
        </div>

        <div className="w-full text-left relative">
          <label className="input input-bordered flex items-center gap-2 w-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
              fill="currentColor"
              className="h-4 w-4 opacity-70 absolute left-3">
              <path d="M435.95,287.525c32.51,0,58.87-26.343,58.87-58.853c0-32.51-26.361-58.871-58.87-58.871   c-32.502,0-58.863,26.361-58.863,58.871C377.088,261.182,403.448,287.525,435.95,287.525z" />
              <path d="M511.327,344.251c-2.623-15.762-15.652-37.822-25.514-47.677c-1.299-1.306-7.105-1.608-8.673-0.636   c-11.99,7.374-26.074,11.714-41.19,11.714c-15.099,0-29.184-4.34-41.175-11.714c-1.575-0.972-7.373-0.67-8.672,0.636   c-2.757,2.757-5.765,6.427-8.698,10.683c7.935,14.94,14.228,30.81,16.499,44.476c2.27,13.7,1.533,26.67-2.138,38.494   c13.038,4.717,28.673,6.787,44.183,6.787C476.404,397.014,517.804,382.987,511.327,344.251z" />
              <path d="M254.487,262.691c52.687,0,95.403-42.716,95.403-95.402c0-52.67-42.716-95.386-95.403-95.386   c-52.678,0-95.378,42.716-95.378,95.386C159.109,219.975,201.808,262.691,254.487,262.691z" />
              <path d="M335.269,277.303c-2.07-2.061-11.471-2.588-14.027-1.006c-19.448,11.966-42.271,18.971-66.755,18.971   c-24.466,0-47.3-7.005-66.738-18.971c-2.555-1.583-11.956-1.055-14.026,1.006c-16.021,16.004-37.136,51.782-41.384,77.288   c-10.474,62.826,56.634,85.508,122.148,85.508c65.532,0,132.639-22.682,122.165-85.508   C372.404,329.085,351.289,293.307,335.269,277.303z" />
              <path d="M76.049,287.525c32.502,0,58.862-26.343,58.862-58.853c0-32.51-26.36-58.871-58.862-58.871   c-32.511,0-58.871,26.361-58.871,58.871C17.178,261.182,43.538,287.525,76.049,287.525z" />
              <path d="M115.094,351.733c2.414-14.353,9.225-31.253,17.764-46.88c-2.38-3.251-4.759-6.083-6.955-8.279   c-1.299-1.306-7.097-1.608-8.672-0.636c-11.991,7.374-26.076,11.714-41.182,11.714c-15.108,0-29.202-4.34-41.183-11.714   c-1.568-0.972-7.382-0.67-8.681,0.636c-9.887,9.854-22.882,31.915-25.514,47.677c-6.468,38.736,34.924,52.762,75.378,52.762   c14.437,0,29.016-1.777,41.459-5.84C113.587,379.108,112.757,365.835,115.094,351.733z" />
            </svg>
            <Input
              type="text"
              className="grow pl-10 p-2 bg-neutral-700 rounded-md focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-black/25"
              placeholder="所属先"
              {...register('employee', { required: true })}
            />
          </label>
          {errors.employee && touchedFields.employee && (
            <span className="text-xs text-red-600">所属先を入力して下さい</span>
          )}
        </div>

        <CorrectBtn type="submit" disabled={!isValid || isSubmitting}>新規登録</CorrectBtn>
      </form>
      <OutlineBtn className="outline-white text-white" onClick={() => { router.push('/login') }}>ログイン画面へ</OutlineBtn>
    </main>
  )
}