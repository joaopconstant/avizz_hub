"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { format, startOfMonth, subMonths, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlobalGoalSection } from "./global-goal-section";
import { IndividualGoalsSection } from "./individual-goals-section";
import { RatesSection } from "./rates-section";
import { AuditLogModal } from "./audit-log-modal";
import { PendingCenter } from "./pending-center";
import { MonthAccordion } from "./month-accordion";
import { IndividualGoalModal } from "./individual-goal-modal";
import type { UserRole } from "@/lib/generated/prisma/enums";
import { ChevronLeft, ChevronRight, History } from "lucide-react";

// ─── Botão para adicionar meta a colaborador sem meta ──────────────────────

function AddIndividualGoalButton({
  goalId,
  month,
  existingUserIds,
  onSaved,
}: {
  goalId: string;
  month: string;
  existingUserIds: string[];
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    name: string;
    role: string;
    avatar_url: string | null;
  } | null>(null);

  const { data } = api.goals.getPendingCenter.useQuery({ month });

  const availableUsers = (data?.withoutGoal ?? []).filter(
    (u) => !existingUserIds.includes(u.id),
  );

  if (availableUsers.length === 0) return null;

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        {availableUsers.map((u) => (
          <Button
            key={u.id}
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedUser(u);
              setOpen(true);
            }}
          >
            + {u.name}
          </Button>
        ))}
      </div>
      {selectedUser && (
        <IndividualGoalModal
          key={selectedUser.id}
          open={open}
          onClose={() => {
            setOpen(false);
            setSelectedUser(null);
          }}
          onSaved={() => {
            setOpen(false);
            setSelectedUser(null);
            onSaved();
          }}
          goalId={goalId}
          user={selectedUser}
          existing={null}
        />
      )}
    </>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────

interface GoalsClientProps {
  role: UserRole;
}

export function GoalsClient({ role }: GoalsClientProps) {
  const [selectedMonth, setSelectedMonth] = useState<Date>(
    startOfMonth(new Date()),
  );
  const [auditOpen, setAuditOpen] = useState(false);

  const monthStr = format(selectedMonth, "yyyy-MM-dd");

  const { data, isLoading, refetch } = api.goals.getGoalForMonth.useQuery({
    month: monthStr,
  });

  function prevMonth() {
    setSelectedMonth((m) => startOfMonth(subMonths(m, 1)));
  }

  function nextMonth() {
    const next = startOfMonth(addMonths(selectedMonth, 1));
    if (next <= startOfMonth(new Date())) {
      setSelectedMonth(next);
    }
  }

  const isCurrentMonth =
    format(selectedMonth, "yyyy-MM") === format(new Date(), "yyyy-MM");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestão de Metas</h1>
          <p className="text-sm text-muted-foreground">
            {role === "head"
              ? "Visualização das metas — edição exclusiva do admin"
              : "Configure as metas globais e individuais da equipe"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-35 text-center text-sm font-medium capitalize">
            {format(selectedMonth, "MMMM yyyy", { locale: ptBR })}
          </span>
          <Button
            size="icon"
            variant="outline"
            onClick={nextMonth}
            disabled={isCurrentMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {data?.goal && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAuditOpen(true)}
              className="gap-2"
            >
              <History className="h-4 w-4" />
              Histórico
            </Button>
          )}
        </div>
      </div>

      {/* Conteúdo principal */}
      {isLoading ? (
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          Carregando...
        </div>
      ) : (
        <Tabs defaultValue="global" className="space-y-4">
          <TabsList>
            <TabsTrigger value="global">Meta Geral</TabsTrigger>
            <TabsTrigger value="individual" disabled={!data?.goal}>
              Metas Individuais
            </TabsTrigger>
            <TabsTrigger value="rates" disabled={!data?.goal}>
              Taxas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="global" className="space-y-4">
            <div className="rounded-lg border bg-card p-5">
              <GlobalGoalSection
                key={monthStr}
                month={monthStr}
                goal={data?.goal ?? null}
                role={role}
                onSaved={() => void refetch()}
              />
            </div>
          </TabsContent>

          <TabsContent value="individual" className="space-y-4">
            {data?.goal && (
              <div className="rounded-lg border bg-card p-5 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-sm font-medium">Metas Individuais</p>
                  {role === "admin" && (
                    <AddIndividualGoalButton
                      goalId={data.goal.id}
                      month={monthStr}
                      existingUserIds={data.individualGoals.map(
                        (ig) => ig.user_id,
                      )}
                      onSaved={() => void refetch()}
                    />
                  )}
                </div>
                <IndividualGoalsSection
                  goalId={data.goal.id}
                  individualGoals={data.individualGoals}
                  role={role}
                  onSaved={() => void refetch()}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="rates" className="space-y-4">
            {data?.goal && (
              <div className="rounded-lg border bg-card p-5 space-y-4">
                <p className="text-sm font-medium">Taxas por Colaborador</p>
                <RatesSection
                  goalId={data.goal.id}
                  individualGoals={data.individualGoals}
                  role={role}
                  onSaved={() => void refetch()}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Central de Pendências */}
      <PendingCenter
        month={monthStr}
        role={role}
        onGoalDefined={() => void refetch()}
      />

      {/* Histórico de meses anteriores */}
      <MonthAccordion currentMonth={monthStr} />

      {/* Modal de auditoria */}
      {data?.goal && (
        <AuditLogModal
          goalId={data.goal.id}
          open={auditOpen}
          onClose={() => setAuditOpen(false)}
        />
      )}
    </div>
  );
}
