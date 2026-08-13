document.addEventListener('DOMContentLoaded', () => {
    // Navigation Logic
    const navLinks = document.querySelectorAll('.nav-links li');
    const views = document.querySelectorAll('.view-container');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active from all
            navLinks.forEach(l => l.classList.remove('active'));
            // Add active to clicked
            link.classList.add('active');

            // Hide all views
            views.forEach(v => v.classList.add('hidden'));
            
            // Show target view
            const targetViewId = link.getAttribute('data-view') + '-view';
            document.getElementById(targetViewId).classList.remove('hidden');
        });
    });

    // Initialization
    initStorefront();
    initInventory();
    initDashboard();
});

const API_URL = 'https://cinevault-backend-2fl5.onrender.com';

// --- Storefront State & Logic ---
let storefrontRows = [];
let targetRowForAdd = null;

async function initStorefront() {
    try {
        const response = await fetch(`${API_URL}/storefront`);
        const data = await response.json();
        storefrontRows = data.rows || [];
        renderStorefrontRows();
    } catch (e) {
        console.error("Failed to load storefront", e);
    }
}

function renderStorefrontRows() {
    const container = document.getElementById('storefront-rows-container');
    container.innerHTML = '';
    
    storefrontRows.forEach((row, index) => {
        const rowEl = document.createElement('div');
        rowEl.className = 'storefront-row-editor';
        
        let moviesHtml = '';
        row.movies.forEach(movie => {
            moviesHtml += `
                <div class="movie-card">
                    <img src="${movie.poster}" alt="${movie.title}" onerror="this.src='https://via.placeholder.com/120x180?text=No+Poster'">
                    <button class="remove-btn" onclick="removeMovieFromRow('${row.id}', '${movie.id}')"><i class='bx bx-x'></i></button>
                </div>
            `;
        });
        
        // Add Button
        moviesHtml += `
            <div class="add-movie-card" onclick="openSearchModal('${row.id}')">
                <i class='bx bx-plus'></i>
                <span>Add Movie</span>
            </div>
        `;
        
        rowEl.innerHTML = `
            <div class="row-editor-header">
                <input type="text" class="row-title-input" value="${row.title}" onchange="updateRowTitle('${row.id}', this.value)">
                <button class="icon-btn" style="color: #ff4757; border-color: rgba(255,71,87,0.2)" onclick="deleteRow('${row.id}')"><i class='bx bx-trash'></i></button>
            </div>
            <div class="row-movies-grid">
                ${moviesHtml}
            </div>
        `;
        container.appendChild(rowEl);
    });
}

function addNewRow() {
    const newId = 'row' + Date.now();
    storefrontRows.push({ id: newId, title: 'New Category', movies: [] });
    renderStorefrontRows();
}

function deleteRow(rowId) {
    storefrontRows = storefrontRows.filter(r => r.id !== rowId);
    renderStorefrontRows();
}

function updateRowTitle(rowId, newTitle) {
    const row = storefrontRows.find(r => r.id === rowId);
    if (row) row.title = newTitle;
}

function removeMovieFromRow(rowId, movieId) {
    const row = storefrontRows.find(r => r.id === rowId);
    if (row) {
        row.movies = row.movies.filter(m => m.id !== movieId);
        renderStorefrontRows();
    }
}

    document.getElementById('save-storefront-btn').addEventListener('click', async () => {
        const btn = document.getElementById('save-storefront-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Saving...`;
        
        try {
            await fetch(`${API_URL}/storefront`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rows: storefrontRows })
            });
            btn.innerHTML = `<i class='bx bx-check'></i> Saved!`;
            setTimeout(() => btn.innerHTML = originalText, 2000);
        } catch (e) {
            console.error("Save failed", e);
            btn.innerHTML = `<i class='bx bx-error'></i> Error`;
            setTimeout(() => btn.innerHTML = originalText, 2000);
        }
    });

// --- Database State ---
let inventoryDb = [];

// --- Search Modal Logic ---
function openSearchModal(rowId) {
    targetRowForAdd = rowId;
    document.getElementById('search-modal').classList.remove('hidden');
    document.getElementById('db-search-input').value = '';
    document.getElementById('search-results-grid').innerHTML = '';
    document.getElementById('db-search-input').focus();
}

function closeSearchModal() {
    document.getElementById('search-modal').classList.add('hidden');
    targetRowForAdd = null;
}

