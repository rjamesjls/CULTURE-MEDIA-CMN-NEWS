const { Client } = require('pg');

async function fix() {
  const connectionString = 'postgresql://postgres:Cmnjames973@*@db.cklwlxjutudysxapieev.supabase.co:5432/postgres';
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    
    const sql = `
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1
              FROM pg_policies
              WHERE schemaname = 'public'
                AND tablename = 'subscribers'
                AND policyname = 'Admins can delete subscribers'
          ) THEN
              CREATE POLICY "Admins can delete subscribers" ON public.subscribers
                  FOR DELETE
                  USING (
                      EXISTS (
                          SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
                      )
                  );
          END IF;
      END
      $$;
    `;
    await client.query(sql);
    console.log('Other RLS checked/fixed');
  } catch (err) {
    console.error('Failed:', err);
  } finally {
    await client.end();
  }
}

fix();
