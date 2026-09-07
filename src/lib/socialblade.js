/**
 * Service d'intégration pour l'API Social Blade v2
 * Documentation: https://socialblade.com/v2/docs
 */

export async function fetchSocialBladeStats(query, platform = 'youtube') {
  const clientId = process.env.SOCIALBLADE_CLIENT_ID;
  const token = process.env.SOCIALBLADE_CLIENT_TOKEN;

  if (!clientId || !token) {
    console.warn("API Social Blade : Clés SOCIALBLADE_CLIENT_ID ou SOCIALBLADE_CLIENT_TOKEN absentes.");
    return { error: "CLÉS_MANQUANTES", message: "Veuillez configurer SOCIALBLADE_CLIENT_ID et SOCIALBLADE_CLIENT_TOKEN dans Vercel." };
  }

  // platform can be 'youtube', 'tiktok', 'instagram'
  const validPlatforms = ['youtube', 'tiktok', 'instagram'];
  if (!validPlatforms.includes(platform)) {
    console.error(`Plateforme SocialBlade non supportée : ${platform}`);
    return null;
  }

  try {
    const res = await fetch(`https://matrix.sbapis.com/b/${platform}/statistics?query=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'client_id': clientId,
        'token': token,
        'Accept': 'application/json'
      },
      next: { revalidate: 3600 } // Cache 1h
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Social Blade API Error (${res.status}):`, errorText);
      return { error: 'API_ERROR', status: res.status, message: `SocialBlade a refusé la requête (Code ${res.status}). Vérifiez vos clés d'API (Client ID et Token).` };
    }

    const data = await res.json();
    if (!data.status || data.status.error) {
      console.error("Social Blade API returned error status:", data.status);
      
      let msg = data.status?.error || "Erreur interne SocialBlade";
      if (data.status?.status === 402 || data.status?.error === 'insufficient_credits') {
        msg = "Votre compte API SocialBlade n'a plus de crédits suffisants (insufficient_credits).";
      }
      return { error: 'API_ERROR', status: 400, message: msg };
    }

    const daily = data.statistics?.daily || [];

    // Trier du plus récent au plus ancien
    const sortedDaily = [...daily].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Calculer les gains des 7 derniers jours et 30 derniers jours
    const last7 = sortedDaily.slice(0, 7);
    const last30 = sortedDaily.slice(0, 30);

    // Some platforms use 'followers' instead of 'subs', but SocialBlade often standardizes 'subs' or we must check.
    const viewsGained7d = last7.reduce((sum, day) => sum + (parseInt(day.views || 0, 10)), 0);
    const subsGained7d = last7.reduce((sum, day) => sum + (parseInt(day.subs || day.followers || 0, 10)), 0);

    const viewsGained30d = last30.reduce((sum, day) => sum + (parseInt(day.views || 0, 10)), 0);
    const subsGained30d = last30.reduce((sum, day) => sum + (parseInt(day.subs || day.followers || 0, 10)), 0);

    return {
      raw: data,
      channelId: data.id?.channelid || data.id?.id,
      username: data.id?.username,
      total: data.statistics?.total || {},
      gains: {
        '7_days': { views: Math.max(0, viewsGained7d), subscribers: Math.max(0, subsGained7d) },
        '30_days': { views: Math.max(0, viewsGained30d), subscribers: Math.max(0, subsGained30d) }
      }

    };
  } catch (error) {
    console.error("Erreur d'appel API Social Blade:", error);
    return null;
  }
}
