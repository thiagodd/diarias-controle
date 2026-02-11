"use client"

import useSWR from "swr"
import type { Diaria, MonthTotals } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useDiarias(year: number, month: number) {
  const start = `${year}-${String(month + 1).padStart(2, "0")}-01`
  const lastDay = new Date(year, month + 1, 0).getDate()
  const end = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`

  const { data, error, isLoading, mutate } = useSWR<Diaria[]>(
    `/api/diarias?start=${start}&end=${end}`,
    fetcher,
  )

  return { diarias: data || [], error, isLoading, mutate }
}

export function usePendingDiarias(targetMonth: string) {
  const { data, error, isLoading, mutate } = useSWR<Diaria[]>(
    `/api/diarias?pending_month=${targetMonth}`,
    fetcher,
  )

  return { pendingDiarias: data || [], error, isLoading, mutate }
}

export function calculateTotals(
  diarias: Diaria[],
  pendingIn: Diaria[],
): MonthTotals {
  // Previsto: weekday (status = trabalhado when generated) non-pending
  const previstoItems = diarias.filter(
    (d) => d.status === "trabalhado" && !d.pendente_anterior,
  )
  const previsto_dias = previstoItems.length
  const previsto_valor = previstoItems.reduce((sum, d) => sum + Number(d.valor), 0)

  // Realizado: actually worked (status = trabalhado), non-pending
  const realizadoItems = diarias.filter(
    (d) => d.status === "trabalhado" && !d.pendente_anterior,
  )
  const realizado_dias = realizadoItems.length
  const realizado_valor = realizadoItems.reduce((sum, d) => sum + Number(d.valor), 0)

  // Fechado: has fechamento_id
  const fechadoItems = diarias.filter((d) => d.fechamento_id !== null)
  const fechado_dias = fechadoItems.length
  const fechado_valor = fechadoItems.reduce((sum, d) => sum + Number(d.valor), 0)

  // Pago
  const pagoItems = diarias.filter((d) => d.pago)
  const pago_dias = pagoItems.length
  const pago_valor = pagoItems.reduce((sum, d) => sum + Number(d.valor), 0)

  // Pending from other months
  const pendente_dias = pendingIn.length
  const pendente_valor = pendingIn.reduce((sum, d) => sum + Number(d.valor), 0)

  return {
    previsto_dias,
    previsto_valor: previsto_valor + pendente_valor,
    realizado_dias,
    realizado_valor: realizado_valor + pendente_valor,
    fechado_dias,
    fechado_valor,
    pago_dias,
    pago_valor,
    pendente_dias,
    pendente_valor,
  }
}
