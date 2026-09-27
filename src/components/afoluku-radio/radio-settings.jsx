'use client';
import {uploadRadioFile} from '@/lib/afoluku-radio/upload';
import { useEffect, useState } from 'react';
import { api } from '@/lib/afoluku-radio/audio';
import { defaultSettings, spectrumModels } from '@/lib/afoluku-radio/radio-settings';
export function useRadioSettings() { const [settings, setSettings] = useState(defaultSettings); useEffect(() => { let alive = true; const update = () => void api('/api/afoluku-radio/settings').then(s => { if (alive)
    setSettings(previous => s.version >= previous.version ? s : previous); }).catch(() => { }); update(); const timer = setInterval(update, 30000); const changed = (e) => { const s = e.detail; setSettings(previous => s.version >= previous.version ? s : previous); }; window.addEventListener('radio-settings', changed); return () => { alive = false; clearInterval(timer); window.removeEventListener('radio-settings', changed); }; }, []); return settings; }
export function RadioLogo({ src = defaultSettings.logoUrl, name = defaultSettings.name }) { return <span className={`radio-logo ${src === defaultSettings.logoUrl ? 'original-logo' : ''}`}><img src={src} alt={`Logo ${name}`}/></span>; }
export default function SettingsPanel({ enabled }) {
    const [value, setValue] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState(''), [saved, setSaved] = useState('');
    const load = () => api('/api/afoluku-radio/settings').then(setValue).catch(e => setError(e.message));
    useEffect(() => { if (enabled)
        void load(); }, [enabled]);
    function accept(s, logoOnly = false) { setValue(previous => logoOnly && previous ? { ...previous, logoUrl: s.logoUrl, version: s.version } : s); window.dispatchEvent(new CustomEvent('radio-settings', { detail: s })); setSaved(logoOnly ? 'Logo enregistré.' : 'Paramètres enregistrés.'); }
    async function work(action, logoOnly = false) { if (busy)
        return; setBusy(true); setError(''); setSaved(''); try {
        accept(await action(), logoOnly);
    }
    catch (e) {
        setError(e.message);
    }
    finally {
        setBusy(false);
    } }
    async function logo(file) { return work(async () => { if (file && file.size > 5 * 1024 * 1024)
        throw new Error('Choisissez une image de 5 Mo maximum.'); if(file)return uploadRadioFile(file,{purpose:'logo',mime:file.type,version:value?.version});
        const r = await fetch('/api/afoluku-radio/settings/logo', { method: file ? 'PUT' : 'DELETE', headers: { 'X-Settings-Version': String(value?.version) }, body: file }); const result = await r.json(); if (!r.ok)
        throw new Error(result.error); return result; }, true); }
    return <section className="settings-panel library"><h2>Paramètres de la radio</h2>{error && <div className="notice error" role="alert">{error}<button className="secondary" disabled={busy} onClick={() => void load()}>Recharger</button></div>}{saved && <p className="notice" role="status">{saved}</p>}{!value ? <p>{enabled ? 'Chargement des paramètres…' : 'Connectez-vous pour modifier les paramètres.'}</p> : <><form onSubmit={e => { e.preventDefault(); void work(() => api('/api/afoluku-radio/settings', 'PUT', value)); }}><label className="field-label">Nom de la radio<input className="field" value={value.name} maxLength={80} required disabled={busy} onChange={e => setValue({ ...value, name: e.target.value })}/></label><div className="settings-grid"><label className="field-label">Volume du retour son par défaut<div className="setting-range"><input type="range" min="0" max="100" value={value.monitorVolume} disabled={busy} onChange={e => setValue({ ...value, monitorVolume: Number(e.target.value) })}/><output>{value.monitorVolume}%</output></div></label><label className="field-label">Volume de préécoute par défaut<div className="setting-range"><input type="range" min="0" max="100" value={value.previewVolume} disabled={busy} onChange={e => setValue({ ...value, previewVolume: Number(e.target.value) })}/><output>{value.previewVolume}%</output></div></label><label className="field-label">Musique pendant la prise de parole<div className="setting-range"><input type="range" min="0" max="100" value={value.duckVolume} disabled={busy} onChange={e => setValue({ ...value, duckVolume: Number(e.target.value) })}/><output>{value.duckVolume}%</output></div></label></div><label className="field-label">Modèle de spectre par défaut<select className="field" value={value.spectrumModel} disabled={busy} onChange={e => setValue({ ...value, spectrumModel: e.target.value })}>{spectrumModels.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label><p className="help">Le retour son reste à activer dans la régie. Chaque auditeur peut ensuite choisir son propre modèle de spectre.</p><button className="primary" disabled={busy || !value.name.trim()} type="submit">{busy ? 'Enregistrement…' : 'Enregistrer les paramètres'}</button></form><div className="settings-logo"><h3>Logo de la radio</h3><RadioLogo src={value.logoUrl} name={value.name}/><p className="help">Le logo apparaît sur la page d’écoute et derrière les spectres.</p><label className="field-label">Importer un logo<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={e => { const file = e.target.files?.[0]; if (file)
        void logo(file); e.target.value = ''; }}/></label>{value.logoUrl !== defaultSettings.logoUrl && <button className="secondary" disabled={busy} onClick={() => void logo()}>Revenir au logo AFOLUKU</button>}<small>PNG, JPG ou WebP · 5 Mo maximum</small></div></>}</section>;
}
