# Video Walkthrough Pipeline

Automated pipeline to transform video content into accessible "scroll-and-play" web walkthroughs.

## How it works

1. Drop video files (.mp4 or .mov) into `source_videos/` directory
2. GitHub Actions automatically:
   - Transcribes with OpenAI Whisper v3
   - Segments into 400-600 character chunks
   - Slices video clips with FFmpeg
   - Generates captions (.vtt files)
   - Creates components.json metadata
   - Builds and deploys to GitHub Pages

## Setup

1. Add `OPENAI_API_KEY` to repository secrets
2. Enable GitHub Pages in repository settings
3. Drop video files in `source_videos/` and commit

## Local Development

```bash
npm install
npm run dev
```

## Generated Structure

- `video-snippets/` - Sliced video clips
- `transcripts/` - VTT caption files
- `components.json` - Metadata for video player

## Customization

- Modify segmentation logic in `.github/scripts/process-video.js`
- Update styling in `index.html` and `src/VideoWalkthrough.js`
- Add interactive features by extending the components array
