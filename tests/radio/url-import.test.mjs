import assert from 'node:assert/strict';
import {test} from 'node:test';
import {downloadMediaUrl, mediaImportUrl, MAX_URL_IMPORT_BYTES} from '../../src/lib/afoluku-radio/url-import.js';

test('accepts direct HTTPS links, rejects credentials, unsafe schemes and YouTube pages', () => {
    assert.equal(mediaImportUrl(' https://media.example/song.mp3?token=abc#play '), 'https://media.example/song.mp3?token=abc');
    for (const link of ['no url', 'http://media.example/song.mp3', 'file:///music.mp3', 'https://user:secret@media.example/music.mp3'])
        assert.throws(() => mediaImportUrl(link));
    for (const link of ['https://youtu.be/123', 'https://m.youtube.com/watch?v=123', 'https://www.youtube-nocookie.com/embed/123'])
        assert.throws(() => mediaImportUrl(link), /YouTube/);
});

test('downloads bytes as a media file without cookies, referrer or server proxy', async t => {
    let request;
    t.mock.method(globalThis, 'fetch', async (url, options) => {
        request = {url, options};
        return new Response(new Uint8Array([1, 2, 3]), {headers:{'Content-Type':'audio/mpeg'}});
    });
    const progress=[];
    const file=await downloadMediaUrl('https://media.example/Mon%20titre.mp3', {onProgress:size=>progress.push(size)});
    assert.equal(file.name, 'Mon titre.mp3'); assert.equal(file.type, 'audio/mpeg'); assert.equal(file.size, 3);
    assert.equal(request.options.credentials, 'omit'); assert.equal(request.options.referrerPolicy, 'no-referrer');
    assert.equal(request.options.mode, 'cors'); assert.deepEqual(progress, [3]);
});

test('uses content type for extensionless links and filename for binary downloads', async t => {
    t.mock.method(globalThis, 'fetch', async () => new Response('data', {headers:{'Content-Type':'audio/mp4; charset=binary'}}));
    assert.equal((await downloadMediaUrl('https://media.example/download?id=123')).name, 'download.m4a');
    globalThis.fetch = async () => new Response('data', {headers:{'Content-Type':'application/octet-stream'}});
    assert.equal((await downloadMediaUrl('https://media.example/clip.mp4')).type, 'video/mp4');
});

test('rejects web pages, unavailable, unsupported and empty files with useful errors', async t => {
    t.mock.method(globalThis, 'fetch', async () => new Response('<html>Login</html>', {headers:{'Content-Type':'text/html'}}));
    await assert.rejects(downloadMediaUrl('https://media.example/song.mp3'), /page web/);
    globalThis.fetch=async()=>new Response('missing', {status:404});
    await assert.rejects(downloadMediaUrl('https://media.example/song.mp3'), /404/);
    globalThis.fetch=async()=>new Response('data', {headers:{'Content-Type':'application/pdf'}});
    await assert.rejects(downloadMediaUrl('https://media.example/report.pdf'), /Format/);
    globalThis.fetch=async()=>new Response('', {headers:{'Content-Type':'audio/mpeg'}});
    await assert.rejects(downloadMediaUrl('https://media.example/song.mp3'), /vide/);
});

test('enforces the 50 MB limit from headers and actual streamed bytes, then cancels the stream', async t => {
    t.mock.method(globalThis, 'fetch', async () => new Response('data', {headers:{'Content-Length':String(MAX_URL_IMPORT_BYTES+1),'Content-Type':'audio/mpeg'}}));
    await assert.rejects(downloadMediaUrl('https://media.example/song.mp3'), /50 Mo/);
    let cancelled=false;
    globalThis.fetch=async()=>new Response(new ReadableStream({
        pull(controller){controller.enqueue(new Uint8Array(1024*1024));},
        cancel(){cancelled=true;},
    }));
    await assert.rejects(downloadMediaUrl('https://media.example/song.mp3'), /50 Mo/);
    assert.equal(cancelled, true);
});

test('explains browser restrictions without exposing the URL', async t => {
    t.mock.method(globalThis, 'fetch', async () => {throw new TypeError('Failed to fetch secret=123');});
    await assert.rejects(downloadMediaUrl('https://media.example/song.mp3?secret=123'), error => /hébergeur/.test(error.message) && !error.message.includes('123'));
});

test('cancellation aborts the pending request', async t => {
    const controller=new AbortController();
    t.mock.method(globalThis, 'fetch', async (url, {signal}) => new Promise((resolve,reject)=> {
        signal.addEventListener('abort', ()=>reject(new DOMException('Aborted','AbortError')), {once:true});
    }));
    const download=downloadMediaUrl('https://media.example/song.mp3', {signal:controller.signal});
    controller.abort();
    await assert.rejects(download, {name:'AbortError'});
});
