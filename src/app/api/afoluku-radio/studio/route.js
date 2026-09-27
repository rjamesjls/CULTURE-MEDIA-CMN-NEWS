import { admin, handle, json, getTracks, getPlaylists, state, ApiError } from '@/lib/afoluku-radio/server';
import { missingRadioVariables, configurationHelp } from '@/lib/afoluku-radio/configuration';
export const dynamic = 'force-dynamic';
export async function GET() {
    return handle(async () => {
        await admin();
        const missing = missingRadioVariables();
        if (missing.length) throw new ApiError(503, `Configuration incomplète : ${missing.join(', ')}. Dans Vercel → Settings → Environment Variables, ajoutez ces variables à l’environnement de ce déploiement (Preview pour la version de test), puis redéployez. Rafraîchir cette page ne suffit pas à appliquer les variables.`);
        try {
            const [tracks, playlists, station] = await Promise.all([getTracks(), getPlaylists(), state()]);
            return json({ tracks, playlists, station });
        } catch (error) {
            const help = configurationHelp(error);
            if (help) throw new ApiError(503, help);
            throw error;
        }
    });
}
