/**
 * Service d'intégration pour l'API Social Blade v2
 * Documentation: https://socialblade.com/v2/docs
 */

export async function fetchSocialBladeChannelStats(channelQuery) {
  const clientId = process.env.SOCIALBLADE_CLIENT_ID;
  const token = process.env.SOCIALBLADE_CLIENT_TOKEN;

  if (!clientId || !token) {
    console.warn("API Social Blade : Clés SOCIALBLADE_CLIENT_ID ou SOCIALBLADE_CLIENT_TOKEN absentes.");
    return null;
  }

  try {
    const res = await fetch(`https://socialblade.com/v2/youtube/statistics?query=${encodeURIComponent(channelQuery)}`, {
      method: 'GET',
      headers: {
        'client_id': clientId,
        'token': token,
        'Accept': 'application/json'
      },
      next: { revalidate: 3600 } // Cache 1h
    });

    if (!res.ok) {
      console.error(`Social Blade API Error (${res.status}):`, await res.text());
      return null;
    }

    const data = await res.json();
    if (!data.status || data.status.error) {
      console.error("Social Blade API returned error status:", data.status);
      return null;
    }

    const daily = data.statistics?.daily || [];

    // Trier du plus récent au plus ancien
    const sortedDaily = [...daily].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Calculer les gains des 7 derniers jours et 30 derniers jours
    const last7 = sortedDaily.slice(0, 7);
    const last30 = sortedDaily.slice(0, 30);

    const viewsGained7d = last7.reduce((sum, day) => sum + (parseInt(day.views || 0, 10)), 0);
    const subsGained7d = last7.reduce((sum, day) => sum + (parseInt(day.subs || 0, 10)), 0);

    const viewsGained30d = last30.reduce((sum, day) => sum + (parseInt(day.views || 0, 10)), 0);
    const subsGained30d = last30.reduce((sum, day) => sum + (parseInt(day.subs || 0, 10)), 0);

    return {
      raw: data,
      channelId: data.id?.channelid,
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
