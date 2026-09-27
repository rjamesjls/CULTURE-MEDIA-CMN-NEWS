'use client';
import { useLayoutEffect, useEffect, useId, useRef, useState } from 'react';
import { useRadioSettings } from './radio-settings';
import { NativeSelect, NativeSelectOption } from '@/components/afoluku-radio/ui';
const models = [['bars', 'Barres'], ['curve', 'Courbe'], ['mirror', 'Miroir'], ['circle', 'Cercle'], ['dots', 'Points']];
const preference = 'afoluku-spectrum-model';
const valid = (value) => models.some(([id]) => id === value);
export default function AudioSpectrum({ getAnalyser, active, hint, hideTitle = false, allowModelSelection = true, showFrequencyLabels = true }) {
    const settings = useRadioSettings();
    const [selectedModel, setModel] = useState('bars');
    const model = allowModelSelection ? selectedModel : settings.spectrumModel;
    const id = useId();
    const canvas = useRef(null), source = useRef(getAnalyser);
    useLayoutEffect(() => { source.current = getAnalyser; });
    useEffect(() => {
        if (!allowModelSelection) return;
        try {
            const saved = localStorage.getItem(preference);
            // Restore the browser’s saved visualisation after hydration.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setModel(valid(saved) ? saved : settings.spectrumModel);
        }
        catch { }
        const sync = (event) => { if (event.key === preference && valid(event.newValue))
            setModel(event.newValue); };
        window.addEventListener('storage', sync);
        return () => window.removeEventListener('storage', sync);
    }, [settings.spectrumModel, allowModelSelection]);
    function choose(value) { if (!valid(value))
        return; setModel(value); try {
        localStorage.setItem(preference, value);
    }
    catch { } }
    useEffect(() => {
        const element = canvas.current, ctx = element?.getContext('2d');
        if (!element || !ctx)
            return;
        let width = 1, height = 168, frame = 0, last = 0, data = new Uint8Array(0);
        const count = 48, levels = new Float32Array(count);
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const resize = () => { width = Math.max(1, element.clientWidth); height = element.clientHeight || 168; const ratio = Math.min(window.devicePixelRatio || 1, 2); element.width = Math.round(width * ratio); element.height = Math.round(height * ratio); ctx.setTransform(ratio, 0, 0, ratio, 0, 0); };
        resize();
        const observer = new ResizeObserver(resize);
        observer.observe(element);
        const draw = (now) => {
            frame = requestAnimationFrame(draw);
            if (document.hidden || (reduced && now - last < 250))
                return;
            const dt = Math.min(.1, (now - last) / 1000 || 1 / 60);
            last = now;
            const analyser = active ? source.current() : null;
            if (analyser) {
                if (data.length !== analyser.frequencyBinCount)
                    data = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(data);
            }
            const nyquist = analyser ? analyser.context.sampleRate / 2 : 24000;
            for (let i = 0; i < count; i++) {
                let peak = 0;
                if (analyser) {
                    const low = 60 * Math.pow(Math.min(16000, nyquist) / 60, i / count), high = 60 * Math.pow(Math.min(16000, nyquist) / 60, (i + 1) / count);
                    const start = Math.min(data.length - 1, Math.max(1, Math.floor(low / nyquist * data.length)));
                    const end = Math.min(data.length, Math.max(start + 1, Math.ceil(high / nyquist * data.length)));
                    for (let bin = start; bin < end; bin++)
                        peak = Math.max(peak, data[bin] / 255);
                }
                // Actual frequency magnitudes with a fast rise and a softer release.
                levels[i] += (peak - levels[i]) * (1 - Math.exp(-dt * (peak > levels[i] ? 30 : 9)));
            }
            ctx.clearRect(0, 0, width, height);
            const pad = 12, usable = width - pad * 2, base = height - 15, amplitude = height - 38, step = usable / count;
            const gradient = ctx.createLinearGradient(0, height, 0, 0);
            gradient.addColorStop(0, '#557633');
            gradient.addColorStop(.55, '#b2d952');
            gradient.addColorStop(1, '#e4fa8a');
            ctx.fillStyle = gradient;
            ctx.strokeStyle = '#c8eb69';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            if (model === 'circle') {
                const radius = Math.min(width, height) * .22, cx = width / 2, cy = height / 2, reach = Math.min(width, height) * .23;
                ctx.lineWidth = Math.max(2, Math.min(4, width / 100));
                for (let i = 0; i < count; i++) {
                    const angle = i / count * Math.PI * 2 - Math.PI / 2, length = 2 + levels[i] * reach;
                    ctx.beginPath();
                    ctx.moveTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
                    ctx.lineTo(cx + Math.cos(angle) * (radius + length), cy + Math.sin(angle) * (radius + length));
                    ctx.stroke();
                }
            }
            else if (model === 'curve') {
                const points = Array.from(levels, (level, i) => ({ x: pad + (i + .5) * step, y: base - level * amplitude }));
                ctx.beginPath();
                ctx.moveTo(points[0].x, points[0].y);
                for (let i = 1; i < points.length; i++) {
                    const previous = points[i - 1], point = points[i];
                    ctx.quadraticCurveTo(previous.x, previous.y, (previous.x + point.x) / 2, (previous.y + point.y) / 2);
                }
                ctx.lineTo(points[count - 1].x, points[count - 1].y);
                ctx.stroke();
                ctx.lineTo(points[count - 1].x, base);
                ctx.lineTo(points[0].x, base);
                ctx.closePath();
                ctx.globalAlpha = .25;
                ctx.fill();
                ctx.globalAlpha = 1;
            }
            else
                for (let i = 0; i < count; i++) {
                    const x = pad + i * step, w = Math.max(1, step * .66), h = Math.max(1, levels[i] * amplitude);
                    if (model === 'mirror') {
                        ctx.fillRect(x, height / 2 - h / 2, w, h);
                    }
                    else if (model === 'dots') {
                        const radius = Math.max(1, Math.min(3, step * .25));
                        ctx.beginPath();
                        ctx.arc(x + step / 2, base - h, radius, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.globalAlpha = .25;
                        ctx.fillRect(x + step / 2 - .5, base - h + radius, 1, h - radius);
                        ctx.globalAlpha = 1;
                    }
                    else
                        ctx.fillRect(x, base - h, w, h);
                }
        };
        frame = requestAnimationFrame(draw);
        return () => { cancelAnimationFrame(frame); observer.disconnect(); };
    }, [model, active]);
    return <section className="audio-spectrum" aria-label="Spectre audio">
  {allowModelSelection && <div className="spectrum-heading" style={hideTitle ? { justifyContent: 'flex-end' } : undefined}><label className={hideTitle ? 'sr-only' : undefined} htmlFor={id}>{hideTitle ? 'Style de visualisation' : 'Spectre audio'}</label><NativeSelect id={id} aria-label="Modèle de spectre" value={model} onChange={e => choose(e.target.value)}>{models.map(([value, label]) => <NativeSelectOption key={value} value={value}>{label}</NativeSelectOption>)}</NativeSelect></div>}
  <div className="spectrum-stage"><img className={`spectrum-watermark ${settings.logoUrl !== '/afoluku-radio/logo.png' ? 'custom-watermark' : ''}`} src={settings.logoUrl} alt="" aria-hidden="true" width={718} height={251} draggable={false}/><canvas ref={canvas} role="img" aria-label={`Spectre audio — ${models.find(([id]) => id === model)?.[1]}. Les fréquences graves à aiguës réagissent au son.`}/></div>
  {(!active || showFrequencyLabels) && <div className="spectrum-caption">{active ? <><span>{model === 'circle' ? 'Graves → aigus, sens horaire' : 'Graves'}</span><span>{model === 'circle' ? 'Départ en haut' : 'Aigus'}</span></> : <span>{hint}</span>}</div>}
 </section>;
}
