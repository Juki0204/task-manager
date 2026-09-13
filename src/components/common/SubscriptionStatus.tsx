import { RefreshCcw } from "lucide-react";

type SubscriptionStatusProps = {
  health: "green" | "yellow" | "red";
  status: string;
  onResubscribe: () => void;
};

export function SubscriptionStatus({
  health,
  status,
  onResubscribe,
}: SubscriptionStatusProps) {
  const healthClass = {
    green: "bg-emerald-400 text-neutral-700",
    yellow: "bg-amber-400 text-neutral-700",
    red: "bg-rose-400 text-neutral-700",
  }[health];

  return (
    <div className={`h-8 flex items-center gap-2 rounded-full px-4 py-0.75 font-bold text-neutral-700 ${healthClass} ${status !== "SUBSCRIBED" ? "pr-1" : ""}`}>
      {/* <span className={`h-2.5 w-2.5 rounded-full ${healthClass}`} /> */}

      <span className="text-xs">{status}</span>

      {status !== "SUBSCRIBED" && (
        <button
          type="button"
          onClick={onResubscribe}
          className="flex items-center gap-1 rounded-full bg-neutral-600 px-2 py-0.25 pr-3 ml-1 text-xs text-white hover:opacity-80"
        >
          <RefreshCcw className="w-3.5" />
          再購読
        </button>
      )}
    </div>
  );
}