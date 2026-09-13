import { Button } from "@headlessui/react";
import { FaClipboardList } from "react-icons/fa6";
import { useRuleContext } from "../rule/RuleProvider";
import { useMemo } from "react";
import { useAuth } from "@/app/AuthProvider";

interface RuleBoardLinkBtnProps {
  className?: string;
  pathname: string;
  onClick: () => void;
}

export default function RuleBoardLinkBtn({ className, pathname, onClick }: RuleBoardLinkBtnProps) {
  const { rules, ruleAcknowledgements } = useRuleContext();
  const { user } = useAuth();

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
      className={`flex items-center gap-2 p-3 text-sm font-bold data-hover:bg-neutral-100 transition-all duration-100 ${pathname === "/rule" ? "bg-neutral-100" : "cursor-pointer"}`}
      onClick={onClick}
    >
      <div className="relative">
        <FaClipboardList className="text-lg" />
        {unconfirmedRuleCount > 0 && (<div className="absolute -top-1 -right-1 pb-0.5 grid place-content-center text-[10px] bg-red-600 leading-none text-white font-bold w-3.5 h-3.5 rounded-full">{unconfirmedRuleCount}</div>)}
      </div>
      <span className="">掲示板</span>
    </Button>
  )
}