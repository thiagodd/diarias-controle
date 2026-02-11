"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { capitalize } from "@/lib/format"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface MonthNavigatorProps {
  year: number
  month: number
  onPrev: () => void
  onNext: () => void
}

export function MonthNavigator({ year, month, onPrev, onNext }: MonthNavigatorProps) {
  const date = new Date(year, month)
  const label = capitalize(format(date, "MMMM yyyy", { locale: ptBR }))

  return (
    <div className="flex items-center justify-between">
      <Button variant="ghost" size="icon" onClick={onPrev} aria-label="Mes anterior">
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <h2 className="text-lg font-bold text-foreground">{label}</h2>
      <Button variant="ghost" size="icon" onClick={onNext} aria-label="Proximo mes">
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  )
}
