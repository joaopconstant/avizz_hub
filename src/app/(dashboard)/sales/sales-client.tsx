"use client";

import { useState } from "react";
import type { UserRole } from "@/lib/generated/prisma/enums";

import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { RegisterSaleModal } from "@/components/sales/register-sale-modal";
import { SalesList } from "@/components/sales/sales-list";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Types ────────────────────────────────────────────────────────────────────

type SalesClientProps = {
  role: UserRole;
  userId: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function SalesClient({ role, userId }: SalesClientProps) {
  const [showForm, setShowForm] = useState(false);
  const [filterUserId, setFilterUserId] = useState<string>(userId);

  const isAdminOrHead = ["admin", "head"].includes(role);
  const utils = api.useUtils();

  const { data: sales = [], isLoading } = api.sales.listSales.useQuery({
    userId: filterUserId !== userId ? filterUserId : undefined,
  });

  const { data: users = [] } = api.reports.listUsers.useQuery(undefined, {
    enabled: isAdminOrHead,
  });

  const deleteSale = api.sales.deleteSale.useMutation({
    onSuccess: async () => {
      await utils.sales.listSales.invalidate();
    },
  });

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta venda?")) {
      deleteSale.mutate({ id });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-4 border-b">
        <div>
          <h1 className="text-xl font-semibold">Vendas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {sales.length} {sales.length === 1 ? "venda registrada" : "vendas registradas"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isAdminOrHead && users.length > 0 && (
            <Select
              value={filterUserId}
              onValueChange={setFilterUserId}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por usuário..." />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                    {u.id === userId && " (você)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button size="sm" onClick={() => setShowForm(true)}>
            Nova Venda
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
        ) : (
          <SalesList
            sales={sales}
            onDelete={handleDelete}
            isDeleting={deleteSale.isPending}
          />
        )}
      </div>

      {/* Modal de registro de venda */}
      {showForm && (
        <RegisterSaleModal
          mode="create"
          onSuccess={() => setShowForm(false)}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
