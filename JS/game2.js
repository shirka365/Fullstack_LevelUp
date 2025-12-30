document.addEventListener('DOMContentLoaded', () => {
    
    console.log("Game Script Loaded! Starting initialization...");

    // --- audio assets ---
    const matchSound = new Audio('../media/match.wav');
    const clappingSound = new Audio('../media/clapping.wav');

    // --- 1. game variables and DOM elements ---
    const gameBoard = document.getElementById('gameBoard');
    const movesDisplay = document.getElementById('movesCount');
    const timeDisplay = document.getElementById('timeCount');
    const restartBtn = document.getElementById('restartBtn');
    const winModal = document.getElementById('winModal');
    const navUserNameElement = document.getElementById('navUserName');


    // --- user management ---
    let currentUser = null;
    try {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            currentUser = JSON.parse(storedUser);
             // check session expiry
            if (currentUser.expires && new Date().getTime() > currentUser.expires) {
                currentUser = null;
            }
        }
    } catch (error) {
        console.warn("LocalStorage access failed:", error);
    }

    // if no valid user session, redirect to login
    if (!currentUser) {
       
        window.location.href = 'login.html';
        return; 
    }

    console.log("User loaded:", currentUser.username);

    if (navUserNameElement) {
        navUserNameElement.textContent = currentUser.username;
    }

    // ---  game logic variables ---
    const cardItems = ['🍕', '🚀', '🐱', '🌵', '🎈', '🎸', '🍦', '💎']; 
    let cards = []; 
    
    let flippedCards = []; 
    let matchedPairs = 0;  
    let moves = 0;         
    let gameActive = false; 
    let timerInterval;     
    let seconds = 0;

    // --- initialization and start ---

    initGame();

    if (restartBtn) {
        restartBtn.addEventListener('click', initGame);
    }

    // ---  functions ---

    function initGame() {
        console.log("Initializing new game...");

        // reset clapping sound
        clappingSound.pause(); 
        clappingSound.currentTime = 0;

        // reset game variables
        moves = 0;
        matchedPairs = 0;
        seconds = 0;
        flippedCards = [];
        gameActive = true;
        
        // create card set (pairs) by using spread operator
        cards = [...cardItems, ...cardItems]; 

        // shuffle cards
        shuffleArray(cards);

        // hide win modal if visible
        if (winModal) winModal.classList.add('hidden');
        
        updateStats();
        stopTimer();
        startTimer();

        // clear existing cards
        gameBoard.innerHTML = '';

        cards.forEach((item) => {
            const card = document.createElement('div');
            card.classList.add('card');
            // store item value in dataset
            card.dataset.value = item;


            // create card faces
            const cardBack = document.createElement('div');
            cardBack.classList.add('card-face', 'card-back');
            cardBack.textContent = item;

            const cardFront = document.createElement('div');
            cardFront.classList.add('card-face', 'card-front');
            cardFront.textContent = '?';

            // append faces to card
            card.appendChild(cardBack);
            card.appendChild(cardFront);
            
            // add click event listener
            card.addEventListener('click', handleCardClick);

            // append card to game board
            gameBoard.appendChild(card);
        });
        
        console.log("Cards generated:", cards.length);
    }

    function handleCardClick(e) {
        const clickedCard = e.currentTarget;
        
        // ignore clicks if game not active or card already flipped/matched
        if (!gameActive || 
            clickedCard.classList.contains('flipped') || 
            clickedCard.classList.contains('matched') ||
            flippedCards.length >= 2) {
            return;
        }

        clickedCard.classList.add('flipped');
        
        // add clicked card to flippedCards array
        flippedCards.push(clickedCard);

        if (flippedCards.length === 2) {
            moves++;
            updateStats();
            setTimeout(checkForMatch, 600);
        }
    }

    function checkForMatch() {
        const [card1, card2] = flippedCards;
        const value1 = card1.dataset.value;
        const value2 = card2.dataset.value;

        // temporarily disable game interaction
        gameActive = false; 

        if (value1 === value2) {

            console.log("Match found: " + value1);
            
            // --- match sound ---
            matchSound.currentTime = 0; // reset to start
            matchSound.play().catch(e => console.log("Sound error:", e));

            card1.classList.add('matched');
            card2.classList.add('matched');
            matchedPairs++;
            
            flippedCards = [];
            gameActive = true;
            
            // check for game completion
            if (matchedPairs === cardItems.length) {
                endGame();
            }

        } else {
            // no match - flip back after delay
            setTimeout(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
                flippedCards = [];
                gameActive = true;
            }, 1000);
        }
    }

    function endGame() {
        console.log("Game Over!");
        stopTimer();
        
        // end game sound
        clappingSound.currentTime = 0;
        clappingSound.play().catch(e => console.log("Sound error:", e));
        setTimeout(() => {
            clappingSound.pause();
            clappingSound.currentTime = 0;
        }, 3000);

        // calculate score and coins
        let calculatedScore = Math.max(30, 400 - (moves * 10) - seconds);
        let coinsEarned = Math.floor(calculatedScore / 10);

        // update modal elements 
        const finalMovesEl = document.getElementById('finalMoves');
        const finalTimeEl = document.getElementById('finalTime');
        if (finalMovesEl) finalMovesEl.textContent = moves;
        if (finalTimeEl) finalTimeEl.textContent = formatTime(seconds);
        
        // update score and coins elements
        const finalScoreEl = document.getElementById('finalScore');
        const finalCoinsEl = document.getElementById('finalCoins');
        
        if (finalScoreEl) finalScoreEl.textContent = calculatedScore;
        if (finalCoinsEl) finalCoinsEl.textContent = coinsEarned;
        
        // show the modal
        if (winModal) winModal.classList.remove('hidden');

        // save to localStorage
        if (currentUser) {
            saveGameStats({
                gameId: 'game2',
                currentScore: calculatedScore, 
                coinsEarned: coinsEarned
            });
        }
    }

    function saveGameStats(data) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const userIndex = users.findIndex(u => u.username === currentUser.username);

        if (userIndex !== -1) {
            const user = users[userIndex];

            // 1. update games played
            user.gamesPlayed = (user.gamesPlayed || 0) + 1;

            // 2. update coins
            user.coins = (user.coins || 0) + data.coinsEarned;

            // 3. update total score (add to the pool)
            user.highScore = (user.highScore || 0) + data.currentScore;

            // 4. update best score for this game if higher
            if (data.currentScore > (user.scores[data.gameId] || 0)) {
                user.scores[data.gameId] = data.currentScore;
            }

            // save to localStorage
            users[userIndex] = user;
            localStorage.setItem('users', JSON.stringify(users));

            currentUser.gamesPlayed = user.gamesPlayed;
            currentUser.coins = user.coins;
            currentUser.scores = user.scores;
            currentUser.highScore = user.highScore;
            
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
    }

    // --- utility functions ---
    // Fisher-Yates shuffle
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // timer functions
    function startTimer() {
        timerInterval = setInterval(() => {
            seconds++;
            updateStats();
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
    }

    // update moves and time display
    function updateStats() {
        if (movesDisplay) movesDisplay.textContent = moves;
        if (timeDisplay) timeDisplay.textContent = formatTime(seconds);
    }

    // format time as MM:SS
    function formatTime(totalSeconds) {
        const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }
});