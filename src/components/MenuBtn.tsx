import { useAuth } from "@/app/AuthProvider";
import { useState } from "react"
import { FaUserCircle } from "react-icons/fa";
import LogoutBtn from "./ui/LogoutBtn";
import ThemeSwitcher from "./ThemeSwitcher";


export default function MenuBtn() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  return (
    <div className="relative text-neutral-700 dark:text-neutral-100 transition-all duration-100">
      <div onClick={() => setMenuOpen(!menuOpen)} className={`menu-btn ${menuOpen ? "active" : ""}`}>
        <span className="bar bar1"></span>
        <span className="bar bar2"></span>
        <span className="bar bar3"></span>
      </div>
      <div className={`fixed top-12.5 right-1 p-4 rounded-md w-fit bg-neutral-100 dark:bg-neutral-600 shadow-lg shadow-neutral-800 transition-opacity duration-300 ${menuOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <h3 className="flex items-center justify-center gap-1 pb-2"><FaUserCircle />{user?.name} さん</h3>
        <div className="flex flex-col gap-2">
          {/* <div className="pb-2 border-b border-neutral-500">
            <p className="text-center text-sm pb-2">- Exchange Themes -</p>
            <ThemeSwitcher />
          </div> */}
          <div className="bg-slate-400 dark:bg-slate-800 rounded-md"><LogoutBtn className="px-10 !py-1 w-full justify-center" /></div>
        </div>
      </div>
    </div>
  )
}