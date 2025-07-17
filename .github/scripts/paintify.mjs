import fs from 'fs';
import OpenAI from 'openai';
import path from 'path';

const openai = new OpenAI();

async function createAcrylicPainting(imagePath, segmentId) {
  try {
    console.log(`Creating acrylic painting for ${segmentId}...`);
    
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    
    const response = await openai.images.edit({
      image: imageBuffer,
      prompt: "Transform this image into a beautiful acrylic painting with visible brush strokes, rich colors, and artistic texture. Maintain the composition but add painterly qualities.",
      n: 1,
      size: "1024x1024"
    });
    
    const imageUrl = response.data[0].url;
    
    const imageResponse = await fetch(imageUrl);
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const outputPath = `website/images/${segmentId}-paint.jpg`;
    fs.writeFileSync(outputPath, buffer);
    
    console.log(`✓ Acrylic painting created: ${outputPath}`);
    return outputPath;
    
  } catch (error) {
    console.error(`Error creating painting for ${segmentId}:`, error.message);
    
    const fallbackPath = `website/images/${segmentId}-paint.jpg`;
    fs.copyFileSync(imagePath, fallbackPath);
    console.log(`Used original frame as fallback: ${fallbackPath}`);
    return fallbackPath;
  }
}

async function main() {
  const segmentsFile = process.argv[2];
  
  if (!segmentsFile || !fs.existsSync(segmentsFile)) {
    console.error('Please provide a valid segments.json file');
    process.exit(1);
  }
  
  const segments = JSON.parse(fs.readFileSync(segmentsFile, 'utf8'));
  const youtubeUrl = fs.readFileSync('inputs/youtube.txt', 'utf8').trim();
  
  fs.mkdirSync('website/cards', { recursive: true });
  
  console.log(`Processing ${segments.length} segments for acrylic paintings...`);
  
  for (const segment of segments) {
    const framePath = `frames/${segment.id}-frame.png`;
    
    if (!fs.existsSync(framePath)) {
      console.error(`Frame not found: ${framePath}`);
      continue;
    }
    
    const paintingPath = await createAcrylicPainting(framePath, segment.id);
    
    const card = {
      id: segment.id,
      img: `images/${segment.id}-paint.jpg`,
      title: segment.title,
      start: segment.start,
      end: segment.end,
      duration: segment.duration,
      yt: `${youtubeUrl}?t=${Math.floor(segment.start)}`,
      summary: segment.text.length > 200 ? segment.text.slice(0, 200) + '...' : segment.text
    };
    
    fs.writeFileSync(`website/cards/${segment.id}.json`, JSON.stringify(card, null, 2));
    console.log(`✓ Card created: website/cards/${segment.id}.json`);
  }
  
  const allCards = segments.map(segment => {
    const cardPath = `website/cards/${segment.id}.json`;
    return fs.existsSync(cardPath) ? JSON.parse(fs.readFileSync(cardPath, 'utf8')) : null;
  }).filter(Boolean);
  
  fs.writeFileSync('website/cards.json', JSON.stringify(allCards, null, 2));
  console.log(`✓ Master cards file created: website/cards.json`);
  
  console.log('Paintify process complete!');
}

main().catch(console.error);
