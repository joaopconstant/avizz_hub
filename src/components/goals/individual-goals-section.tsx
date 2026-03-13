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
import { IndividualGoalModal, formatGoalTarget } from "./individual-goal-modal";
import type { UserRole } from "@/lib/generated/prisma/enums";

interface IndividualGoalItem {
  id: string;
  user_id: string;
  goal_id: string;
  cash_goal: number;
  sales_goal: number | null;
  rate_answer: number | null;
  rate_schedule: number | null;
  rate_noshow_max: number | null;
  rate_close: number | null;
  user: {
    id: string;
    name: string;
    role: string;
    avatar_url: string | null;
  };
}

interface IndividualGoalsSectionProps {
  goalId: string;
  individualGoals: IndividualGoalItem[];
  role: UserRole;
  onSaved: () => void;
}

export function IndividualGoalsSection({
  goalId,
  individualGoals,
  role,
  onSaved,
}: IndividualGoalsSectionProps) {
  const isAdmin = role === "admin";
  const [editing, setEditing] = useState<IndividualGoalItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  function openModal(item: IndividualGoalItem) {
    setEditing(item);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
  }

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
              <TableHead className="text-right">Meta Caixa</TableHead>
              <TableHead className="text-right">Meta Vendas</TableHead>
              <TableHead className="text-right">No-Show Máx.</TableHead>
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
                  {formatGoalTarget(ig.cash_goal, "cash")}
                </TableCell>
                <TableCell className="text-right tabular-nums text-sm">
                  {ig.user.role === "sdr"
                    ? "—"
                    : formatGoalTarget(ig.sales_goal, "sales")}
                </TableCell>
                <TableCell className="text-right tabular-nums text-sm">
                  {formatGoalTarget(ig.rate_noshow_max, "rate")}
                </TableCell>
                {isAdmin && (
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openModal(ig)}
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
          open={modalOpen}
          onClose={closeModal}
          onSaved={() => {
            onSaved();
            closeModal();
          }}
          goalId={goalId}
          user={editing.user}
          existing={editing}
        />
      )}
    </>
  );
}
