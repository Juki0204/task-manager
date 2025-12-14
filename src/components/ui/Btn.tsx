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
      // className={`fixed flex gap-2 items-center top-15 right-4 whitespace-nowrap z-50 w-fit rounded-md bg-sky-600 px-4 py-2 text-md text-white font-bold data-active:bg-sky-700 data-hover:bg-sky-500 cursor-pointer ${className}`}
      className={`py-2 pl-3.5 pr-4.5 flex items-center gap-1 rounded text-sm text-white font-bold data-hover:opacity-80 data-hover:cursor-pointer whitespace-nowrap w-fit bg-sky-600 text-md data-active:bg-sky-700 data-hover:bg-sky-500 cursor-pointer ${className}`}
    >
      <FaPlus /><span className="text-sm duration-300">新規タスク追加</span>
    </Button>
  )
}