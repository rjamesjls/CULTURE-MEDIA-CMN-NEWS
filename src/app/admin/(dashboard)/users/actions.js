'use server';

import { createClient } from '@/utils/supabase/server';
import { getUserProfile } from '@/utils/supabase/auth';
import { revalidatePath } from 'next/cache';

export async function updateUserRoleAndStatus(formData) {
  const profile = await getUserProfile();
  if (!profile || profile.role !== 'admin') {
    throw new Error('Non autorisé');
  }

  const id = formData.get('id');
  const role = formData.get('role');
  const status = formData.get('status');

  const supabase = await createClient();

  const { error } = await supabase
    .from('profiles')
    .update({ role, status })
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/users');
}
