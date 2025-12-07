// script.js

// --- CONFIGURATION ---
// IMPORTANT: Replace this with your actual key from The Movie Database (TMDb) for the search to work.
const API_KEY = "35770e431a6cc28f489728cf20da5e39"; 
const BASE_URL = "https://api.themoviedb.org/3";
const SEARCH_URL = `${BASE_URL}/search/multi?api_key=${API_KEY}&query=`;
const IMG_BASE_URL = "https://image.tmdb.org/t/p/w500"; 

// Supported languages for filtering (English, Korean, Tamil, Hindi, Kannada, Malayalam)
const SUPPORTED_LANGUAGES = ['en', 'ko', 'ta', 'hi', 'kn', 'ml']; 
const MIN_YEAR = 1960;


document.addEventListener('DOMContentLoaded', () => {
    
    // ====================================
    // 1. Splash Screen/Animation Logic
    // ====================================
    const splashScreen = document.getElementById('splash-screen');
    const mainContent = document.getElementById('main-content');

    if (splashScreen && mainContent) {
        // Hide main content initially
        mainContent.style.display = 'none';

        setTimeout(() => {
            // Start fade out after 4 seconds
            splashScreen.classList.add('hidden');

            // Wait for the fade-out transition (1s in CSS) to complete
            setTimeout(() => {
                splashScreen.style.display = 'none';
                mainContent.style.display = 'block';
            }, 1000); 
        }, 4000); // Total display time for animation
    } else {
        // For contact.html (which doesn't have a splash screen), ensure main content is visible
        if (mainContent) mainContent.style.display = 'block';
    }


    // ====================================
    // 3. Digital Clock and Calendar Logic
    // ====================================
    function updateClockAndCalendar() {
        const now = new Date();

        // Time format: 12:34:56 PM
        const timeString = now.toLocaleTimeString('en-US', { hour12: true }); 
        
        // Date format: Sunday, December 7, 2025
        const dateString = now.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        const clockElement = document.getElementById('digital-clock');
        const dateElement = document.getElementById('calendar-date');

        if (clockElement) clockElement.textContent = timeString;
        if (dateElement) dateElement.textContent = dateString;
    }

    // Update immediately and then every second
    setInterval(updateClockAndCalendar, 1000);
    updateClockAndCalendar();


    // ====================================
    // 4. Theme Toggle Logic
    // ====================================
    const themeToggle = document.getElementById('theme-toggle');

    // Function to set the theme and update the icon
    function applyTheme(theme) {
        document.body.classList.toggle('dark-theme', theme === 'dark');
        const icon = themeToggle ? themeToggle.querySelector('.fas') : null;
        if (icon) {
            // Change icon based on theme
            icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
        }
    }

    // Load saved preference on page load
    const savedTheme = localStorage.getItem('theme');
    applyTheme(savedTheme === 'dark' ? 'dark' : 'light');

    // Event listener for toggle button
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-theme');
            const newTheme = isDark ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme); 
        });
    }

    // ====================================
    // 2. Movie Search Logic (Only on index.html)
    // ====================================
    const searchForm = document.getElementById('search-form');

    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = document.getElementById('search-input').value.trim();
            if (query) {
                searchMedia(query);
            }
        });
    }

    // Fetches media data from TMDb
    async function searchMedia(query) {
        const resultContainer = document.getElementById('result-container');
        resultContainer.innerHTML = '<p>Searching for DoomView information...</p>';

        if (API_KEY === "YOUR_TMDB_API_KEY") {
            resultContainer.innerHTML = `<p class="error-message">Error: TMDb API Key is not configured. Please get a key and replace "YOUR_TMDB_API_KEY" in script.js.</p>`;
            return;
        }

        // Search for all media types and prioritize the English results
        const url = SEARCH_URL + encodeURIComponent(query);
        
        try {
            const response = await fetch(url);
            const data = await response.json();

            // Find the first valid movie or TV result
            const result = data.results.find(
                item => (item.media_type === 'movie' || item.media_type === 'tv')
            );
            
            if (result) {
                // Fetch external IDs (needed for IMDb/Wikipedia link construction)
                const externalIdUrl = `${BASE_URL}/${result.media_type}/${result.id}/external_ids?api_key=${API_KEY}`;
                const externalIdResponse = await fetch(externalIdUrl);
                const externalIdData = await externalIdResponse.json();

                displayMovieDetails(result, externalIdData);

            } else {
                // Invalid search result
                resultContainer.innerHTML = `<p class="error-message">Error: No movie or TV series found for "${query}". Please enter the name again.</p>`;
            }

        } catch (error) {
            console.error("Fetch error:", error);
            resultContainer.innerHTML = `<p class="error-message">An unexpected error occurred during the search. Check console for details.</p>`;
        }
    }

    // Displays the fetched details
    function displayMovieDetails(media, externalIds) {
        const resultContainer = document.getElementById('result-container');
        
        const isMovie = media.media_type === 'movie';
        const title = media.title || media.name;
        const overview = media.overview || 'No overview available.';
        const releaseDate = isMovie ? media.release_date : media.first_air_date;
        const releaseYear = (releaseDate || '0').substring(0, 4);
        const posterPath = media.poster_path;
        const backdropPath = media.backdrop_path;
        
        // --- Filtering and Validation ---
        const yearIsValid = parseInt(releaseYear) >= MIN_YEAR;
        
        if (!yearIsValid) {
             resultContainer.innerHTML = `<p class="error-message">DoomView does not support titles released before ${MIN_YEAR} (${releaseYear}).</p>`;
            return;
        }
        
        // --- Download Confidence (% number) ---
        const voteAverage = media.vote_average || 0;
        const downloadConfidence = Math.round(voteAverage * 10);
        
        // Conditional styling for the confidence score
        const confidenceColor = downloadConfidence >= 70 ? '#28a745' : // Green for high confidence
                                downloadConfidence >= 50 ? '#ffc107' : // Yellow/Orange for medium
                                'var(--primary-color)'; // Red/Blue for low (matches accent)
        
        // --- Wikipedia/IMDb Link ---
        const imdbId = externalIds.imdb_id;
        const wikipediaSearchTitle = title + (isMovie ? ' (film)' : ' (TV series)');
        const wikipediaLink = `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(wikipediaSearchTitle)}`;
        const imdbLink = imdbId ? `https://www.imdb.com/title/${imdbId}` : null;


        // --- Display HTML ---
        let html = `
            <div class="result-header">
                <h2>${title} (${releaseYear})</h2>
                ${posterPath ? `<img src="${IMG_BASE_URL + posterPath}" alt="${title} Poster" class="movie-poster">` : ''}
            </div>

            <p><strong>Type:</strong> ${isMovie ? 'Movie' : 'TV Series'}</p>
            <p><strong>Original Language:</strong> ${media.original_language ? media.original_language.toUpperCase() : 'N/A'}</p>
            <p><strong>Release Date:</strong> ${releaseDate || 'N/A'}</p>
            
            <hr style="margin: 15px 0; border-color: var(--border-color);">

            <h3>Plot Summary (Overview)</h3>
            <p>${overview}</p>
            
            <div class="download-confidence">
                DoomView Download Confidence: <span style="color: ${confidenceColor};">${downloadConfidence}%</span>
            </div>
            <p style="font-size: 0.9em; margin-top: -10px; opacity: 0.7;">(Based on public popularity and average rating)</p>

            <h3 style="margin-top: 25px;">More Details & External Links</h3>
            <p class="link-group">
                <a href="${wikipediaLink}" target="_blank">Search Wikipedia for "${title}"</a>
                ${imdbLink ? ` | <a href="${imdbLink}" target="_blank">View on IMDb</a>` : ''}
            </p>
            
            <div class="review-box">
                <h4>Public Reviews (Conceptual)</h4>
                <p><strong>Note:</strong> Retrieving 10 specific positive/negative public reviews requires advanced, targeted APIs or web scraping, which is not feasible using only client-side JavaScript and the free TMDb API. This section uses the overall TMDb rating as a proxy for review quality.</p>
                <p><strong>TMDb Average Rating: ${voteAverage}/10</strong> (${media.vote_count} votes)</p>
            </div>
        `;

        resultContainer.innerHTML = html;

        // Apply a subtle background based on the movie's backdrop image
        resultContainer.style.background = backdropPath 
            ? `linear-gradient(to bottom, rgba(18, 18, 18, 0.9), var(--main-bg-color)), url(${IMG_BASE_URL + backdropPath}) no-repeat center center` 
            : 'var(--main-bg-color)';
        resultContainer.style.backgroundSize = 'cover';
    }
});