function handleSearch() {
    const query = document.getElementById('db-search-input').value.toLowerCase();
    const grid = document.getElementById('search-results-grid');
    
    if (query.length < 2) {
        grid.innerHTML = '';
        return;
    }
    
    const results = inventoryDb.filter(m => m.title.toLowerCase().includes(query));
    
    grid.innerHTML = '';
    results.forEach(movie => {
        const streamCount = movie.streams ? movie.streams.length : 0;
        const el = document.createElement('div');
        el.className = 'search-result-item';
        el.onclick = () => addMovieToTargetRow(movie);
        el.innerHTML = `
            <img src="${movie.poster}" alt="${movie.title}" onerror="this.src='https://via.placeholder.com/140x210?text=No+Poster'">
            <div class="overlay">
                <h4>${movie.title}</h4>
                <span>${streamCount} Streams</span>
            </div>
        `;
        grid.appendChild(el);
    });
}

function addMovieToTargetRow(movie) {
    if (!targetRowForAdd) return;
    const row = storefrontRows.find(r => r.id === targetRowForAdd);
    if (row && !row.movies.find(m => m.id === movie.id)) {
        row.movies.push(movie);
        renderStorefrontRows();
    }
    closeSearchModal();
}

// --- Inventory Logic ---
async function initInventory() {
    try {
        const response = await fetch(`${API_URL}/inventory`);
        inventoryDb = await response.json();
        renderInventory(inventoryDb);
        document.getElementById('total-movies-count').textContent = inventoryDb.length;
    } catch (e) {
        console.error("Failed to load inventory", e);
    }
}

function renderInventory(movies) {
    const list = document.getElementById('inventory-list');
    if (!list) return;
    
    list.innerHTML = '';
    movies.forEach(movie => {
        const streamCount = movie.streams ? movie.streams.length : 0;
        const languages = movie.streams ? [...new Set(movie.streams.map(s => s.language))].join(', ') : '';
        list.innerHTML += `
            <tr>
                <td><img src="${movie.poster}" class="table-poster" onerror="this.src='https://via.placeholder.com/50x75?text=No+Poster'"></td>
                <td style="font-weight: 600;">${movie.title}</td>
                <td><span class="status-badge" style="background: rgba(108, 92, 231, 0.2); color: var(--primary-color);">${streamCount} Streams</span></td>
                <td>${languages}</td>
                <td>
                    <button class="icon-btn" style="color: #ff4757; border-color: rgba(255,71,87,0.2)" onclick="alert('Delete functionality coming soon!')"><i class='bx bx-trash'></i></button>
                </td>
            </tr>
        `;
    });
}

function filterInventory(query) {
    const q = query.toLowerCase();
    const filtered = inventoryDb.filter(m => m.title.toLowerCase().includes(q));
    renderInventory(filtered);
}

// --- Add Master Movie Logic ---
let currentMasterMovie = null;
let streamCount = 0;

async function fetchTmdbMetadata() {
    const tmdbId = document.getElementById('curated-tmdb-id').value;
    if (!tmdbId) return;
    
    try {
        const res = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}?api_key=15d2ea6d0dc1d476efbca3eba2b9bbfb`);
        if (!res.ok) throw new Error("TMDB not found");
        const data = await res.json();
        
        currentMasterMovie = {
            tmdbId: data.id,
            title: data.title,
            poster: `https://image.tmdb.org/t/p/w500${data.poster_path}`,
            streams: []
        };
        
        document.getElementById('curated-title').textContent = data.title;
        document.getElementById('curated-year').textContent = data.release_date ? data.release_date.split('-')[0] : "";
        document.getElementById('curated-poster').src = currentMasterMovie.poster;
        document.getElementById('curated-metadata-preview').style.display = "flex";
        
        if (streamCount === 0) addStreamField();
        
    } catch (e) {
        alert("Failed to fetch TMDB data. Check the ID.");
    }
}

