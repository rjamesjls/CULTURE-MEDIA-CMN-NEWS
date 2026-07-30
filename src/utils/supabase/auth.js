import { createClient } from './server';

export async function getUserProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  console.log("=== DEBUG getUserProfile ===");
  console.log("User:", user?.id, user?.email);
  
  if (!user) {
    console.log("No user found");
    return null;
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  console.log("Profile query result:", profile, "Error:", error);

  if (error || !profile) {
    console.log("Fallback triggering for user", user.id);
    // Si pas de profil, on tente de le créer (fallback)
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert([
        { 
          id: user.id, 
          email: user.email,
          role: user.email === 'admin@culturemedianews.fr' ? 'admin' : 'author',
          status: user.email === 'admin@culturemedianews.fr' ? 'active' : 'pending'
        }
      ])
      .select()
      .single();
    
    console.log("Fallback insert result:", newProfile, "Error:", insertError);
    return newProfile;
  }

  return profile;
}
