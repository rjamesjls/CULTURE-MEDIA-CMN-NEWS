export const contentKinds = [['music', 'Musique'], ['advertisement', 'Publicité'], ['jingle', 'Jingle'], ['voiceover', 'Voix off']];
export const musicGenres = [['urban', 'Musique urbaine'], ['traditional', 'Musique traditionnelle'], ['gospel', 'Musique gospel']];
export const validContentKind = (value) => contentKinds.some(([id]) => id === value);
export const validMusicGenre = (value) => musicGenres.some(([id]) => id === value);
export function classificationLabel(track) {
    return track.contentKind === 'music' ? (musicGenres.find(([id]) => id === track.musicGenre)?.[1] || 'Musique · à classer') : contentKinds.find(([id]) => id === track.contentKind)?.[1] || 'Hors classement';
}
