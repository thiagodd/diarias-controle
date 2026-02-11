import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isWeekend,
  getYear,
  getMonth,
  parseISO,
  isValid,
} from "date-fns"
import { ptBR } from "date-fns/locale"

export function formatDateBR(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date
  return format(d, "dd/MM/yyyy", { locale: ptBR })
}

export function formatMonthYear(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date
  return format(d, "MMMM yyyy", { locale: ptBR })
}

export function formatMonthShort(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date
  return format(d, "MMM", { locale: ptBR })
}

export function formatDayOfWeek(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date
  return format(d, "EEE", { locale: ptBR })
}

export function formatDayMonth(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date
  return format(d, "dd/MM", { locale: ptBR })
}

export function toDateString(date: Date): string {
  return format(date, "yyyy-MM-dd")
}

export function toMonthKey(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date
  return format(d, "yyyy-MM")
}

export function getMonthDays(year: number, month: number): Date[] {
  const start = startOfMonth(new Date(year, month))
  const end = endOfMonth(new Date(year, month))
  return eachDayOfInterval({ start, end })
}

export function isBusinessDay(date: Date): boolean {
  return !isWeekend(date)
}

export function parseDateSafe(dateStr: string): Date | null {
  const d = parseISO(dateStr)
  return isValid(d) ? d : null
}

export function getMonthRange(year: number, month: number) {
  const start = startOfMonth(new Date(year, month))
  const end = endOfMonth(new Date(year, month))
  return { start: toDateString(start), end: toDateString(end) }
}

export { getYear, getMonth, parseISO, format }
