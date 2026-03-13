"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { IndividualGoalModal } from "./individual-goal-modal";
import { formatPercent } from "@/lib/formatting";
import type { UserRole } from "@/lib/generated/prisma/enums";
import type { IndividualGoalItem } from "./types";

function fmtRate(v: number | null): string {
  return v === null ? "—" : formatPercent(v);
}

interface RatesSectionProps {
  goalId: string;
  individualGoals: IndividualGoalItem[];
  role: UserRole;
  onSaved: () => void;
}

export function RatesSection({
  goalId,
  individualGoals,
  role,
  onSaved,
}: RatesSectionProps) {
  const isAdmin = role === "admin";
  const [editing, setEditing] = useState<IndividualGoalItem | null>(null);

  if (individualGoals.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        Nenhuma meta individual definida para este mês.
      </p>
    );
  }

  return (
    <>
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Colaborador</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Atendimento</TableHead>
              <TableHead className="text-right">Agendamento</TableHead>
              <TableHead className="text-right">No-Show Máx.</TableHead>
              <TableHead className="text-right">Conversão</TableHead>
              {isAdmin && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {individualGoals.map((ig) => (
              <TableRow key={ig.id}>
                <TableCell className="font-medium text-sm">
                  {ig.user.name}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize text-xs">
                    {ig.user.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums text-sm">
                  {ig.user.role === "sdr" ? fmtRate(ig.rate_answer) : "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums text-sm">
                  {ig.user.role === "sdr" ? fmtRate(ig.rate_schedule) : "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums text-sm">
                  {fmtRate(ig.rate_noshow_max)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-sm">
                  {ig.user.role === "closer" ? fmtRate(ig.rate_close) : "—"}
                </TableCell>
                {isAdmin && (
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditing(ig)}
                    >
                      Editar
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editing && (
        <IndividualGoalModal
          key={editing.id}
          open
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            onSaved();
          }}
          goalId={goalId}
          user={editing.user}
          existing={editing}
        />
      )}
    </>
  );
}
