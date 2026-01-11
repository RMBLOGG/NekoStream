let currentTab = 'latest';
let currentPage = 1;
let currentQuery = '';

// DOM Elements
const sidebar = document.getElementById('sidebar');
const menuBtn = document.getElementById('menuBtn');
const sidebarToggle = document.getElementById('sidebarToggle');
const refreshBtn = document.getElementById('refreshBtn');
const randomBtn = document.getElementById('randomBtn');
const headerSearch = document.getElementById('headerSearch');
const searchInput = document.getElementById('searchInput');
const navItems = document.querySelectorAll('.nav-item');

// Toggle Sidebar (Mobile)
menuBtn?.addEventListener('click', () => {
    sidebar.classList.toggle('active');
});

sidebarToggle?.addEventListener('click', () => {
    sidebar.classList.remove('active');
});

// Refresh Content
refreshBtn?.addEventListener('click', () => {
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i>';
    setTimeout(() => {
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
        refreshContent();
    }, 500);
});

// Random Anime
randomBtn?.addEventListener('click', async () => {
    // Create loading overlay
    const overlay = document.createElement('div');
    overlay.className = 'random-overlay';
    overlay.innerHTML = `
        <div class="random-content">
            <i class="fas fa-dice"></i>
            <h3>Finding Random Anime...</h3>
            <p>Please wait a moment</p>
        </div>
    `;
    document.body.appendChild(overlay);
    
    randomBtn.disabled = true;
    
    try {
        const response = await fetch('/api/random');
        const data = await response.json();
        
        if (data.status === 'success' && data.title) {
            overlay.querySelector('h3').textContent = 'Found! Redirecting...';
            overlay.querySelector('p').textContent = data.title;
            
            // Extract URL from title if it contains NekoPoi link
            const searchQuery = data.title.replace(' – NekoPoi', '').replace('– NekoPoi', '').trim();
            
            // Try to search and redirect to first result
            const searchResponse = await fetch(`/api/search/${encodeURIComponent(searchQuery)}`);
            const searchData = await searchResponse.json();
            
            if (searchData.data && searchData.data.length > 0) {
                setTimeout(() => {
                    window.location.href = '/detail?url=' + encodeURIComponent(searchData.data[0].url);
                }, 1000);
            } else {
                overlay.remove();
                showNotification('Random anime found but details unavailable. Try again!', 'warning');
            }
        } else {
            overlay.remove();
            showNotification('Failed to get random anime. Try again!', 'error');
        }
    } catch (error) {
        console.error('Random error:', error);
        overlay.remove();
        showNotification('Error loading random anime. Try again!', 'error');
    } finally {
        randomBtn.disabled = false;
    }
});

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    notification.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        padding: 1rem 1.5rem;
        background: ${type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#6366f1'};
        color: white;
        border-radius: 0.5rem;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Header Search
headerSearch?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const query = headerSearch.value.trim();
        if (query) {
            switchTab('search');
            searchInput.value = query;
            performSearch();
        }
    }
});

// Search Input
searchInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        performSearch();
    }
});

// Navigation
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = item.getAttribute('data-tab');
        switchTab(tab);
        
        // Update active state
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        // Close sidebar on mobile
        if (window.innerWidth <= 1024) {
            sidebar.classList.remove('active');
        }
    });
});

function switchTab(tab) {
    currentTab = tab;
    currentPage = 1;
    
    // Hide all sections
    document.getElementById('searchSection').style.display = 'none';
    document.getElementById('categoriesSection').style.display = 'none';
    document.getElementById('contentSection').style.display = 'none';
    
    // Update section title
    const titles = {
        'latest': 'Latest Updates',
        'release': 'All Releases',
        'search': 'Search Results',
        'categories': 'Browse by Genre',
        'random': 'Random Anime'
    };
    
    document.getElementById('sectionTitle').textContent = titles[tab] || 'Anime';
    
    // Show relevant section
    if (tab === 'search') {
        document.getElementById('searchSection').style.display = 'block';
    } else if (tab === 'categories') {
        document.getElementById('categoriesSection').style.display = 'block';
        loadCategories();
    } else if (tab === 'random') {
        // Trigger random button
        randomBtn?.click();
    } else {
        document.getElementById('contentSection').style.display = 'block';
        loadContent();
    }
}

function refreshContent() {
    if (currentTab === 'categories') {
        loadCategories();
    } else if (currentTab === 'search' && currentQuery) {
        performSearch();
    } else {
        loadContent();
    }
}

async function loadContent() {
    const content = document.getElementById('content');
    const pagination = document.getElementById('pagination');
    
    content.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading anime...</p>
        </div>
    `;
    pagination.style.display = 'none';
    
    try {
        let data;
        if (currentTab === 'latest') {
            const response = await fetch('/api/latest');
            data = await response.json();
            
            if (data.status === 'success' && data.results) {
                displayLatest(data.results);
            } else {
                content.innerHTML = '<div class="error"><i class="fas fa-exclamation-circle"></i> Failed to load anime data</div>';
            }
        } else if (currentTab === 'release') {
            const response = await fetch(`/api/release/${currentPage}`);
            data = await response.json();
            
            if (data.data) {
                displayRelease(data.data);
                updatePagination();
            } else {
                content.innerHTML = '<div class="error"><i class="fas fa-exclamation-circle"></i> Failed to load anime data</div>';
            }
        }
    } catch (error) {
        content.innerHTML = `<div class="error"><i class="fas fa-exclamation-circle"></i> Error: ${error.message}</div>`;
    }
}

async function loadCategories() {
    const categoriesGrid = document.getElementById('categoriesGrid');
    categoriesGrid.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading categories...</p>
        </div>
    `;
    
    try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        
        if (data.categories) {
            displayCategories(data.categories);
        } else {
            categoriesGrid.innerHTML = '<div class="error"><i class="fas fa-exclamation-circle"></i> Failed to load categories</div>';
        }
    } catch (error) {
        categoriesGrid.innerHTML = `<div class="error"><i class="fas fa-exclamation-circle"></i> Error: ${error.message}</div>`;
    }
}

