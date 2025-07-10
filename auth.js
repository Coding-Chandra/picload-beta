// auth.js
let currentUser = null;

function initAuth() {
    return new Promise((resolve) => {
        if (window.netlifyIdentity) {
            netlifyIdentity.on('init', (user) => {
                currentUser = user || netlifyIdentity.currentUser();
                updateAuthUI();
                resolve(currentUser);
            });
            netlifyIdentity.on('login', (user) => {
                currentUser = user;
                updateAuthUI();
                const redirect = new URLSearchParams(window.location.search).get('redirect') || 'index.html';
                window.location.href = redirect;
            });
            netlifyIdentity.on('logout', () => {
                currentUser = null;
                updateAuthUI();
                window.location.href = 'index.html';
            });
            netlifyIdentity.init();
        } else {
            console.error('Netlify Identity not loaded');
            resolve(null);
        }
    });
}

function updateAuthUI() {
    const userButton = document.getElementById('userButton');
    const logoutButton = document.querySelector('header button');
    const dashboardLink = document.getElementById('dashboardLink');
    const myPhotosToggle = document.getElementById('myPhotosToggle');

    if (currentUser) {
        if (userButton) userButton.textContent = '👤';
        if (logoutButton) logoutButton.style.display = 'block';
        if (dashboardLink) dashboardLink.style.display = 'block';
        if (myPhotosToggle) myPhotosToggle.style.display = 'flex';
    } else {
        if (userButton) userButton.textContent = '👤';
        if (logoutButton) logoutButton.style.display = 'none';
        if (dashboardLink) dashboardLink.style.display = 'none';
        if (myPhotosToggle) myPhotosToggle.style.display = 'none';
    }
}

function getCurrentUser() {
    return currentUser || netlifyIdentity.currentUser();
}

window.addEventListener('load', () => initAuth());
