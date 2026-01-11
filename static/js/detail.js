function changeStream(url, button) {
    // Update iframe src
    const iframe = document.querySelector('.video-player iframe');
    if (iframe) {
        iframe.src = url;
    }
    
    // Update active button
    document.querySelectorAll('.stream-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    button.classList.add('active');
    
    // Scroll to video player
    const videoPlayer = document.querySelector('.video-player');
    if (videoPlayer) {
        videoPlayer.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
    }
}

// Load related episodes
async function loadRelatedEpisodes(animeTitle) {
    const relatedSection = document.getElementById('relatedSection');
    const relatedEpisodes = document.getElementById('relatedEpisodes');
    
    if (!animeTitle || animeTitle === 'N/A') {
        relatedSection.style.display = 'none';
        return;
    }
    
    // Extract clean anime name (remove subtitle info)
    const cleanTitle = animeTitle
        .replace(/\(Subtitle Indonesia\)/gi, '')
        .replace(/Subtitle Indonesia/gi, '')
        .trim();
    
    try {
        const response = await fetch(`/api/search/${encodeURIComponent(cleanTitle)}`);
        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
            relatedSection.style.display = 'block';
            displayRelatedEpisodes(data.data);
        } else {
            relatedSection.style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading related episodes:', error);
        relatedSection.style.display = 'none';
    }
}

function displayRelatedEpisodes(episodes) {
    const container = document.getElementById('relatedEpisodes');
    container.innerHTML = '';
    
    // Get current page URL to exclude current episode
    const currentUrl = new URLSearchParams(window.location.search).get('url');
    
    episodes.forEach(episode => {
        // Skip current episode
        if (episode.url === currentUrl) return;
        
        const card = document.createElement('div');
        card.className = 'anime-card';
        card.onclick = () => {
            window.location.href = '/detail?url=' + encodeURIComponent(episode.url);
        };
        
        // Use proxy for images
        let imageSrc = '';
        if (episode.img) {
            imageSrc = `/proxy-image?url=${encodeURIComponent(episode.img)}`;
        }
        
        const imageHTML = imageSrc ? 
            `<img src="${imageSrc}" 
                  alt="${episode.title}" 
                  class="anime-image" 
                  loading="lazy"
                  onerror="this.onerror=null; this.style.display='none'; if(!this.parentElement.querySelector('.image-placeholder')){this.parentElement.insertAdjacentHTML('afterbegin', '<div class=\\'image-placeholder\\'>🎬</div>')}">` :
            `<div class="image-placeholder">🎬</div>`;
        
        const genresHTML = episode.genre && episode.genre.length > 0 ? 
            `<div class="anime-genres">
                ${episode.genre.slice(0, 2).map(g => `<span class="genre-tag">${g}</span>`).join('')}
            </div>` : '';
        
        card.innerHTML = `
            ${imageHTML}
            <div class="anime-info">
                <div class="anime-title">${episode.title}</div>
                ${episode.duration ? `<div class="anime-meta"><div class="anime-duration"><i class="far fa-clock"></i> ${episode.duration}</div></div>` : ''}
                ${genresHTML}
            </div>
        `;
        
        container.appendChild(card);
    });
}

// Auto-play prevention for better UX
document.addEventListener('DOMContentLoaded', () => {
    const iframe = document.querySelector('.video-player iframe');
    if (iframe) {
        // Store original src
        const originalSrc = iframe.src;
        // Remove src to prevent auto-load
        iframe.src = '';
        
        // Add click to play
        const playerContainer = document.querySelector('.video-player');
        if (playerContainer) {
            const playOverlay = document.createElement('div');
            playOverlay.className = 'play-overlay';
            playOverlay.innerHTML = '<i class="fas fa-play-circle"></i>';
            playOverlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 10;
            `;
            playOverlay.querySelector('i').style.cssText = `
                font-size: 5rem;
                color: white;
                transition: transform 0.3s ease;
            `;
            
            playOverlay.addEventListener('mouseenter', () => {
                playOverlay.querySelector('i').style.transform = 'scale(1.1)';
            });
            
            playOverlay.addEventListener('mouseleave', () => {
                playOverlay.querySelector('i').style.transform = 'scale(1)';
            });
            
            playOverlay.addEventListener('click', () => {
                iframe.src = originalSrc;
                playOverlay.remove();
            });
            
            playerContainer.style.position = 'relative';
            playerContainer.appendChild(playOverlay);
        }
    }
});