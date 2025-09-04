import { Button } from "@headlessui/react";
import { ComponentPropsWithoutRef } from "react";

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
      className={`outline-1 -outline-offset-1 p-2 rounded w-full max-w-60 ${className}`}
      type={type}
      disabled={disabled}
      {...props}
    >
      {children}
    </Button>
  )
}