document.addEventListener('DOMContentLoaded', () => {
    const gallery = document.getElementById('photoGallery');
    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessage = document.getElementById('errorMessage');
    const emptyGallery = document.getElementById('emptyGallery');
    const searchBar = document.getElementById('searchBar');
    const sortSelect = document.getElementById('sortSelect');
    const tagCloud = document.getElementById('tagCloud');
    const authLinks = document.getElementById('authLinks');
    const authButton = document.getElementById('authButton');
    const dashboardLink = document.getElementById('dashboardLink');
    const myPhotosToggle = document.getElementById('myPhotosToggle');
    const myPhotosCheckbox = document.getElementById('myPhotosCheckbox');
    const pagination = document.getElementById('pagination');
    const prevPage = document.getElementById('prevPage');
    const nextPage = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');
    const menuToggle = document.getElementById('menuToggle');
    const menuItems = document.getElementById('menuItems');

    let allImages = [];
    let activeTags = new Set();
    let currentUser = netlifyIdentity.currentUser();
    let currentPage = 1;
    const imagesPerPage = 12;
    const majorTags = ['AI Generated', 'Wallpaper', 'Nature', 'Travel', 'Architecture & Interior', 'Street Peak'];

    // Sync user state with localStorage
    function syncUserState(user) {
        if (user) {
            localStorage.setItem('netlifyUser', JSON.stringify({ id: user.id, email: user.email }));
            authButton.textContent = 'Log Out';
            authButton.onclick = () => netlifyIdentity.logout();
            dashboardLink.style.display = 'block';
            myPhotosToggle.style.display = 'flex';
            fetchImages(user.id);
        } else {
            localStorage.removeItem('netlifyUser');
            authButton.textContent = 'Sign Up / Log In';
            authButton.onclick = () => netlifyIdentity.open();
            dashboardLink.style.display = 'none';
            myPhotosToggle.style.display = 'none';
            fetchImages();
        }
    }

    // Hide preloader on load
    window.addEventListener('load', () => {
        document.getElementById('preloader').classList.add('fade-out');
    });

    // Format title to "Pic One"
    function formatTitle(title) {
        if (!title) return 'Untitled';
        const cleanTitle = title.split('/').pop().replace(/-\d{13}$/, '');
        return cleanTitle
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    async function fetchImages(userId = null) {
        try {
            loadingMessage.style.display = 'block';
            gallery.style.display = 'none';
            errorMessage.style.display = 'none';
            emptyGallery.style.display = 'none';

            const url = userId ? `/.netlify/functions/get-images?userId=${userId}&t=${Date.now()}` : `/.netlify/functions/get-images?t=${Date.now()}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);

            const data = await response.json();
            console.log('Fetched data:', data);

            allImages = Array.isArray(data) ? data : (data.images || []);
            renderGallery();
            renderTagCloud(allImages);
        } catch (error) {
            console.error('Error fetching images:', error);
            errorMessage.textContent = `Error: ${error.message}`;
            errorMessage.style.display = 'block';
            loadingMessage.style.display = 'none';
        }
    }

    function renderGallery() {
        loadingMessage.style.display = 'none';
        errorMessage.style.display = 'none';

        if (allImages.length === 0) {
            emptyGallery.style.display = 'block';
            gallery.style.display = 'none';
            pagination.style.display = 'none';
            return;
        }

        emptyGallery.style.display = 'none';
        const startIdx = (currentPage - 1) * imagesPerPage;
        const endIdx = startIdx + imagesPerPage;
        const paginatedImages = allImages.slice(startIdx, endIdx);

        gallery.innerHTML = paginatedImages.map(image => {
            const displayTitle = formatTitle(image.title);
            const thumbnailUrl = image.url.replace(/upload\/v\d+/, 'upload/w_600,h_500,q_70,c_thumb'); // 70% quality for thumbnails
            return `
                <div class="photo-card">
                    <div class="image-wrapper">
                        <img src="${thumbnailUrl}" alt="${displayTitle}" loading="lazy">
                    </div>
                    <div class="photo-info">
                        <h3>${displayTitle}</h3>
                    </div>
                </div>
            `;
        }).join('');

        gallery.style.display = 'grid';
        gallery.style.gridTemplateColumns = 'repeat(auto-fill, minmax(300px, 1fr))';
        gallery.style.gap = '1.5rem';
        gallery.style.padding = '1rem';
        pagination.style.display = 'flex';

        prevPage.disabled = currentPage === 1;
        nextPage.disabled = endIdx >= allImages.length;
        pageInfo.textContent = `Page ${currentPage} of ${Math.ceil(allImages.length / imagesPerPage)}`;
    }

    function renderTagCloud(images) {
        tagCloud.innerHTML = majorTags.map(tag => `
            <button class="tag-btn" data-tag="${tag}">${tag}</button>
        `).join('');

        document.querySelectorAll('.tag-btn').forEach(btn => {
            const tag = btn.dataset.tag;
            btn.addEventListener('click', () => {
                if (activeTags.has(tag)) {
                    activeTags.delete(tag);
                    btn.classList.remove('active');
                } else {
                    activeTags.add(tag);
                    btn.classList.add('active');
                }
                currentPage = 1; // Reset to first page on tag change
                updateGallery();
            });
        });
    }

    function sortImages(images, sortBy) {
        const sorted = [...images];
        switch (sortBy) {
            case 'new-to-old':
                return sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
            case 'old-to-new':
                return sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
            case 'most-downloaded':
                return sorted.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
            case 'shuffled':
                return sorted.sort(() => Math.random() - 0.5);
            default:
                return sorted;
        }
    }

    function updateGallery() {
        let filteredImages = [...allImages];
        const searchTerm = searchBar.value.toLowerCase().trim();
        if (searchTerm) {
            filteredImages = filteredImages.filter(image =>
                formatTitle(image.title).toLowerCase().includes(searchTerm) ||
                (image.description || '').toLowerCase().includes(searchTerm) ||
                (image.tags || []).some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }

        if (activeTags.size > 0) {
            filteredImages = filteredImages.filter(image =>
                (image.tags || []).some(tag => activeTags.has(tag))
            );
        }

        const sortBy = sortSelect.value;
        filteredImages = sortImages(filteredImages, sortBy);
        allImages = filteredImages; // Update allImages for pagination
        currentPage = 1; // Reset to first page on filter/sort
        renderGallery();
    }

    // Auth Handling
    netlifyIdentity.on('init', user => {
        syncUserState(user || netlifyIdentity.currentUser());
    });

    netlifyIdentity.on('login', user => {
        syncUserState(user);
    });

    netlifyIdentity.on('logout', () => {
        syncUserState(null);
    });

    // Initial state check
    if (currentUser) {
        syncUserState(currentUser);
    } else {
        const storedUser = localStorage.getItem('netlifyUser');
        if (storedUser) {
            const userData = JSON.parse(storedUser);
            currentUser = { id: userData.id, email: userData.email };
            syncUserState(currentUser);
        } else {
            syncUserState(null);
        }
    }

    // Pagination and Menu Handling
    prevPage.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderGallery();
        }
    });

    nextPage.addEventListener('click', () => {
        const totalPages = Math.ceil(allImages.length / imagesPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderGallery();
        }
    });

    menuToggle.addEventListener('click', () => {
        menuItems.classList.toggle('active');
    });

    // Event Listeners
    searchBar.addEventListener('input', updateGallery);
    sortSelect.addEventListener('change', updateGallery);
    myPhotosCheckbox.addEventListener('change', () => {
        if (currentUser) {
            fetchImages(myPhotosCheckbox.checked ? currentUser.id : null);
        }
    });

    // Initial Fetch
    fetchImages(currentUser ? currentUser.id : null);
});
