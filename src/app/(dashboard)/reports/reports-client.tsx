"use client";

import { useState } from "react";
import { format, addMonths, subMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import { api } from "@/trpc/react";
import type { UserRole } from "@/lib/generated/prisma/enums";
import { ReportCalendar } from "@/components/reports/report-calendar";
import { ReportForm } from "@/components/reports/report-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ReportsClientProps = {
  role: UserRole;
  userId: string;
};

export function ReportsClient({ role, userId }: ReportsClientProps) {
  const canViewOthers = role === "admin" || role === "head";

  const [currentMonth, setCurrentMonth] = useState(() =>
    format(new Date(), "yyyy-MM"),
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [targetUserId, setTargetUserId] = useState<string>(userId);

  const isViewingOwn = targetUserId === userId;

  // Carrega lista de usuários para admin/head
  const { data: users } = api.reports.listUsers.useQuery(undefined, {
    enabled: canViewOthers,
  });

  // Carrega calendário do mês
  const { data: days, isLoading } = api.reports.getMonthCalendar.useQuery({
    month: currentMonth,
    userId: targetUserId !== userId ? targetUserId : undefined,
  });

  const selectedDay = days?.find((d) => d.date === selectedDate) ?? null;

  const monthLabel = format(
    parseISO(`${currentMonth}-01`),
    "MMMM 'de' yyyy",
    { locale: ptBR },
  );

  const handlePrevMonth = () => {
    setCurrentMonth((m) => format(subMonths(parseISO(`${m}-01`), 1), "yyyy-MM"));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentMonth((m) => format(addMonths(parseISO(`${m}-01`), 1), "yyyy-MM"));
    setSelectedDate(null);
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate((prev) => (prev === date ? null : date));
  };

  // Determina o role do usuário alvo (para mostrar campos corretos no form)
  const targetUser = canViewOthers ? users?.find((u) => u.id === targetUserId) : null;
  const targetRole: UserRole = targetUser?.role ?? role;

  // Conta pendências no mês
  const pendingCount = days?.filter((d) => d.isPending).length ?? 0;

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold capitalize">{monthLabel}</h1>
          {pendingCount > 0 && (
            <p className="text-sm text-destructive mt-0.5">
              {pendingCount} {pendingCount === 1 ? "relatório pendente" : "relatórios pendentes"}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Seletor de usuário — admin/head apenas */}
          {canViewOthers && users && (
            <Select
              value={targetUserId}
              onValueChange={(v) => {
                setTargetUserId(v);
                setSelectedDate(null);
              }}
            >
              <SelectTrigger className="w-48 h-8 text-xs">
                <SelectValue placeholder="Selecionar usuário" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id} className="text-xs">
                    {u.name}
                    {u.id === userId && " (eu)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Navegação de mês */}
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={handlePrevMonth}>
              ‹
            </Button>
            <Button variant="outline" size="sm" onClick={handleNextMonth}>
              ›
            </Button>
          </div>
        </div>
      </div>

      {/* Layout principal */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 flex-1 min-h-0">
        {/* Calendário */}
        <Card className="p-5">
          {isLoading ? (
            <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
              Carregando...
            </div>
          ) : days ? (
            <ReportCalendar
              days={days}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
            />
          ) : null}
        </Card>

        {/* Painel do formulário */}
        <Card className="p-5 flex flex-col">
          {!selectedDate ? (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground text-center">
              Selecione um dia no calendário para preencher ou visualizar o relatório.
            </div>
          ) : selectedDay?.isHoliday && !selectedDay.report ? (
            <div className="flex flex-1 items-center justify-center flex-col gap-2 text-center">
              <p className="text-sm font-medium">Feriado nacional</p>
              <p className="text-xs text-muted-foreground">
                O preenchimento é voluntário neste dia.
              </p>
              <ReportForm
                date={selectedDate}
                role={targetRole}
                existingReport={null}
                isReadOnly={!isViewingOwn}
                onSuccess={() => setSelectedDate(null)}
              />
            </div>
          ) : (
            <ReportForm
              date={selectedDate}
              role={targetRole}
              existingReport={selectedDay?.report ?? null}
              isReadOnly={!isViewingOwn}
              onSuccess={() => {
                // mantém a seleção para feedback visual
              }}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
