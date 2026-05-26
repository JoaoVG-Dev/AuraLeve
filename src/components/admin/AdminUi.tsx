import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

const toneClasses = {
  primary: "bg-primary/10 text-primary ring-primary/15",
  gold: "bg-gold/15 text-gold-foreground ring-gold/25",
  danger: "bg-destructive/10 text-destructive ring-destructive/15",
  neutral: "bg-muted text-muted-foreground ring-border",
};

export const adminInputClass =
  "w-full max-w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15";

export const adminTableHeaderClass =
  "bg-muted/60 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground";

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
        {eyebrow ? (
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
            {eyebrow}
          </span>
        ) : null}
        <h1 className="mt-1 break-words font-display text-xl text-primary sm:text-2xl md:text-3xl">
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
    <section
      className={cn(
        "max-w-full overflow-hidden rounded-xl border border-border bg-card shadow-sm",
        className,
      )}
    >
      {(title || description) && (
        <div className="border-b border-border/70 px-4 py-3 sm:px-5 sm:py-4">
          {title ? <h2 className="text-sm font-semibold text-foreground">{title}</h2> : null}
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
    <div className="min-w-0 rounded-xl border border-border bg-card p-3 shadow-sm sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {label}
          </p>
          <div className="mt-2 break-words text-xl font-semibold text-foreground sm:text-2xl">
            {value}
          </div>
        </div>
        <span
          className={cn(
            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 sm:h-10 sm:w-10",
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
    <div className="flex flex-col items-center justify-center px-4 py-8 text-center sm:px-6 sm:py-12">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-primary">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
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
        "inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-accent hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:w-9",
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
        "inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  );
}
