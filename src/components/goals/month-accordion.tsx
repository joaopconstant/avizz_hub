"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { formatCurrency } from "@/lib/formatting";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AuditLogModal } from "./audit-log-modal";

interface MonthAccordionProps {
  currentMonth: string; // excluir do histórico (já exibido nas tabs acima)
}

export function MonthAccordion({ currentMonth }: MonthAccordionProps) {
  const { data: goals, isLoading } = api.goals.listGoals.useQuery();
  const [auditGoalId, setAuditGoalId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-5">
        <p className="text-sm text-muted-foreground">Carregando histórico...</p>
      </div>
    );
  }

  // Filtrar meses anteriores ao mês atual
  const pastGoals = (goals ?? []).filter(
    (g) => g.month.substring(0, 7) !== currentMonth.substring(0, 7),
  );

  if (pastGoals.length === 0) {
    return null;
  }

  return (
    <>
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Histórico de Meses
        </p>

        <Accordion type="multiple" className="space-y-1">
          {pastGoals.map((g) => (
            <AccordionItem
              key={g.id}
              value={g.id}
              className="border rounded-md px-3"
            >
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="flex items-center justify-between w-full pr-2">
                  <span className="text-sm font-medium capitalize">
                    {format(new Date(g.month), "MMMM yyyy", { locale: ptBR })}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatCurrency(g.cash_goal)} · {g.sales_goal} vendas ·{" "}
                    {g.individualGoalsCount} metas individuais
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="rounded-md border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Meta Caixa</p>
                    <p className="font-medium">{formatCurrency(g.cash_goal)}</p>
                  </div>
                  <div className="rounded-md border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Meta Vendas</p>
                    <p className="font-medium">{g.sales_goal}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAuditGoalId(g.id)}
                >
                  Ver Histórico de Alterações
                </Button>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <AuditLogModal
        goalId={auditGoalId}
        open={!!auditGoalId}
        onClose={() => setAuditGoalId(null)}
      />
    </>
  );
}
