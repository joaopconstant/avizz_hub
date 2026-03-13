"use client";

import { formatCurrency } from "@/lib/formatting";

interface MetaSectionProps {
  cashGoal: number | null;
  cashRealized: number;
  salesGoal: number | null;
  salesCount: number;
  myCashRealized: number | null;
  mySalesCount: number | null;
}

function HeroBar({
  realized,
  goal,
}: {
  realized: number;
  goal: number | null;
}) {
  const pct = goal && goal > 0 ? Math.min((realized / goal) * 100, 100) : 0;
  const pctDisplay =
    goal && goal > 0 ? Math.round((realized / goal) * 100) : null;

  return (
    <div className="relative h-5 rounded-full bg-muted overflow-hidden">
      <div
        className="h-full rounded-full bg-primary transition-all duration-700"
        style={{ width: `${pct}%` }}
      />
      {pctDisplay !== null && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold tabular-nums">
          {pctDisplay}%
        </span>
      )}
    </div>
  );
}

function HeroMetric({
  displayValue,
  displayGoal,
  label,
  realized,
  goal,
  size = "lg",
}: {
  displayValue: string;
  displayGoal?: string;
  label?: string;
  realized: number;
  goal: number | null;
  size?: "lg" | "md" | "sm";
}) {
  const valueClass =
    size === "lg"
      ? "text-3xl font-bold tabular-nums text-primary"
      : size === "md"
        ? "text-2xl font-bold tabular-nums text-primary"
        : "text-xl font-bold tabular-nums";
  const subClass =
    size === "lg"
      ? "text-base text-muted-foreground"
      : size === "md"
        ? "text-sm text-muted-foreground"
        : "text-xs text-muted-foreground";

  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className={valueClass}>{displayValue}</span>
        {displayGoal && <span className={subClass}>{displayGoal}</span>}
        {label && <span className={subClass}>{label}</span>}
      </div>
      <HeroBar realized={realized} goal={goal} />
    </div>
  );
}

export function MetaSection({
  cashGoal,
  cashRealized,
  salesGoal,
  salesCount,
  myCashRealized,
  mySalesCount,
}: MetaSectionProps) {
  const showPersonal = myCashRealized !== null;
  const myCash = myCashRealized ?? 0;

  return (
    <div className="rounded-lg border bg-card p-6 space-y-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Meta da Empresa
      </p>

      <HeroMetric
        displayValue={formatCurrency(cashRealized)}
        displayGoal={
          cashGoal !== null ? `/ ${formatCurrency(cashGoal)}` : undefined
        }
        realized={cashRealized}
        goal={cashGoal}
        size="lg"
      />

      <HeroMetric
        displayValue={String(salesCount)}
        displayGoal={salesGoal !== null ? `/ ${salesGoal} vendas` : undefined}
        realized={salesCount}
        goal={salesGoal}
        size="md"
      />

      {showPersonal && (
        <div className="border-t pt-4 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Minha Performance
          </p>
          <HeroMetric
            displayValue={formatCurrency(myCash)}
            label="meu caixa"
            realized={myCash}
            goal={cashGoal}
            size="sm"
          />
          {mySalesCount !== null && (
            <HeroMetric
              displayValue={String(mySalesCount)}
              label="minhas vendas"
              realized={mySalesCount}
              goal={salesGoal}
              size="sm"
            />
          )}
        </div>
      )}
    </div>
  );
}
