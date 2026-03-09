"use client";

import { useState } from "react";
import type { UserRole } from "@/lib/generated/prisma/enums";

import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { AdvanceForm } from "@/components/advances/advance-form";
import { AdvancesList, type AdvanceRow } from "@/components/advances/advances-list";
import { AdvanceConvertDialog } from "@/components/advances/advance-convert-dialog";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type AdvancesClientProps = {
  role: UserRole;
  userId: string;
};

type StatusFilter = "all" | "active" | "converted";

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Em andamento" },
  { value: "converted", label: "Convertidos" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function AdvancesClient({ role, userId }: AdvancesClientProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAdvance, setEditingAdvance] = useState<AdvanceRow | null>(null);
  const [convertingAdvance, setConvertingAdvance] = useState<AdvanceRow | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const utils = api.useUtils();
  const { data: advances = [], isLoading } = api.advances.listAdvances.useQuery({
    status: statusFilter,
  });

  const deleteAdvance = api.advances.deleteAdvance.useMutation({
    onSuccess: async () => {
      await utils.advances.listAdvances.invalidate();
    },
  });

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este avanço?")) {
      deleteAdvance.mutate({ id });
    }
  };

  const handleConvertSuccess = async () => {
    setConvertingAdvance(null);
    await utils.advances.listAdvances.invalidate();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-4 border-b">
        <div>
          <h1 className="text-xl font-semibold">Avanços</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {advances.length} {advances.length === 1 ? "avanço" : "avanços"}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreateForm(true)}>
          Novo Avanço
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-1 px-6 pt-4">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              statusFilter === tab.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 pt-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
        ) : (
          <AdvancesList
            advances={advances}
            currentUserId={userId}
            currentRole={role}
            onEdit={setEditingAdvance}
            onConvert={setConvertingAdvance}
            onDelete={handleDelete}
            isDeleting={deleteAdvance.isPending}
          />
        )}
      </div>

      {/* Formulário de criação */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 px-4">
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowCreateForm(false)}
          />
          <div className="relative z-10 bg-background ring-1 ring-foreground/10 rounded-xl w-full max-w-lg max-h-[calc(100vh-4rem)] overflow-y-auto shadow-md">
            <div className="p-6">
              <div className="mb-5">
                <h2 className="text-lg font-semibold">Novo Avanço</h2>
                <p className="text-sm text-muted-foreground">
                  Registre um lead em negociação.
                </p>
              </div>
              <AdvanceForm
                onSuccess={() => setShowCreateForm(false)}
                onCancel={() => setShowCreateForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Formulário de edição */}
      {editingAdvance && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 px-4">
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setEditingAdvance(null)}
          />
          <div className="relative z-10 bg-background ring-1 ring-foreground/10 rounded-xl w-full max-w-lg max-h-[calc(100vh-4rem)] overflow-y-auto shadow-md">
            <div className="p-6">
              <div className="mb-5">
                <h2 className="text-lg font-semibold">Editar Avanço</h2>
                <p className="text-sm text-muted-foreground">
                  {editingAdvance.lead_name} · {editingAdvance.company_name}
                </p>
              </div>
              <AdvanceForm
                existingAdvance={{
                  id: editingAdvance.id,
                  lead_name: editingAdvance.lead_name,
                  company_name: editingAdvance.company_name,
                  estimated_value: editingAdvance.estimated_value,
                  deadline: editingAdvance.deadline,
                  lead_score: editingAdvance.lead_score,
                  status_flags: editingAdvance.status_flags,
                  sdr_id: editingAdvance.sdr_id,
                }}
                onSuccess={() => setEditingAdvance(null)}
                onCancel={() => setEditingAdvance(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Dialog de conversão */}
      {convertingAdvance && (
        <AdvanceConvertDialog
          advance={{
            id: convertingAdvance.id,
            lead_name: convertingAdvance.lead_name,
            company_name: convertingAdvance.company_name,
            estimated_value: convertingAdvance.estimated_value,
            sdr_id: convertingAdvance.sdr_id,
          }}
          onSuccess={handleConvertSuccess}
          onClose={() => setConvertingAdvance(null)}
        />
      )}
    </div>
  );
}
