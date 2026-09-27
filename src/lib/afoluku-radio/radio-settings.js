import { validMusicGenre } from './track-classification.js';
export const spectrumModels = [['bars', 'Barres'], ['curve', 'Courbe'], ['mirror', 'Miroir'], ['circle', 'Cercle'], ['dots', 'Points']];
export const defaultSettings = { name: 'AFOLUKU RADIO', monitorVolume: 70, previewVolume: 70, duckVolume: 22, spectrumModel: 'bars', videoEnabled: true, publicPortrait: false, importMusicGenre: null, importCoverUrl: null, logoUrl: '/afoluku-radio/logo.png', version: 0 };
export function validSettings(value) { if (!value || typeof value !== 'object')
    return false; const s = value; return (s.importMusicGenre == null || validMusicGenre(s.importMusicGenre)) && (s.publicPortrait === undefined || typeof s.publicPortrait === 'boolean') && (s.videoEnabled === undefined || typeof s.videoEnabled === 'boolean') && typeof s.name === 'string' && s.name.trim().length > 0 && s.name.trim().length <= 80 && Number.isInteger(s.monitorVolume) && s.monitorVolume >= 0 && s.monitorVolume <= 100 && Number.isInteger(s.previewVolume) && s.previewVolume >= 0 && s.previewVolume <= 100 && Number.isInteger(s.duckVolume) && s.duckVolume >= 0 && s.duckVolume <= 100 && spectrumModels.some(([id]) => id === s.spectrumModel) && Number.isInteger(s.version) && s.version >= 0; }

export function broadcastArtwork(track, settings) {
    if (settings.videoEnabled !== false) return { src: track?.coverUrl, type: track?.coverType };
    return { src: track?.coverType !== 'video' && track?.coverUrl ? track.coverUrl : settings.logoUrl, type: 'image' };
}
