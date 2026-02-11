import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, format } from "date-fns"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { year, month } = body

  const start = startOfMonth(new Date(year, month))
  const end = endOfMonth(new Date(year, month))
  const days = eachDayOfInterval({ start, end })

  const startStr = format(start, "yyyy-MM-dd")
  const endStr = format(end, "yyyy-MM-dd")

  const { data: existing } = await supabase
    .from("diarias")
    .select("data")
    .eq("user_id", user.id)
    .gte("data", startStr)
    .lte("data", endStr)

  const existingDates = new Set((existing || []).map((d: { data: string }) => d.data))

  // Get user settings for default rate
  const { data: settings } = await supabase
    .from("user_settings")
    .select("valor_diaria")
    .eq("user_id", user.id)
    .single()

  const defaultRate = settings?.valor_diaria ?? 180

  const newDiarias = days
    .filter((day) => !existingDates.has(format(day, "yyyy-MM-dd")))
    .map((day) => ({
      user_id: user.id,
      data: format(day, "yyyy-MM-dd"),
      status: isWeekend(day) ? ("folga" as const) : ("trabalhado" as const),
      valor: isWeekend(day) ? 0 : defaultRate,
    }))

  if (newDiarias.length > 0) {
    const { error } = await supabase.from("diarias").insert(newDiarias)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ generated: newDiarias.length })
}
