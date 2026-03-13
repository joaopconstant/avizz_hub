"use client";

import { api } from "@/trpc/react";
import { formatCurrency } from "@/lib/formatting";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AuditLogModalProps {
  goalId: string | null;
  open: boolean;
  onClose: () => void;
}

export function AuditLogModal({ goalId, open, onClose }: AuditLogModalProps) {
  const { data, isLoading } = api.goals.getAuditLog.useQuery(
    { goalId: goalId ?? "" },
    { enabled: !!goalId },
  );

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico de Alterações</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Carregando...
          </p>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Nenhuma alteração registrada para esta meta.
          </p>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Alterado por</TableHead>
                  <TableHead>Meta Caixa</TableHead>
                  <TableHead>Meta Vendas</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.changed_at), "dd/MM/yyyy HH:mm", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.changed_by.name}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.previous_cash !== null && (
                        <span className="text-muted-foreground line-through mr-1">
                          {formatCurrency(log.previous_cash)}
                        </span>
                      )}
                      {log.new_cash !== null && (
                        <span className="font-medium">
                          {formatCurrency(log.new_cash)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.previous_sales_goal !== null && (
                        <span className="text-muted-foreground line-through mr-1">
                          {log.previous_sales_goal}
                        </span>
                      )}
                      {log.new_sales_goal !== null && (
                        <span className="font-medium">
                          {log.new_sales_goal}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {log.reason ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
