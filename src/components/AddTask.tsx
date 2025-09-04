"use client";
import { useState } from "react";

import { Field, Input, Label, Textarea, Dialog, DialogPanel, DialogTitle, DialogBackdrop, Button, Select } from "@headlessui/react";
import { GrAddCircle, GrClose } from "react-icons/gr";


export default function AddTask() {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <>
      <Button onClick={() => { setIsOpen(true) }} className="flex items-center gap-2 ml-auto mr-0 rounded bg-sky-600 px-4 py-2 text-sm text-white font-bold data-active:bg-sky-700 data-hover:bg-sky-500"><GrAddCircle />新規追加</Button>
      <Dialog open={isOpen} onClose={() => setIsOpen(false)} transition className="relative z-50 transition duration-300 ease-out data-closed:opacity-0">
        <DialogBackdrop className="fixed inset-0 bg-black/30" />

        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <DialogPanel className="relative max-w-3xl space-y-4 rounded-2xl bg-neutral-100 p-8 grid grid-cols-2 gap-4">
            <DialogTitle className="font-bold text-left col-span-2">新規タスク追加</DialogTitle>
            <GrClose onClick={() => setIsOpen(false)} className="absolute top-8 right-8 cursor-pointer" />
            <Field className="flex">
              <Label className="w-28 whitespace-nowrap pr-2 py-1">クライアント</Label>
              <Input name="CLIENT" type="text" className="flex-1 p-1 bg-neutral-300 rounded-md focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-black/25" />
            </Field>
            <Field className="flex">
              <Label className="w-28 whitespace-nowrap pr-2 py-1">依頼者</Label>
              <Input name="CONTACT_NAME" type="text" className="flex-1 p-1 bg-neutral-300 rounded-md focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-black/25" />
            </Field>
            <Field className="flex col-span-2">
              <Label className="w-28 whitespace-nowrap pr-2 py-1">作業タイトル</Label>
              <Input name="TASK_TITLE" type="text" className="flex-1 p-1 bg-neutral-300 rounded-md focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-black/25" />
            </Field>
            <Field className="flex col-span-2">
              <Label className="w-28 whitespace-nowrap pr-2 py-1">作業内容</Label>
              <Input name="TASK_DESCRIPTION" type="text" className="flex-1 p-1 bg-neutral-300 rounded-md focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-black/25" />
            </Field>
            <Field className="flex">
              <Label className="w-28 whitespace-nowrap pr-2 py-1">依頼日</Label>
              <Input name="CREATED_AT" type="date" className="flex-1 p-1 bg-neutral-300 rounded-md focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-black/25" />
            </Field>
            <Field className="flex">
              <Label className="w-28 whitespace-nowrap pr-2 py-1">完了日</Label>
              <Input name="COMPLETED_AT" type="date" className="flex-1 p-1 bg-neutral-300 rounded-md focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-black/25" />
            </Field>
            <Field className="flex">
              <Label className="w-28 whitespace-nowrap pr-2 py-1">担当者</Label>
              <Input name="MANAGER_NAME" type="text" className="flex-1 p-1 bg-neutral-300 rounded-md focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-black/25" />
            </Field>
            <Field className="flex">
              <Label className="w-28 whitespace-nowrap pr-2 py-1">作業状況</Label>
              <Select name="STATUS" className="flex-1 p-1 bg-neutral-300 rounded-md focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-black/25">
                <option value="未着手">未着手</option>
                <option value="作業中">作業中</option>
                <option value="作業途中">作業途中</option>
                <option value="確認中">確認中</option>
                <option value="完了">完了</option>
                <option value="保留">保留</option>
                <option value="中止">中止</option>
                <option value="詳細待ち">詳細待ち</option>
              </Select>
            </Field>
            <Field className="flex col-span-2">
              <Label className="w-28 whitespace-nowrap pr-2 py-1">優先度</Label>
              <Select name="PRIORITY" className="flex-1 p-1 bg-neutral-300 rounded-md focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-black/25">
                <option value=""></option>
                <option value="至急">至急</option>
                <option value="高">高</option>
                <option value="低">低</option>
              </Select>
            </Field>
            <Field className="flex col-span-2">
              <Label className="w-28 whitespace-nowrap pr-2 py-1">備考欄</Label>
              <Textarea name="REMARKS" rows={5} className="flex-1 p-1 bg-neutral-300 rounded-md focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-black/25" />
            </Field>

            <div className="flex gap-4 justify-end col-span-2">
              <Button onClick={() => setIsOpen(false)} className="outline-1 -outline-offset-1 rounded px-4 py-2 text-sm">キャンセル</Button>
              <Button onClick={() => setIsOpen(false)} className="bg-sky-600 rounded px-4 py-2 text-sm text-white font-bold">新規追加</Button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
