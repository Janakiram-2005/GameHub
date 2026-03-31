const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, '.')));

// MongoDB Connection
const mongoString = process.env.MONGODB_URI || 'mongodb+srv://testuser:testpassword123@cluster0.vulsn3z.mongodb.net/?appName=Cluster0';

mongoose.connect(mongoString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('Connected to MongoDB');
})
.catch((error) => {
    console.error('MongoDB connection error:', error);
});

// Game Schema
const gameSchema = new mongoose.Schema({
    id: Number,
    name: String,
    logo: String, // Base64 encoded image
    description: String,
    categories: [String],
    link: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Game = mongoose.model('Game', gameSchema);

// Routes

// GET all games
app.get('/api/games', async (req, res) => {
    try {
        const games = await Game.find().sort({ createdAt: -1 });
        res.json(games);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch games' });
    }
});

// POST - Add new game
app.post('/api/games', async (req, res) => {
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
        res.status(201).json(savedGame);
    } catch (error) {
        res.status(400).json({ error: 'Failed to add game' });
    }
});

// PUT - Update game
app.put('/api/games/:id', async (req, res) => {
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
            return res.status(404).json({ error: 'Game not found' });
        }

        res.json(updatedGame);
    } catch (error) {
        res.status(400).json({ error: 'Failed to update game' });
    }
});

// DELETE - Remove game
app.delete('/api/games/:id', async (req, res) => {
    try {
        const deletedGame = await Game.findOneAndDelete({ id: parseInt(req.params.id) });

        if (!deletedGame) {
            return res.status(404).json({ error: 'Game not found' });
        }

        res.json({ message: 'Game deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: 'Failed to delete game' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'Server is running' });
});

// Serve index.html for root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
