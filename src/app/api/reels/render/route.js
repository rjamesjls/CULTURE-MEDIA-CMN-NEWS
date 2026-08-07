import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

const FFMPEG_PATH = ffmpegInstaller.path;

function runFFmpeg(args) {
  return new Promise((resolve, reject) => {
    console.log('Running FFmpeg with args:', args.join(' '));
    const proc = spawn(FFMPEG_PATH, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        console.error('FFmpeg stderr:', stderr);
        reject(new Error(`FFmpeg exited with code ${code}. stderr: ${stderr.slice(-500)}`));
      }
    });
    proc.on('error', (err) => reject(err));
  });
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const slidesMetaStr = formData.get('slidesMeta');

    if (!slidesMetaStr) {
      return NextResponse.json({ error: 'Aucune slide fournie' }, { status: 400 });
    }

    const slidesMeta = JSON.parse(slidesMetaStr);
    const videoFormat = formData.get('videoFormat') || 'reels';
    const mention = formData.get('mention') || '';
    const template = formData.get('template') || 'standard';

    const targetWidth = videoFormat === 'reels' ? 1080 : 1920;
    const targetHeight = videoFormat === 'reels' ? 1920 : 1080;

    // Dossiers temp
    const tmpDir = path.join(process.cwd(), '.tmp-reels');
    const publicTempDir = path.join(process.cwd(), 'public', 'temp-reels');
    await fs.mkdir(tmpDir, { recursive: true });
    await fs.mkdir(publicTempDir, { recursive: true });

    // Sauvegarder les fichiers uploadés
    const processedSlides = [];
    for (const slide of slidesMeta) {
      const file = formData.get(`file_${slide.id}`);
      if (file && typeof file === 'object' && file.arrayBuffer) {
        const buffer = Buffer.from(await file.arrayBuffer());
        // Nettoyer le nom du fichier (enlever les espaces/accents)
        const safeFileName = `slide_${slide.id}_${Date.now()}.${file.name.split('.').pop()}`;
        const filePath = path.join(tmpDir, safeFileName);
        await fs.writeFile(filePath, buffer);
        processedSlides.push({ ...slide, filePath, isImage: /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name) });
      }
    }

    if (processedSlides.length === 0) {
      return NextResponse.json({ error: 'Aucun fichier média fourni. Importez des images ou vidéos dans vos slides.' }, { status: 400 });
    }

    // Construire et traiter chaque slide en une vidéo individuelle
    const slideVideos = [];
    for (const slide of processedSlides) {
      const outPath = path.join(tmpDir, `processed_${slide.id}_${Date.now()}.mp4`);
      const args = [];

      if (slide.isImage) {
        args.push('-loop', '1', '-t', String(slide.duration || 3));
      }
      args.push('-i', slide.filePath);

      // Scale + crop au centre
      let vf = `fps=30,scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=increase,crop=${targetWidth}:${targetHeight},setsar=1`;

      // Texte
      if (slide.text) {
        const safeText = slide.text
          .replace(/\\/g, '\\\\')
          .replace(/'/g, "\\'")
          .replace(/:/g, '\\:')
          .replace(/\[/g, '\\[')
          .replace(/\]/g, '\\]');
        const textColor = template === 'breaking' ? 'red' : 'black@0.6';
        const fontPath = '/Library/Fonts/Lato-Bold.ttf';
        vf += `,drawtext=fontfile='${fontPath}':text='${safeText}':fontcolor=white:fontsize=60:x=(w-text_w)/2:y=h*0.82:box=1:boxcolor=${textColor}:boxborderw=15`;
      }

      // Mention
      if (mention) {
        const safeMention = mention.replace(/'/g, "\\'").replace(/:/g, '\\:');
        const fontPath = '/Library/Fonts/Lato-Bold.ttf';
        vf += `,drawtext=fontfile='${fontPath}':text='${safeMention}':fontcolor=white:fontsize=38:x=(w-text_w)/2:y=h*0.93:box=1:boxcolor=black@0.4:boxborderw=8`;
      }

      args.push('-vf', vf);

      if (slide.isImage) {
        args.push('-t', String(slide.duration || 3));
      }

      args.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'fast', '-an', '-y', outPath);

      await runFFmpeg(args);
      slideVideos.push(outPath);
    }

    // Concaténer si plusieurs slides
    const outputFilename = `reel_${Date.now()}.mp4`;
    const outputPath = path.join(publicTempDir, outputFilename);

    if (slideVideos.length === 1) {
      await fs.copyFile(slideVideos[0], outputPath);
    } else {
      // Créer le fichier de liste pour concat
      const concatListPath = path.join(tmpDir, `concat_${Date.now()}.txt`);
      const concatContent = slideVideos.map(p => `file '${p}'`).join('\n');
      await fs.writeFile(concatListPath, concatContent);

      const concatArgs = [
        '-f', 'concat', '-safe', '0',
        '-i', concatListPath,
        '-c', 'copy',
        '-y', outputPath,
      ];
      await runFFmpeg(concatArgs);
      await fs.unlink(concatListPath);
    }

    // Nettoyer les fichiers temporaires intermédiaires
    for (const f of slideVideos) {
      await fs.unlink(f).catch(() => {});
    }
    for (const slide of processedSlides) {
      await fs.unlink(slide.filePath).catch(() => {});
    }

    return NextResponse.json({ success: true, url: `/temp-reels/${outputFilename}` });
  } catch (error) {
    console.error('API /api/reels/render error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
