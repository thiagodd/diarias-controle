import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { format } from "date-fns"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const today = format(new Date(), "yyyy-MM-dd")
  const valor = body.valor ?? 180

  const { data, error } = await supabase
    .from("diarias")
    .upsert(
      {
        user_id: user.id,
        data: today,
        status: "trabalhado",
        valor,
      },
      { onConflict: "user_id,data" },
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
