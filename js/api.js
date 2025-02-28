const API_KEY = 'YOUR_RAWG_API_KEY'; // You'll need to get an API key from https://rawg.io/apidocs
const BACKUP_IMAGE_URL = 'https://via.placeholder.com/150';

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

        try {
            // Search for the game first
            const gameResponse = await fetch(`https://api.rawg.io/api/games?key=${API_KEY}&search=${encodeURIComponent(gameName)}&page_size=1`);
            const gameData = await gameResponse.json();

            if (gameData.results && gameData.results.length > 0) {
                const gameId = gameData.results[0].id;
                
                // Get game screenshots that might contain the character
                const screenshotsResponse = await fetch(`https://api.rawg.io/api/games/${gameId}/screenshots?key=${API_KEY}`);
                const screenshotsData = await screenshotsResponse.json();

                if (screenshotsData.results && screenshotsData.results.length > 0) {
                    // Use the first screenshot as character representation
                    const imageUrl = screenshotsData.results[0].image;
                    this.characterCache.set(cacheKey, imageUrl);
                    return imageUrl;
                }
            }

            // Fallback to backup image if no game screenshots found
            this.characterCache.set(cacheKey, BACKUP_IMAGE_URL);
            return BACKUP_IMAGE_URL;
        } catch (error) {
            console.error('Error fetching character image:', error);
            return BACKUP_IMAGE_URL;
        }
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