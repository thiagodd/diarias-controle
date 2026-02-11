"use client"

import type { Diaria } from "@/lib/types"
import { formatDateBR } from "@/lib/date-helpers"
import { formatCurrency } from "@/lib/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Check, X } from "lucide-react"
import { toast } from "sonner"
import { useState } from "react"

interface PendingSectionProps {
  pendingDiarias: Diaria[]
  onUpdate: () => void
}

export function PendingSection({ pendingDiarias, onUpdate }: PendingSectionProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  if (pendingDiarias.length === 0) return null

  const totalValue = pendingDiarias.reduce(
    (sum, d) => sum + Number(d.valor),
    0,
  )

  async function handleMarkPaid(diaria: Diaria) {
    setLoadingId(diaria.id)
    try {
      const res = await fetch("/api/diarias", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: diaria.id,
          pago: true,
          pendente_anterior: false,
          mes_origem: null,
        }),
      })
      if (!res.ok) throw new Error("Erro")
      toast.success("Pendencia marcada como paga")
      onUpdate()
    } catch {
      toast.error("Erro ao marcar como paga")
    } finally {
      setLoadingId(null)
    }
  }

  async function handleRemovePending(diaria: Diaria) {
    setLoadingId(diaria.id)
    try {
      const res = await fetch("/api/diarias", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: diaria.id,
          pendente_anterior: false,
          mes_origem: null,
        }),
      })
      if (!res.ok) throw new Error("Erro")
      toast.success("Pendencia removida, diaria volta ao mes de origem")
      onUpdate()
    } catch {
      toast.error("Erro ao remover pendencia")
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <Card className="border-warning/30 bg-warning/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-warning">
          <AlertCircle className="h-4 w-4" />
          Pendencias de meses anteriores
          <Badge variant="secondary" className="ml-auto text-xs">
            {formatCurrency(totalValue)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {pendingDiarias.map((diaria) => (
          <div
            key={diaria.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
          >
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {formatDateBR(diaria.data)}
              </p>
              <p className="text-xs text-muted-foreground">
                Origem: {diaria.mes_origem || diaria.data.substring(0, 7)}
              </p>
            </div>
            <span className="text-sm font-semibold text-foreground">
              {formatCurrency(Number(diaria.valor))}
            </span>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-success hover:bg-success/10 hover:text-success"
                onClick={() => handleMarkPaid(diaria)}
                disabled={loadingId === diaria.id}
                aria-label="Marcar como pago"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => handleRemovePending(diaria)}
                disabled={loadingId === diaria.id}
                aria-label="Remover pendencia"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
