'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export async function login(formData) {
  const email = formData.get('email');
  const password = formData.get('password');
  
  if (!email || !password) {
    return { error: "L'email et le mot de passe sont requis" };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: 'Identifiants invalides' };
  }

  redirect('/');
}

export async function signup(formData) {
  const email = formData.get('email');
  const password = formData.get('password');
  const name = formData.get('name');
  
  if (!email || !password || !name) {
    return { error: "Le nom, l'email et le mot de passe sont requis" };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name,
        full_name: name,
        role: 'user'
      }
    }
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}
