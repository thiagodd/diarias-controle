process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const connectionString = process.env.POSTGRES_URL;
if (!connectionString) {
  console.error("POSTGRES_URL not set");
  process.exit(1);
}

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function run() {
  await client.connect();
  console.log("Connected to database");

  await client.query(`
    CREATE TABLE IF NOT EXISTS public.diarias (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      data DATE NOT NULL,
      status TEXT NOT NULL DEFAULT 'trabalhado' CHECK (status IN ('trabalhado','falta','feriado','folga')),
      valor NUMERIC(10,2) NOT NULL DEFAULT 180.00,
      observacao TEXT DEFAULT '',
      fechamento_id UUID,
      pago BOOLEAN NOT NULL DEFAULT false,
      pendente_anterior BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  console.log("Created diarias table");

  await client.query(`
    CREATE TABLE IF NOT EXISTS public.fechamentos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      data_inicio DATE NOT NULL,
      data_fim DATE NOT NULL,
      total_diarias INTEGER NOT NULL DEFAULT 0,
      valor_total NUMERIC(10,2) NOT NULL DEFAULT 0,
      pago BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  console.log("Created fechamentos table");

  await client.query(`
    CREATE TABLE IF NOT EXISTS public.user_settings (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      valor_diaria NUMERIC(10,2) NOT NULL DEFAULT 180.00,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  console.log("Created user_settings table");

  // Unique constraint
  await client.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'diarias_user_data_unique') THEN
        ALTER TABLE public.diarias ADD CONSTRAINT diarias_user_data_unique UNIQUE (user_id, data);
      END IF;
    END $$;
  `);
  console.log("Added unique constraint");

  // FK for fechamento
  await client.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'diarias_fechamento_fk') THEN
        ALTER TABLE public.diarias ADD CONSTRAINT diarias_fechamento_fk FOREIGN KEY (fechamento_id) REFERENCES public.fechamentos(id) ON DELETE SET NULL;
      END IF;
    END $$;
  `);
  console.log("Added fechamento FK");

  // Enable RLS
  await client.query(`ALTER TABLE public.diarias ENABLE ROW LEVEL SECURITY;`);
  await client.query(`ALTER TABLE public.fechamentos ENABLE ROW LEVEL SECURITY;`);
  await client.query(`ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;`);
  console.log("Enabled RLS");

  // RLS Policies
  const policies = [
    { table: "diarias", name: "diarias_select", op: "SELECT", using: "auth.uid() = user_id", check: null },
    { table: "diarias", name: "diarias_insert", op: "INSERT", using: null, check: "auth.uid() = user_id" },
    { table: "diarias", name: "diarias_update", op: "UPDATE", using: "auth.uid() = user_id", check: null },
    { table: "diarias", name: "diarias_delete", op: "DELETE", using: "auth.uid() = user_id", check: null },
    { table: "fechamentos", name: "fechamentos_select", op: "SELECT", using: "auth.uid() = user_id", check: null },
    { table: "fechamentos", name: "fechamentos_insert", op: "INSERT", using: null, check: "auth.uid() = user_id" },
    { table: "fechamentos", name: "fechamentos_update", op: "UPDATE", using: "auth.uid() = user_id", check: null },
    { table: "fechamentos", name: "fechamentos_delete", op: "DELETE", using: "auth.uid() = user_id", check: null },
    { table: "user_settings", name: "settings_select", op: "SELECT", using: "auth.uid() = id", check: null },
    { table: "user_settings", name: "settings_insert", op: "INSERT", using: null, check: "auth.uid() = id" },
    { table: "user_settings", name: "settings_update", op: "UPDATE", using: "auth.uid() = id", check: null },
  ];

  for (const p of policies) {
    const clause = p.check ? `WITH CHECK (${p.check})` : `USING (${p.using})`;
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = '${p.table}' AND policyname = '${p.name}') THEN
          CREATE POLICY ${p.name} ON public.${p.table} FOR ${p.op} ${clause};
        END IF;
      END $$;
    `);
  }
  console.log("Created RLS policies");

  // Index for faster queries
  await client.query(`CREATE INDEX IF NOT EXISTS idx_diarias_user_data ON public.diarias(user_id, data);`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_diarias_fechamento ON public.diarias(fechamento_id);`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_fechamentos_user ON public.fechamentos(user_id, data_inicio);`);
  console.log("Created indexes");

  await client.end();
  console.log("Done! Database setup complete.");
}

run().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
