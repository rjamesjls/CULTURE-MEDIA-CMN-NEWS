import { NextResponse } from 'next/server';
import ytdl from '@distube/ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export const maxDuration = 60; // 1 minute max duration on Vercel

export async function POST(req) {
  try {
    const body = await req.json();
    const { videoId, startTime = 0, duration = 20, textOverlay = '' } = body;

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    const outputDir = path.join(process.cwd(), 'public', 'shorts');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename = `short_${videoId}_${uuidv4()}.mp4`;
    const outputPath = path.join(outputDir, filename);

    // Fetch video stream
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    
    // Check for cookies to bypass YouTube 403 Bot Protection
    const cookiesPath = path.join(process.cwd(), 'cookies.json');
    let agentOptions = {};
    if (fs.existsSync(cookiesPath)) {
      try {
        const cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf8'));
        agentOptions.agent = ytdl.createAgent(cookies);
      } catch (err) {
        console.warn('Could not parse cookies.json:', err.message);
      }
    }
    
    const stream = ytdl(url, { filter: 'audioandvideo', quality: 'highest', ...agentOptions });

    // Build FFmpeg command
    return new Promise((resolve, reject) => {
      const logoPath = path.join(process.cwd(), 'public/assets/youtube-logo.png');
      const fontPath = path.join(process.cwd(), 'public/assets/fonts/Montserrat-Black.ttf');

      let command = ffmpeg(stream)
        .input(logoPath) // Add logo as second input [1:v]
        .setStartTime(startTime)
        .setDuration(duration)
        .videoCodec('libx264')
        .audioCodec('aac')
        .format('mp4')
        .outputOptions('-preset veryfast'); // Faster encoding

      // Complex filtergraph for crop + logo overlay + text
      let complexFilter = [
        '[0:v]crop=ih*9/16:ih[cropped]',
        '[1:v]scale=250:-1[logo]',
        '[cropped][logo]overlay=(W-w)/2:H*0.1[withlogo]',
        `[withlogo]drawtext=text='DISPONIBLE SUR YOUTUBE':fontfile='${fontPath}':fontcolor=white:fontsize=42:x=(w-text_w)/2:y=(H*0.1)+100:shadowcolor=black@0.8:shadowx=4:shadowy=4[withcta]`
      ];
      
      let lastOutput = 'withcta';

      if (textOverlay && textOverlay.trim().length > 0) {
        // Escape characters for drawtext and make uppercase
        const sanitizedText = textOverlay.replace(/'/g, "\u2019").replace(/:/g, '\\:').toUpperCase();
        
        // Add drawtext filter for main text
        complexFilter.push(`[${lastOutput}]drawtext=text='${sanitizedText}':fontfile='${fontPath}':fontcolor=white:fontsize=120:x=(w-text_w)/2:y=(h-text_h)/2:shadowcolor=black@0.9:shadowx=8:shadowy=8[final]`);
        lastOutput = 'final';
      }

      command.complexFilter(complexFilter);
      command.outputOptions([
        `-map [${lastOutput}]`,
        '-map 0:a' // keep original audio
      ]);

      command.on('error', (err) => {
        console.error('Error generating short:', err);
        resolve(NextResponse.json({ error: 'Failed to generate short', details: err.message }, { status: 500 }));
      });

      command.on('end', () => {
        console.log('Short generated successfully:', filename);
        const publicUrl = `/shorts/${filename}`;
        resolve(NextResponse.json({ success: true, url: publicUrl }));
      });

      command.save(outputPath);
    });

  } catch (error) {
    console.error('Short generation API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
