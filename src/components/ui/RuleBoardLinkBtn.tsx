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
    <div className="relative">
      <Button
        tabIndex={-1}
        className={`flex items-center gap-1 rounded px-3 py-1.25 min-[1700px]:px-4 text-sm font-bold data-hover:bg-blue-500/50 transition-all duration-100 ${pathname === "/rule" ? "bg-blue-500/50" : "cursor-pointer"}`}
        onClick={onClick}
      >
        {unconfirmedRuleCount > 0 ? (
          <div className="pb-0.5 grid place-content-center text-xs bg-red-600 leading-none text-white font-bold w-4.5 h-4.5 rounded-full">{unconfirmedRuleCount}</div>
        ) : (
          <><FaClipboardList className="text-base" /></>
        )}<span className="hidden min-[1700px]:block">掲示板</span>
      </Button>
    </div>
  )
}