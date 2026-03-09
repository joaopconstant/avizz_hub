"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { RegisterSaleModal } from "@/components/sales/register-sale-modal";
import { formatCurrency } from "@/lib/formatting";

// ─── Types ────────────────────────────────────────────────────────────────────

type AdvanceData = {
  id: string;
  lead_name: string;
  company_name: string;
  estimated_value: number;
  sdr_id?: string | null;
};

type AdvanceConvertDialogProps = {
  advance: AdvanceData;
  onSuccess: () => void;
  onClose: () => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function AdvanceConvertDialog({
  advance,
  onSuccess,
  onClose,
}: AdvanceConvertDialogProps) {
  const [step, setStep] = useState<"confirm" | "form">("confirm");

  if (step === "confirm") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="relative z-10 bg-background ring-1 ring-foreground/10 rounded-xl p-6 w-full max-w-sm shadow-md">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Converter em Venda</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Você está convertendo o avanço abaixo em uma venda. Esta ação é
              irreversível.
            </p>
          </div>

          <div className="rounded-lg bg-muted/50 border p-3 mb-5 space-y-1">
            <p className="text-sm font-medium">{advance.lead_name}</p>
            <p className="text-xs text-muted-foreground">{advance.company_name}</p>
            <p className="text-sm font-semibold mt-1">
              {formatCurrency(advance.estimated_value)}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button size="sm" className="flex-1" onClick={() => setStep("form")}>
              Continuar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Abre o RegisterSaleModal em modo "convert" — já traz o stepper completo
  return (
    <RegisterSaleModal
      mode="convert"
      advance_id={advance.id}
      prefill={{
        client_name: advance.lead_name,
        client_company: advance.company_name,
        sdr_id: advance.sdr_id ?? undefined,
      }}
      onSuccess={onSuccess}
      onClose={onClose}
    />
  );
}
