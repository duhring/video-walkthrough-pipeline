import { VideoWalkthrough } from './VideoWalkthrough.js';

document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  const walkthrough = new VideoWalkthrough(app);
  walkthrough.init();
});
