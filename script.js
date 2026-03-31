// Game data - stored in browser's local storage
let games = [];
let selectedImageData = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadGames();
    renderGames();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    const toggleBtn = document.getElementById('toggleFormBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const addGameForm = document.getElementById('addGameForm');
    const form = document.querySelector('form');
    const logoInput = document.getElementById('gameLogo');

    // File input change handler
    logoInput.addEventListener('change', handleImageUpload);

    toggleBtn.addEventListener('click', () => {
        const isHidden = addGameForm.style.display === 'none';
        addGameForm.style.display = isHidden ? 'block' : 'none';
        if (isHidden) {
            toggleBtn.textContent = '✕ Close Form';
        } else {
            toggleBtn.textContent = '+ Add New Game';
            resetForm();
        }
    });

    cancelBtn.addEventListener('click', () => {
        addGameForm.style.display = 'none';
        toggleBtn.textContent = '+ Add New Game';
        resetForm();
    });

    form.addEventListener('submit', addGame);
}

// Handle image file upload
function handleImageUpload(e) {
    const file = e.target.files[0];
    
    if (!file) {
        selectedImageData = null;
        document.getElementById('imagePreview').innerHTML = '';
        return;
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        alert('Image is too large! Please choose an image smaller than 2MB.');
        e.target.value = '';
        selectedImageData = null;
        document.getElementById('imagePreview').innerHTML = '';
        return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file (PNG, JPG, GIF, etc.)');
        e.target.value = '';
        selectedImageData = null;
        document.getElementById('imagePreview').innerHTML = '';
        return;
    }

    // Read file and convert to base64
    const reader = new FileReader();
    reader.onload = function(event) {
        selectedImageData = event.target.result; // Base64 data
        
        // Show preview
        const preview = document.getElementById('imagePreview');
        const img = document.createElement('img');
        img.src = selectedImageData;
        preview.innerHTML = '';
        preview.appendChild(img);
    };
    reader.readAsDataURL(file);
}

// Add new game
function addGame(e) {
    e.preventDefault();

    const gameName = document.getElementById('gameName').value.trim();
    const gameDescription = document.getElementById('gameDescription').value.trim();
    const gameLink = document.getElementById('gameLink').value.trim();
    
    // Get all selected categories
    const categorySelect = document.getElementById('gameCategory');
    const selectedOptions = Array.from(categorySelect.selectedOptions);
    const gameCategories = selectedOptions.map(option => option.value).filter(val => val !== '');

    if (!gameName || !selectedImageData || !gameLink || gameCategories.length === 0) {
        alert('Please fill in all required fields, upload an image, and select at least one category!');
        return;
    }

    // Validate URL
    try {
        new URL(gameLink);
    } catch (err) {
        alert('Please enter a valid game URL!');
        return;
    }

    // Create game object with base64 image and multiple categories
    const newGame = {
        id: Date.now(),
        name: gameName,
        logo: selectedImageData, // Base64 image data
        description: gameDescription,
        categories: gameCategories, // Array of categories
        link: gameLink
    };

    // Add to games array
    games.push(newGame);

    // Save to local storage
    saveGames();

    // Reset form
    resetForm();

    // Hide form
    document.getElementById('addGameForm').style.display = 'none';
    document.getElementById('toggleFormBtn').textContent = '+ Add New Game';

    // Render games
    renderGames();
}

// Delete game
function deleteGame(id, event) {
    event.stopPropagation(); // Prevent triggering play game
    
    if (confirm('Are you sure you want to delete this game?')) {
        games = games.filter(game => game.id !== id);
        saveGames();
        renderGames();
    }
}

// Play game - opens in new tab
function playGame(link, event) {
    if (event) {
        event.stopPropagation();
    }
    window.open(link, '_blank');
}

