document.addEventListener('DOMContentLoaded', () => {
    
    // בדיקה האם המשתמש מחובר
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || (currentUser.expires && new Date().getTime() > currentUser.expires)) {
        window.location.href = 'login.html'; 
        return;
    }

    updateDashboard(currentUser);
    updateLeaderboard();

    // הוספת מאזין לכפתור היציאה (במקום onclick ב-HTML)
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    function updateDashboard(user) {
        const displayUserNameElement = document.getElementById('displayUserName');
        if (displayUserNameElement) displayUserNameElement.textContent = user.firstName || user.username;
        
        const navUserNameElement = document.getElementById('navUserName');
        if (navUserNameElement) navUserNameElement.textContent = `שלום, ${user.firstName || user.username}`;
        
        const highScoreElement = document.getElementById('highScoreDisplay');
        const bestScore = Math.max(user.scores?.game1 || 0, user.scores?.game2 || 0);
        if (highScoreElement) highScoreElement.textContent = bestScore;
        
        const coinsElement = document.getElementById('coinsDisplay');
        if (coinsElement) coinsElement.textContent = user.coins || 0;
        
        const gamesPlayedElement = document.getElementById('gamesPlayedDisplay');
        if (gamesPlayedElement) gamesPlayedElement.textContent = user.gamesPlayed || 0;
    }
    
    function updateLeaderboard() {
        const leaderboardBody = document.getElementById('leaderboardBody');
        if (!leaderboardBody) return; 

        const users = JSON.parse(localStorage.getItem('users')) || [];
        
        users.sort((a, b) => {
            const scoreA = Math.max(a.scores?.game1 || 0, a.scores?.game2 || 0);
            const scoreB = Math.max(b.scores?.game1 || 0, b.scores?.game2 || 0);
            return scoreB - scoreA;
        });

        leaderboardBody.innerHTML = '';

        users.slice(0, 5).forEach((user, index) => {
            const bestScore = Math.max(user.scores?.game1 || 0, user.scores?.game2 || 0);
            const tr = document.createElement('tr');
            
            if (user.username === currentUser.username) {
                tr.style.backgroundColor = '#FFF9C4'; 
                tr.style.fontWeight = 'bold';
            }

            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${user.firstName || user.username}</td>
                <td>${bestScore}</td>
                <td>${user.gamesPlayed || 0}</td>
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