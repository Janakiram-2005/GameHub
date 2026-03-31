const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// ============ MIDDLEWARE (Order matters!) ============
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging middleware for debugging
app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path}`);
    next();
});

// ============ MONGODB CONNECTION ============
const mongoString = process.env.MONGODB_URI || 'mongodb+srv://testuser:testpassword123@cluster0.vulsn3z.mongodb.net/?appName=Cluster0';

mongoose.connect(mongoString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('✅ Connected to MongoDB');
})
.catch((error) => {
    console.error('❌ MongoDB connection error:', error);
});

// ============ DATABASE SCHEMA ============
const gameSchema = new mongoose.Schema({
    id: Number,
    name: String,
    logo: String,
    description: String,
    categories: [String],
    link: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Game = mongoose.model('Game', gameSchema);

// ============ HEALTH CHECK ENDPOINT ============
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// ============ API ROUTES (PRIORITY!) ============

// GET all games
app.get('/api/games', async (req, res) => {
    console.log('🎮 Fetching all games from MongoDB...');
    try {
        const games = await Game.find().sort({ createdAt: -1 });
        console.log(`✅ Found ${games.length} games`);
        res.json(games);
    } catch (error) {
        console.error('❌ Error fetching games:', error);
        res.status(500).json({ error: 'Failed to fetch games', details: error.message });
    }
});

// POST - Add new game
app.post('/api/games', async (req, res) => {
    console.log('➕ Adding new game...');
    try {
        const newGame = new Game({
            id: req.body.id,
            name: req.body.name,
            logo: req.body.logo,
            description: req.body.description,
            categories: req.body.categories,
            link: req.body.link
        });

        const savedGame = await newGame.save();
        console.log('✅ Game saved:', savedGame.name);
        res.status(201).json(savedGame);
    } catch (error) {
        console.error('❌ Error adding game:', error);
        res.status(400).json({ error: 'Failed to add game', details: error.message });
    }
});

// PUT - Update game
app.put('/api/games/:id', async (req, res) => {
    console.log(`✏️ Updating game ${req.params.id}...`);
    try {
        const updatedGame = await Game.findOneAndUpdate(
            { id: parseInt(req.params.id) },
            {
                name: req.body.name,
                logo: req.body.logo,
                description: req.body.description,
                categories: req.body.categories,
                link: req.body.link
            },
            { new: true }
        );

        if (!updatedGame) {
            console.log('⚠️ Game not found:', req.params.id);
            return res.status(404).json({ error: 'Game not found' });
        }

        console.log('✅ Game updated:', updatedGame.name);
        res.json(updatedGame);
    } catch (error) {
        console.error('❌ Error updating game:', error);
        res.status(400).json({ error: 'Failed to update game', details: error.message });
    }
});

// DELETE - Remove game
app.delete('/api/games/:id', async (req, res) => {
    console.log(`🗑️ Deleting game ${req.params.id}...`);
    try {
        const deletedGame = await Game.findOneAndDelete({ id: parseInt(req.params.id) });

        if (!deletedGame) {
            console.log('⚠️ Game not found:', req.params.id);
            return res.status(404).json({ error: 'Game not found' });
        }

        console.log('✅ Game deleted:', deletedGame.name);
        res.json({ message: 'Game deleted successfully' });
    } catch (error) {
        console.error('❌ Error deleting game:', error);
        res.status(400).json({ error: 'Failed to delete game', details: error.message });
    }
});

// ============ STATIC FILES & FRONTEND ============

// Serve static files (CSS, JS, images, etc)
app.use(express.static(path.join(__dirname)));

// Serve index.html for SPA routing
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ============ 404 HANDLER ============
app.use((req, res) => {
    console.log(`⚠️ 404 Not Found: ${req.method} ${req.path}`);
    res.status(404).json({ error: 'Route not found', path: req.path, method: req.method });
});

// ============ ERROR HANDLER ============
app.use((err, req, res, next) => {
    console.error('💥 Server error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ============ START SERVER ============
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n🚀 GameHub Server Started!`);
    console.log(`📍 Running on: http://localhost:${PORT}`);
    console.log(`🌐 API Endpoint: http://localhost:${PORT}/api/games`);
    console.log(`💾 Database: MongoDB`);
    console.log(`✅ Ready to accept requests!\n`);
});
