import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import OpenAI from 'openai';
const openai = new OpenAI();

const SRC_DIR = 'source_videos';
const SNIP_DIR = 'video-snippets';
const TRANS_DIR = 'transcripts';
const COMPONENTS = [];

fs.mkdirSync(SNIP_DIR, { recursive: true });
fs.mkdirSync(TRANS_DIR, { recursive: true });

for (const file of fs.readdirSync(SRC_DIR)) {
  if (!file.match(/\.(mp4|mov)$/i)) continue;
  const basename = path.parse(file).name;

  console.log(`Processing video: ${file}`);

  const transcript = await openai.audio.transcriptions.create({
    file: fs.createReadStream(path.join(SRC_DIR, file)),
    model: 'whisper-1',
    response_format: 'verbose_json'
  });

  console.log(`Transcription complete. Found ${transcript.segments.length} segments.`);

  let clipIdx = 0;
  for (const segment of transcript.segments) {
    clipIdx++;
    const outMp4 = `${basename}-${clipIdx}.mp4`;
    const outVtt = `${basename}-${clipIdx}.vtt`;

    console.log(`Processing segment ${clipIdx}/${transcript.segments.length}: ${segment.text.slice(0, 50)}...`);

    execSync(
      `ffmpeg -y -i ${path.join(SRC_DIR, file)} -ss ${segment.start} -to ${segment.end} -c copy ${path.join(SNIP_DIR, outMp4)}`
    );

    const duration = segment.end - segment.start;
    const vttContent = `WEBVTT

00:00.000 --> 00:${duration.toFixed(3).padStart(6, '0')}
${segment.text}`;

    fs.writeFileSync(
      path.join(TRANS_DIR, outVtt),
      vttContent
    );

    COMPONENTS.push({
      id: `${basename}-${clipIdx}`,
      title: segment.text.slice(0, 60) + (segment.text.length > 60 ? '…' : ''),
      src: `video-snippets/${outMp4}`,
      captions: `transcripts/${outVtt}`,
      start: segment.start,
      end: segment.end,
      duration: duration.toFixed(1),
      text: segment.text
    });
  }
}

fs.writeFileSync('components.json', JSON.stringify(COMPONENTS, null, 2));
console.log(`Generated components.json with ${COMPONENTS.length} video segments.`);
