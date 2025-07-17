export class VideoWalkthrough {
  constructor(container) {
    this.container = container;
    this.components = [];
    this.currentIndex = 0;
  }

  async init() {
    try {
      await this.loadComponents();
      this.render();
    } catch (error) {
      console.error('Failed to load components:', error);
      this.renderError();
    }
  }

  async loadComponents() {
    try {
      const response = await fetch('./components.json');
      if (!response.ok) {
        throw new Error('Components file not found');
      }
      this.components = await response.json();
    } catch (error) {
      this.components = [
        {
          id: 'sample-1',
          title: 'Welcome to the video walkthrough system',
          src: 'video-snippets/sample-1.mp4',
          captions: 'transcripts/sample-1.vtt',
          duration: '5.2',
          text: 'This is a sample video segment to demonstrate the walkthrough system.'
        }
      ];
    }
  }

  render() {
    if (this.components.length === 0) {
      this.renderEmpty();
      return;
    }

    this.container.innerHTML = `
      <div class="video-player">
        <video id="main-video" controls>
          <track kind="captions" src="" srclang="en" label="English" default>
          Your browser does not support the video tag.
        </video>
        <div id="video-info">
          <h3 id="video-title"></h3>
          <p id="video-text"></p>
        </div>
      </div>
      <div class="video-list" id="video-list"></div>
    `;

    this.renderVideoList();
    this.loadVideo(0);
    this.setupEventListeners();
  }

  renderVideoList() {
    const listContainer = document.getElementById('video-list');
    listContainer.innerHTML = this.components.map((component, index) => `
      <div class="video-item ${index === this.currentIndex ? 'active' : ''}" data-index="${index}">
        <div class="video-title">${component.title}</div>
        <div class="video-duration">Duration: ${component.duration}s</div>
      </div>
    `).join('');
  }

  setupEventListeners() {
    const videoItems = document.querySelectorAll('.video-item');
    videoItems.forEach(item => {
      item.addEventListener('click', () => {
        const index = parseInt(item.dataset.index);
        this.loadVideo(index);
      });
    });

    const video = document.getElementById('main-video');
    video.addEventListener('ended', () => {
      this.playNext();
    });
  }

  loadVideo(index) {
    if (index < 0 || index >= this.components.length) return;

    this.currentIndex = index;
    const component = this.components[index];
    
    const video = document.getElementById('main-video');
    const title = document.getElementById('video-title');
    const text = document.getElementById('video-text');
    
    video.src = component.src;
    
    const track = video.querySelector('track');
    if (track) {
      track.src = component.captions;
    }
    
    title.textContent = component.title;
    text.textContent = component.text || '';
    
    document.querySelectorAll('.video-item').forEach((item, i) => {
      item.classList.toggle('active', i === index);
    });
  }

  playNext() {
    if (this.currentIndex < this.components.length - 1) {
      this.loadVideo(this.currentIndex + 1);
    }
  }

  renderEmpty() {
    this.container.innerHTML = `
      <div class="loading">
        <h2>No video components found</h2>
        <p>Add video files to the source_videos/ directory and push to trigger processing.</p>
      </div>
    `;
  }

  renderError() {
    this.container.innerHTML = `
      <div class="loading">
        <h2>Error loading video walkthrough</h2>
        <p>Please check that the components.json file exists and is valid.</p>
      </div>
    `;
  }
}
