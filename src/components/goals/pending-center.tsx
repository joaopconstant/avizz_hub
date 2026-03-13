"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IndividualGoalModal } from "./individual-goal-modal";
import type { UserRole } from "@/lib/generated/prisma/enums";

interface PendingCenterProps {
  month: string;
  role: UserRole;
  onGoalDefined: () => void;
}

export function PendingCenter({
  month,
  role,
  onGoalDefined,
}: PendingCenterProps) {
  const isAdmin = role === "admin";

  const { data, isLoading, refetch } = api.goals.getPendingCenter.useQuery(
    { month },
    { enabled: true },
  );

  const [addingForUser, setAddingForUser] = useState<{
    id: string;
    name: string;
    role: string;
    avatar_url: string | null;
  } | null>(null);

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-5">
        <p className="text-sm text-muted-foreground">
          Carregando pendências...
        </p>
      </div>
    );
  }

  if (!data) return null;

  const hasPending = data.withoutGoal.length > 0 || data.lateReports.length > 0;

  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Central de Pendências
      </p>

      {!hasPending && (
        <p className="text-sm text-muted-foreground">
          Nenhuma pendência encontrada para este mês.
        </p>
      )}

      {data.withoutGoal.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Colaboradores sem meta definida ({data.withoutGoal.length})
          </p>
          <div className="space-y-2">
            {data.withoutGoal.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{u.name}</span>
                  <Badge variant="secondary" className="capitalize text-xs">
                    {u.role}
                  </Badge>
                </div>
                {isAdmin && data.goalId && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAddingForUser(u)}
                  >
                    Definir Meta
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.lateReports.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Relatórios atrasados</p>
          <div className="space-y-2">
            {data.lateReports.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{u.name}</span>
                  <Badge variant="secondary" className="capitalize text-xs">
                    {u.role}
                  </Badge>
                </div>
                <span className="text-sm text-destructive font-medium">
                  {u.pending_days}{" "}
                  {u.pending_days === 1 ? "dia pendente" : "dias pendentes"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {addingForUser && data.goalId && (
        <IndividualGoalModal
          open={!!addingForUser}
          onClose={() => setAddingForUser(null)}
          onSaved={() => {
            setAddingForUser(null);
            void refetch();
            onGoalDefined();
          }}
          goalId={data.goalId}
          user={addingForUser}
          existing={null}
        />
      )}
    </div>
  );
}
