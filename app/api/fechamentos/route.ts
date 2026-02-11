import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("fechamentos")
    .select("*")
    .eq("user_id", user.id)
    .order("data_fim", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { data_inicio, data_fim } = body

  // Get all unfechado, worked diarias in the date range
  const { data: diarias, error: fetchError } = await supabase
    .from("diarias")
    .select("*")
    .eq("user_id", user.id)
    .is("fechamento_id", null)
    .eq("status", "trabalhado")
    .gte("data", data_inicio)
    .lte("data", data_fim)
    .order("data")

  if (fetchError)
    return NextResponse.json({ error: fetchError.message }, { status: 500 })

  if (!diarias || diarias.length === 0) {
    return NextResponse.json(
      { error: "Nenhuma diaria para fechar neste periodo" },
      { status: 400 },
    )
  }

  const totalDiarias = diarias.length
  const valorTotal = diarias.reduce(
    (sum: number, d: { valor: number }) => sum + (d.valor || 0),
    0,
  )

  // Create the fechamento record
  const { data: fechamento, error: createError } = await supabase
    .from("fechamentos")
    .insert({
      user_id: user.id,
      data_inicio,
      data_fim,
      total_diarias: totalDiarias,
      valor_total: valorTotal,
      status: "fechado",
    })
    .select()
    .single()

  if (createError)
    return NextResponse.json({ error: createError.message }, { status: 500 })

  // Mark all those diarias as closed with fechamento_id
  const ids = diarias.map((d: { id: string }) => d.id)
  const { error: updateError } = await supabase
    .from("diarias")
    .update({ fechamento_id: fechamento.id })
    .in("id", ids)

  if (updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({
    fechamento,
    closed_count: totalDiarias,
    valor_total: valorTotal,
  })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { id, ...updates } = body

  if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 })

  const { data, error } = await supabase
    .from("fechamentos")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
