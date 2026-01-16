// Authentication JavaScript
console.log('🚀 auth.js file is being executed');

document.addEventListener('DOMContentLoaded', function() {
    console.log('Auth.js loaded successfully');
    
    const loginForm = document.getElementById('loginForm');
    const messageDiv = document.getElementById('message');
    
    if (loginForm) {
        console.log('Login form found');
        loginForm.addEventListener('submit', handleLogin);
    } else {
        console.error('Login form not found');
    }
});

async function handleLogin(e) {
    console.log('Login form submitted');
    e.preventDefault(); // Prevent normal form submission
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('message');
    const submitBtn = document.querySelector('.auth-btn');
    
    console.log('Attempting login with:', email);
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';
    messageDiv.innerHTML = '';
    
    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.success) {
            messageDiv.innerHTML = '<p class="success">Login successful! Redirecting...</p>';
            setTimeout(() => {
                window.location.href = data.redirectUrl || '/dashboard';
            }, 1000);
        } else {
            messageDiv.innerHTML = `<p class="error">${data.error}</p>`;
        }
    } catch (error) {
        console.error('Login error:', error);
        messageDiv.innerHTML = '<p class="error">Login failed. Please try again.</p>';
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
    }
}

async function logout() {
    try {
        const response = await fetch('/api/auth/logout', { 
            method: 'POST' 
        });
        
        const data = await response.json();
        
        if (data.success) {
            window.location.href = data.redirectUrl || '/login';
        }
    } catch (error) {
        console.error('Logout error:', error);
        // Fallback redirect
        window.location.href = '/login';
    }
}

async function loadUserInfo() {
    try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        
        if (data.success && data.user) {
            const userNameElements = document.querySelectorAll('#userName');
            userNameElements.forEach(element => {
                element.textContent = data.user.fullName;
            });
        } else {
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Error loading user info:', error);
        window.location.href = '/login';
    }
}
