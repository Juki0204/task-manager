import { useState } from "react";
import { MdCheckBox, MdCheckBoxOutlineBlank } from "react-icons/md";

type Item = {
  id: string;
  title: string;
  checked: boolean;
};

interface ToggleLineNumberProps {
  item: Item,
  index: number,
  onToggle: (id: string, next: boolean) => void,
}

export default function ToggleRowNumber({ item, index, onToggle }: ToggleLineNumberProps) {
  const [hovered, setHovered] = useState<boolean>(false);

  const showCheckbox = hovered || item.checked;

  return (
    <div
      className="w-full h-full"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={`w-full h-full grid place-content-center cursor-pointer ${item.checked ? "bg-[#ffff00]" : "bg-transparent"}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggle(item.id, !item.checked);
        }}
      >
        {showCheckbox ? (
          item.checked ? (
            <MdCheckBox className="text-green-500 text-xl" />
          ) : (
            <MdCheckBoxOutlineBlank className="text-white text-xl" />
          )
        ) : (
          <span className="text-white">
            {index + 1}
          </span>
        )}
      </div>
    </div>
  )
}