import { Button } from "@headlessui/react";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

import { FaClipboardList } from "react-icons/fa6";
import { useRuleContext } from "../rule/RuleProvider";
import { useMemo } from "react";
import { useAuth } from "@/app/AuthProvider";
import { Tooltip } from "react-tooltip";


interface SideMenuBtnProps {
  className?: string;
  title: string;
  icon: ReactNode;
  pathname: string;
  isSideMenuOpen: boolean;
  onClick: () => void;
}

export function SideMenuBtn({ className, title, icon, pathname, isSideMenuOpen, onClick }: SideMenuBtnProps) {
  const currentPath = usePathname();

  const idPathName = pathname.replace("/", "");
  console.log(idPathName);

  return (
    <Button
      tabIndex={-1}
      className={`flex items-center p-3 text-sm font-bold hover:bg-neutral-100 dark:hover:bg-[#222222] transition-all duration-100 ${className} ${pathname === currentPath ? "bg-neutral-100 dark:bg-[#222222]" : "cursor-pointer"}`}
      data-tooltip-id={`menuTips-${idPathName}`}
      data-tooltip-content={title}
      onClick={onClick}
    >
      {icon}<span className={`text-left overflow-clip whitespace-nowrap duration-300 transition-all ${isSideMenuOpen ? "delay-300 w-40 pl-2 opacity-100" : "w-0 pl-0 opacity-0 pointer-events-none"}`}>{title}</span>
      {!isSideMenuOpen && <Tooltip id={`menuTips-${idPathName}`} place="left" style={{ backgroundColor: "#555", color: "#fff", fontWeight: "bold", fontSize: "14px" }} />}
    </Button>
  )
}



interface RuleBoardLinkBtnProps {
  className?: string;
  title: string;
  icon: ReactNode;
  pathname: string;
  isSideMenuOpen: boolean;
  onClick: () => void;
}

export function WithBadgeSideMenuBtn({ className, title, icon, pathname, isSideMenuOpen, onClick }: RuleBoardLinkBtnProps) {
  const { rules, ruleAcknowledgements } = useRuleContext();
  const { user } = useAuth();
  const currentPath = usePathname();

  const idPathName = pathname.replace("/", "");

  const unconfirmedRuleCount = useMemo(() => {
    if (!user?.id) return 0;

    return rules.filter((rule) => {
      const ack = ruleAcknowledgements.find(
        (a) => a.rule_id === rule.id && a.user_id === user.id
      );

      if (!ack) return true;
      return ack.acknowledged_at < rule.confirmation_required_at;
    }).length;
  }, [rules, ruleAcknowledgements, user?.id]);

  return (
    <Button
      tabIndex={-1}
      className={`flex items-center p-3 text-sm font-bold hover:bg-neutral-100 dark:hover:bg-[#222222] transition-all duration-100 ${className} ${pathname === currentPath ? "bg-neutral-100 dark:bg-[#222222]" : "cursor-pointer"}`}
      data-tooltip-id={`menuTips-${idPathName}`}
      data-tooltip-content={title}
      onClick={onClick}
    >
      <div className="relative">
        {icon}
        {unconfirmedRuleCount > 0 && (<div className="absolute -top-1 -right-1 pb-0.5 grid place-content-center text-[10px] bg-red-600 leading-none text-white font-bold w-3.5 h-3.5 rounded-full">{unconfirmedRuleCount}</div>)}
      </div>
      <span className={`text-left overflow-clip whitespace-nowrap duration-300 transition-[width] ${isSideMenuOpen ? "delay-300 w-40 pl-2 opacity-100" : "w-0 pl-0 opacity-0 pointer-events-none"}`}>{title}</span>
      {!isSideMenuOpen && <Tooltip id={`menuTips-${idPathName}`} place="left" style={{ backgroundColor: "#555", color: "#fff", fontWeight: "bold", fontSize: "14px" }} />}
    </Button>
  )
}




import LogoutBtn from "@/components/ui/LogoutBtn";
import { CircleUserRound } from "lucide-react";

export function UserMenu() {
  const { user } = useAuth();

  return (
    <div className="mb-0 mt-auto p-4">
      <h3 className="flex items-center justify-center gap-1 pb-2"><CircleUserRound className="w-4.5 text-neutral-500" />{user?.name} さん</h3>
      <div className="flex flex-col gap-2">
        <div className="bg-slate-400 dark:bg-slate-800 rounded-md"><LogoutBtn className="px-10 !py-1 w-full justify-center" /></div>
      </div>
    </div>
  )
}