import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { AuraLeveSymbol } from "@/components/AuraLeveLogo";
import { cn } from "@/lib/utils";

const toneClasses = {
  primary: "bg-primary/10 text-primary ring-primary/20",
  gold: "bg-champagne text-primary ring-border",
  danger: "bg-destructive/10 text-destructive ring-destructive/20",
  neutral: "bg-muted text-muted-foreground ring-border",
};

export const adminInputClass =
  "aura-input shadow-none disabled:cursor-not-allowed disabled:opacity-60";

export const adminButtonClass = "aura-button min-h-10 px-4 py-2";

export const adminSecondaryButtonClass = "aura-button-outline min-h-10 px-4 py-2";

export const adminTableHeaderClass =
  "bg-champagne/48 text-left text-[11px] font-bold uppercase text-muted-foreground";

export const adminTableCellClass = "px-4 py-3 align-middle";

export function AdminPageHeader({
  title,
  description,
  eyebrow,
  action,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex min-w-0 flex-col gap-3 border-b border-border/70 pb-4 sm:mb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-4 sm:pb-5">
      <div className="min-w-0">
        {eyebrow ? <span className="aura-eyebrow">{eyebrow}</span> : null}
        <h1 className="mt-1 break-words font-display text-3xl text-foreground md:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:mt-2">{description}</p>
        ) : null}
      </div>
      {action ? (
        <div className="w-full shrink-0 sm:w-auto [&_button]:w-full sm:[&_button]:w-auto">
          {action}
        </div>
      ) : null}
    </div>
  );
}

export function AdminPanel({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("aura-card max-w-full overflow-hidden", className)}>
      {(title || description) && (
        <div className="border-b border-border/70 px-4 py-3 sm:px-5 sm:py-4">
          {title ? <h2 className="font-display text-2xl text-foreground">{title}</h2> : null}
          {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
        </div>
      )}
      {children}
    </section>
  );
}

export function AdminMetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: React.ReactNode;
  helper?: string;
  icon: LucideIcon;
  tone?: keyof typeof toneClasses;
}) {
  return (
    <div className="aura-card min-w-0 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">{label}</p>
          <div className="mt-2 break-words text-2xl font-semibold text-foreground">{value}</div>
        </div>
        <span
          className={cn(
            "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md ring-1",
            toneClasses[tone],
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
      {helper ? <p className="mt-3 text-xs text-muted-foreground">{helper}</p> : null}
    </div>
  );
}

export function AdminEmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden px-4 py-10 text-center sm:px-6 sm:py-14">
      <AuraLeveSymbol className="aura-symbol-watermark absolute right-8 top-6 h-32" />
      <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-md bg-champagne text-primary">
        <Icon className="h-7 w-7" />
      </span>
      <h3 className="relative mt-4 font-display text-2xl text-foreground">{title}</h3>
      {description ? (
        <p className="relative mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="relative mt-5">{action}</div> : null}
    </div>
  );
}

export function AdminIconButton({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition hover:bg-champagne hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:w-9",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function AdminBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: keyof typeof toneClasses;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-md px-2.5 py-1 text-xs font-bold ring-1",
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  );
}
