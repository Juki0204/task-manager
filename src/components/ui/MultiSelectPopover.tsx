"use client";

import { Fragment, useState } from "react";
import { Popover, PopoverButton, PopoverPanel, Transition } from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";

interface MultiSelectPopoverProps {
  options: { id: number, label: string }[];
  onChange: (e: React.ChangeEvent<HTMLInputElement>, label: string) => void;
  defaultText: string;
}

export default function MultiSelectPopover({ options, onChange, defaultText }: MultiSelectPopoverProps) {
  const [selected, setSelected] = useState<number[]>([]);

  const toggleOption = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="w-46">
      <Popover className="relative">
        {({ open }) => (
          <>
            <PopoverButton className="flex w-full items-center justify-between rounded-md border border-gray-300 bg-white pl-3 pr-2 py-1.5 text-sm font-medium shadow-sm hover:bg-gray-50 focus:outline-none">
              <span className="truncate flex-1 text-left">
                {selected.length > 0
                  ? options.filter((opt) => selected.includes(opt.id)).map((opt) => opt.label).join(", ")
                  : `${defaultText}`}
              </span>
              <ChevronDown
                className={`ml-2 h-4 w-4 transition-transform ${open ? "rotate-180" : ""
                  }`}
              />
            </PopoverButton>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in furation-150"
              leaveFrom="opacity-100 transition-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <PopoverPanel className="absolute z-10 mt-2 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                <div className="p-2 space-y-1">
                  {options.map((opt) => (
                    <label key={opt.id} className="flex cursor-pointer items-center rounded-md px-2 py-1 hover:bg-gray-100">
                      <input type="checkbox" checked={selected.includes(opt.id)} onChange={(e) => { toggleOption(opt.id); onChange(e, opt.label); }} className="w-0"></input>
                      <span className="text-sm">{opt.label}</span>
                      {selected.includes(opt.id) && (
                        <Check className="ml-auto h-4 w-4 text-blue-500" />
                      )}
                    </label>
                  ))

                  }
                </div>
              </PopoverPanel>

            </Transition>
          </>
        )}
      </Popover>
    </div>
  )
}