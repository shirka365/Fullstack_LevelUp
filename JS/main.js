document.addEventListener('DOMContentLoaded', () => {
            
    // 1. בדיקה האם המשתמש מחובר (סימולציה)
    // בפרויקט האמיתי: תבדקו אם קיים מפתח 'currentUser' ב-LocalStorage
    // הקוד מנסה למשוך את המשתמש השמור. אם אין כזה, הוא מקבל null.
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (!currentUser) {
        // אם אין משתמש מחובר
        console.log("No user logged in - showing demo data");
        // אופציה להפניה לדף התחברות:
        // window.location.href = '../HTML/login.html'; 
    } else {
        // אם יש משתמש, נעדכן את המסך עם הפרטים שלו
        updateDashboard(currentUser);
    }

    function updateDashboard(user) {
        // עדכון ה-DOM עם פרטי המשתמש
        
        // עדכון שם המשתמש בכותרת
        const displayUserNameElement = document.getElementById('displayUserName');
        if (displayUserNameElement) displayUserNameElement.textContent = user.username;
        
        // עדכון שם המשתמש בבר הניווט
        const navUserNameElement = document.getElementById('navUserName');
        if (navUserNameElement) navUserNameElement.textContent = `שלום, ${user.username}`;
        
        // עדכון סטטיסטיקות (אם קיימות באובייקט המשתמש)
        // משתמשים ב-|| 0 כדי להציג 0 אם הנתון לא קיים
        const highScoreElement = document.getElementById('highScoreDisplay');
        if (highScoreElement) highScoreElement.textContent = user.highScore || 0;
        
        const coinsElement = document.getElementById('coinsDisplay');
        if (coinsElement) coinsElement.textContent = user.coins || 0;
        
        const gamesPlayedElement = document.getElementById('gamesPlayedDisplay');
        if (gamesPlayedElement) gamesPlayedElement.textContent = user.gamesPlayed || 0;
    }
});

function logout() {
    // מחיקת המשתמש הנוכחי מהזיכרון
    localStorage.removeItem('currentUser');
    alert('התנתקת בהצלחה!');
    // הפניה לדף התחברות או רענון הדף
    location.reload(); 
    // window.location.href = '../HTML/login.html'; // אם יש דף התחברות
}