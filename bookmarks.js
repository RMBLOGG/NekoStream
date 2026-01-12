// Bookmark management - FIXED VERSION
// File ini sudah diperbaiki agar bookmark cards bisa diklik ke detail page

(function() {
    'use strict';
    
    const BOOKMARKS_KEY = 'nekostream_bookmarks';

    // Get bookmarks from localStorage
    function getBookmarks() {
        try {
            return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]');
        } catch (e) {
            console.error('Error reading bookmarks:', e);
            return [];
        }
    }

    // Save bookmarks to localStorage
    function saveBookmarks(bookmarks) {
        try {
            localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
            updateBookmarkCount();
        } catch (e) {
            console.error('Error saving bookmarks:', e);
        }
    }

    // Update bookmark count badge
    function updateBookmarkCount() {
        const bookmarks = getBookmarks();
        const count = bookmarks.length;
        
        const bookmarkCount = document.getElementById('bookmarkCount');
        const bookmarkBadge = document.getElementById('bookmarkBadge');
        
        if (bookmarkCount) {
            bookmarkCount.textContent = count;
            bookmarkCount.style.display = count > 0 ? 'inline-block' : 'none';
        }
        
        if (bookmarkBadge) {
            bookmarkBadge.textContent = count;
            bookmarkBadge.style.display = count > 0 ? 'inline-block' : 'none';
        }
    }

    // Check if anime is bookmarked
    function isBookmarked(url) {
        const bookmarks = getBookmarks();
        return bookmarks.some(b => b.url === url);
    }

    // Add to bookmarks
    function addToBookmarks(animeData) {
        const bookmarks = getBookmarks();
        
        if (!bookmarks.some(b => b.url === animeData.url)) {
            bookmarks.unshift({
                title: animeData.title,
                url: animeData.url,
                img: animeData.img || '',
                info: animeData.info || '',
                genre: animeData.genre || '',
                timestamp: new Date().toISOString()
            });
            saveBookmarks(bookmarks);
            return true;
        }
        return false;
    }

    // Remove from bookmarks
    function removeFromBookmarks(url) {
        const bookmarks = getBookmarks();
        const filtered = bookmarks.filter(b => b.url !== url);
        saveBookmarks(filtered);
        
        // Refresh bookmarks view if currently showing
        const bookmarksSection = document.getElementById('bookmarksSection');
        if (bookmarksSection && bookmarksSection.style.display !== 'none') {
            displayBookmarks();
        }
    }

    // Display bookmarks
    function displayBookmarks() {
        const bookmarks = getBookmarks();
        const content = document.getElementById('bookmarksContent');
        const clearBtn = document.getElementById('clearBookmarksBtn');
        
        if (!content) return;
        
        if (bookmarks.length === 0) {
            content.innerHTML = `
                <div class="empty-bookmarks">
                    <i class="fas fa-bookmark" style="font-size: 4rem; opacity: 0.3; margin-bottom: 1rem;"></i>
                    <p>You haven't bookmarked any anime yet</p>
                    <p style="font-size: 0.9rem; opacity: 0.7;">Start exploring and save your favorites!</p>
                </div>
            `;
            if (clearBtn) clearBtn.style.display = 'none';
            return;
        }
        
        if (clearBtn) clearBtn.style.display = 'inline-flex';
        
        let html = '<div class="anime-grid">';
        
        bookmarks.forEach(anime => {
            // Use proxy for images like in main.js
            let imgUrl = 'https://via.placeholder.com/300x400?text=No+Image';
            if (anime.img) {
                // If it's already a proxy URL, use it directly
                if (anime.img.includes('/proxy-image?url=')) {
                    imgUrl = anime.img;
                } else {
                    // Create proxy URL
                    imgUrl = `/proxy-image?url=${encodeURIComponent(anime.img)}`;
                }
            }
            
            // Handle genre - bisa string atau array atau undefined
            let genres = '';
            if (anime.genre) {
                let genreArray = [];
                if (typeof anime.genre === 'string') {
                    genreArray = anime.genre.split(', ');
                } else if (Array.isArray(anime.genre)) {
                    genreArray = anime.genre;
                }
                genres = genreArray.slice(0, 3).map(g => 
                    `<span class="genre-badge">${escapeHtml(g.trim())}</span>`
                ).join('');
            }
            
            // FIXED: Tambahkan data-url attribute untuk memudahkan click handling
            html += `
                <div class="anime-card bookmark-card" data-url="${escapeHtml(anime.url)}">
                    <div class="anime-poster">
                        <img src="${imgUrl}" alt="${escapeHtml(anime.title)}" 
                             onerror="this.src='https://via.placeholder.com/300x400?text=No+Image'"
                             loading="lazy">
                        <div class="anime-overlay">
                            <div class="play-btn">
                                <i class="fas fa-play"></i>
                            </div>
                        </div>
                    </div>
                    <div class="anime-info">
                        <h3 class="anime-title" title="${escapeHtml(anime.title)}">${escapeHtml(anime.title)}</h3>
                        ${anime.info ? `<p class="anime-meta">${escapeHtml(anime.info)}</p>` : ''}
                        ${genres ? `<div class="anime-genres">${genres}</div>` : ''}
                        <button class="remove-bookmark-btn" onclick="event.stopPropagation(); removeBookmarkItem('${escapeHtml(anime.url).replace(/'/g, "\\'")}')">
                            <i class="fas fa-trash-alt"></i> Remove
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        content.innerHTML = html;
        
        // FIXED: Add click event listener to bookmark cards
        setupBookmarkCardClickHandlers();
    }

    // FIXED: Setup click handlers for bookmark cards
    function setupBookmarkCardClickHandlers() {
        const bookmarkCards = document.querySelectorAll('.bookmark-card');
        
        bookmarkCards.forEach(card => {
            // Remove any existing listeners by cloning
            const newCard = card.cloneNode(true);
            card.parentNode.replaceChild(newCard, card);
            
            // Add new click listener
            newCard.addEventListener('click', function(e) {
                // Don't navigate if clicking on remove button
                if (e.target.closest('.remove-bookmark-btn')) {
                    return;
                }
                
                const url = this.getAttribute('data-url');
                if (url) {
                    window.location.href = `/detail?url=${encodeURIComponent(url)}`;
                }
            });
            
            // Make card look clickable
            newCard.style.cursor = 'pointer';
        });
    }

    // Clear all bookmarks
    function clearAllBookmarks() {
        if (confirm('Are you sure you want to remove all bookmarks?')) {
            localStorage.removeItem(BOOKMARKS_KEY);
            updateBookmarkCount();
            displayBookmarks();
            showNotification('All bookmarks cleared', 'info');
        }
    }

    // Show notification
    function showNotification(message, type = 'info') {
        const existing = document.querySelector('.bookmark-notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = 'bookmark-notification';
        notification.style.cssText = `
            position: fixed;
            top: 2rem;
            right: 2rem;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6366f1'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        `;
        
        const iconClass = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle';
        notification.innerHTML = `
            <i class="fas fa-${iconClass}"></i>
            <span>${escapeHtml(message)}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 2500);
    }

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Make functions global for onclick handlers
    window.removeBookmarkItem = function(url) {
        removeFromBookmarks(url);
        showNotification('Removed from bookmarks', 'info');
    };

    // Initialize on DOM ready
    function init() {
        updateBookmarkCount();
        
        // Setup bookmarks button in header
        const bookmarksBtn = document.getElementById('bookmarksBtn');
        if (bookmarksBtn) {
            bookmarksBtn.addEventListener('click', showBookmarksSection);
        }
        
        // Setup bookmarks nav item
        const bookmarksNavItem = document.querySelector('.nav-item[data-tab="bookmarks"]');
        if (bookmarksNavItem) {
            bookmarksNavItem.addEventListener('click', function(e) {
                e.preventDefault();
                showBookmarksSection();
            });
        }
        
        // Setup clear bookmarks button
        const clearBtn = document.getElementById('clearBookmarksBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', clearAllBookmarks);
        }
        
        addStyles();
    }

    // Show bookmarks section
    function showBookmarksSection() {
        // Hide all sections
        ['contentSection', 'searchSection', 'categoriesSection'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
        
        // Show bookmarks section
        const bookmarksSection = document.getElementById('bookmarksSection');
        if (bookmarksSection) {
            bookmarksSection.style.display = 'block';
            displayBookmarks();
        }
        
        // Update nav active state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        const bookmarksNavItem = document.querySelector('.nav-item[data-tab="bookmarks"]');
        if (bookmarksNavItem) bookmarksNavItem.classList.add('active');
        
        // Close sidebar on mobile
        if (window.innerWidth <= 768) {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) sidebar.classList.remove('active');
        }
    }

    // Add CSS styles
    function addStyles() {
        if (document.getElementById('bookmark-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'bookmark-styles';
        style.textContent = `
            .bookmark-count {
                background: var(--primary);
                color: white;
                font-size: 0.7rem;
                padding: 0.2rem 0.5rem;
                border-radius: 1rem;
                margin-left: auto;
                display: none;
            }

            .bookmark-badge {
                position: absolute;
                top: -0.3rem;
                right: -0.3rem;
                background: var(--primary);
                color: white;
                font-size: 0.7rem;
                padding: 0.2rem 0.4rem;
                border-radius: 1rem;
                min-width: 1.2rem;
                text-align: center;
                display: none;
            }

            .bookmarks-section {
                padding: 2rem;
            }

            .bookmarks-section .section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 2rem;
            }

            .bookmarks-section .anime-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 1.5rem;
            }

            /* FIXED: Make bookmark cards clickable */
            .bookmarks-section .anime-card {
                background: var(--card-bg, #1e293b);
                border-radius: 0.75rem;
                overflow: hidden;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
                cursor: pointer;
                position: relative;
            }

            .bookmarks-section .anime-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            }

            .bookmarks-section .anime-poster {
                position: relative;
                width: 100%;
                padding-top: 56.25%; /* 16:9 ratio */
                overflow: hidden;
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            }

            .bookmarks-section .anime-poster img {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
            }

            .bookmarks-section .anime-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.3s ease;
                pointer-events: none; /* FIXED: Allow clicks to pass through */
            }

            .bookmarks-section .anime-card:hover .anime-overlay {
                opacity: 1;
            }

            .bookmarks-section .play-btn {
                width: 3.5rem;
                height: 3.5rem;
                border-radius: 50%;
                background: var(--primary, #6366f1);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.5rem;
                transition: transform 0.3s ease;
                pointer-events: none; /* FIXED: Button is just visual, card handles click */
            }

            .bookmarks-section .anime-card:hover .play-btn {
                transform: scale(1.1);
            }

            .bookmarks-section .anime-info {
                padding: 1rem;
            }

            .bookmarks-section .anime-title {
                font-size: 0.95rem;
                font-weight: 600;
                margin-bottom: 0.5rem;
                color: var(--text, white);
                overflow: hidden;
                text-overflow: ellipsis;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                line-height: 1.4;
            }

            .bookmarks-section .anime-meta {
                font-size: 0.8rem;
                color: var(--text-secondary, #94a3b8);
                margin-bottom: 0.5rem;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .bookmarks-section .anime-genres {
                display: flex;
                flex-wrap: wrap;
                gap: 0.25rem;
                margin-bottom: 0.75rem;
            }

            .bookmarks-section .genre-badge {
                font-size: 0.7rem;
                padding: 0.2rem 0.5rem;
                border-radius: 0.25rem;
                background: rgba(99, 102, 241, 0.2);
                color: var(--primary, #6366f1);
            }

            .clear-bookmarks-btn {
                background: rgba(239, 68, 68, 0.1);
                border: 1px solid rgba(239, 68, 68, 0.3);
                color: #ef4444;
                padding: 0.5rem 1rem;
                border-radius: 0.5rem;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                transition: all 0.3s ease;
                font-size: 0.9rem;
            }

            .clear-bookmarks-btn:hover {
                background: rgba(239, 68, 68, 0.2);
            }

            .empty-bookmarks {
                text-align: center;
                padding: 4rem 2rem;
                color: var(--text-secondary);
            }

            /* FIXED: Remove button needs higher z-index to be clickable */
            .remove-bookmark-btn {
                width: 100%;
                margin-top: 0.5rem;
                padding: 0.5rem;
                background: rgba(239, 68, 68, 0.1);
                border: 1px solid rgba(239, 68, 68, 0.3);
                color: #ef4444;
                border-radius: 0.375rem;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                transition: all 0.3s ease;
                font-size: 0.85rem;
                position: relative;
                z-index: 10; /* FIXED: Ensure button is clickable */
            }

            .remove-bookmark-btn:hover {
                background: rgba(239, 68, 68, 0.2);
            }

            @keyframes slideInRight {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }

            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(400px); opacity: 0; }
            }

            @media (max-width: 768px) {
                .bookmarks-section {
                    padding: 1rem;
                }
                .bookmarks-section .section-header {
                    flex-direction: column;
                    gap: 1rem;
                    align-items: flex-start;
                }
                .bookmarks-section .anime-grid {
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1rem;
                }
                .bookmarks-section .anime-title {
                    font-size: 0.85rem;
                    -webkit-line-clamp: 2;
                }
                .bookmarks-section .anime-info {
                    padding: 0.75rem;
                }
                .bookmarks-section .anime-genres {
                    display: none;
                }
                .remove-bookmark-btn {
                    font-size: 0.75rem;
                    padding: 0.4rem;
                }
            }

            @media (max-width: 480px) {
                .bookmarks-section .anime-grid {
                    gap: 0.75rem;
                }
                .bookmarks-section .anime-title {
                    font-size: 0.8rem;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
