import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  markClassName?: string;
  compact?: boolean;
  admin?: boolean;
};

export function AuraLeveSymbol({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 72 120"
      aria-hidden="true"
      className={cn("h-12 w-auto text-gold", className)}
      fill="none"
    >
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M36 4v10" strokeWidth="2" />
        <path d="M36 106v10" strokeWidth="2" />
        <path
          d="M18 31c0-17 14-22 18-4 4-18 18-13 18 4 0 20-18 31-18 31S18 51 18 31Z"
          strokeWidth="2.2"
        />
        <path
          d="M18 89c0 17 14 22 18 4 4 18 18 13 18-4 0-20-18-31-18-31S18 69 18 89Z"
          strokeWidth="2.2"
        />
        <path
          d="M10 60c0-28 16-50 26-50s26 22 26 50-16 50-26 50S10 88 10 60Z"
          strokeWidth="1.4"
          opacity="0.42"
        />
      </g>
      <g fill="currentColor">
        <circle cx="36" cy="2" r="2" />
        <circle cx="36" cy="60" r="3" />
        <circle cx="36" cy="118" r="2" />
        <path d="M51 13l1.7 3.7 3.7 1.7-3.7 1.7L51 24.8l-1.7-3.7-3.7-1.7 3.7-1.7L51 13Z" />
        <path d="M21 95l1.2 2.6 2.6 1.2-2.6 1.2-1.2 2.6-1.2-2.6-2.6-1.2 2.6-1.2L21 95Z" />
      </g>
    </svg>
  );
}

export function AuraLeveLogo({ className, markClassName, compact, admin }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5 text-foreground", className)}>
      <AuraLeveSymbol className={cn(compact ? "h-9" : "h-11", markClassName)} />
      {!compact && (
        <div className="leading-none">
          <div className="font-display text-2xl text-foreground">AuraLeve</div>
          <div className="mt-1 text-[0.62rem] font-semibold uppercase text-primary">
            {admin ? "Admin" : "Acessórios Autorais"}
          </div>
        </div>
      )}
    </div>
  );
}
