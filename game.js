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
        const size = this.guessedCharacters.size;
        let x, y;
        
        // Posicionamento em duas linhas, evitando o centro
        const centerBuffer = 150; // Espaço reservado para o personagem mistério
        
        if (size <= 2) {
            // Primeiros dois cards vão para a esquerda em alturas diferentes
            x = -350;
            y = size === 1 ? -80 : 80;
        } else if (size <= 4) {
            // Próximos dois cards vão para a direita em alturas diferentes
            x = 350;
            y = size === 3 ? -80 : 80;
        } else {
            // Cards adicionais alternam entre esquerda e direita, expandindo para fora
            const side = size % 2 === 1 ? -1 : 1; // Alterna entre esquerda (-1) e direita (1)
            const offset = Math.floor((size - 4) / 2) * 180; // Aumenta o deslocamento a cada par de cards
            x = (350 + offset) * side;
            y = size % 4 <= 1 ? -80 : 80;
        }
        
        // Create character element
        const characterElement = document.createElement('div');
        characterElement.className = 'guessed-character';
        characterElement.dataset.character = characterName;
        
        // Set position variables for CSS
        characterElement.style.setProperty('--x', `${x}px`);
        characterElement.style.setProperty('--y', `${y}px`);
        characterElement.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
        
        // Get character image and game background
        const [characterImage, gameBackground] = await Promise.all([
            this.gameAPI.searchCharacterImage(characterName, gameName),
            this.gameAPI.searchGameBackground(gameName)
        ]);

        // Create attributes HTML with horizontal layout
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
            <div class="character-icon" ${gameBackground ? `style="background-image: url('${gameBackground}');"` : ''}>
                <img src="${characterImage}" alt="${characterName}">
            </div>
            <div class="character-info">
                <div class="character-name">${characterName}</div>
                <div class="attributes">
                    ${attributes.join('')}
                </div>
            </div>
        `;
        
        this.guessedCharactersContainer.appendChild(characterElement);
        
        // Não cria conexão para o primeiro card
        if (size > 1) {
            // Pega o card anterior
            const allCharacters = Array.from(this.guessedCharactersContainer.querySelectorAll('.guessed-character'));
            const previousCharacter = allCharacters[allCharacters.length - 2];
            const previousName = previousCharacter.dataset.character;
            const previousData = this.findCharacterData(previousName);
            
            if (previousData) {
                const previousX = parseFloat(previousCharacter.style.getPropertyValue('--x'));
                const previousY = parseFloat(previousCharacter.style.getPropertyValue('--y'));
                
                // Calcula similaridade entre os personagens
                const score = this.gameAPI.calculateProximityScore(characterData, previousData.data);
                const color = this.gameAPI.getProximityColor(score);
                
                // Cria conexão com o card anterior
                this.createConnection(
                    { x: previousX, y: previousY },
                    { x, y },
                    score,
                    color,
                    `${characterName}-${previousName}`
                );
            }
        }
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
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        // Apply line styles
        line.style.width = `${length}px`;
        line.style.transform = `translate(${from.x}px, ${from.y}px) rotate(${angle}deg)`;
        line.style.color = color;
        
        // Add proximity score
        const scoreElement = document.createElement('div');
        scoreElement.className = 'connection-score';
        scoreElement.textContent = `${Math.floor((score / 1000) * 100)}%`;
        
        // Position score at the midpoint of the line
        const midX = from.x + dx / 2;
        const midY = from.y + dy / 2;
        scoreElement.style.transform = `translate(${midX}px, ${midY}px)`;
        
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