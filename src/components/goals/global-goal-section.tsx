"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { formatCurrency } from "@/lib/formatting";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { UserRole } from "@/lib/generated/prisma/enums";

interface SerializedGoal {
  id: string;
  month: string;
  cash_goal: number;
  sales_goal: number;
  created_at: string;
}

interface GlobalGoalSectionProps {
  month: string; // "YYYY-MM-DD"
  goal: SerializedGoal | null;
  role: UserRole;
  onSaved: () => void;
}

function ProgressBar({ realized, goal }: { realized: number; goal: number }) {
  const pct = goal > 0 ? Math.min((realized / goal) * 100, 100) : 0;
  const pctDisplay = goal > 0 ? Math.round((realized / goal) * 100) : null;
  return (
    <div className="relative h-4 rounded-full bg-muted overflow-hidden">
      <div
        className="h-full rounded-full bg-primary transition-all duration-700"
        style={{ width: `${pct}%` }}
      />
      {pctDisplay !== null && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold tabular-nums">
          {pctDisplay}%
        </span>
      )}
    </div>
  );
}

export function GlobalGoalSection({
  month,
  goal,
  role,
  onSaved,
}: GlobalGoalSectionProps) {
  const isAdmin = role === "admin";

  const [cashGoal, setCashGoal] = useState(goal ? String(goal.cash_goal) : "");
  const [salesGoal, setSalesGoal] = useState(
    goal ? String(goal.sales_goal) : "",
  );
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const upsert = api.goals.upsertGoal.useMutation({
    onSuccess: () => {
      setReason("");
      setError(null);
      onSaved();
    },
    onError: (e) => setError(e.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cash = parseFloat(cashGoal);
    const sales = parseInt(salesGoal);
    if (isNaN(cash) || cash <= 0) {
      setError("Meta Caixa deve ser um valor positivo.");
      return;
    }
    if (isNaN(sales) || sales <= 0) {
      setError("Meta de Vendas deve ser um número inteiro positivo.");
      return;
    }
    if (goal && !reason.trim()) {
      setError("Informe o motivo da alteração.");
      return;
    }
    upsert.mutate({
      month,
      cash_goal: cash,
      sales_goal: sales,
      reason: reason || undefined,
    });
  }

  // Leitura para Head
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        {!goal ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma meta definida para este mês.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border bg-card p-5 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Meta Caixa
              </p>
              <p className="text-3xl font-bold tabular-nums text-primary">
                {formatCurrency(goal.cash_goal)}
              </p>
              <ProgressBar realized={0} goal={goal.cash_goal} />
            </div>
            <div className="rounded-lg border bg-card p-5 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Meta de Vendas
              </p>
              <p className="text-3xl font-bold tabular-nums text-primary">
                {goal.sales_goal}
              </p>
              <ProgressBar realized={0} goal={goal.sales_goal} />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Formulário para Admin
  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
      {goal && (
        <div className="rounded-md border bg-muted/30 p-4 text-sm">
          <p className="text-muted-foreground">Meta atual:</p>
          <p className="font-medium mt-1">
            Caixa: {formatCurrency(goal.cash_goal)} · Vendas: {goal.sales_goal}
          </p>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="cash_goal">Meta Caixa (R$)</Label>
        <Input
          id="cash_goal"
          type="number"
          min="0"
          step="0.01"
          placeholder="Ex: 80000"
          value={cashGoal}
          onChange={(e) => setCashGoal(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sales_goal">Meta de Vendas</Label>
        <Input
          id="sales_goal"
          type="number"
          min="1"
          step="1"
          placeholder="Ex: 8"
          value={salesGoal}
          onChange={(e) => setSalesGoal(e.target.value)}
          required
        />
      </div>

      {goal && (
        <div className="space-y-1.5">
          <Label htmlFor="reason">
            Motivo da alteração <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="reason"
            placeholder="Descreva o motivo da alteração da meta..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={upsert.isPending}>
        {upsert.isPending
          ? "Salvando..."
          : goal
            ? "Atualizar Meta"
            : "Criar Meta"}
      </Button>
    </form>
  );
}
