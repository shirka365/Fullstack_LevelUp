document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. משתנים והגדרות ---
    const gameArea = document.getElementById('gameArea');
    const player = document.createElement('div');
    const startScreen = document.getElementById('startScreen');
    const gameOverScreen = document.getElementById('gameOverScreen');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const livesDisplay = document.getElementById('livesDisplay');
    const levelDisplay = document.getElementById('levelDisplay');
    const navUserName = document.getElementById('navUserName');

    // הגדרות משחק - מהירות מותאמת
    let gameActive = false;
    let score = 0;
    let lives = 3;
    let level = 1;
    let gameSpeed = 3; // החזרנו למהירות רגילה (במקום 5)
    let spawnRate = 1000; // קצב יצירה רגיל (במקום 800)
    let lastSpawnTime = 0;
    let animationFrameId;
    let playerPos = 50; // מיקום באחוזים (50% = אמצע)
    
    // מערכים לשמירת האלמנטים שזזים
    let enemies = [];
    let collectibles = [];

    // --- 2. טעינת משתמש ---
    let currentUser = null;
    try {
        currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser) {
            navUserName.textContent = `שלום, ${currentUser.firstName || currentUser.username}`;
        }
    } catch (e) { console.error("Error loading user", e); }

    // --- 3. אתחול המשחק ---
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('restartBtn').addEventListener('click', startGame);

    function startGame() {
        // איפוס משתנים
        score = 0;
        lives = 3;
        level = 1;
        gameSpeed = 3; // איפוס למהירות התחלתית רגועה
        spawnRate = 1000;
        playerPos = 50;
        enemies = [];
        collectibles = [];
        gameActive = true;

        // עדכון תצוגה
        updateStats();
        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        gameArea.classList.add('active'); // מפעיל אנימציית רקע

        // ניקוי הלוח והוספת שחקן
        gameArea.innerHTML = '';
        gameArea.appendChild(startScreen); // מחזירים את המסכים שיהיו מוסתרים
        gameArea.appendChild(gameOverScreen);
        
        player.className = 'player';
        player.textContent = '🚀';
        player.style.left = playerPos + '%';
        gameArea.appendChild(player);

        // התחלת הלולאה
        lastSpawnTime = performance.now();
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    // --- 4. לולאת המשחק (Game Loop) ---
    function gameLoop(timestamp) {
        if (!gameActive) return;

        // יצירת אובייקטים חדשים
        if (timestamp - lastSpawnTime > spawnRate) {
            spawnObject();
            lastSpawnTime = timestamp;
        }

        // הזזת אובייקטים
        moveObjects(enemies, 'meteor');
        moveObjects(collectibles, 'star');

        // בדיקת התנגשויות
        checkCollisions();

        // בקשת הפריים הבא
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    // --- 5. לוגיקת תנועה ויצירה ---
    function spawnObject() {
        const item = document.createElement('div');
        const isEnemy = Math.random() > 0.3; // 70% סיכוי למטאור
        
        item.classList.add('item');
        item.classList.add(isEnemy ? 'meteor' : 'star');
        item.textContent = isEnemy ? '🪨' : '⭐';
        
        // מיקום רנדומלי (0% עד 90% כדי שלא יצא מהמסגרת)
        item.style.left = Math.floor(Math.random() * 90) + '%';
        item.style.top = '-60px'; 
        
        gameArea.appendChild(item);

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
            
            // עדכון מיקום
            item.style.top = (currentTop + gameSpeed) + 'px';

            // מחיקה אם יצא מהמסך
            if (currentTop > gameArea.offsetHeight) {
                item.remove();
                array.splice(i, 1);
                i--;
            }
        }
    }

    // --- 6. שליטה בשחקן ---
    // מקלדת
    document.addEventListener('keydown', (e) => {
        if (!gameActive) return;
        if (e.key === 'ArrowLeft') movePlayer(-5);
        if (e.key === 'ArrowRight') movePlayer(5);
    });

    // כפתורי מובייל
    document.getElementById('btnLeft').addEventListener('touchstart', (e) => { 
        e.preventDefault(); movePlayer(-10); 
    });
    document.getElementById('btnLeft').addEventListener('click', () => movePlayer(-10)); 

    document.getElementById('btnRight').addEventListener('touchstart', (e) => { 
        e.preventDefault(); movePlayer(10); 
    });
    document.getElementById('btnRight').addEventListener('click', () => movePlayer(10));

    function movePlayer(delta) {
        playerPos += delta;
        // גבולות גזרה (0 עד 90 אחוז)
        if (playerPos < 0) playerPos = 0;
        if (playerPos > 90) playerPos = 90;
        player.style.left = playerPos + '%';
    }

    // --- 7. בדיקת התנגשויות ---
    function checkCollisions() {
        const playerRect = player.getBoundingClientRect();

        // בדיקת מטאורים
        enemies.forEach((enemy, index) => {
            const enemyRect = enemy.getBoundingClientRect();
            // הקטנת שטח הפגיעה מעט (Hitbox) כדי שיהיה הוגן יותר
            const padding = 10; 
            const reducedEnemyRect = {
                left: enemyRect.left + padding,
                right: enemyRect.right - padding,
                top: enemyRect.top + padding,
                bottom: enemyRect.bottom - padding
            };

            if (isColliding(playerRect, reducedEnemyRect)) {
                // פגיעה!
                enemy.remove();
                enemies.splice(index, 1);
                hitMeteor();
            }
        });

        // בדיקת כוכבים
        collectibles.forEach((star, index) => {
            const starRect = star.getBoundingClientRect();
            if (isColliding(playerRect, starRect)) {
                // איסוף!
                star.remove();
                collectibles.splice(index, 1);
                collectStar();
            }
        });
    }

    function isColliding(rect1, rect2) {
        return !(rect1.right < rect2.left || 
                 rect1.left > rect2.right || 
                 rect1.bottom < rect2.top || 
                 rect1.top > rect2.bottom);
    }

    // --- 8. ניהול מצב משחק ---
    function collectStar() {
        score += 10;
        updateStats();
        
        // עליית רמה כל 100 נקודות
        if (score > 0 && score % 100 === 0) {
            levelUp();
        }
    }

    function hitMeteor() {
        lives--;
        // אפקט רעידה
        gameArea.classList.add('shake');
        setTimeout(() => gameArea.classList.remove('shake'), 500);
        
        updateStats();

        if (lives <= 0) {
            endGame();
        }
    }

    function levelUp() {
        level++;
        gameSpeed += 0.5; // האצה מתונה
        spawnRate = Math.max(300, spawnRate - 50); 
        
        // הודעה קטנה
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

    function updateStats() {
        scoreDisplay.textContent = score;
        livesDisplay.textContent = '❤️'.repeat(lives);
        levelDisplay.textContent = level;
    }

    function endGame() {
        gameActive = false;
        cancelAnimationFrame(animationFrameId);
        gameArea.classList.remove('active');
        
        // חישוב מטבעות (1 לכל 10 נקודות)
        const coinsEarned = Math.floor(score / 10);

        // עדכון התצוגה במסך הסיום
        document.getElementById('finalScore').textContent = score;
        
        // --- עדכון אלמנט המטבעות החדש ---
        const finalCoinsEl = document.getElementById('finalCoins');
        if (finalCoinsEl) finalCoinsEl.textContent = coinsEarned;

        gameOverScreen.classList.remove('hidden');

        // שמירת נתונים (שיא מצטבר וכו')
        if (currentUser) {
            saveGameStats({
                gameId: 'game1',
                currentScore: score,
                coinsEarned: coinsEarned
            });
        }
    }
    
    // --- פונקציית עזר לשמירה וסנכרון נתונים (תוסיפי את זה בסוף הקובץ) ---
    function saveGameStats(data) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const userIndex = users.findIndex(u => u.username === currentUser.username);

        if (userIndex !== -1) {
            const user = users[userIndex];

            // 1. עדכון מספר המשחקים
            user.gamesPlayed = (user.gamesPlayed || 0) + 1;
            
            // 2. עדכון מטבעות (מצטבר)
            user.coins = (user.coins || 0) + data.coinsEarned;

            // 3. עדכון ניקוד מצטבר (השינוי הגדול!)
            // במקום לבדוק מי יותר גדול, אנחנו פשוט מוסיפים את הניקוד החדש לסך הכולל
            user.highScore = (user.highScore || 0) + data.currentScore;

            // עדכון נתונים מקומיים למקרה שנרצה לדעת מה השיא הספציפי למשחק הזה (לא חובה לתצוגה הראשית אבל טוב שיהיה)
            if (data.currentScore > (user.scores[data.gameId] || 0)) {
                user.scores[data.gameId] = data.currentScore;
            }

            // שמירה
            users[userIndex] = user;
            localStorage.setItem('users', JSON.stringify(users));

            // עדכון הסשן הנוכחי
            currentUser.gamesPlayed = user.gamesPlayed;
            currentUser.coins = user.coins;
            currentUser.scores = user.scores;
            currentUser.highScore = user.highScore; // עדכון הניקוד המצטבר בסשן
            
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            console.log("Cumulative stats saved successfully");
        }
    }
});