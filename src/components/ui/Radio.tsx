import { MdMailOutline } from "react-icons/md";
import { FiPhone } from "react-icons/fi";
import { FaRegQuestionCircle } from "react-icons/fa";

interface mailRadioProps {
  name: string;
  id: string;
  onClick?: (e: React.MouseEvent<HTMLInputElement>) => void;
}

interface telRadioProps {
  name: string;
  id: string;
  onClick?: (e: React.MouseEvent<HTMLInputElement>) => void;
}

interface otherRadioProps {
  name: string;
  id: string;
  onClick?: (e: React.MouseEvent<HTMLInputElement>) => void;
}


export function MailRadio({ name, id, onClick }: mailRadioProps) {
  return (
    <div className="relative aspect-square w-8 h-fit bg-neutral-300 text-neutral-700 rounded-sm overflow-hidden [font-size:0]">
      <input type="radio" name={name} id={id} value="mail" onClick={onClick} className="w-full h-full hidden peer"></input>
      <label htmlFor={id} className="absolute top-0 left-0 w-full aspect-square p-1 peer-checked:bg-blue-300 transition duration-300"><MdMailOutline className="w-full h-full" /></label>
    </div>
  )
}

export function TelRadio({ name, id, onClick }: telRadioProps) {
  return (
    <div className="relative aspect-square w-8 h-fit bg-neutral-300 text-neutral-700 rounded-sm overflow-hidden [font-size:0]">
      <input type="radio" name={name} id={id} value="tel" onClick={onClick} className="w-full h-full hidden peer"></input>
      <label htmlFor={id} className="absolute top-0 left-0 w-full aspect-square p-1 peer-checked:bg-blue-300 transition duration-300"><FiPhone className="w-full h-full" /></label>
    </div>
  )
}

export function OtherRadio({ name, id, onClick }: otherRadioProps) {
  return (
    <div className="relative aspect-square w-8 h-fit bg-neutral-300 text-neutral-700 rounded-sm overflow-hidden [font-size:0]">
      <input type="radio" name={name} id={id} value="other" onClick={onClick} className="w-full h-full hidden peer"></input>
      <label htmlFor={id} className="absolute top-0 left-0 w-full aspect-square p-1 peer-checked:bg-blue-300 transition duration-300"><FaRegQuestionCircle className="w-full h-full" /></label>
    </div>
  )
}