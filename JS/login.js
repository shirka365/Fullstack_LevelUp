//login.js - user login and registration

//global variables
const loginSection = document.getElementById('loginSection');
const registerSection = document.getElementById('registerSection');
const loginMsg = document.getElementById('loginMsg');
const registerMsg = document.getElementById('registerMsg');
const goRegisterBtn = document.getElementById('goRegister');
const goLoginBtn = document.getElementById('goLogin');

//event listeners for toggling forms
if (goRegisterBtn) goRegisterBtn.addEventListener('click', toggleForms);
if (goLoginBtn) goLoginBtn.addEventListener('click', toggleForms);


//helpers

//switch between login and register forms
function toggleForms() {
    loginSection.classList.toggle('hidden');
    registerSection.classList.toggle('hidden');
    hideMessages();
}

//display messages
function showMessage(element, text, isError) {
    element.style.display = 'block';
    element.textContent = text;
    element.className = 'message-box ' + (isError ? 'error' : 'success');
}

//hide messages
function hideMessages() {
    loginMsg.style.display = 'none';
    registerMsg.style.display = 'none';
}

//get users from localStorage
function getUsers() {
    const usersJSON = localStorage.getItem('users');
    return usersJSON ? JSON.parse(usersJSON) : [];
}

//save users to localStorage
function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

//events: registration
document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();//cancel default form submission
    hideMessages();//hide previous messages

    //get form values from inputs
    const username = document.getElementById('regUser').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const pass = document.getElementById('regPass').value;
    const passConfirm = document.getElementById('regPassConfirm').value;


    //validation
    if (pass !== passConfirm) {
        showMessage(registerMsg, 'הסיסמאות לא תואמות!', true);
        return;
    }
    if (pass.length < 4) {
        showMessage(registerMsg, 'הסיסמה חייבת להיות לפחות 4 תווים', true);
        return;
    }

    const users = getUsers();

    if (users.find(u => u.username === username)) {
        showMessage(registerMsg, 'שם המשתמש תפוס, נסה שם אחר', true);
        return;
    }

    //create new user object
    const newUser = {
        username: username,
        email: email,
        password: pass,
        firstName: username,
        loginAttempts: 0,
        blockedUntil: null,
        highScore: 0, 
        coins: 0,
        gamesPlayed: 0,
        scores: { game1: 0, game2: 0 }
    };

    //save new user to localStorage
    users.push(newUser);
    saveUsers(users);

    showMessage(registerMsg, 'נרשמת בהצלחה! עובר לכניסה...', false);
    
    //after a delay, switch to login form and pre-fill username
    setTimeout(() => {
        toggleForms();
        document.getElementById('loginUser').value = username;
    }, 1500);
});

//events: login
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();//cancel default form submission
    hideMessages();//hide previous messages

    //get form values from inputs
    const username = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value;
    
    const users = getUsers();
    const userIndex = users.findIndex(u => u.username === username);

    //validation
    if (userIndex === -1) {
        showMessage(loginMsg, 'שם משתמש או סיסמה שגויים', true);
        return;
    }

    const user = users[userIndex];

    //check if user is blocked
    if (user.blockedUntil && new Date(user.blockedUntil) > new Date()) {
        const remaining = Math.ceil((new Date(user.blockedUntil) - new Date()) / 1000 / 60);
        showMessage(loginMsg, `המשתמש חסום! נסה שוב בעוד ${remaining} דקות`, true);
        return;
    }

    //check password and handle login attempts
    if (user.password !== pass) {
        user.loginAttempts = (user.loginAttempts || 0) + 1;
        if (user.loginAttempts >= 3) {
            const blockTime = new Date();
            blockTime.setMinutes(blockTime.getMinutes() + 5);
            user.blockedUntil = blockTime;
            user.loginAttempts = 0;
            showMessage(loginMsg, 'יותר מדי ניסיונות שגויים. נחסמת ל-5 דקות!', true);
        } else {
            showMessage(loginMsg, `סיסמה שגויה (ניסיון ${user.loginAttempts} מתוך 3)`, true);
        }
        users[userIndex] = user;
        saveUsers(users);
        return;
    }

    //successful login - reset attempts and create session
    user.loginAttempts = 0;
    user.blockedUntil = null;
    users[userIndex] = user;
    saveUsers(users);

    //a session is an object stored in localStorage for tracking logged-in user
    const session = {
        username: user.username,
        firstName: user.firstName,
        loginTime: new Date(),
        expires: new Date().getTime() + (20 * 60 * 1000),
        highScore: user.highScore || 0,
        coins: user.coins || 0,
        gamesPlayed: user.gamesPlayed || 0
    };
    localStorage.setItem('currentUser', JSON.stringify(session));

    showMessage(loginMsg, 'התחברת בהצלחה! עוברים למשחקים...', false);

    //redirect to main page after a short delay
    setTimeout(() => {
        window.location.href = 'main.html'; 
    }, 1000);
});

//auto-redirect if already logged in
window.onload = function() {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        const session = JSON.parse(currentUser);
        if (new Date().getTime() < session.expires) {
            window.location.href = 'main.html';
        } else {
            localStorage.removeItem('currentUser');
        }
    }
};