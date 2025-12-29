document.addEventListener('DOMContentLoaded', () => {
    
    console.log("Game Script Loaded! Starting initialization...");

    // --- הגדרת סאונד ---
    // הנתיב הוא יחסי לקובץ ה-HTML שמריץ את הסקריפט
    const matchSound = new Audio('../media/match.wav');
    const clappingSound = new Audio('../media/clapping.wav');

    // --- 1. משתני המשחק ורכיבי ה-DOM ---
    const gameBoard = document.getElementById('gameBoard');
    const movesDisplay = document.getElementById('movesCount');
    const timeDisplay = document.getElementById('timeCount');
    const restartBtn = document.getElementById('restartBtn');
    const winModal = document.getElementById('winModal');
    const navUserNameElement = document.getElementById('navUserName');

    // בדיקת תקינות קריטית
    if (!gameBoard) {
        console.error("Critical Error: element with id 'gameBoard' not found in HTML!");
        alert("שגיאה: לא נמצא לוח משחק (gameBoard). בדקי את קובץ ה-HTML.");
        return;
    }

    // --- 2. ניהול משתמש ---
    let currentUser = null;
    try {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            currentUser = JSON.parse(storedUser);
            console.log("User loaded:", currentUser.username);
        } else {
            console.log("No user found - Running in Guest/Dev Mode");
        }
    } catch (error) {
        console.warn("LocalStorage access failed (Guest Mode active):", error);
    }

    if (navUserNameElement) {
        navUserNameElement.textContent = currentUser ? currentUser.username : "אורח (מצב פיתוח)";
    }

    // --- 3. לוגיקת המשחק ---
    const cardItems = ['🍕', '🚀', '🐱', '🌵', '🎈', '🎸', '🍦', '💎']; 
    let cards = []; 
    
    let flippedCards = []; 
    let matchedPairs = 0;  
    let moves = 0;         
    let gameActive = false; 
    let timerInterval;     
    let seconds = 0;

    // --- אתחול והרצת המשחק ---
    initGame();

    if (restartBtn) {
        restartBtn.addEventListener('click', initGame);
    }

    function initGame() {
        console.log("Initializing new game...");
        
        // עצירת סאונד אם התחילו משחק חדש באמצע מחיאות הכפיים
        clappingSound.pause(); 
        clappingSound.currentTime = 0;

        moves = 0;
        matchedPairs = 0;
        seconds = 0;
        flippedCards = [];
        gameActive = true;
        
        cards = [...cardItems, ...cardItems]; 
        
        if (winModal) winModal.classList.add('hidden');
        
        updateStats();
        stopTimer();
        startTimer();

        gameBoard.innerHTML = '';

        shuffleArray(cards);

        cards.forEach((item) => {
            const card = document.createElement('div');
            card.classList.add('card');
            card.dataset.value = item;

            const cardBack = document.createElement('div');
            cardBack.classList.add('card-face', 'card-back');
            cardBack.textContent = item;

            const cardFront = document.createElement('div');
            cardFront.classList.add('card-face', 'card-front');
            cardFront.textContent = '?';

            card.appendChild(cardBack);
            card.appendChild(cardFront);
            
            card.addEventListener('click', handleCardClick);
            gameBoard.appendChild(card);
        });
        
        console.log("Cards generated:", cards.length);
    }

    function handleCardClick(e) {
        const clickedCard = e.currentTarget;

        if (!gameActive || 
            clickedCard.classList.contains('flipped') || 
            clickedCard.classList.contains('matched') ||
            flippedCards.length >= 2) {
            return;
        }

        clickedCard.classList.add('flipped');
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

        gameActive = false; 

        if (value1 === value2) {
            // התאמה!
            console.log("Match found: " + value1);
            
            // --- הפעלת סאונד התאמה (חדש! ✨) ---
            matchSound.currentTime = 0; // מאפס את הסאונד למקרה שהוא כבר מתנגן
            matchSound.play().catch(e => console.log("Sound error:", e));

            card1.classList.add('matched');
            card2.classList.add('matched');
            matchedPairs++;
            
            flippedCards = [];
            gameActive = true;

            if (matchedPairs === cardItems.length) {
                endGame();
            }

        } else {
            // אין התאמה
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
        
        // סאונד סיום
        clappingSound.currentTime = 0;
        clappingSound.play().catch(e => console.log("Sound error:", e));
        setTimeout(() => {
            clappingSound.pause();
            clappingSound.currentTime = 0;
        }, 5000);

        // חישוב ניקוד מאוזן (400 פחות קנסות)
        let calculatedScore = Math.max(30, 400 - (moves * 10) - seconds);
        let coinsEarned = Math.floor(calculatedScore / 10);

        // עדכון טקסטים קיימים (צעדים וזמן)
        const finalMovesEl = document.getElementById('finalMoves');
        const finalTimeEl = document.getElementById('finalTime');
        if (finalMovesEl) finalMovesEl.textContent = moves;
        if (finalTimeEl) finalTimeEl.textContent = formatTime(seconds);
        
        // --- עדכון אלמנטים חדשים (ניקוד ומטבעות) ---
        const finalScoreEl = document.getElementById('finalScore');
        const finalCoinsEl = document.getElementById('finalCoins');
        
        if (finalScoreEl) finalScoreEl.textContent = calculatedScore;
        if (finalCoinsEl) finalCoinsEl.textContent = coinsEarned;
        
        // הצגת המודל
        if (winModal) winModal.classList.remove('hidden');

        // שמירה
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

            // 1. עדכון משחקים
            user.gamesPlayed = (user.gamesPlayed || 0) + 1;

            // 2. עדכון מטבעות
            user.coins = (user.coins || 0) + data.coinsEarned;

            // 3. עדכון ניקוד מצטבר (הוספה לקופה)
            user.highScore = (user.highScore || 0) + data.currentScore;

            // שמירת השיא המקומי למשחק (אופציונלי)
            if (data.currentScore > (user.scores[data.gameId] || 0)) {
                user.scores[data.gameId] = data.currentScore;
            }

            // שמירה
            users[userIndex] = user;
            localStorage.setItem('users', JSON.stringify(users));

            currentUser.gamesPlayed = user.gamesPlayed;
            currentUser.coins = user.coins;
            currentUser.scores = user.scores;
            currentUser.highScore = user.highScore;
            
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function startTimer() {
        timerInterval = setInterval(() => {
            seconds++;
            updateStats();
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
    }

    function updateStats() {
        if (movesDisplay) movesDisplay.textContent = moves;
        if (timeDisplay) timeDisplay.textContent = formatTime(seconds);
    }

    function formatTime(totalSeconds) {
        const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }
});