function displayCategories(categories) {
    const categoriesGrid = document.getElementById('categoriesGrid');
    categoriesGrid.innerHTML = '';
    
    categories.forEach(category => {
        const card = document.createElement('div');
        card.className = 'category-card';
        card.onclick = () => searchCategory(category.name);
        
        card.innerHTML = `
            <div class="category-icon">${category.icon || '📁'}</div>
            <div class="category-title">${category.name}</div>
        `;
        
        categoriesGrid.appendChild(card);
    });
}

function searchCategory(category) {
    currentQuery = category;
    searchInput.value = category;
    switchTab('search');
    performSearch();
}

async function performSearch() {
    const query = searchInput.value.trim();
    if (!query) return;
    
    currentQuery = query;
    currentPage = 1;
    
    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Searching...</p>
        </div>
    `;
    
    try {
        const response = await fetch(`/api/search/${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
            displaySearchResults(data.data, query);
        } else {
            searchResults.innerHTML = `<div class="search-info">No results found for "${query}"</div>`;
        }
    } catch (error) {
        searchResults.innerHTML = `<div class="error"><i class="fas fa-exclamation-circle"></i> Search error: ${error.message}</div>`;
    }
}

function displaySearchResults(animeList, query) {
    const searchResults = document.getElementById('searchResults');
    const grid = document.createElement('div');
    grid.className = 'anime-grid';
    
    animeList.forEach(anime => {
        const card = createAnimeCard(anime);
        grid.appendChild(card);
    });
    
    searchResults.innerHTML = `
        <div class="results-info">
            <i class="fas fa-check-circle"></i> Found ${animeList.length} results for "${query}"
        </div>
    `;
    searchResults.appendChild(grid);
}

function displayLatest(animeList) {
    const content = document.getElementById('content');
    const grid = document.createElement('div');
    grid.className = 'anime-grid';
    
    animeList.forEach(anime => {
        const card = createAnimeCard({
            url: anime.link,
            title: anime.title,
            img: anime.image,
            upload: anime.upload
        }, 'latest');
        grid.appendChild(card);
    });
    
    content.innerHTML = '';
    content.appendChild(grid);
}

function displayRelease(animeList) {
    const content = document.getElementById('content');
    const grid = document.createElement('div');
    grid.className = 'anime-grid';
    
    animeList.forEach(anime => {
        const card = createAnimeCard(anime);
        grid.appendChild(card);
    });
    
    content.innerHTML = '';
    content.appendChild(grid);
}

function createAnimeCard(anime, type = 'default') {
    const card = document.createElement('div');
    card.className = 'anime-card';
    card.onclick = () => {
        window.location.href = '/detail?url=' + encodeURIComponent(anime.url || anime.link);
    };
    
    // Use proxy for images to bypass CORS
    let imageSrc = '';
    if (anime.img || anime.image) {
        const originalUrl = anime.img || anime.image;
        imageSrc = `/proxy-image?url=${encodeURIComponent(originalUrl)}`;
    }
    
    const imageHTML = imageSrc ? 
        `<img src="${imageSrc}" 
              alt="${anime.title}" 
              class="anime-image" 
              loading="lazy"
              onerror="this.onerror=null; this.style.display='none'; if(!this.parentElement.querySelector('.image-placeholder')){this.parentElement.insertAdjacentHTML('afterbegin', '<div class=\\'image-placeholder\\'>🎬</div>')}">` :
        `<div class="image-placeholder">🎬</div>`;
    
    let genresHTML = '';
    if (anime.genre && anime.genre.length > 0) {
        genresHTML = `
            <div class="anime-genres">
                ${anime.genre.slice(0, 3).map(g => `<span class="genre-tag">${g}</span>`).join('')}
                ${anime.genre.length > 3 ? `<span class="genre-tag">+${anime.genre.length - 3}</span>` : ''}
            </div>
        `;
    }
    
    let metaHTML = '';
    if (type === 'latest' && anime.upload) {
        metaHTML = `<div class="anime-date"><i class="far fa-calendar"></i> ${anime.upload}</div>`;
    } else if (anime.duration) {
        metaHTML = `<div class="anime-duration"><i class="far fa-clock"></i> ${anime.duration}</div>`;
    }
    
    card.innerHTML = `
        ${imageHTML}
        <div class="anime-info">
            <div class="anime-title">${anime.title}</div>
            ${metaHTML ? `<div class="anime-meta">${metaHTML}</div>` : ''}
            ${genresHTML}
        </div>
    `;
    
    return card;
}

function updatePagination() {
    const pagination = document.getElementById('pagination');
    const pageInfo = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevBtn');
    
    pagination.style.display = 'flex';
    pageInfo.textContent = `Page ${currentPage}`;
    prevBtn.disabled = currentPage === 1;
}

function changePage(delta) {
    const newPage = currentPage + delta;
    if (newPage < 1) return;
    
    currentPage = newPage;
    loadContent();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Initialize
loadContent();