// JS/main.js

// don't run this code unless the whole DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    
    // check if user is logged in and session is valid
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || (currentUser.expires && new Date().getTime() > currentUser.expires)) {
        window.location.href = 'login.html'; 
        return;
    }

    // update dashboard and leaderboard
    updateDashboard(currentUser);
    updateLeaderboard();

    // logout button handler
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        // call logout function on click
        logoutBtn.addEventListener('click', logout);
    }

    // ---  functions ---
    // update user info on dashboard
    function updateDashboard(user) {
        const displayUserNameElement = document.getElementById('displayUserName');
        if (displayUserNameElement) displayUserNameElement.textContent = user.firstName || user.username;
        
        const navUserNameElement = document.getElementById('navUserName');
        if (navUserNameElement) navUserNameElement.textContent = `שלום, ${user.firstName || user.username}`;
        
        const highScoreElement = document.getElementById('highScoreDisplay');
        if (highScoreElement) highScoreElement.textContent = user.highScore || 0;
        
        const coinsElement = document.getElementById('coinsDisplay');
        if (coinsElement) coinsElement.textContent = user.coins || 0;
        
        const gamesPlayedElement = document.getElementById('gamesPlayedDisplay');
        if (gamesPlayedElement) gamesPlayedElement.textContent = user.gamesPlayed || 0;
    }
    
    // update leaderboard table
    function updateLeaderboard() {
        const leaderboardBody = document.getElementById('leaderboardBody');
        if (!leaderboardBody) return; 

        const users = JSON.parse(localStorage.getItem('users')) || [];
        
        // ---  sorting by cumulative score ---
        users.sort((a, b) => {
            const scoreA = a.highScore || 0;
            const scoreB = b.highScore || 0;
            return scoreB - scoreA; // from highest to lowest
        });


        leaderboardBody.innerHTML = '';

        // display top 5 users
        users.slice(0, 5).forEach((user, index) => {
            const totalScore = user.highScore || 0; 
            // create table row
            const tr = document.createElement('tr');
            
            // highlight current user
            if (user.username === currentUser.username) {
                tr.style.backgroundColor = '#FFF9C4'; 
                tr.style.fontWeight = 'bold';
            }

            // populate row with user data
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${user.firstName || user.username}</td>
                <td>${totalScore}</td> <td>${user.gamesPlayed || 0}</td>
            `;
            // append row to leaderboard 
            leaderboardBody.appendChild(tr);
        });

        if (users.length === 0) {
            leaderboardBody.innerHTML = '<tr><td colspan="4">אין עדיין שחקנים רשומים</td></tr>';
        }
    }
});

function logout() {
    localStorage.removeItem('currentUser');
    // Redirect to login page
    window.location.href = 'login.html';
}