'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// Middleware / auth check helper
async function checkAuth() {
  const cookieStore = await cookies();
  const supabaseClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            // Handle cookie setting error during SSR
          }
        },
      },
    }
  );

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    throw new Error('Non autorisé');
  }
}

export async function saveMenu(formData) {
  await checkAuth();

  const id = formData.get('id');
  const label = formData.get('label');
  const url = formData.get('url');
  const position = parseInt(formData.get('position'), 10) || 0;
  const location = formData.get('location');

  const menuData = { label, url, position, location };

  let error;

  if (id) {
    // Update
    const { error: updateError } = await supabase
      .from('menus')
      .update(menuData)
      .eq('id', id);
    error = updateError;
  } else {
    // Insert
    const { error: insertError } = await supabase
      .from('menus')
      .insert([menuData]);
    error = insertError;
  }

  if (error) {
    console.error('Erreur saveMenu:', error);
    throw new Error(error.message);
  }

  revalidatePath('/');
  revalidatePath('/admin/menus');
}

export async function deleteMenu(id) {
  await checkAuth();

  const { error } = await supabase
    .from('menus')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erreur deleteMenu:', error);
    throw new Error(error.message);
  }

  revalidatePath('/');
  revalidatePath('/admin/menus');
}
