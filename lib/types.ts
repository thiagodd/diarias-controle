export type DiariaStatus = "previsto" | "trabalhado" | "falta" | "feriado" | "folga"

export interface Diaria {
  id: string
  user_id: string
  data: string // date in yyyy-MM-dd
  status: DiariaStatus
  valor: number
  observacao: string | null
  fechamento_id: string | null
  pago: boolean
  pendente_anterior: boolean
  mes_origem: string | null // yyyy-MM of the month this was carried from
  created_at: string
  updated_at: string
}

export interface Fechamento {
  id: string
  user_id: string
  data_inicio: string
  data_fim: string
  total_diarias: number
  valor_total: number
  pago: boolean
  notas: string | null
  status: "aberto" | "fechado" | "pago"
  created_at: string
  updated_at: string
}

export interface UserSettings {
  id: string
  user_id: string
  valor_diaria: number
  dias_trabalho_mes: number
  created_at: string
  updated_at: string
}

export interface MonthTotals {
  previsto_dias: number
  previsto_valor: number
  realizado_dias: number
  realizado_valor: number
  fechado_dias: number
  fechado_valor: number
  pago_dias: number
  pago_valor: number
  pendente_dias: number
  pendente_valor: number
}

export type ViewMode = "dia" | "quinzena" | "mes" | "ano"