function addStreamField() {
    streamCount++;
    const container = document.getElementById('curated-streams-container');
    const id = `stream-${streamCount}`;
    
    const html = `
        <div id="${id}" style="display: flex; gap: 10px; margin-bottom: 10px; align-items: center; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px;">
            <select class="search-box" id="${id}-quality" style="width: 100px; padding: 8px; border:none; background:rgba(255,255,255,0.1); color:white;">
                <option style="color:black;" value="1080p">1080p</option>
                <option style="color:black;" value="720p">720p</option>
                <option style="color:black;" value="4K">4K</option>
            </select>
            <select class="search-box" id="${id}-lang" style="width: 120px; padding: 8px; border:none; background:rgba(255,255,255,0.1); color:white;">
                <option style="color:black;" value="Tamil">Tamil</option>
                <option style="color:black;" value="Telugu">Telugu</option>
                <option style="color:black;" value="Hindi">Hindi</option>
                <option style="color:black;" value="Multi">Multi</option>
            </select>
            <input type="text" id="${id}-url" class="search-box" style="flex: 1; padding: 8px; border:none; background:rgba(255,255,255,0.1); color:white;" placeholder="Paste auto-filter link here...">
            <button class="icon-btn" style="color: #ff4757;" onclick="document.getElementById('${id}').remove()"><i class='bx bx-trash'></i></button>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
}

async function saveMasterMovie() {
    if (!currentMasterMovie) {
        alert("Please fetch TMDB metadata first.");
        return;
    }
    
    const statusEl = document.getElementById('add-movie-status');
    statusEl.textContent = "Saving Master Movie...";
    
    const streamDivs = document.getElementById('curated-streams-container').children;
    const streams = [];
    
    for (let div of streamDivs) {
        const id = div.id;
        const quality = document.getElementById(`${id}-quality`).value;
        const lang = document.getElementById(`${id}-lang`).value;
        const url = document.getElementById(`${id}-url`).value;
        
        if (!url) continue;
        
        const parts = url.split('/player/');
        if (parts.length > 1) {
            const fileParts = parts[1].split('/');
            const fileId = fileParts[0];
            const fileName = fileParts.slice(1).join('/');
            
            streams.push({
                quality: quality,
                language: lang,
                fileId: fileId,
                fileName: fileName
            });
        } else {
            // Fallback for unparseable urls
            streams.push({
                quality: quality,
                language: lang,
                fileId: "",
                fileName: "",
                rawUrl: url
            });
        }
    }
    
    if (streams.length === 0) {
        statusEl.textContent = "You must add at least one valid stream URL.";
        return;
    }
    
    currentMasterMovie.streams = streams;
    
    try {
        const res = await fetch(`${API_URL}/inventory/curated`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentMasterMovie)
        });
        
        if (res.ok) {
            statusEl.innerHTML = `<i class='bx bx-check-circle'></i> "${currentMasterMovie.title}" successfully saved!`;
            statusEl.style.color = "#2ed573";
            setTimeout(() => {
                document.getElementById('curated-tmdb-id').value = '';
                document.getElementById('curated-metadata-preview').style.display = "none";
                document.getElementById('curated-streams-container').innerHTML = '';
                statusEl.innerHTML = '';
                currentMasterMovie = null;
                streamCount = 0;
                initInventory();
            }, 2000);
        } else {
            statusEl.textContent = "Failed to save.";
        }
    } catch(e) {
        statusEl.textContent = "Network error.";
    }
}

function initDashboard() {
    // Simulate fetching from MongoDB / Backend
    document.getElementById('total-movies-count').textContent = '1,325';
    document.getElementById('queue-count').textContent = '42';
    document.getElementById('enriched-count').textContent = '1,280';

    const mockRecentMovies = [
        {
            title: "Leo",
            poster: "https://image.tmdb.org/t/p/w500/p9nKnOAVQO58t2lQikZ9vGstEvy.jpg",
            quality: "1080p",
            language: "Tamil",
            status: "active"
        },
        {
            title: "Jailer",
            poster: "https://image.tmdb.org/t/p/w500/wffEQ9qHn7gM2k0TfFfS4vEpxP.jpg",
            quality: "720p",
            language: "Tamil",
            status: "active"
        },
        {
            title: "Vikram",
            poster: "https://image.tmdb.org/t/p/w500/9yZ4QkAvtNeqX3W4Fq4m8s37Zid.jpg",
            quality: "1080p",
            language: "Tamil, Telugu",
            status: "active"
        },
        {
            title: "Scraping Queue #42",
            poster: "https://via.placeholder.com/40x60?text=?",
            quality: "Unknown",
            language: "Unknown",
            status: "pending"
        }
    ];

    const tbody = document.getElementById('recent-movies-list');
    tbody.innerHTML = '';

    mockRecentMovies.forEach(movie => {
        const tr = document.createElement('tr');
        
        const statusClass = movie.status === 'active' ? 'active' : 'pending';
        const statusText = movie.status === 'active' ? 'Live in Store' : 'Scraping...';

        tr.innerHTML = `
            <td>
                <div class="poster-cell">
                    <img src="${movie.poster}" alt="${movie.title}">
                    <span style="font-family: 'Outfit'; font-weight: 600;">${movie.title}</span>
                </div>
            </td>
            <td>${movie.quality}</td>
            <td>${movie.language}</td>
            <td>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </td>
        `;
        tbody.appendChild(tr);
    });
}
