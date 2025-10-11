// public/js/auth.js (New File)

const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const showLoginBtn = document.getElementById('show-login');
const showSignupBtn = document.getElementById('show-signup');
const authStatus = document.getElementById('auth-status');

// --- Helper Functions ---

function toggleForms(show) {
    if (show === 'login') {
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        showLoginBtn.classList.add('bg-orange-600');
        showLoginBtn.classList.remove('bg-gray-600');
        showSignupBtn.classList.add('bg-gray-600');
        showSignupBtn.classList.remove('bg-orange-600');
    } else {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        showSignupBtn.classList.add('bg-orange-600');
        showSignupBtn.classList.remove('bg-gray-600');
        showLoginBtn.classList.add('bg-gray-600');
        showLoginBtn.classList.remove('bg-orange-600');
    }
}

function displayMessage(message, type = 'error') {
    authStatus.textContent = message;
    authStatus.classList.remove('hidden', 'text-red-400', 'text-green-400');
    authStatus.classList.add(type === 'error' ? 'text-red-400' : 'text-green-400');
    setTimeout(() => { authStatus.classList.add('hidden'); }, 3000);
}

/*************  ✨ Windsurf Command ⭐  *************/
/**
 * Authenticates a user given their email and password.
 * If the user is found in the mock database (localStorage), sets the 'logged_in' status and redirects to the main app page.
 * @param {string} email - The user's email address.
 * @param {string} password - The user's password.
 * @returns {boolean} - true if the user is authenticated, false otherwise.
 */
/*******  5571135a-958e-4fea-836b-ee8bd19848d3  *******/function authenticateUser(email, password) {
    // 1. Get existing users (mock database)
    const users = JSON.parse(localStorage.getItem('food3d_users')) || [];
    
    // 2. Find user
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        // Mock Session: Set the 'logged_in' status and redirect
        localStorage.setItem('food3d_logged_in', 'true');
        window.location.href = '/index.html'; // Redirect to the main app page
        return true;
    }
    return false;
}

// --- Event Listeners ---

showLoginBtn.addEventListener('click', () => toggleForms('login'));
showSignupBtn.addEventListener('click', () => toggleForms('signup'));

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (authenticateUser(email, password)) {
        // Success handled inside authenticateUser (redirects)
    } else {
        displayMessage('Login failed. Check credentials or Sign Up.', 'error');
    }
});

signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    let users = JSON.parse(localStorage.getItem('food3d_users')) || [];

    if (users.find(u => u.email === email)) {
        displayMessage('User already exists! Please Login.', 'error');
        return;
    }

    // Save new user (mock registration)
    users.push({ email, password });
    localStorage.setItem('food3d_users', JSON.stringify(users));
    
    displayMessage('Sign Up successful! Redirecting to Login...', 'success');
    setTimeout(() => {
        toggleForms('login');
        // Pre-fill login form with new user's email
        document.getElementById('login-email').value = email;
    }, 1500);
});