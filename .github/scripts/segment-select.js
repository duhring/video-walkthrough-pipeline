import fs from 'fs';
import OpenAI from 'openai';

const openai = new OpenAI();

function parseVTT(vttContent) {
  const lines = vttContent.split('\n');
  const segments = [];
  let currentSegment = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.includes('-->')) {
      const [start, end] = line.split(' --> ');
      currentSegment = {
        start: timeToSeconds(start),
        end: timeToSeconds(end),
        text: ''
      };
    } else if (line && currentSegment && !line.match(/^\d+$/)) {
      currentSegment.text += line + ' ';
      if (i === lines.length - 1 || lines[i + 1].trim() === '') {
        currentSegment.text = currentSegment.text.trim();
        segments.push(currentSegment);
        currentSegment = null;
      }
    }
  }
  
  return segments;
}

function timeToSeconds(timeStr) {
  const parts = timeStr.split(':');
  const seconds = parts[parts.length - 1].split(',')[0];
  const minutes = parts.length > 1 ? parseInt(parts[parts.length - 2]) : 0;
  const hours = parts.length > 2 ? parseInt(parts[parts.length - 3]) : 0;
  
  return hours * 3600 + minutes * 60 + parseFloat(seconds);
}

function groupSegments(segments, minDuration = 15, maxDuration = 90) {
  const groups = [];
  let currentGroup = [];
  let currentDuration = 0;
  
  for (const segment of segments) {
    const segmentDuration = segment.end - segment.start;
    
    if (currentDuration + segmentDuration <= maxDuration) {
      currentGroup.push(segment);
      currentDuration += segmentDuration;
    } else {
      if (currentDuration >= minDuration && currentGroup.length > 0) {
        groups.push({
          start: currentGroup[0].start,
          end: currentGroup[currentGroup.length - 1].end,
          text: currentGroup.map(s => s.text).join(' '),
          duration: currentDuration
        });
      }
      currentGroup = [segment];
      currentDuration = segmentDuration;
    }
  }
  
  if (currentDuration >= minDuration && currentGroup.length > 0) {
    groups.push({
      start: currentGroup[0].start,
      end: currentGroup[currentGroup.length - 1].end,
      text: currentGroup.map(s => s.text).join(' '),
      duration: currentDuration
    });
  }
  
  return groups;
}

async function selectBestSegments(segments, maxSegments = 8) {
  const transcript = segments.map(s => s.text).join('\n\n');
  
  const prompt = `Analyze this transcript and select the ${maxSegments} most instructionally valuable segments. Focus on:
- Key concepts and explanations
- Important insights or revelations
- Practical examples or demonstrations
- Critical turning points in the discussion

Return only the segment numbers (0-indexed) as a JSON array, like [0, 3, 7, 12].

Transcript segments:
${segments.map((s, i) => `${i}: ${s.text}`).join('\n\n')}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3
    });
    
    const selectedIndices = JSON.parse(response.choices[0].message.content);
    return selectedIndices.map(i => segments[i]).filter(Boolean);
  } catch (error) {
    console.error('Error selecting segments:', error);
    return segments.slice(0, maxSegments);
  }
}

async function main() {
  const vttFile = process.argv[2];
  if (!vttFile || !fs.existsSync(vttFile)) {
    console.error('Please provide a valid VTT file path');
    process.exit(1);
  }
  
  const vttContent = fs.readFileSync(vttFile, 'utf8');
  const segments = parseVTT(vttContent);
  const groupedSegments = groupSegments(segments);
  const selectedSegments = await selectBestSegments(groupedSegments);
  
  const output = selectedSegments.map((segment, index) => ({
    id: `seg-${String(index + 1).padStart(2, '0')}`,
    start: segment.start,
    end: segment.end,
    duration: segment.duration,
    text: segment.text,
    title: segment.text.slice(0, 60) + (segment.text.length > 60 ? '...' : '')
  }));
  
  console.log(JSON.stringify(output, null, 2));
}

main().catch(console.error);
