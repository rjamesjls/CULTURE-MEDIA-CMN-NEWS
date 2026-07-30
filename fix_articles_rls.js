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
      -- Politique INSERT pour les articles
      DROP POLICY IF EXISTS "Insertion d'articles" ON public.articles;
      CREATE POLICY "Insertion d'articles" ON public.articles
          FOR INSERT
          WITH CHECK (
              public.is_admin() OR auth.uid() = user_id
          );

      -- Politique UPDATE pour les articles
      DROP POLICY IF EXISTS "Modification d'articles" ON public.articles;
      CREATE POLICY "Modification d'articles" ON public.articles
          FOR UPDATE
          USING (
              public.is_admin() OR auth.uid() = user_id
          );

      -- Politique DELETE pour les articles
      DROP POLICY IF EXISTS "Suppression d'articles" ON public.articles;
      CREATE POLICY "Suppression d'articles" ON public.articles
          FOR DELETE
          USING (
              public.is_admin() OR auth.uid() = user_id
          );
    `;
    
    await client.query(query);
    console.log("RLS policies added for articles table.");
    
  } catch (err) {
    console.error("Error executing query", err);
  } finally {
    await client.end();
  }
}

run();
