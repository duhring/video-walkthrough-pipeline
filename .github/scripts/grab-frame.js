import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

function getYouTubeVideoId(url) {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

async function main() {
  const segmentsFile = process.argv[2];
  const youtubeFile = process.argv[3];
  
  if (!segmentsFile || !youtubeFile) {
    console.error('Usage: node grab-frame.js segments.json inputs/youtube.txt');
    process.exit(1);
  }
  
  if (!fs.existsSync(segmentsFile) || !fs.existsSync(youtubeFile)) {
    console.error('Input files not found');
    process.exit(1);
  }
  
  const segments = JSON.parse(fs.readFileSync(segmentsFile, 'utf8'));
  const youtubeUrl = fs.readFileSync(youtubeFile, 'utf8').trim();
  const videoId = getYouTubeVideoId(youtubeUrl);
  
  if (!videoId) {
    console.error('Invalid YouTube URL');
    process.exit(1);
  }
  
  fs.mkdirSync('frames', { recursive: true });
  fs.mkdirSync('website/images', { recursive: true });
  
  console.log(`Processing ${segments.length} segments from video: ${videoId}`);
  
  for (const segment of segments) {
    const frameTime = segment.start + (segment.end - segment.start) / 2;
    const outputFrame = `frames/${segment.id}-frame.png`;
    
    console.log(`Extracting frame at ${formatTime(frameTime)} for segment ${segment.id}`);
    
    try {
      execSync(`yt-dlp -f "bestvideo[height<=720]" --no-audio -o "temp-${segment.id}.%(ext)s" "https://youtube.com/watch?v=${videoId}"`, {
        stdio: 'pipe'
      });
      
      const tempFiles = fs.readdirSync('.').filter(f => f.startsWith(`temp-${segment.id}.`));
      if (tempFiles.length === 0) {
        console.error(`Failed to download video for segment ${segment.id}`);
        continue;
      }
      
      const tempVideo = tempFiles[0];
      
      execSync(`ffmpeg -y -i "${tempVideo}" -ss ${frameTime} -frames:v 1 -q:v 2 "${outputFrame}"`, {
        stdio: 'pipe'
      });
      
      fs.unlinkSync(tempVideo);
      
      console.log(`✓ Frame extracted: ${outputFrame}`);
      
    } catch (error) {
      console.error(`Error processing segment ${segment.id}:`, error.message);
      
      const fallbackFrame = `frames/${segment.id}-frame.png`;
      execSync(`ffmpeg -y -f lavfi -i color=lightgray:size=1280x720:duration=1 -frames:v 1 "${fallbackFrame}"`, {
        stdio: 'pipe'
      });
      console.log(`Created fallback frame: ${fallbackFrame}`);
    }
  }
  
  console.log('Frame extraction complete!');
}

main().catch(console.error);
