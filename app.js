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

// --- Storefront State & Logic ---
let storefrontRows = [
    { id: 'row1', title: 'Trending Now', movies: [] },
    { id: 'row2', title: 'Popular on Cinevault', movies: [] },
    { id: 'row3', title: 'Top Rated', movies: [] }
];
let targetRowForAdd = null;

function initStorefront() {
    renderStorefrontRows();
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

// --- Mock Data ---
const mockDb = [
    { id: '1', title: 'Leo', poster: 'https://image.tmdb.org/t/p/w500/p9nKnOAVQO58t2lQikZ9vGstEvy.jpg', quality: '1080p', language: 'Tamil' },
    { id: '2', title: 'Jailer', poster: 'https://image.tmdb.org/t/p/w500/wffEQ9qHn7gM2k0TfFfS4vEpxP.jpg', quality: '720p', language: 'Tamil' },
    { id: '3', title: 'Vikram', poster: 'https://image.tmdb.org/t/p/w500/9yZ4QkAvtNeqX3W4Fq4m8s37Zid.jpg', quality: '1080p', language: 'Tamil' },
    { id: '4', title: 'Master', poster: 'https://image.tmdb.org/t/p/w500/8c7q5M09jEAWz7k4lq32o8N4R7M.jpg', quality: '720p', language: 'Tamil' },
    { id: '5', title: 'Kaithi', poster: 'https://image.tmdb.org/t/p/w500/eWjJ3E2oYfM58H0JtA11lqA8i9M.jpg', quality: '1080p', language: 'Tamil' },
    { id: '6', title: 'Avatar', poster: 'https://image.tmdb.org/t/p/w500/jRXYjXNq0Cs2TcJjLkki24MLp7u.jpg', quality: '4K', language: 'English' }
];

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
    
    const results = mockDb.filter(m => m.title.toLowerCase().includes(query));
    
    grid.innerHTML = '';
    results.forEach(movie => {
        const el = document.createElement('div');
        el.className = 'search-result-item';
        el.onclick = () => addMovieToTargetRow(movie);
        el.innerHTML = `
            <img src="${movie.poster}" alt="${movie.title}" onerror="this.src='https://via.placeholder.com/140x210?text=No+Poster'">
            <div class="overlay">
                <h4>${movie.title}</h4>
                <span>${movie.quality}</span>
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
function initInventory() {
    renderInventory(mockDb);
}

function renderInventory(movies) {
    const list = document.getElementById('inventory-list');
    if (!list) return;
    
    list.innerHTML = '';
    movies.forEach(movie => {
        list.innerHTML += `
            <tr>
                <td><img src="${movie.poster}" class="table-poster" onerror="this.src='https://via.placeholder.com/50x75?text=No+Poster'"></td>
                <td style="font-weight: 600;">${movie.title}</td>
                <td><span class="status-badge" style="background: rgba(108, 92, 231, 0.2); color: var(--primary-color);">${movie.quality}</span></td>
                <td>${movie.language}</td>
                <td>
                    <button class="icon-btn" style="color: #ff4757; border-color: rgba(255,71,87,0.2)" onclick="alert('Delete functionality coming soon!')"><i class='bx bx-trash'></i></button>
                </td>
            </tr>
        `;
    });
}

function filterInventory(query) {
    const q = query.toLowerCase();
    const filtered = mockDb.filter(m => m.title.toLowerCase().includes(q));
    renderInventory(filtered);
}

// --- Add Movie Logic ---
function queueNewMovie() {
    const input = document.getElementById('add-movie-input').value;
    const statusEl = document.getElementById('add-movie-status');
    
    if (!input) {
        statusEl.textContent = "Please enter a TMDB ID or Movie Name.";
        statusEl.style.color = "#ff4757";
        return;
    }
    
    // Simulate API call to backend
    statusEl.textContent = "Sending request to Telegram bot...";
    statusEl.style.color = "var(--primary-color)";
    
    setTimeout(() => {
        statusEl.innerHTML = `<i class='bx bx-check-circle'></i> "${input}" has been queued successfully! It will appear in Inventory once processed.`;
        statusEl.style.color = "#2ed573";
        document.getElementById('add-movie-input').value = '';
    }, 1500);
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
