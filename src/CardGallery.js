export class CardGallery {
  constructor(container) {
    this.container = container;
    this.cards = [];
  }

  async init() {
    try {
      await this.loadCards();
      this.render();
    } catch (error) {
      console.error('Failed to load cards:', error);
      this.renderError();
    }
  }

  async loadCards() {
    try {
      const response = await fetch('./website/cards.json');
      if (!response.ok) {
        throw new Error('Cards file not found');
      }
      this.cards = await response.json();
    } catch (error) {
      this.cards = [
        {
          id: 'sample-1',
          img: 'images/sample-1-paint.jpg',
          title: 'Sample highlight from video',
          start: 120,
          end: 180,
          yt: 'https://youtube.com/watch?v=dQw4w9WgXcQ?t=120',
          summary: 'This is a sample highlight card showing how the system works.'
        }
      ];
    }
  }

  render() {
    if (this.cards.length === 0) {
      this.renderEmpty();
      return;
    }

    this.container.innerHTML = `
      <div class="cards-grid">
        ${this.cards.map(card => `
          <div class="highlight-card" data-card-id="${card.id}">
            <div class="card-image">
              <img src="${card.img}" alt="${card.title}" loading="lazy">
              <div class="play-overlay">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>
            <div class="card-content">
              <h3 class="card-title">${card.title}</h3>
              <p class="card-summary">${card.summary}</p>
              <div class="card-meta">
                <span class="duration">${Math.floor((card.end - card.start) / 60)}:${String(Math.floor((card.end - card.start) % 60)).padStart(2, '0')}</span>
                <span class="timestamp">@${Math.floor(card.start / 60)}:${String(Math.floor(card.start % 60)).padStart(2, '0')}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    this.setupEventListeners();
  }

  setupEventListeners() {
    const cards = document.querySelectorAll('.highlight-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const cardId = card.dataset.cardId;
        const cardData = this.cards.find(c => c.id === cardId);
        if (cardData) {
          window.open(cardData.yt, '_blank');
        }
      });
    });
  }

  renderEmpty() {
    this.container.innerHTML = `
      <div class="loading">
        <h2>No highlight cards found</h2>
        <p>Add audio, transcript, and YouTube URL to the inputs/ directory to generate cards.</p>
      </div>
    `;
  }

  renderError() {
    this.container.innerHTML = `
      <div class="loading">
        <h2>Error loading highlight cards</h2>
        <p>Please check that the cards.json file exists and is valid.</p>
      </div>
    `;
  }
}
