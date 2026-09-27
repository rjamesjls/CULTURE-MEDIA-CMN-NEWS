'use client';
import { useState } from 'react';
import { NativeSelect, NativeSelectOption } from '@/components/afoluku-radio/ui';
import { classificationLabel, musicGenres } from '@/lib/afoluku-radio/track-classification';
import { Headphones, Trophy } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/afoluku-radio/ui';
import { TrackArtwork } from './track-visuals';
export default function StreamRanking({ tracks, stats, failed }) {
    const [genre, setGenre] = useState('all');
    const counts = new Map(stats?.tracks.map(t => [t.id, t.streams]));
    const music = tracks.filter(t => t.contentKind === 'music');
    const sorted = music.filter(t => genre === 'all' || (genre === 'unclassified' ? !t.musicGenre : t.musicGenre === genre)).map(t => ({ ...t, streams: counts.get(t.id) || 0 })).sort((a, b) => b.streams - a.streams || a.title.localeCompare(b.title, 'fr') || a.id.localeCompare(b.id));
    const total = sorted.reduce((sum, t) => sum + t.streams, 0);
    return <section className="stream-ranking"><div className="audience-card"><Headphones size={28}/><div><span className="eyebrow">{genre === 'all' ? 'STREAMS MUSICAUX' : 'STREAMS DE LA SÉLECTION'}</span><div className="audience-value" aria-live="polite">{failed ? 'Indisponible' : stats ? total.toLocaleString('fr-FR') : '—'}<span>écoutes validées</span></div></div><p className="help">Cumul depuis l’activation du compteur.<br />Actualisation toutes les 10 secondes.</p></div>
 <section className="library"><div className="section-top"><div><h2><Trophy size={21}/> Classement musical</h2><p>Un stream après 30 secondes de lecture. Un seul comptage par navigateur et par passage du titre.</p></div><NativeSelect aria-label="Catégorie du classement" value={genre} onChange={e => setGenre(e.target.value)}><NativeSelectOption value="all">Toutes les musiques</NativeSelectOption>{musicGenres.map(([id, label]) => <NativeSelectOption key={id} value={id}>{label}</NativeSelectOption>)}<NativeSelectOption value="unclassified">Musique à classer</NativeSelectOption></NativeSelect></div>
 {failed ? <div className="notice error" role="status">Les compteurs sont momentanément indisponibles. Nouvelle tentative automatique dans quelques secondes.</div> : !stats ? <div className="empty">Chargement du classement…</div> : !sorted.length ? <div className="empty"><Trophy size={32}/><h3>Aucune musique dans cette sélection.</h3><p>Classez vos titres depuis le bouton Modifier dans la bibliothèque.</p></div> : <>
 {total === 0 && <div className="notice">Les compteurs sont prêts. Les premières écoutes validées apparaîtront ici ; les anciennes écoutes ne sont pas reconstituées.</div>}
 <Table><TableHeader><TableRow><TableHead>RANG</TableHead><TableHead>TITRE</TableHead><TableHead className="text-right">STREAMS</TableHead></TableRow></TableHeader><TableBody>{sorted.map((track, index) => { const rank=sorted.findIndex(item=>item.streams===track.streams)+1; return <TableRow key={track.id}><TableCell className="ranking-position">{track.streams ? rank : '—'}</TableCell><TableCell><div className="row"><TrackArtwork src={track.coverUrl} type={track.coverType} title={track.title}/><div><span className="track-title">{track.title}</span><div className="subtle">{classificationLabel(track)}</div></div></div></TableCell><TableCell className="text-right stream-number">{track.streams.toLocaleString('fr-FR')}</TableCell></TableRow>; })}</TableBody></Table></>}
 <p className="help ranking-note">Les publicités, jingles, voix off, préécoutes de la régie, le volume à zéro et les directs au micro sont exclus. Plusieurs onglets d’un même navigateur ne multiplient pas les streams.</p></section></section>;
}
