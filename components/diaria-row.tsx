"use client"

import type { Diaria } from "@/lib/types"
import { formatDateBR, formatDayOfWeek } from "@/lib/date-helpers"
import { formatCurrency } from "@/lib/format"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface DiariaRowProps {
  diaria: Diaria
  onClick: (diaria: Diaria) => void
}

export function DiariaRow({ diaria, onClick }: DiariaRowProps) {
  const isFolga = diaria.status === "folga"
  const isTrabalhado = diaria.status === "trabalhado"
  const isPending = diaria.pendente_anterior
  const isFechado = diaria.fechamento_id !== null
  const isPago = diaria.pago

  function getStatusBadge() {
    if (isPago) {
      return (
        <Badge className="bg-success text-success-foreground text-xs">
          Pago
        </Badge>
      )
    }
    if (isFechado) {
      return (
        <Badge className="bg-warning text-warning-foreground text-xs">
          Fechado
        </Badge>
      )
    }
    if (isPending) {
      return (
        <Badge
          variant="outline"
          className="border-warning text-warning text-xs"
        >
          Pendente
        </Badge>
      )
    }
    if (isTrabalhado) {
      return (
        <Badge className="bg-success text-success-foreground text-xs">
          Trabalhado
        </Badge>
      )
    }
    if (diaria.status === "falta") {
      return (
        <Badge className="bg-destructive text-destructive-foreground text-xs">
          Falta
        </Badge>
      )
    }
    if (diaria.status === "feriado") {
      return (
        <Badge variant="secondary" className="text-xs">
          Feriado
        </Badge>
      )
    }
    if (isFolga) {
      return (
        <Badge variant="secondary" className="text-xs text-muted-foreground">
          Folga
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="text-xs text-muted-foreground">
        Previsto
      </Badge>
    )
  }

  const isDisabled = isPago

  return (
    <button
      type="button"
      onClick={() => !isDisabled && onClick(diaria)}
      disabled={isDisabled}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors",
        !isDisabled && "hover:bg-muted/50 active:bg-muted",
        isDisabled && "cursor-default opacity-60",
        isFolga && "bg-muted/30",
      )}
    >
      <div className="flex flex-col items-center">
        <span className="text-xs font-medium uppercase text-muted-foreground">
          {formatDayOfWeek(diaria.data)}
        </span>
        <span className="text-lg font-bold text-foreground">
          {diaria.data.split("-")[2]}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          {diaria.observacao && (
            <span className="truncate text-xs text-muted-foreground">
              {diaria.observacao}
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {formatDateBR(diaria.data)}
        </span>
      </div>
      <div className="text-right">
        <span
          className={cn(
            "text-sm font-semibold",
            Number(diaria.valor) === 0
              ? "text-muted-foreground"
              : "text-foreground",
          )}
        >
          {formatCurrency(Number(diaria.valor))}
        </span>
      </div>
    </button>
  )
}
