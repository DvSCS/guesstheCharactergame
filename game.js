class CharacterGuessingGame {
    constructor() {
        this.maxGuesses = 5;
        this.remainingGuesses = this.maxGuesses;
        this.targetGame = null;
        this.targetCharacter = null;
        this.targetCharacterData = null;
        this.gameActive = false;
        this.gameAPI = new GameAPI();
        this.guessedCharacters = new Set();
        
        // DOM Elements
        this.guessInput = document.getElementById('guess-input');
        this.submitButton = document.getElementById('submit-guess');
        this.newGameButton = document.getElementById('new-game');
        this.hintsContainer = document.getElementById('hints-container');
        this.historyContainer = document.getElementById('history-container');
        this.guessesLeftSpan = document.getElementById('guesses-left');
        this.connectionsContainer = document.getElementById('connections-container');
        this.guessedCharactersContainer = document.getElementById('guessed-characters');
        
        // Event Listeners
        this.submitButton.addEventListener('click', () => this.makeGuess());
        this.newGameButton.addEventListener('click', () => this.startNewGame());
        this.guessInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.makeGuess();
        });
        
        // Start the first game
        this.startNewGame();
    }
    
    async startNewGame() {
        // Reset game state
        this.remainingGuesses = this.maxGuesses;
        this.guessesLeftSpan.textContent = this.remainingGuesses;
        this.hintsContainer.innerHTML = '';
        this.historyContainer.innerHTML = '';
        this.connectionsContainer.innerHTML = '';
        this.guessedCharactersContainer.innerHTML = '';
        this.guessInput.value = '';
        this.gameActive = true;
        this.guessedCharacters.clear();
        this.submitButton.disabled = false;
        
        // Select random game and character
        const games = Object.keys(gameDatabase);
        this.targetGame = games[Math.floor(Math.random() * games.length)];
        const characters = Object.keys(gameDatabase[this.targetGame].characters);
        this.targetCharacter = characters[Math.floor(Math.random() * characters.length)];
        this.targetCharacterData = gameDatabase[this.targetGame].characters[this.targetCharacter];
        
        // Add initial hint
        this.addHint(`This character is from ${this.targetGame}`);
    }
    
    async makeGuess() {
        if (!this.gameActive) return;
        
        const guess = this.guessInput.value.trim();
        if (!guess) return;
        
        this.remainingGuesses--;
        this.guessesLeftSpan.textContent = this.remainingGuesses;
        
        // Check if the guess is correct
        if (guess.toLowerCase() === this.targetCharacter.toLowerCase()) {
            await this.gameWon();
            return;
        }
        
        // Find the guessed character in any game
        let guessedCharacterData = null;
        let guessedGame = null;
        
        for (const game in gameDatabase) {
            for (const character in gameDatabase[game].characters) {
                if (character.toLowerCase() === guess.toLowerCase()) {
                    guessedCharacterData = gameDatabase[game].characters[character];
                    guessedGame = game;
                    break;
                }
            }
            if (guessedCharacterData) break;
        }
        
        if (!guessedCharacterData) {
            this.addHint(`Character "${guess}" not found in the database!`);
        } else {
            await this.compareCharacters(guess, guessedGame, guessedCharacterData);
        }
        
        // Check if game is over
        if (this.remainingGuesses <= 0) {
            await this.gameLost();
        }
        
        this.guessInput.value = '';
    }
    
    async compareCharacters(guessedName, guessedGame, guessedData) {
        if (this.guessedCharacters.has(guessedName)) {
            this.addHint(`You already guessed ${guessedName}!`);
            return;
        }
        
        this.guessedCharacters.add(guessedName);
        
        // Calculate proximity score
        const proximityScore = this.gameAPI.calculateProximityScore(this.targetCharacterData, guessedData);
        const proximityColor = this.gameAPI.getProximityColor(proximityScore);
        
        // Add character to the diagram
        await this.addCharacterToDiagram(guessedName, guessedGame, proximityScore, proximityColor, guessedData);
        
        // Add to history
        const historyEntry = document.createElement('div');
        historyEntry.className = 'history-item';
        
        const hints = [];
        for (const attr in this.targetCharacterData) {
            const targetValue = this.targetCharacterData[attr];
            const guessedValue = guessedData[attr];
            
            const isMatch = targetValue === guessedValue;
            const emoji = isMatch ? '🟩' : '🟥';
            hints.push(`${emoji} ${attr}: ${guessedValue}`);
        }
        
        historyEntry.innerHTML = `
            <strong>${guessedName}</strong><br>
            ${hints.join('<br>')}
        `;
        
        this.historyContainer.insertBefore(historyEntry, this.historyContainer.firstChild);
    }
    
    async addCharacterToDiagram(characterName, gameName, proximityScore, proximityColor, characterData) {
        const angle = (this.guessedCharacters.size - 1) * (360 / this.maxGuesses);
        const radius = 300;
        
        // Calculate base position
        const x = Math.cos(angle * Math.PI / 180) * radius;
        const y = Math.sin(angle * Math.PI / 180) * radius;
        
        // Create character element
        const characterElement = document.createElement('div');
        characterElement.className = 'guessed-character';
        characterElement.dataset.character = characterName;
        
        // Adjust position based on quadrant to prevent overflow
        const quadrant = Math.floor((angle + 45) / 90) % 4;
        let xOffset = 0;
        let yOffset = 0;
        
        switch(quadrant) {
            case 0: // Top right
                xOffset = -160;
                break;
            case 1: // Bottom right
                xOffset = -160;
                yOffset = -100;
                break;
            case 2: // Bottom left
                yOffset = -100;
                break;
            case 3: // Top left
                break;
        }
        
        const finalX = x + xOffset;
        const finalY = y + yOffset;
        
        // Set position variables for CSS
        characterElement.style.setProperty('--x', `${finalX}px`);
        characterElement.style.setProperty('--y', `${finalY}px`);
        characterElement.style.transform = `translate(${finalX}px, ${finalY}px)`;
        
        // Get character image
        const imageUrl = await this.gameAPI.searchCharacterImage(characterName, gameName);
        
        // Create attributes HTML
        const attributes = [];
        for (const attr in characterData) {
            const targetValue = this.targetCharacterData[attr];
            const guessedValue = characterData[attr];
            const isMatch = targetValue === guessedValue;
            const emoji = isMatch ? '🟩' : '🟥';
            attributes.push(`
                <div class="attribute">
                    <span class="emoji">${emoji}</span>
                    <span>${attr}: ${guessedValue}</span>
                </div>
            `);
        }
        
        characterElement.innerHTML = `
            <div class="character-icon">
                <img src="${imageUrl}" alt="${characterName}">
            </div>
            <div class="character-info">
                <div class="character-name">${characterName}</div>
                <div class="attributes">
                    ${attributes.join('')}
                </div>
            </div>
        `;
        
        this.guessedCharactersContainer.appendChild(characterElement);
        
        // Create connection to center (mystery character)
        this.createConnection(
            { x: 0, y: 0 },
            { x: finalX + 60, y: finalY + 60 },
            proximityScore,
            proximityColor,
            'center-' + characterName
        );
        
        // Create connections to other characters
        const allCharacters = this.guessedCharactersContainer.querySelectorAll('.guessed-character');
        allCharacters.forEach(otherCharacter => {
            if (otherCharacter !== characterElement) {
                const otherName = otherCharacter.dataset.character;
                const otherData = this.findCharacterData(otherName);
                if (otherData) {
                    const score = this.gameAPI.calculateProximityScore(characterData, otherData.data);
                    const color = this.gameAPI.getProximityColor(score);
                    
                    const otherX = parseFloat(otherCharacter.style.getPropertyValue('--x')) + 60;
                    const otherY = parseFloat(otherCharacter.style.getPropertyValue('--y')) + 60;
                    
                    this.createConnection(
                        { x: finalX + 60, y: finalY + 60 },
                        { x: otherX, y: otherY },
                        score,
                        color,
                        `${characterName}-${otherName}`
                    );
                }
            }
        });
    }
    
    createConnection(from, to, score, color, id) {
        // Create connection line
        const line = document.createElement('div');
        line.className = 'connection-line';
        line.dataset.id = id;
        
        // Calculate line angle and length
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        // Apply line styles
        line.style.width = `${length}px`;
        line.style.transform = `translate(${from.x + 100}px, ${from.y + 100}px) rotate(${angle}rad)`;
        line.style.color = color;
        
        // Add proximity score
        const scoreElement = document.createElement('div');
        scoreElement.className = 'connection-score';
        scoreElement.textContent = `#${score}`;
        
        // Position score at the midpoint of the line
        const midX = from.x + dx / 2;
        const midY = from.y + dy / 2;
        scoreElement.style.left = `${midX + 100}px`;
        scoreElement.style.top = `${midY + 100}px`;
        
        this.connectionsContainer.appendChild(line);
        this.connectionsContainer.appendChild(scoreElement);
        
        return { line, scoreElement };
    }
    
    findCharacterData(characterName) {
        for (const game in gameDatabase) {
            for (const character in gameDatabase[game].characters) {
                if (character === characterName) {
                    return {
                        game,
                        data: gameDatabase[game].characters[character]
                    };
                }
            }
        }
        return null;
    }
    
    addHint(message) {
        const hintElement = document.createElement('div');
        hintElement.className = 'hint';
        hintElement.textContent = message;
        this.hintsContainer.appendChild(hintElement);
    }
    
    async gameWon() {
        this.gameActive = false;
        this.addHint(`🎉 Congratulations! You found the character: ${this.targetCharacter}!`);
        this.submitButton.disabled = true;
        
        // Show the target character's image
        const mysteryImg = document.querySelector('.mystery-character img');
        const imageUrl = await this.gameAPI.searchCharacterImage(this.targetCharacter, this.targetGame);
        mysteryImg.src = imageUrl;
        document.querySelector('.mystery-character .character-name').textContent = this.targetCharacter;
    }
    
    async gameLost() {
        this.gameActive = false;
        this.addHint(`Game Over! The character was ${this.targetCharacter} from ${this.targetGame}.`);
        this.submitButton.disabled = true;
        
        // Show the target character's image
        const mysteryImg = document.querySelector('.mystery-character img');
        const imageUrl = await this.gameAPI.searchCharacterImage(this.targetCharacter, this.targetGame);
        mysteryImg.src = imageUrl;
        document.querySelector('.mystery-character .character-name').textContent = this.targetCharacter;
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new CharacterGuessingGame();
}); 