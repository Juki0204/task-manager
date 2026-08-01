import SideMenu from "@/components/SideMenu";
import { type ReactNode, type MouseEventHandler, useState } from "react";

type PageLayoutProps = {
  children: ReactNode;

  // タイトル部分
  title: ReactNode;
  titleAddon?: ReactNode;
  actions?: ReactNode;

  // 外側wrapper調整
  overflowX?: "hidden" | "clip" | "auto";

  // 例外調整用
  className?: string;
  headerClassName?: string;
  titleAreaClassName?: string;

  onClick?: MouseEventHandler<HTMLElement>;
};

const overflowClasses = {
  hidden: "overflow-x-hidden",
  clip: "overflow-x-clip",
  auto: "overflow-x-auto",
};

const SideMenuToggleClass = {
  open: "pl-64",
  close: "pl-12",
}

export function PageLayout({
  children,
  title,
  titleAddon,
  actions,
  overflowX = "hidden",
  className = "",
  headerClassName = "",
  titleAreaClassName = "",
  onClick,
}: PageLayoutProps) {
  const [isSideMenuOpen, setIsSideMenuOpen] = useState<boolean>(true);

  return (
    <main
      onClick={onClick}
      className={[
        "relative mx-auto text-neutral-700 dark:text-neutral-100",
        "py-2 pr-4 max-w-[1920px] duration-300 transition-[padding]",
        `${isSideMenuOpen ? "!pl-64" : "!pl-14"}`,
        overflowClasses[overflowX],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <SideMenu onClick={() => setIsSideMenuOpen(!isSideMenuOpen)} isSideMenuOpen={isSideMenuOpen} />

      <header
        className={[
          "mb-2 flex min-w-375 justify-between gap-4",
          "border-b-2 border-neutral-300 p-1 pb-2",
          "dark:border-neutral-700",
          headerClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div
          className={[
            "flex min-w-0 items-center justify-start gap-4",
            titleAreaClassName,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <h1 className="flex items-center gap-1 text-center text-xl font-bold">
            {title}
          </h1>

          {titleAddon}
        </div>

        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </header>

      {children}
    </main>
  );
}