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
import { Zap } from "lucide-react"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/format"

interface QuickRegisterFABProps {
  onRegistered: () => void
  defaultRate: number
}

export function QuickRegisterFAB({
  onRegistered,
  defaultRate,
}: QuickRegisterFABProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [showValueDialog, setShowValueDialog] = useState(false)
  const [customValue, setCustomValue] = useState(String(defaultRate))
  const [adjustType, setAdjustType] = useState<
    "fixed" | "add" | "subtract" | "percent_add" | "percent_sub"
  >("fixed")
  const [adjustAmount, setAdjustAmount] = useState("")
  const [loading, setLoading] = useState(false)

  function calculateFinalValue(): number {
    const base = defaultRate
    const amount = Number.parseFloat(adjustAmount) || 0
    switch (adjustType) {
      case "fixed":
        return Number.parseFloat(customValue) || base
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

  async function handleQuickRegister() {
    setLoading(true)
    try {
      const res = await fetch("/api/diarias/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valor: defaultRate }),
      })
      if (!res.ok) throw new Error("Erro ao registrar")
      toast.success(`Diaria registrada: ${formatCurrency(defaultRate)}`)
      onRegistered()
    } catch {
      toast.error("Erro ao registrar diaria")
    } finally {
      setLoading(false)
      setShowDialog(false)
    }
  }

  async function handleCustomRegister() {
    setLoading(true)
    const finalValue = calculateFinalValue()
    try {
      const res = await fetch("/api/diarias/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valor: finalValue }),
      })
      if (!res.ok) throw new Error("Erro ao registrar")
      toast.success(`Diaria registrada: ${formatCurrency(finalValue)}`)
      onRegistered()
    } catch {
      toast.error("Erro ao registrar diaria")
    } finally {
      setLoading(false)
      setShowValueDialog(false)
      setShowDialog(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowDialog(true)}
        disabled={loading}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 lg:bottom-8 lg:right-8 lg:h-16 lg:w-16"
        aria-label="Registrar diaria de hoje"
      >
        <Zap className="h-7 w-7 lg:h-8 lg:w-8" />
      </button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Registrar Diaria de Hoje
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Registrar o dia de hoje como trabalhado.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleQuickRegister}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading
                ? "Registrando..."
                : `Registrar ${formatCurrency(defaultRate)}`}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowDialog(false)
                setShowValueDialog(true)
                setCustomValue(String(defaultRate))
                setAdjustType("fixed")
                setAdjustAmount("")
              }}
              className="w-full bg-transparent"
            >
              Ajustar valor
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showValueDialog} onOpenChange={setShowValueDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Ajustar Valor da Diaria
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Escolha como ajustar o valor.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
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
                  variant={adjustType === opt.value ? "default" : "outline"}
                  onClick={() => setAdjustType(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>

            {adjustType === "fixed" ? (
              <div className="flex flex-col gap-2">
                <Label className="text-foreground">{"Valor fixo (R$)"}</Label>
                <Input
                  type="number"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  step="0.01"
                  min="0"
                />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Label className="text-foreground">
                  {adjustType.includes("percent")
                    ? "Porcentagem (%)"
                    : "Valor (R$)"}
                </Label>
                <Input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  step="0.01"
                  min="0"
                />
              </div>
            )}

            <div className="rounded-md bg-muted p-3 text-center">
              <p className="text-sm text-muted-foreground">Valor final</p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(calculateFinalValue())}
              </p>
            </div>

            <Button
              onClick={handleCustomRegister}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? "Registrando..." : "Registrar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
