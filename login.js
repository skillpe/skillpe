// login.js - Firebase Authentication for SkillPe Affiliate Program

// Import Firebase authentication functions
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDTokmcW4mkKaSz6qeaMonlmjHM2wKTb6c",
    authDomain: "skillppe.firebaseapp.com",
    projectId: "skillppe",
    storageBucket: "skillppe.firebasestorage.app",
    messagingSenderId: "714570952768",
    appId: "1:714570952768:web:bbe41cc6091a3a838defa5",
    measurementId: "G-D8YHKMY104"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// DOM Elements
const loginForm = document.getElementById('login-form');
const errorAlert = document.getElementById('error-alert');
const loginBtn = document.getElementById('login-btn');
const btnText = document.getElementById('btn-text');
const togglePassword = document.getElementById('toggle-password');
const passwordInput = document.getElementById('password');
const emailInput = document.getElementById('email');

// Error messages
const ERROR_MESSAGES = {
    'auth/invalid-email': 'Please enter a valid email address',
    'auth/user-disabled': 'This account has been disabled',
    'auth/user-not-found': 'No account found with this email',
    'auth/wrong-password': 'Incorrect password',
    'auth/too-many-requests': 'Too many attempts. Try again later or reset your password',
    'default': 'Login failed. Please try again'
};

/**
 * Toggle password visibility
 */
function setupPasswordToggle() {
    togglePassword.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        togglePassword.classList.toggle('fa-eye-slash');
        togglePassword.classList.toggle('fa-eye');
    });
}

/**
 * Handle login form submission
 * @param {Event} e - Form submit event
 */
async function handleLogin(e) {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // Validate inputs
    if (!email || !password) {
        showError('Please fill in all fields');
        return;
    }

    // Show loading state
    setLoadingState(true);

    try {
        // Attempt login with Firebase
        await signInWithEmailAndPassword(auth, email, password);
        
        // On success, redirect to dashboard
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error('Login error:', error);
        handleAuthError(error);
    } finally {
        setLoadingState(false);
    }
}

/**
 * Display error message to user
 * @param {string} message - Error message to display
 */
function showError(message) {
    errorAlert.textContent = message;
    errorAlert.style.display = 'block';
    setTimeout(() => {
        errorAlert.style.display = 'none';
    }, 5000);
}

/**
 * Handle authentication errors
 * @param {Error} error - Firebase auth error
 */
function handleAuthError(error) {
    const errorMessage = ERROR_MESSAGES[error.code] || ERROR_MESSAGES.default;
    showError(errorMessage);
    
    // Clear password field on wrong password
    if (error.code === 'auth/wrong-password') {
        passwordInput.value = '';
        passwordInput.focus();
    }
}

/**
 * Set loading state for login button
 * @param {boolean} isLoading - Whether to show loading state
 */
function setLoadingState(isLoading) {
    loginBtn.disabled = isLoading;
    btnText.textContent = isLoading ? 'Authenticating...' : 'Login';
}

/**
 * Check if user is already logged in
 */
function checkAuthState() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            window.location.href = 'dashboard.html';
        }
    });
}

/**
 * Initialize the login functionality
 */
function initLogin() {
    setupPasswordToggle();
    loginForm.addEventListener('submit', handleLogin);
    checkAuthState();
    
    // Focus email field on page load
    emailInput.focus();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initLogin);