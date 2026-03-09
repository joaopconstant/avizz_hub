"use client";

import { api } from "@/trpc/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatting";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

// ─── Types ────────────────────────────────────────────────────────────────────

type SaleRow = {
  id: string;
  sale_date: string;
  client_name: string;
  client_company: string;
  contract_value: number;
  payment_method: string;
  cash_value: number;
  net_value: number;
  counts_as_sale: boolean;
  sale_origin: string;
  is_recovered: boolean;
  product: { name: string };
  closer: { name: string };
  sdr: { name: string } | null;
};

type SalesListProps = {
  sales: SaleRow[];
  currentUserId: string;
  currentRole: string;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PAYMENT_LABELS: Record<string, string> = {
  pix: "PIX",
  card: "Cartão",
  boleto: "Boleto",
};

const ORIGIN_LABELS: Record<string, string> = {
  organic: "Orgânico",
  referral: "Indicação",
  outbound: "Outbound",
  advance: "Avanço",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function SalesList({
  sales,
  currentUserId,
  currentRole,
  onDelete,
  isDeleting,
}: SalesListProps) {
  const isAdminOrHead = ["admin", "head"].includes(currentRole);

  if (sales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-muted-foreground">Nenhuma venda registrada ainda.</p>
        <p className="text-xs text-muted-foreground mt-1">
          Clique em "Nova Venda" para registrar.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-3 pr-4 font-medium text-muted-foreground text-xs whitespace-nowrap">Data</th>
            <th className="pb-3 pr-4 font-medium text-muted-foreground text-xs whitespace-nowrap">Cliente / Empresa</th>
            <th className="pb-3 pr-4 font-medium text-muted-foreground text-xs whitespace-nowrap">Produto</th>
            <th className="pb-3 pr-4 font-medium text-muted-foreground text-xs whitespace-nowrap text-right">Valor</th>
            <th className="pb-3 pr-4 font-medium text-muted-foreground text-xs whitespace-nowrap text-right">Caixa</th>
            <th className="pb-3 pr-4 font-medium text-muted-foreground text-xs whitespace-nowrap">Pagamento</th>
            <th className="pb-3 pr-4 font-medium text-muted-foreground text-xs whitespace-nowrap">Origem</th>
            <th className="pb-3 font-medium text-muted-foreground text-xs whitespace-nowrap">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {sales.map((sale) => {
            const canDelete =
              isAdminOrHead || sale.closer.name === currentUserId;
            const formattedDate = format(parseISO(sale.sale_date), "dd/MM/yyyy", { locale: ptBR });

            return (
              <tr key={sale.id} className="group hover:bg-muted/30">
                <td className="py-3 pr-4 text-xs text-muted-foreground whitespace-nowrap">
                  {formattedDate}
                </td>
                <td className="py-3 pr-4">
                  <p className="font-medium text-sm leading-tight">{sale.client_name}</p>
                  <p className="text-xs text-muted-foreground leading-tight">{sale.client_company}</p>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm">{sale.product.name}</span>
                    {!sale.counts_as_sale && (
                      <Badge variant="outline" className="w-fit text-[10px] py-0">
                        Upsell
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="py-3 pr-4 text-right tabular-nums font-medium whitespace-nowrap">
                  {formatCurrency(sale.contract_value)}
                </td>
                <td className="py-3 pr-4 text-right tabular-nums text-muted-foreground whitespace-nowrap">
                  {formatCurrency(sale.cash_value)}
                </td>
                <td className="py-3 pr-4 text-xs text-muted-foreground whitespace-nowrap">
                  {PAYMENT_LABELS[sale.payment_method] ?? sale.payment_method}
                </td>
                <td className="py-3 pr-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">
                      {ORIGIN_LABELS[sale.sale_origin] ?? sale.sale_origin}
                    </span>
                    {sale.is_recovered && (
                      <Badge variant="secondary" className="w-fit text-[10px] py-0">
                        Recuperada
                      </Badge>
                    )}
                    {sale.sdr && (
                      <span className="text-[10px] text-muted-foreground">
                        SDR: {sale.sdr.name}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive text-xs h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onDelete(sale.id)}
                    disabled={isDeleting}
                  >
                    Excluir
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
