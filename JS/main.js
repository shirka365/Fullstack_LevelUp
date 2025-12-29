document.addEventListener('DOMContentLoaded', () => {
    
    // בדיקה האם המשתמש מחובר
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || (currentUser.expires && new Date().getTime() > currentUser.expires)) {
        window.location.href = 'login.html'; 
        return;
    }

    updateDashboard(currentUser);
    updateLeaderboard();

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    function updateDashboard(user) {
        const displayUserNameElement = document.getElementById('displayUserName');
        if (displayUserNameElement) displayUserNameElement.textContent = user.firstName || user.username;
        
        const navUserNameElement = document.getElementById('navUserName');
        if (navUserNameElement) navUserNameElement.textContent = `שלום, ${user.firstName || user.username}`;
        
        // --- שינוי: הצגת הניקוד המצטבר ---
        const highScoreElement = document.getElementById('highScoreDisplay');
        // פשוט מציגים את ה-highScore מהמשתמש, שהוא כעת סכום כל הנקודות
        if (highScoreElement) highScoreElement.textContent = user.highScore || 0;
        
        const coinsElement = document.getElementById('coinsDisplay');
        if (coinsElement) coinsElement.textContent = user.coins || 0;
        
        const gamesPlayedElement = document.getElementById('gamesPlayedDisplay');
        if (gamesPlayedElement) gamesPlayedElement.textContent = user.gamesPlayed || 0;
    }
    
    function updateLeaderboard() {
        const leaderboardBody = document.getElementById('leaderboardBody');
        if (!leaderboardBody) return; 

        const users = JSON.parse(localStorage.getItem('users')) || [];
        
        // --- שינוי: מיון לפי הניקוד המצטבר ---
        users.sort((a, b) => {
            const scoreA = a.highScore || 0;
            const scoreB = b.highScore || 0;
            return scoreB - scoreA; // מהגדול לקטן
        });

        leaderboardBody.innerHTML = '';

        users.slice(0, 5).forEach((user, index) => {
            const totalScore = user.highScore || 0; // שימוש בניקוד המצטבר
            const tr = document.createElement('tr');
            
            if (user.username === currentUser.username) {
                tr.style.backgroundColor = '#FFF9C4'; 
                tr.style.fontWeight = 'bold';
            }

            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${user.firstName || user.username}</td>
                <td>${totalScore}</td> <td>${user.gamesPlayed || 0}</td>
            `;
            leaderboardBody.appendChild(tr);
        });

        if (users.length === 0) {
            leaderboardBody.innerHTML = '<tr><td colspan="4">אין עדיין שחקנים רשומים</td></tr>';
        }
    }
});

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}