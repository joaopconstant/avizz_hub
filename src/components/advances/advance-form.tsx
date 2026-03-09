"use client";

import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { format } from "date-fns";

import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ADVANCE_STATUS_FLAGS } from "@/lib/constants";

// ─── Types ────────────────────────────────────────────────────────────────────

type FormValues = {
  lead_name: string;
  company_name: string;
  estimated_value: string;
  deadline: string;
  lead_score: number;
  status_flags: string[];
  sdr_id: string;
};

type ExistingAdvance = {
  id: string;
  lead_name: string;
  company_name: string;
  estimated_value: number;
  deadline: string | null;
  lead_score: number;
  status_flags: string[];
  sdr_id?: string | null;
};

type AdvanceFormProps = {
  existingAdvance?: ExistingAdvance | null;
  report_id?: string;
  onSuccess: () => void;
  onCancel: () => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function AdvanceForm({ existingAdvance, report_id, onSuccess, onCancel }: AdvanceFormProps) {
  const utils = api.useUtils();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      lead_name: existingAdvance?.lead_name ?? "",
      company_name: existingAdvance?.company_name ?? "",
      estimated_value: existingAdvance ? String(existingAdvance.estimated_value) : "",
      deadline: existingAdvance?.deadline ?? "",
      lead_score: existingAdvance?.lead_score ?? 0,
      status_flags: existingAdvance?.status_flags ?? [],
      sdr_id: existingAdvance?.sdr_id ?? "",
    },
  });

  useEffect(() => {
    if (existingAdvance) {
      reset({
        lead_name: existingAdvance.lead_name,
        company_name: existingAdvance.company_name,
        estimated_value: String(existingAdvance.estimated_value),
        deadline: existingAdvance.deadline ?? "",
        lead_score: existingAdvance.lead_score,
        status_flags: existingAdvance.status_flags,
        sdr_id: existingAdvance.sdr_id ?? "",
      });
    }
  }, [existingAdvance, reset]);

  const { data: sdrs = [] } = api.sales.listSdrs.useQuery();

  const leadScore = watch("lead_score");
  const statusFlags = watch("status_flags");

  const createAdvance = api.advances.createAdvance.useMutation({
    onSuccess: async () => {
      await utils.advances.listAdvances.invalidate();
      onSuccess();
    },
  });

  const updateAdvance = api.advances.updateAdvance.useMutation({
    onSuccess: async () => {
      await utils.advances.listAdvances.invalidate();
      onSuccess();
    },
  });

  const mutation = existingAdvance ? updateAdvance : createAdvance;

  const toggleFlag = (value: string) => {
    const current = statusFlags ?? [];
    if (current.includes(value)) {
      setValue("status_flags", current.filter((f) => f !== value));
    } else {
      setValue("status_flags", [...current, value]);
    }
  };

  const onSubmit = (values: FormValues) => {
    const estimatedValue = parseFloat(values.estimated_value);
    if (isNaN(estimatedValue) || estimatedValue <= 0) return;

    const payload = {
      lead_name: values.lead_name,
      company_name: values.company_name,
      estimated_value: estimatedValue,
      deadline: values.deadline || undefined,
      lead_score: values.lead_score,
      status_flags: values.status_flags,
      sdr_id: values.sdr_id || undefined,
    };

    if (existingAdvance) {
      updateAdvance.mutate({ id: existingAdvance.id, data: payload });
    } else {
      createAdvance.mutate({ ...payload, report_id });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

      {/* Lead e Empresa */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="lead_name" className="text-xs">Nome do Lead *</Label>
          <Input
            id="lead_name"
            type="text"
            placeholder="Nome completo"
            {...register("lead_name")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="company_name" className="text-xs">Empresa *</Label>
          <Input
            id="company_name"
            type="text"
            placeholder="Nome da empresa"
            {...register("company_name")}
          />
        </div>
      </div>

      {/* Valor e Deadline */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="estimated_value" className="text-xs">Valor Estimado (R$) *</Label>
          <Input
            id="estimated_value"
            type="number"
            min={0}
            step={0.01}
            placeholder="0,00"
            {...register("estimated_value")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="deadline" className="text-xs">Prazo (opcional)</Label>
          <Input
            id="deadline"
            type="date"
            {...register("deadline")}
          />
        </div>
      </div>

      {/* Score */}
      <div className="space-y-1.5">
        <Label className="text-xs">Score do Lead</Label>
        <div className="flex gap-1.5">
          {[0, 1, 2, 3, 4, 5].map((score) => (
            <button
              key={score}
              type="button"
              onClick={() => setValue("lead_score", score)}
              className={cn(
                "flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                leadScore === score
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-muted border-input text-foreground",
              )}
            >
              {score}
            </button>
          ))}
        </div>
      </div>

      {/* Status Flags */}
      <div className="space-y-2">
        <Label className="text-xs">Status do Avanço</Label>
        <div className="flex flex-wrap gap-2">
          {ADVANCE_STATUS_FLAGS.map((flag) => {
            const isActive = statusFlags?.includes(flag.value);
            return (
              <button
                key={flag.value}
                type="button"
                onClick={() => toggleFlag(flag.value)}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted border-input text-foreground",
                )}
              >
                {flag.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* SDR */}
      {sdrs.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs">SDR (opcional)</Label>
          <Select
            value={watch("sdr_id")}
            onValueChange={(v) => setValue("sdr_id", v === "__none" ? "" : v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Nenhum SDR..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">Nenhum</SelectItem>
              {sdrs.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Erro */}
      {mutation.error && (
        <p className="text-xs text-destructive">{mutation.error.message}</p>
      )}

      {/* Ações */}
      <div className="flex gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onCancel}
          disabled={isSubmitting || mutation.isPending}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          size="sm"
          className="flex-1"
          disabled={isSubmitting || mutation.isPending}
        >
          {mutation.isPending
            ? "Salvando..."
            : existingAdvance
              ? "Atualizar Avanço"
              : "Registrar Avanço"}
        </Button>
      </div>
    </form>
  );
}
