import assert from 'node:assert/strict';
import {test} from 'node:test';
import {adminDestination} from '../../src/utils/supabase/admin-destination.js';
import {configurationHelp} from '../../src/lib/afoluku-radio/configuration.js';
import {api} from '../../src/lib/afoluku-radio/audio.js';

test('radio login returns to studio, never an untrusted destination', () => {
    assert.equal(adminDestination('/admin/webradio'), '/admin/webradio');
    for (const value of [null, '/admin', 'https://evil.test', '//evil.test', '/admin/../auth', '/admin\\evil'])
        assert.equal(adminDestination(value), '/admin');
});

test('configuration guidance never includes raw database credentials', () => {
    for (const code of ['28P01', '42P01', '42501', 'ENETUNREACH']) {
        const help = configurationHelp({code, message:'postgresql://admin:secret@private-host'});
        assert.ok(help);
        assert.doesNotMatch(help, /secret|private-host/);
    }
    assert.equal(configurationHelp(new Error('secret')), null);
});

test('client distinguishes configuration failures from expired sessions and can retry', async () => {
    const original = globalThis.fetch;
    try {
        for (const status of [503, 401, 403]) {
            globalThis.fetch = async () => Response.json({error:'Test failure'}, {status});
            await assert.rejects(api('/studio'), error => error.status === status && error.message === 'Test failure');
        }
        globalThis.fetch = async () => Response.json({tracks:[]});
        assert.deepEqual(await api('/studio'), {tracks:[]});
    } finally { globalThis.fetch = original; }
});
