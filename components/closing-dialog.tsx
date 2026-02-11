"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/format"
import { format, startOfMonth } from "date-fns"

interface ClosingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onClosed: () => void
}

export function ClosingDialog({
  open,
  onOpenChange,
  onClosed,
}: ClosingDialogProps) {
  const today = new Date()
  const [dataInicio, setDataInicio] = useState(
    format(startOfMonth(today), "yyyy-MM-dd"),
  )
  const [dataFim, setDataFim] = useState(format(today, "yyyy-MM-dd"))
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    closed_count: number
    valor_total: number
  } | null>(null)

  async function handleClose() {
    setLoading(true)
    try {
      const res = await fetch("/api/fechamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data_inicio: dataInicio, data_fim: dataFim }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao fechar")
      setResult({
        closed_count: data.closed_count,
        valor_total: data.valor_total,
      })
      toast.success("Fechamento realizado com sucesso!")
      onClosed()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao fechar"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  function handleDialogChange(isOpen: boolean) {
    onOpenChange(isOpen)
    if (!isOpen) setResult(null)
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Fechamento de Diarias
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Fechar todas as diarias trabalhadas no periodo selecionado.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-md bg-success/10 p-4 text-center">
              <p className="text-sm font-medium text-success">
                Fechamento realizado!
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {formatCurrency(result.valor_total)}
              </p>
              <p className="text-sm text-muted-foreground">
                {result.closed_count}{" "}
                {result.closed_count === 1
                  ? "diaria fechada"
                  : "diarias fechadas"}
              </p>
            </div>
            <Button
              onClick={() => handleDialogChange(false)}
              className="w-full"
            >
              Fechar
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-foreground">Data inicio</Label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-foreground">Data fim</Label>
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
            <Button
              onClick={handleClose}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Fechando..." : "Fechar diarias"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
