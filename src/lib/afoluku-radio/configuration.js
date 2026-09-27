// Only variable names and fixed guidance are returned, never credentials or raw errors.
export function missingRadioVariables() {
    return ['RADIO_DATABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']
        .filter(name => !process.env[name]?.trim());
}

export function configurationHelp(error) {
    if (['28P01', '28000'].includes(error?.code))
        return 'Connexion à Supabase refusée. Vérifiez le mot de passe et les identifiants de RADIO_DATABASE_URL dans Vercel, puis redéployez.';
    if (['42P01', '3F000', '42703'].includes(error?.code))
        return 'Les tables de la radio sont absentes ou incomplètes. Exécutez la migration radio dans le projet Supabase indiqué par RADIO_DATABASE_URL.';
    if (error?.code === '42501')
        return 'Le compte de connexion à Supabase ne possède pas les droits nécessaires sur les tables de la radio.';
    if (['ENETUNREACH', 'ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT', 'EHOSTUNREACH'].includes(error?.code))
        return 'Le serveur ne parvient pas à joindre Supabase. Vérifiez que RADIO_DATABASE_URL utilise le pooler partagé compatible IPv4, puis redéployez.';
    return null;
}
