import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const searchParams = request.nextUrl.searchParams
  const startDate = searchParams.get("start")
  const endDate = searchParams.get("end")
  const pendingMonth = searchParams.get("pending_month")

  let query = supabase.from("diarias").select("*").eq("user_id", user.id)

  if (pendingMonth) {
    query = supabase
      .from("diarias")
      .select("*")
      .eq("user_id", user.id)
      .eq("pendente_anterior", true)
      .eq("mes_origem", pendingMonth)
  } else if (startDate && endDate) {
    query = query.gte("data", startDate).lte("data", endDate)
  }

  const { data, error } = await query.order("data", { ascending: true })

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

  const { data, error } = await supabase
    .from("diarias")
    .upsert(
      {
        user_id: user.id,
        data: body.data,
        status: body.status || "trabalhado",
        valor: body.valor ?? 180,
        observacao: body.observacao ?? null,
        pago: body.pago ?? false,
        pendente_anterior: body.pendente_anterior ?? false,
        mes_origem: body.mes_origem ?? null,
      },
      { onConflict: "user_id,data" },
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
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
    .from("diarias")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
