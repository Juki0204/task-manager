import { Field, Input, Label, Textarea, Select } from "@headlessui/react";
import { ComponentPropsWithoutRef } from "react";

interface AddTaskInputProps extends ComponentPropsWithoutRef<"input"> {
  col?: number;
  name: string;
  type?: string;
  label: string;
}

interface AddTaskSelectProps extends ComponentPropsWithoutRef<"select"> {
  col?: number;
  name: string;
  label: string;
}


interface AddTaskTextareaProps extends ComponentPropsWithoutRef<"textarea"> {
  col?: number;
  name: string;
  label: string;
  rows?: number;
}



export function AddTaskInput({ col, name, type, label, ...props }: AddTaskInputProps) {
  const colSpan = col ? `col-span-${col}` : "";

  return (
    <Field className={`flex flex-col ${colSpan}`}>
      <Label className="w-28 whitespace-nowrap pl-0.5 py-1">{label}</Label>
      <Input name={name} type={type ? type : "text"} {...props} className="flex-1 p-1 bg-neutral-300 rounded-md focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-black/25" />
    </Field>
  )
}


export function AddTaskSelect({ col, name, label, ...props }: AddTaskSelectProps) {
  const colSpan = col ? `col-span-${col}` : "";

  return (
    <Field className={`flex flex-col ${colSpan}`}>
      <Label className="w-28 whitespace-nowrap pl-0.5 py-1">{label}</Label>
      <Select name={name} {...props} className="flex-1 p-1 bg-neutral-300 rounded-md focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-black/25">
      </Select>
    </Field>
  )
}


export function AddTaskTextarea({ col, name, label, rows, ...props }: AddTaskTextareaProps) {
  const colSpan = col ? `col-span-${col}` : "";

  return (
    <Field className={`flex flex-col ${colSpan}`}>
      <Label className="w-28 whitespace-nowrap pl-0.5 py-1">{label}</Label>
      <Textarea name={name} rows={rows ? rows : 3} {...props} className="flex-1 p-1 bg-neutral-300 rounded-md focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-black/25" />
    </Field>
  )
}