import { TbReload } from "react-icons/tb";

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
    green: "bg-emerald-400",
    yellow: "bg-amber-400",
    red: "bg-rose-400",
  }[health];

  return (
    <div className="flex items-center gap-2 rounded-full bg-neutral-200 px-1.75 py-0.75 dark:bg-neutral-500">
      <span className={`h-2.5 w-2.5 rounded-full ${healthClass}`} />

      <span className="mr-1 text-xs">{status}</span>

      {status !== "SUBSCRIBED" && (
        <button
          type="button"
          onClick={onResubscribe}
          className="flex items-center gap-1 rounded-full bg-neutral-400 px-2 py-0.25 pr-3 text-xs text-white hover:opacity-80 dark:bg-neutral-600"
        >
          <TbReload />
          再購読
        </button>
      )}
    </div>
  );
}