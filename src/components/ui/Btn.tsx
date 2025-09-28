import { Button } from "@headlessui/react";
import { ComponentPropsWithoutRef } from "react";
import { FaPlus } from "react-icons/fa6";

interface btnProps extends ComponentPropsWithoutRef<"button"> {
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  children?: React.ReactNode;
}

export function CorrectBtn({ className, type = "button", disabled = false, children, ...props }: btnProps) {
  return (
    <Button
      className={`bg-sky-700 text-white p-2 rounded m-auto mt-4 w-full max-w-60 data-disabled:grayscale-100 data-disabled:opacity-30 ${className}`}
      type={type}
      disabled={disabled}
      {...props}
    >
      {children}
    </Button>
  )
}

export function OutlineBtn({ className, type = "button", disabled = false, children, ...props }: btnProps) {
  return (
    <Button
      className={`outline-1 -outline-offset-1 p-2 rounded w-full max-w-60 data-hover:opacity-80 ${className}`}
      type={type}
      disabled={disabled}
      {...props}
    >
      {children}
    </Button>
  )
}


interface addTaskBtnProps {
  onClick: () => void;
  className?: string;
}

export function AddTaskBtn({ onClick, className }: addTaskBtnProps) {
  return (
    <Button
      onClick={onClick}
      className={`fixed flex gap-2 items-center top-19 right-2 z-50 w-fit h-12 rounded-full bg-sky-600 px-4 py-2 text-xl text-white font-bold data-active:bg-sky-700 data-hover:bg-sky-500 cursor-pointer ${className}`}
    >
      <FaPlus /><span className="text-sm duration-300">タスク追加</span>
    </Button>
  )
}