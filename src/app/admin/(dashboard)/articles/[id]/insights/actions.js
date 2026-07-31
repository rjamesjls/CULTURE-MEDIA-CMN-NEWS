"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function getMetaInsights(articleId) {
  try {
    const accessToken = process.env.META_ACCESS_TOKEN;
    if (!accessToken) {
      return { success: false, error: "Jeton d'accès Meta manquant." };
    }

    // 1. Récupérer les IDs de la base de données
    const { data: article, error: dbError } = await supabase
      .from('articles')
      .select('facebook_post_id, instagram_post_id')
      .eq('id', articleId)
      .single();

    if (dbError) {
      console.error("Erreur DB:", dbError);
      return { success: false, error: "Erreur lors de la récupération de l'article." };
    }

    if (!article.facebook_post_id && !article.instagram_post_id) {
      return { success: false, error: "Aucune publication Meta n'est liée à cet article (ou IDs introuvables)." };
    }

    let fbInsights = null;
    let igInsights = null;
    let fbError = null;
    let igError = null;

    // 2. Fetch Facebook Insights
    if (article.facebook_post_id) {
      try {
        // Demande les likes, comments, et impressions/engagement
        const url = `https://graph.facebook.com/v19.0/${article.facebook_post_id}?fields=likes.summary(true),comments.summary(true),insights.metric(post_impressions_unique,post_engaged_users)&access_token=${accessToken}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.error) throw new Error(data.error.message);

        let impressions = 0;
        let engagedUsers = 0;

        if (data.insights && data.insights.data) {
          const impMetric = data.insights.data.find(m => m.name === 'post_impressions_unique');
          const engMetric = data.insights.data.find(m => m.name === 'post_engaged_users');
          if (impMetric && impMetric.values && impMetric.values[0]) impressions = impMetric.values[0].value;
          if (engMetric && engMetric.values && engMetric.values[0]) engagedUsers = engMetric.values[0].value;
        }

        fbInsights = {
          likes: data.likes?.summary?.total_count || 0,
          comments: data.comments?.summary?.total_count || 0,
          impressions: impressions,
          engagedUsers: engagedUsers
        };
      } catch (err) {
        fbError = err.message;
      }
    }

    // 3. Fetch Instagram Insights
    if (article.instagram_post_id) {
      try {
        // Pour les IG Media (images/carrousels), les métriques sont: impressions, reach, saved
        const url = `https://graph.facebook.com/v19.0/${article.instagram_post_id}?fields=like_count,comments_count,insights.metric(impressions,reach,saved)&access_token=${accessToken}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.error) throw new Error(data.error.message);

        let impressions = 0;
        let reach = 0;
        let saved = 0;

        if (data.insights && data.insights.data) {
          const impMetric = data.insights.data.find(m => m.name === 'impressions');
          const reachMetric = data.insights.data.find(m => m.name === 'reach');
          const savedMetric = data.insights.data.find(m => m.name === 'saved');
          if (impMetric && impMetric.values && impMetric.values[0]) impressions = impMetric.values[0].value;
          if (reachMetric && reachMetric.values && reachMetric.values[0]) reach = reachMetric.values[0].value;
          if (savedMetric && savedMetric.values && savedMetric.values[0]) saved = savedMetric.values[0].value;
        }

        igInsights = {
          likes: data.like_count || 0,
          comments: data.comments_count || 0,
          impressions: impressions,
          reach: reach,
          saved: saved
        };
      } catch (err) {
        igError = err.message;
      }
    }

    return {
      success: true,
      fbInsights,
      igInsights,
      fbError,
      igError
    };

  } catch (error) {
    console.error("Fatal error fetching insights:", error);
    return { success: false, error: "Erreur serveur inattendue." };
  }
}
