"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { formatCurrency, capitalize } from "@/lib/format"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { Diaria } from "@/lib/types"

interface AnnualSummaryProps {
  onBack: () => void
}

interface MonthData {
  month: number
  label: string
  previsto_dias: number
  previsto_valor: number
  realizado_dias: number
  realizado_valor: number
  fechado_valor: number
  pago_valor: number
}

export function AnnualSummary({ onBack }: AnnualSummaryProps) {
  const [year, setYear] = useState(new Date().getFullYear())
  const [monthsData, setMonthsData] = useState<MonthData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchYear() {
      setLoading(true)
      const start = `${year}-01-01`
      const end = `${year}-12-31`
      try {
        const res = await fetch(`/api/diarias?start=${start}&end=${end}`)
        const diarias: Diaria[] = await res.json()

        const months: MonthData[] = Array.from({ length: 12 }, (_, i) => {
          const monthDiarias = diarias.filter((d) => {
            const m = Number.parseInt(d.data.split("-")[1]) - 1
            return m === i
          })
          return {
            month: i,
            label: capitalize(
              format(new Date(year, i), "MMM", { locale: ptBR }),
            ),
            previsto_dias: monthDiarias.filter(
              (d) => d.status === "trabalhado" && !d.pendente_anterior,
            ).length,
            previsto_valor: monthDiarias
              .filter(
                (d) => d.status === "trabalhado" && !d.pendente_anterior,
              )
              .reduce((s, d) => s + Number(d.valor), 0),
            realizado_dias: monthDiarias.filter(
              (d) => d.status === "trabalhado",
            ).length,
            realizado_valor: monthDiarias
              .filter((d) => d.status === "trabalhado")
              .reduce((s, d) => s + Number(d.valor), 0),
            fechado_valor: monthDiarias
              .filter((d) => d.fechamento_id !== null)
              .reduce((s, d) => s + Number(d.valor), 0),
            pago_valor: monthDiarias
              .filter((d) => d.pago)
              .reduce((s, d) => s + Number(d.valor), 0),
          }
        })

        setMonthsData(months)
      } catch {
        setMonthsData([])
      } finally {
        setLoading(false)
      }
    }
    fetchYear()
  }, [year])

  const totalPrevisto = monthsData.reduce((s, m) => s + m.previsto_valor, 0)
  const totalRealizado = monthsData.reduce((s, m) => s + m.realizado_valor, 0)
  const totalFechado = monthsData.reduce((s, m) => s + m.fechado_valor, 0)
  const totalPago = monthsData.reduce((s, m) => s + m.pago_valor, 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          Voltar
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setYear(year - 1)}
          aria-label="Ano anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-bold text-foreground">{year}</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setYear(year + 1)}
          aria-label="Proximo ano"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="border-border">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Previsto (ano)</p>
            <p className="text-lg font-bold text-primary">
              {formatCurrency(totalPrevisto)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Realizado (ano)</p>
            <p className="text-lg font-bold text-success">
              {formatCurrency(totalRealizado)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Fechado (ano)</p>
            <p className="text-lg font-bold text-warning">
              {formatCurrency(totalFechado)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Pago (ano)</p>
            <p className="text-lg font-bold text-success">
              {formatCurrency(totalPago)}
            </p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {monthsData.map((m) => (
            <Card key={m.month} className="border-border">
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-sm font-semibold text-foreground">
                  {m.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs lg:grid-cols-4">
                  <div>
                    <span className="text-muted-foreground">{"Previsto: "}</span>
                    <span className="font-medium text-foreground">
                      {m.previsto_dias}d / {formatCurrency(m.previsto_valor)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{"Realizado: "}</span>
                    <span className="font-medium text-foreground">
                      {m.realizado_dias}d /{" "}
                      {formatCurrency(m.realizado_valor)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{"Fechado: "}</span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(m.fechado_valor)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{"Pago: "}</span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(m.pago_valor)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
