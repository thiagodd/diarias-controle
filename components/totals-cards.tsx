"use client"

import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"
import type { MonthTotals } from "@/lib/types"
import { TrendingUp, CheckCircle, Banknote, Clock } from "lucide-react"

interface TotalsCardsProps {
  totals: MonthTotals
}

export function TotalsCards({ totals }: TotalsCardsProps) {
  const cards = [
    {
      label: "Previsto",
      days: totals.previsto_dias,
      value: totals.previsto_valor,
      icon: TrendingUp,
      bgClass: "bg-primary/10",
      iconClass: "text-primary",
      valueClass: "text-primary",
    },
    {
      label: "Realizado",
      days: totals.realizado_dias,
      value: totals.realizado_valor,
      icon: CheckCircle,
      bgClass: "bg-success/10",
      iconClass: "text-success",
      valueClass: "text-success",
    },
    {
      label: "Fechado",
      days: totals.fechado_dias,
      value: totals.fechado_valor,
      icon: Clock,
      bgClass: "bg-warning/10",
      iconClass: "text-warning",
      valueClass: "text-warning",
    },
    {
      label: "Pago",
      days: totals.pago_dias,
      value: totals.pago_valor,
      icon: Banknote,
      bgClass: "bg-success/10",
      iconClass: "text-success",
      valueClass: "text-success",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="border-border">
          <CardContent className="flex flex-col gap-1 p-3">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-md ${card.bgClass}`}
              >
                <card.icon className={`h-4 w-4 ${card.iconClass}`} />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {card.label}
              </span>
            </div>
            <p className={`text-lg font-bold ${card.valueClass}`}>
              {formatCurrency(card.value)}
            </p>
            <p className="text-xs text-muted-foreground">
              {card.days} {card.days === 1 ? "dia" : "dias"}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
