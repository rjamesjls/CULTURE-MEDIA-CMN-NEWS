const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Les variables d'environnement Supabase ne sont pas définies.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createFlashInfosTable() {
  const sql = `
    -- Create flash_infos table
    CREATE TABLE IF NOT EXISTS public.flash_infos (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      content TEXT NOT NULL,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
    );

    -- Enable RLS
    ALTER TABLE public.flash_infos ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if they exist (to be safe during re-runs)
    DROP POLICY IF EXISTS "Public can view active flash_infos" ON public.flash_infos;
    DROP POLICY IF EXISTS "Admins and authors can manage flash_infos" ON public.flash_infos;

    -- Policies
    CREATE POLICY "Public can view active flash_infos" 
      ON public.flash_infos FOR SELECT 
      USING (is_active = true);

    CREATE POLICY "Admins and authors can manage flash_infos" 
      ON public.flash_infos FOR ALL
      USING (
        auth.uid() = user_id OR public.is_admin()
      );
  `;

  // Because exec_sql might not exist, we'll use a direct Postgres connection using the SUPABASE_DB_URL if available
  // Or we just output the SQL for the user to run in the Supabase Dashboard.
  
  console.log("=== VEUILLEZ EXÉCUTER CE CODE SQL DANS L'ÉDITEUR SQL DE SUPABASE ===");
  console.log(sql);
}

createFlashInfosTable();
