"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  useDiarias,
  usePendingDiarias,
  calculateTotals,
} from "@/hooks/use-diarias"
import { TotalsCards } from "@/components/totals-cards"
import { QuickRegisterFAB } from "@/components/quick-register-fab"
import { DiariaRow } from "@/components/diaria-row"
import { EditDiariaDialog } from "@/components/edit-diaria-dialog"
import { PendingSection } from "@/components/pending-section"
import { ClosingDialog } from "@/components/closing-dialog"
import { MonthNavigator } from "@/components/month-navigator"
import { AnnualSummary } from "@/components/annual-summary"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Diaria, ViewMode } from "@/lib/types"
import { toMonthKey } from "@/lib/date-helpers"
import { LogOut, Lock, CalendarDays, RefreshCw } from "lucide-react"
import { toast } from "sonner"

const DEFAULT_RATE = 180

export function Dashboard() {
  const router = useRouter()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [view, setView] = useState<ViewMode>("mes")
  const [selectedDiaria, setSelectedDiaria] = useState<Diaria | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [closingOpen, setClosingOpen] = useState(false)
  const [generatingMonth, setGeneratingMonth] = useState(false)

  const monthKey = toMonthKey(new Date(year, month))
  const { diarias, isLoading, mutate } = useDiarias(year, month)
  const { pendingDiarias, mutate: mutatePending } =
    usePendingDiarias(monthKey)

  const totals = calculateTotals(diarias, pendingDiarias)

  const handleRefresh = useCallback(() => {
    mutate()
    mutatePending()
  }, [mutate, mutatePending])

  function handlePrev() {
    if (month === 0) {
      setMonth(11)
      setYear(year - 1)
    } else {
      setMonth(month - 1)
    }
  }

  function handleNext() {
    if (month === 11) {
      setMonth(0)
      setYear(year + 1)
    } else {
      setMonth(month + 1)
    }
  }

  async function handleGenerateMonth() {
    setGeneratingMonth(true)
    try {
      const res = await fetch("/api/diarias/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, month }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.generated > 0) {
        toast.success(`${data.generated} dias gerados para o mes`)
      } else {
        toast.info("Mes ja esta completo")
      }
      handleRefresh()
    } catch {
      toast.error("Erro ao gerar previsao do mes")
    } finally {
      setGeneratingMonth(false)
    }
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  function handleDiariaClick(diaria: Diaria) {
    setSelectedDiaria(diaria)
    setEditOpen(true)
  }

  // Auto-generate month if no diarias exist
  useEffect(() => {
    if (!isLoading && diarias.length === 0) {
      handleGenerateMonth()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, isLoading])

  function getFilteredDiarias(): Diaria[] {
    if (view === "dia") {
      const today = new Date().toISOString().split("T")[0]
      return diarias.filter((d) => d.data === today)
    }
    if (view === "quinzena") {
      const today = new Date().getDate()
      if (today <= 15) {
        return diarias.filter((d) => {
          const day = Number.parseInt(d.data.split("-")[2])
          return day >= 1 && day <= 15
        })
      }
      return diarias.filter((d) => {
        const day = Number.parseInt(d.data.split("-")[2])
        return day >= 16
      })
    }
    return diarias
  }

  if (view === "ano") {
    return (
      <div className="mx-auto min-h-screen max-w-2xl bg-background px-4 pb-24 pt-4">
        <header className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">
            Controle de Diarias
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            aria-label="Sair"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </header>
        <AnnualSummary onBack={() => setView("mes")} />
      </div>
    )
  }

  const filteredDiarias = getFilteredDiarias()

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-background px-4 pb-24 pt-4">
      {/* Header */}
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">
          Controle de Diarias
        </h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          aria-label="Sair"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      {/* Month Navigator */}
      <MonthNavigator
        year={year}
        month={month}
        onPrev={handlePrev}
        onNext={handleNext}
      />

      {/* Totals */}
      <div className="mt-4">
        <TotalsCards totals={totals} />
      </div>

      {/* View Tabs */}
      <div className="mt-4 flex items-center justify-between gap-2">
        <Tabs
          value={view}
          onValueChange={(v) => setView(v as ViewMode)}
          className="flex-1"
        >
          <TabsList className="w-full">
            <TabsTrigger value="dia" className="flex-1 text-xs">
              Dia
            </TabsTrigger>
            <TabsTrigger value="quinzena" className="flex-1 text-xs">
              Quinzena
            </TabsTrigger>
            <TabsTrigger value="mes" className="flex-1 text-xs">
              Mes
            </TabsTrigger>
            <TabsTrigger value="ano" className="flex-1 text-xs">
              Ano
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Action buttons */}
      <div className="mt-3 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerateMonth}
          disabled={generatingMonth}
          className="flex-1 bg-transparent text-xs"
        >
          <RefreshCw
            className={`mr-1 h-3 w-3 ${generatingMonth ? "animate-spin" : ""}`}
          />
          Gerar previsao
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setClosingOpen(true)}
          className="flex-1 text-xs"
        >
          <Lock className="mr-1 h-3 w-3" />
          Fechamento
        </Button>
      </div>

      {/* Pending Section */}
      <div className="mt-4">
        <PendingSection
          pendingDiarias={pendingDiarias}
          onUpdate={handleRefresh}
        />
      </div>

      {/* Diarias List */}
      <div className="mt-4 flex flex-col gap-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filteredDiarias.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <CalendarDays className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Nenhuma diaria encontrada para esta visao.
            </p>
          </div>
        ) : (
          filteredDiarias.map((diaria) => (
            <DiariaRow
              key={diaria.id}
              diaria={diaria}
              onClick={handleDiariaClick}
            />
          ))
        )}
      </div>

      {/* FAB */}
      <QuickRegisterFAB
        onRegistered={handleRefresh}
        defaultRate={DEFAULT_RATE}
      />

      {/* Edit Dialog */}
      <EditDiariaDialog
        diaria={selectedDiaria}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={handleRefresh}
        defaultRate={DEFAULT_RATE}
      />

      {/* Closing Dialog */}
      <ClosingDialog
        open={closingOpen}
        onOpenChange={setClosingOpen}
        onClosed={handleRefresh}
      />
    </div>
  )
}
