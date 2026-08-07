"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

// --- KNOWLEDGE BRAIN (Règles Éditoriales) ---

export async function getKnowledgeRules() {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("knowledge_brain")
    .select("*")
    .order("category", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function addKnowledgeRule(formData) {
  const category = formData.get("category");
  const title = formData.get("title");
  const content = formData.get("content");

  const supabase = await getSupabase();
  const { error } = await supabase
    .from("knowledge_brain")
    .insert([{ category, title, content }]);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/knowledge-brain");
  return { success: true };
}

export async function deleteKnowledgeRule(id) {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from("knowledge_brain")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/knowledge-brain");
  return { success: true };
}

export async function updateKnowledgeRule(id, formData) {
  const category = formData.get("category");
  const title = formData.get("title");
  const content = formData.get("content");

  const supabase = await getSupabase();
  const { error } = await supabase
    .from("knowledge_brain")
    .update({ category, title, content })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/knowledge-brain");
  return { success: true };
}

// --- LINGUISTIC DICTIONARY (Dictionnaire Local) ---

export async function getDictionaryTerms(language = null) {
  const supabase = await getSupabase();
  let query = supabase.from("linguistic_dictionary").select("*");
  
  if (language) {
    query = query.eq("language", language);
  }
  
  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function addDictionaryTerm(formData) {
  const language = formData.get("language");
  const source_term = formData.get("source_term");
  const translated_term = formData.get("translated_term");
  const context = formData.get("context");

  const supabase = await getSupabase();
  const { error } = await supabase
    .from("linguistic_dictionary")
    .insert([{ language, source_term, translated_term, context }]);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/knowledge-brain");
  return { success: true };
}

export async function updateDictionaryTerm(id, formData) {
  const language = formData.get("language");
  const source_term = formData.get("source_term");
  const translated_term = formData.get("translated_term");
  const context = formData.get("context");

  const supabase = await getSupabase();
  const { error } = await supabase
    .from("linguistic_dictionary")
    .update({ language, source_term, translated_term, context })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/knowledge-brain");
  return { success: true };
}

export async function deleteDictionaryTerm(id) {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from("linguistic_dictionary")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/knowledge-brain");
  return { success: true };
}
