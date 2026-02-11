"use client"

import { useState, useEffect } from "react"
import type { Diaria, DiariaStatus } from "@/lib/types"
import { formatDateBR, toMonthKey } from "@/lib/date-helpers"
import { formatCurrency } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { addMonths, parseISO } from "date-fns"

interface EditDiariaDialogProps {
  diaria: Diaria | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
  defaultRate: number
}

export function EditDiariaDialog({
  diaria,
  open,
  onOpenChange,
  onSaved,
  defaultRate,
}: EditDiariaDialogProps) {
  const [status, setStatus] = useState<DiariaStatus>("trabalhado")
  const [valueMode, setValueMode] = useState<
    "fixed" | "add" | "subtract" | "percent_add" | "percent_sub"
  >("fixed")
  const [fixedValue, setFixedValue] = useState("")
  const [adjustAmount, setAdjustAmount] = useState("")
  const [observacao, setObservacao] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (diaria) {
      setStatus(diaria.status)
      setFixedValue(String(diaria.valor))
      setObservacao(diaria.observacao || "")
      setValueMode("fixed")
      setAdjustAmount("")
    }
  }, [diaria])

  if (!diaria) return null

  const isFechado = diaria.fechamento_id !== null

  function calculateValue(): number {
    const base = defaultRate
    const amount = Number.parseFloat(adjustAmount) || 0
    switch (valueMode) {
      case "fixed":
        return Number.parseFloat(fixedValue) || 0
      case "add":
        return base + amount
      case "subtract":
        return base - amount
      case "percent_add":
        return base * (1 + amount / 100)
      case "percent_sub":
        return base * (1 - amount / 100)
      default:
        return base
    }
  }

  async function handleSave() {
    setLoading(true)
    const finalValue = calculateValue()
    try {
      const res = await fetch("/api/diarias", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: diaria.id,
          status,
          valor: status === "trabalhado" ? finalValue : 0,
          observacao: observacao || null,
        }),
      })
      if (!res.ok) throw new Error("Erro ao salvar")
      toast.success("Diaria atualizada")
      onSaved()
      onOpenChange(false)
    } catch {
      toast.error("Erro ao salvar diaria")
    } finally {
      setLoading(false)
    }
  }

  async function handleMarkPending() {
    if (diaria.status !== "trabalhado") {
      toast.error("Somente dias trabalhados podem ser marcados como pendentes")
      return
    }
    setLoading(true)
    const nextMonth = toMonthKey(addMonths(parseISO(diaria.data), 1))
    try {
      const res = await fetch("/api/diarias", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: diaria.id,
          pendente_anterior: true,
          mes_origem: toMonthKey(parseISO(diaria.data)),
        }),
      })
      if (!res.ok) throw new Error("Erro")
      toast.success("Diaria marcada como pendente para o proximo mes")
      onSaved()
      onOpenChange(false)
    } catch {
      toast.error("Erro ao marcar como pendente")
    } finally {
      setLoading(false)
    }
  }

  async function handleRemovePending() {
    setLoading(true)
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
      toast.success("Pendencia removida")
      onSaved()
      onOpenChange(false)
    } catch {
      toast.error("Erro ao remover pendencia")
    } finally {
      setLoading(false)
    }
  }

  async function handleRevertClose() {
    setLoading(true)
    try {
      const res = await fetch("/api/diarias", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: diaria.id,
          fechamento_id: null,
        }),
      })
      if (!res.ok) throw new Error("Erro")
      toast.success("Fechamento revertido")
      onSaved()
      onOpenChange(false)
    } catch {
      toast.error("Erro ao reverter fechamento")
    } finally {
      setLoading(false)
    }
  }

  async function handleMarkPaid() {
    setLoading(true)
    try {
      const res = await fetch("/api/diarias", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: diaria.id,
          pago: true,
        }),
      })
      if (!res.ok) throw new Error("Erro")
      toast.success("Diaria marcada como paga")
      onSaved()
      onOpenChange(false)
    } catch {
      toast.error("Erro ao marcar como paga")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isFechado ? "Diaria Fechada" : "Editar Diaria"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {formatDateBR(diaria.data)}
          </DialogDescription>
        </DialogHeader>

        {isFechado ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-md bg-muted p-4">
              <p className="text-sm text-muted-foreground">Valor</p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(Number(diaria.valor))}
              </p>
              <p className="text-sm text-muted-foreground">
                Status:{" "}
                {diaria.pago ? "Pago" : "Fechado (aguardando pagamento)"}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {!diaria.pago && (
                <>
                  <Button onClick={handleMarkPaid} disabled={loading}>
                    Marcar como pago
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleRevertClose}
                    disabled={loading}
                    className="bg-transparent"
                  >
                    Reverter fechamento
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-foreground">Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as DiariaStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trabalhado">Trabalhado</SelectItem>
                  <SelectItem value="folga">Folga</SelectItem>
                  <SelectItem value="falta">Falta</SelectItem>
                  <SelectItem value="feriado">Feriado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {status === "trabalhado" && (
              <>
                <div className="flex flex-col gap-2">
                  <Label className="text-foreground">Tipo de ajuste</Label>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { value: "fixed", label: "Fixo" },
                        { value: "add", label: "+R$" },
                        { value: "subtract", label: "-R$" },
                        { value: "percent_add", label: "+%" },
                        { value: "percent_sub", label: "-%" },
                      ] as const
                    ).map((opt) => (
                      <Button
                        key={opt.value}
                        size="sm"
                        variant={
                          valueMode === opt.value ? "default" : "outline"
                        }
                        onClick={() => setValueMode(opt.value)}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {valueMode === "fixed" ? (
                  <div className="flex flex-col gap-2">
                    <Label className="text-foreground">{"Valor (R$)"}</Label>
                    <Input
                      type="number"
                      value={fixedValue}
                      onChange={(e) => setFixedValue(e.target.value)}
                      step="0.01"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Label className="text-foreground">
                      {valueMode.includes("percent")
                        ? "Porcentagem (%)"
                        : "Valor (R$)"}
                    </Label>
                    <Input
                      type="number"
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(e.target.value)}
                      step="0.01"
                    />
                  </div>
                )}

                <div className="rounded-md bg-muted p-3 text-center">
                  <p className="text-sm text-muted-foreground">Valor final</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(calculateValue())}
                  </p>
                </div>
              </>
            )}

            <div className="flex flex-col gap-2">
              <Label className="text-foreground">Observacoes</Label>
              <Textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Observacoes opcionais..."
                rows={2}
              />
            </div>

            <Button onClick={handleSave} disabled={loading} className="w-full">
              {loading ? "Salvando..." : "Salvar"}
            </Button>

            {diaria.status === "trabalhado" &&
              !diaria.pendente_anterior &&
              !diaria.pago && (
                <Button
                  variant="outline"
                  onClick={handleMarkPending}
                  disabled={loading}
                  className="w-full bg-transparent"
                >
                  Marcar como pendente (proximo mes)
                </Button>
              )}

            {diaria.pendente_anterior && (
              <Button
                variant="outline"
                onClick={handleRemovePending}
                disabled={loading}
                className="w-full border-destructive bg-transparent text-destructive hover:bg-destructive/10"
              >
                Remover pendencia
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
