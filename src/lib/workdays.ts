import { isWeekend, isSameDay, startOfDay } from "date-fns";

// Feriados nacionais BR — lista hardcoded MVP (2025–2026)
// RN-08: excluir sábados, domingos e feriados do cálculo de dias úteis
export const HOLIDAYS: Date[] = [
  // 2025
  new Date(2025, 0, 1),   // Confraternização Universal
  new Date(2025, 2, 3),   // Carnaval — segunda-feira
  new Date(2025, 2, 4),   // Carnaval — terça-feira
  new Date(2025, 3, 18),  // Sexta-feira Santa
  new Date(2025, 3, 21),  // Tiradentes
  new Date(2025, 4, 1),   // Dia do Trabalhador
  new Date(2025, 5, 19),  // Corpus Christi
  new Date(2025, 8, 7),   // Independência do Brasil
  new Date(2025, 9, 12),  // Nossa Senhora Aparecida
  new Date(2025, 10, 2),  // Finados
  new Date(2025, 10, 15), // Proclamação da República
  new Date(2025, 10, 20), // Consciência Negra
  new Date(2025, 11, 25), // Natal
  // 2026
  new Date(2026, 0, 1),   // Confraternização Universal
  new Date(2026, 1, 16),  // Carnaval — segunda-feira
  new Date(2026, 1, 17),  // Carnaval — terça-feira
  new Date(2026, 3, 3),   // Sexta-feira Santa
  new Date(2026, 3, 21),  // Tiradentes
  new Date(2026, 4, 1),   // Dia do Trabalhador
  new Date(2026, 5, 4),   // Corpus Christi
  new Date(2026, 8, 7),   // Independência do Brasil
  new Date(2026, 9, 12),  // Nossa Senhora Aparecida
  new Date(2026, 10, 2),  // Finados
  new Date(2026, 10, 15), // Proclamação da República
  new Date(2026, 10, 20), // Consciência Negra
  new Date(2026, 11, 25), // Natal
];

export function isHoliday(date: Date): boolean {
  return HOLIDAYS.some((h) => isSameDay(h, date));
}

/**
 * Retorna se um dia deve gerar indicador de "pendência" para o usuário.
 * NÃO verifica se o relatório foi preenchido — isso é responsabilidade do chamador.
 * RN-07 + RN-08
 */
export function isPendingDay(date: Date, today: Date): boolean {
  const d = startOfDay(date);
  const t = startOfDay(today);
  if (d >= t) return false;        // hoje ou futuro — nunca pendente
  if (isWeekend(d)) return false;  // fim de semana — nunca pendente
  if (isHoliday(d)) return false;  // feriado — nunca pendente
  return true;
}
