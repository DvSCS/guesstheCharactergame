const CHARACTER_IMAGES = {
    'Mario': 'https://i.imgur.com/KCnVHGX.png',
    'Luigi': 'https://i.imgur.com/IzJbqHE.png',
    'Bowser': 'https://i.imgur.com/bB5WFHG.png',
    'Yoshi': 'https://i.imgur.com/XG4fHl5.png',
    'Link': 'https://i.imgur.com/5LqNyRg.png',
    'Zelda': 'https://i.imgur.com/YE1XHUI.png',
    'Ganon': 'https://i.imgur.com/YWpQf1R.png',
    'Steve': 'https://i.imgur.com/L4qX3Kd.png',
    'Villager': 'https://i.imgur.com/YvQXmGF.png',
    'Enderman': 'https://i.imgur.com/L9ziPWh.png'
};

const GAME_BACKGROUNDS = {
    'Super Mario': 'https://i.imgur.com/8lKMJFb.jpg',
    'The Legend of Zelda': 'https://i.imgur.com/Y7YtQYg.jpg',
    'Minecraft': 'https://i.imgur.com/DQCUYjK.jpg'
};

const BACKUP_IMAGE_URL = 'https://i.imgur.com/XqaKHn8.png';
const BACKUP_BG = 'https://i.imgur.com/8G6DGX9.jpg';

class GameAPI {
    constructor() {
        this.characterCache = new Map();
    }

    async searchCharacterImage(characterName, gameName) {
        // First check our cache
        const cacheKey = `${gameName}-${characterName}`;
        if (this.characterCache.has(cacheKey)) {
            return this.characterCache.get(cacheKey);
        }

        // Get predefined image or fallback
        const imageUrl = CHARACTER_IMAGES[characterName] || BACKUP_IMAGE_URL;
        this.characterCache.set(cacheKey, imageUrl);
        return imageUrl;
    }

    async searchGameBackground(gameName) {
        return GAME_BACKGROUNDS[gameName] || BACKUP_BG;
    }

    calculateProximityScore(char1, char2) {
        let score = 0;
        let maxScore = 0;
        
        // Compare each attribute
        for (const attr in char1) {
            if (char1[attr] === char2[attr]) {
                score += 200;
            }
            maxScore += 200;
        }
        
        // Calculate percentage and convert to 1-999 range
        return Math.floor((score / maxScore) * 999) + 1;
    }

    getProximityColor(score) {
        if (score > 666) return '#4CAF50'; // Green
        if (score > 333) return '#FFC107'; // Yellow
        return '#f44336'; // Red
    }
}

// Export for use in other files
window.GameAPI = GameAPI; 