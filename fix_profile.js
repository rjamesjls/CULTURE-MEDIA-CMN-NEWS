const { Client } = require('pg');

const connectionString = "postgresql://postgres:Cmnjames973@*@db.cklwlxjutudysxapieev.supabase.co:5432/postgres";

const client = new Client({
  connectionString,
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to PostgreSQL");
    
    const query = `
      DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
      
      CREATE OR REPLACE FUNCTION public.is_admin()
      RETURNS BOOLEAN
      LANGUAGE sql
      SECURITY DEFINER
      SET search_path = public
      AS $$
        SELECT EXISTS (
          SELECT 1
          FROM public.profiles
          WHERE id = auth.uid() AND role = 'admin'
        );
      $$;

      CREATE POLICY "Admins can manage all profiles" ON public.profiles
          FOR ALL
          USING (public.is_admin());
    `;
    
    const res = await client.query(query);
    console.log("Command executed successfully to fix RLS.");
    
  } catch (err) {
    console.error("Error executing query", err);
  } finally {
    await client.end();
  }
}

run();
