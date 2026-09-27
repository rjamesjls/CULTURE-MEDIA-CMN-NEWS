import { db } from './server';
import { defaultSettings } from './radio-settings';
export async function settingsRow() { return await db().prepare('SELECT * FROM radio_settings WHERE id=1').first() || { payload: '{}', logo_key: null, version: 0 }; }
export function settingsValue(row) { return { ...defaultSettings, ...JSON.parse(row.payload), logoUrl: row.logo_key ? `/api/afoluku-radio/settings/logo?v=${row.logo_key.split('/').pop()}` : defaultSettings.logoUrl, version: row.version }; }
export async function initializeSettings() { await db().prepare("INSERT OR IGNORE INTO radio_settings(id,payload,version) VALUES(1,'{}',0)").run(); }
