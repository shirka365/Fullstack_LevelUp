document.addEventListener('DOMContentLoaded', () => {
    
    // אלמנטים
    const gameBoard = document.getElementById('gameBoard');
    const movesDisplay = document.getElementById('movesCount');
    const timeDisplay = document.getElementById('timeCount');
    const restartBtn = document.getElementById('restartBtn');
    const winModal = document.getElementById('winModal');

    // משתני משחק
    const cardItems = ['🍕', '🚀', '🐱', '🌵', '🎈', '🎸', '🍦', '💎']; 
    let cards = []; 
    let flippedCards = []; 
    let matchedPairs = 0;  
    let moves = 0;         
    let gameActive = false; 
    let timerInterval;     
    let seconds = 0;

    initGame();

    // חיבור כפתור אתחול
    if (restartBtn) {
        restartBtn.addEventListener('click', initGame);
    }

    function initGame() {
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

        // ניקוי ובניית הלוח
        if (gameBoard) {
            gameBoard.innerHTML = '';
            shuffleArray(cards);
            
            cards.forEach((item) => {
                const card = document.createElement('div');
                card.classList.add('card');
                card.dataset.value = item;

                // צד קדמי (סימן שאלה) - ב HTML זה ה-card-front
                const cardFront = document.createElement('div');
                cardFront.classList.add('card-face', 'card-front');
                cardFront.textContent = '?';

                // צד אחורי (אימוג'י) - ב HTML זה ה-card-back
                const cardBack = document.createElement('div');
                cardBack.classList.add('card-face', 'card-back');
                cardBack.textContent = item;

                // סדר ההוספה חשוב ל-CSS 3D
                card.appendChild(cardFront); 
                card.appendChild(cardBack);
                
                card.addEventListener('click', handleCardClick);
                gameBoard.appendChild(card);
            });
        }
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
            checkForMatch();
        }
    }

    function checkForMatch() {
        const [card1, card2] = flippedCards;

        gameActive = false;

        if (card1.dataset.value === card2.dataset.value) {
            setTimeout(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');

                card1.classList.add('matched');
                card2.classList.add('matched');

                matchedPairs++;
                flippedCards = [];
                gameActive = true;

                if (matchedPairs === cardItems.length) {
                    endGame();
                }
            }, 300);
        } else {
            setTimeout(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
                flippedCards = [];
                gameActive = true;
            }, 800);
        }
    }


    // ... (כל הקוד הקיים עד לפונקציה endGame) ...

    function endGame() {
        stopTimer();
        if (winModal) {
            const finalMovesEl = document.getElementById('finalMoves');
            const finalTimeEl = document.getElementById('finalTime');
            if (finalMovesEl) finalMovesEl.textContent = moves;
            if (finalTimeEl) finalTimeEl.textContent = formatTime(seconds);
            winModal.classList.remove('hidden');
        } else {
            alert(`כל הכבוד! סיימת ב-${moves} צעדים ובזמן ${formatTime(seconds)}`);
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