import { admin, handle, json, getTracks, getPlaylists, state } from '@/lib/afoluku-radio/server';
export const dynamic = 'force-dynamic';
export async function GET() { return handle(async () => { await admin(); const [tracks, playlists, station] = await Promise.all([getTracks(), getPlaylists(), state()]); return json({ tracks, playlists, station }); }); }
