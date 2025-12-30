document.addEventListener('DOMContentLoaded', () => {
    
    // initialize variables and elements
    const gameArea = document.getElementById('gameArea');
    const player = document.createElement('div');
    const startScreen = document.getElementById('startScreen');
    const gameOverScreen = document.getElementById('gameOverScreen');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const livesDisplay = document.getElementById('livesDisplay');
    const levelDisplay = document.getElementById('levelDisplay');
    const navUserName = document.getElementById('navUserName');

    // game setup variables (modifiable for difficulty)
    let gameActive = false;
    let score = 0;
    let lives = 3;
    let level = 1;
    
    // difficulty settings (you can tweak these values)
    let gameSpeed = 1.5; // starting speed - lower is slower
    let spawnRate = 1500; // milliseconds between object spawns
    
    let lastSpawnTime = 0;// for tracking spawn timing
    let animationFrameId;// for managing the game loop
    let playerPos = 50; // horizontal position (percentage)
    
    // arrays to hold game objects
    let enemies = [];
    let collectibles = [];

    // current user loading
    let currentUser = null;
    try {
        currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser) {
            navUserName.textContent = `שלום, ${currentUser.firstName || currentUser.username}`;
        }
    } catch (e) { console.error("Error loading user", e); }

    // initialize event listeners
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('restartBtn').addEventListener('click', startGame);

    function startGame() {
        // reset game variables
        score = 0;
        lives = 3;
        level = 1;
        
        gameSpeed = 1.5; 
        spawnRate = 1500;
        
        playerPos = 50;
        enemies = [];
        collectibles = [];
        gameActive = true;

        // clear previous game elements and show game area
        updateStats();
        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        gameArea.classList.add('active'); // animate background

        // add hidden elements to game area for later use
        gameArea.innerHTML = '';
        gameArea.appendChild(startScreen); 
        gameArea.appendChild(gameOverScreen);
        
        // player setup
        player.className = 'player';
        player.textContent = '🚀';
        player.style.left = playerPos + '%';
        gameArea.appendChild(player);

        // reset timing and start game loop
        lastSpawnTime = performance.now();
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    // game loop function 
    function gameLoop(timestamp) {
        if (!gameActive) return;

        // creatng new objects based on spawn rate
        if (timestamp - lastSpawnTime > spawnRate) {
            spawnObject();
            lastSpawnTime = timestamp;
        }

        // moving objects
        moveObjects(enemies, 'meteor');
        moveObjects(collectibles, 'star');

        // checking collisions
        checkCollisions();

        // request next frame
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    // moving ant creating objects
    function spawnObject() {
        const item = document.createElement('div');
        const isEnemy = Math.random() > 0.3; // 70% chance for enemy, 30% for collectible
        
        // object setup 
        item.classList.add('item');
        item.classList.add(isEnemy ? 'meteor' : 'star');
        item.textContent = isEnemy ? '🪨' : '⭐';
        
        // random horizontal position within game area
        item.style.left = Math.floor(Math.random() * 90) + '%';
        item.style.top = '-60px'; 
        
        gameArea.appendChild(item);

        // adding to respective array
        if (isEnemy) {
            enemies.push(item);
        } else {
            collectibles.push(item);
        }
    }

    function moveObjects(array, type) {
        for (let i = 0; i < array.length; i++) {
            let item = array[i];
            let currentTop = parseFloat(item.style.top || -60);
            
            // location update
            item.style.top = (currentTop + gameSpeed) + 'px';

            // delete if out of bounds
            if (currentTop > gameArea.offsetHeight) {
                item.remove();
                array.splice(i, 1);
                i--;
            }
        }
    }

    // player controls
    // keyboard controls
    document.addEventListener('keydown', (e) => {
        if (!gameActive) return;
        if (e.key === 'ArrowLeft') movePlayer(-5);
        if (e.key === 'ArrowRight') movePlayer(5);
    });

    // touch and click controls
    document.getElementById('btnLeft').addEventListener('touchstart', (e) => { 
        e.preventDefault(); movePlayer(-10); 
    });
    document.getElementById('btnLeft').addEventListener('click', () => movePlayer(-10)); 

    document.getElementById('btnRight').addEventListener('touchstart', (e) => { 
        e.preventDefault(); movePlayer(10); 
    });
    document.getElementById('btnRight').addEventListener('click', () => movePlayer(10));

    // move player function
    function movePlayer(delta) {
        playerPos += delta;
        // boundary checks 
        if (playerPos < 0) playerPos = 0;
        if (playerPos > 90) playerPos = 90;
        player.style.left = playerPos + '%';
    }

    // collision detection
    function checkCollisions() {
        const playerRect = player.getBoundingClientRect();

        // meteor checks
        enemies.forEach((enemy, index) => {
            const enemyRect = enemy.getBoundingClientRect();
            // adding padding for fairer collision
            const padding = 10; 
            const reducedEnemyRect = {
                left: enemyRect.left + padding,
                right: enemyRect.right - padding,
                top: enemyRect.top + padding,
                bottom: enemyRect.bottom - padding
            };

            if (isColliding(playerRect, reducedEnemyRect)) {
                // hit!
                enemy.remove();
                enemies.splice(index, 1);
                hitMeteor();
            }
        });

        // star checks
        collectibles.forEach((star, index) => {
            const starRect = star.getBoundingClientRect();
            if (isColliding(playerRect, starRect)) {
                // collect!
                star.remove();
                collectibles.splice(index, 1);
                collectStar();
            }
        });
    }

    function isColliding(rect1, rect2) {
        return (
            rect1.left < rect2.right &&
            rect1.right > rect2.left &&
            rect1.top < rect2.bottom &&
            rect1.bottom > rect2.top
        );
    }

    // game event handlers
    function collectStar() {
        score += 10;
        updateStats();
        
        // level up every 100 points
        if (score > 0 && score % 100 === 0) {
            levelUp();
        }
    }

    function hitMeteor() {
        lives--;
        // shake effect
        gameArea.classList.add('shake');
        setTimeout(() => gameArea.classList.remove('shake'), 500);
        
        updateStats();

        if (lives <= 0) {
            endGame();
        }
    }

    // level up function
    function levelUp() {
        level++;
        gameSpeed += 0.2; // increase speed
        spawnRate = Math.max(500, spawnRate - 50); // decrease spawn rate

        // level up message
        const msg = document.createElement('div');
        msg.textContent = 'LEVEL UP!';
        msg.style.position = 'absolute';
        msg.style.top = '50%';
        msg.style.width = '100%';
        msg.style.textAlign = 'center';
        msg.style.color = '#FFD700';
        msg.style.fontSize = '3rem';
        msg.style.fontWeight = 'bold';
        msg.style.textShadow = '0 0 10px black';
        msg.style.animation = 'fadeOut 2s forwards';
        gameArea.appendChild(msg);
        setTimeout(() => msg.remove(), 2000);
    }

    // update score, lives, level display
    function updateStats() {
        scoreDisplay.textContent = score;
        livesDisplay.textContent = '❤️'.repeat(lives);
        levelDisplay.textContent = level;
    }


    // end game function
    function endGame() {
        gameActive = false;
        cancelAnimationFrame(animationFrameId);
        gameArea.classList.remove('active');
        
        // calculate coins earned
        const coinsEarned = Math.floor(score / 10);

        // update game over screen
        document.getElementById('finalScore').textContent = score;
        
        // update coins earned display
        const finalCoinsEl = document.getElementById('finalCoins');
        if (finalCoinsEl) finalCoinsEl.textContent = coinsEarned;

        // show game over screen
        gameOverScreen.classList.remove('hidden');

        // save stats to user profile
        if (currentUser) {
            saveGameStats({
                gameId: 'game1',
                currentScore: score,
                coinsEarned: coinsEarned
            });
        }
    }
    
    // save game stats to localStorage
    function saveGameStats(data) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const userIndex = users.findIndex(u => u.username === currentUser.username);

        if (userIndex !== -1) {
            const user = users[userIndex];

            // update games played
            user.gamesPlayed = (user.gamesPlayed || 0) + 1;
            
            // update coins 
            user.coins = (user.coins || 0) + data.coinsEarned;

            // update high score
            user.highScore = (user.highScore || 0) + data.currentScore;

            // update current user scores 
            if (data.currentScore > (user.scores[data.gameId] || 0)) {
                user.scores[data.gameId] = data.currentScore;
            }

            // save back to localStorage
            users[userIndex] = user;
            localStorage.setItem('users', JSON.stringify(users));

            // update the current session
            currentUser.gamesPlayed = user.gamesPlayed;
            currentUser.coins = user.coins;
            currentUser.scores = user.scores;
            currentUser.highScore = user.highScore; // update cumulative score in session
            
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            console.log("Cumulative stats saved successfully");
        }
    }
});