// Reset form
function resetForm() {
    document.getElementById('gameName').value = '';
    document.getElementById('gameLogo').value = '';
    document.getElementById('gameDescription').value = '';
    document.getElementById('gameCategory').value = '';
    document.getElementById('gameLink').value = '';
    document.getElementById('imagePreview').innerHTML = '';
    selectedImageData = null;
}

// Render all games
function renderGames() {
    const gamesGrid = document.getElementById('gamesGrid');
    const emptyState = document.getElementById('emptyState');

    // Clear grid
    gamesGrid.innerHTML = '';

    if (games.length === 0) {
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    // Create game cards
    games.forEach(game => {
        const gameCard = document.createElement('div');
        gameCard.className = 'game-card';
        gameCard.onclick = () => playGame(game.link);
        
        // Handle both old single category and new multiple categories format
        const categories = Array.isArray(game.categories) ? game.categories : [game.category];
        const categoryBadges = categories
            .map(cat => `<span class="game-category">${cat}</span>`)
            .join('');
        
        gameCard.innerHTML = `
            <div class="game-image-wrapper">
                <img src="${game.logo}" alt="${game.name}" class="game-image">
                <div class="play-overlay">
                    <i class="fas fa-play"></i>
                </div>
            </div>
            <div class="game-content">
                <h2 class="game-name">${game.name}</h2>
                <div class="game-categories">${categoryBadges}</div>
                <p class="game-description">${game.description || 'Click to play!'}</p>
                <div class="game-actions">
                    <button class="edit-btn" onclick="editGame(${game.id}, event)"><i class="fas fa-edit"></i> Edit</button>
                    <button class="delete-btn" onclick="deleteGame(${game.id}, event)"><i class="fas fa-trash"></i> Delete</button>
                </div>
            </div>
        `;
        gamesGrid.appendChild(gameCard);
    });
}

// Edit game
function editGame(id, event) {
    event.stopPropagation();
    
    const game = games.find(g => g.id === id);
    if (game) {
        document.getElementById('gameName').value = game.name;
        document.getElementById('gameDescription').value = game.description;
        document.getElementById('gameLink').value = game.link;
        
        // Set image preview
        selectedImageData = game.logo;
        const preview = document.getElementById('imagePreview');
        const img = document.createElement('img');
        img.src = game.logo;
        preview.innerHTML = '';
        preview.appendChild(img);

        // Set multiple selected categories
        const categorySelect = document.getElementById('gameCategory');
        const categories = Array.isArray(game.categories) ? game.categories : [game.category];
        
        // Clear all selections first
        Array.from(categorySelect.options).forEach(option => {
            option.selected = false;
        });
        
        // Select the categories
        categories.forEach(cat => {
            Array.from(categorySelect.options).forEach(option => {
                if (option.value === cat) {
                    option.selected = true;
                }
            });
        });

        // Remove the old game
        games = games.filter(g => g.id !== id);

        // Show form and scroll to it
        const form = document.getElementById('addGameForm');
        form.style.display = 'block';
        document.getElementById('toggleFormBtn').textContent = '✕ Close Form';
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Save games without the edited one
        saveGames();
    }
}

// Save games to local storage
function saveGames() {
    localStorage.setItem('gameHubGames', JSON.stringify(games));
}

// Load games from local storage
function loadGames() {
    const saved = localStorage.getItem('gameHubGames');
    if (saved) {
        try {
            games = JSON.parse(saved);
        } catch (e) {
            console.error('Error loading games:', e);
            games = [];
        }
    }
}

// Export games as JSON (for backup)
function exportGames() {
    const dataStr = JSON.stringify(games, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'gamehub-backup.json';
    link.click();
}

// Import games from JSON
function importGames(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const imported = JSON.parse(e.target.result);
                if (Array.isArray(imported)) {
                    games = imported;
                    saveGames();
                    renderGames();
                    alert('Games imported successfully!');
                }
            } catch (error) {
                alert('Error importing games:', error);
            }
        };
        reader.readAsText(file);
    }
}
