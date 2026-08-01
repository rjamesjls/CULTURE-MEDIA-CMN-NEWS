import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cklwlxjutudysxapieev.supabase.co';
const SUPABASE_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrbHdseGp1dHVkeXN4YXBpZWV2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTM1NTk3NiwiZXhwIjoyMTAwOTMxOTc2fQ.WJu8C_l1nMd1URsPNpgN0N06oh_G5Cl_BLIFYbrWQWE';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

async function checkUsers() {
  const { data, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }
  
  console.log('Users found:', data.users.length);
  data.users.forEach(user => {
    console.log(`Email: ${user.email} | Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
  });
}

checkUsers();
