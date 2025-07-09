document.addEventListener('DOMContentLoaded', () => {
    const gallery = document.getElementById('photoGallery');
    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessage = document.getElementById('errorMessage');
    const emptyGallery = document.getElementById('emptyGallery');
    const searchBar = document.getElementById('searchBar');
    const sortSelect = document.getElementById('sortSelect');
    const categoryFilter = document.getElementById('categoryFilter');
    const authLinks = document.getElementById('authLinks');
    const authButton = document.getElementById('authButton');
    const dashboardLink = document.getElementById('dashboardLink');
    const myPhotosToggle = document.getElementById('myPhotosToggle');
    const myPhotosCheckbox = document.getElementById('myPhotosCheckbox');
    const pagination = document.getElementById('pagination');
    const nextPageBtn = document.getElementById('nextPageBtn');

    let allImages = [];
    let activeTags = new Set();
    let currentUser = netlifyIdentity.currentUser();
    let currentPage = 1;
    const imagesPerPage = 12;

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

    // Get thumbnail URL with 70% quality for index
    function getThumbnailUrl(url) {
        return url.replace(/upload\/v\d+/, 'upload/w_600,h_500,q_70,c_thumb');
    }

    async function fetchImages(userId = null) {
        try {
            loadingMessage.style.display = 'block';
            gallery.style.display = 'none';
            errorMessage.style.display = 'none';
            emptyGallery.style.display = 'none';
            pagination.style.display = 'none';

            const url = userId ? `/.netlify/functions/get-images?userId=${userId}&t=${Date.now()}` : `/.netlify/functions/get-images?t=${Date.now()}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);

            const data = await response.json();
            console.log('Fetched data:', data);

            allImages = Array.isArray(data) ? data : (data.images || []);
            currentPage = 1;
            renderGallery(allImages);
            updatePagination();
            renderCategoryFilter(allImages);
        } catch (error) {
            console.error('Error fetching images:', error);
            errorMessage.textContent = `Error: ${error.message}`;
            errorMessage.style.display = 'block';
            loadingMessage.style.display = 'none';
        }
    }

    function renderGallery(images) {
        loadingMessage.style.display = 'none';
        errorMessage.style.display = 'none';

        const startIdx = (currentPage - 1) * imagesPerPage;
        const paginatedImages = images.sort(() => Math.random() - 0.5).slice(startIdx, startIdx + imagesPerPage);

        if (allImages.length === 0 || paginatedImages.length === 0) {
            emptyGallery.style.display = 'block';
            gallery.style.display = 'none';
            pagination.style.display = 'none';
            return;
        }

        emptyGallery.style.display = 'none';
        gallery.innerHTML = paginatedImages.map(image => {
            const displayTitle = formatTitle(image.title);
            const thumbnailUrl = getThumbnailUrl(image.url); // 70% quality thumbnail
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
        gallery.style.gap = '1rem';
        gallery.style.padding = '0.5rem';
    }

    function renderCategoryFilter(images) {
        const allTags = [...new Set(images.flatMap(img => img.tags || []))];
        categoryFilter.innerHTML = allTags.map(tag => `
            <button class="filter-btn" data-tag="${tag}">${tag}</button>
        `).join('');

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tag = btn.dataset.tag;
                if (activeTags.has(tag)) {
                    activeTags.delete(tag);
                    btn.classList.remove('active');
                } else {
                    activeTags.add(tag);
                    btn.classList.add('active');
                }
                currentPage = 1;
                updateGallery();
                updatePagination();
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
        renderGallery(filteredImages);
        updatePagination();
    }

    function updatePagination() {
        const totalPages = Math.ceil(allImages.length / imagesPerPage);
        if (totalPages > 1) {
            pagination.style.display = 'block';
            nextPageBtn.disabled = currentPage >= totalPages;
        } else {
            pagination.style.display = 'none';
        }
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

    // Event Listeners
    searchBar.addEventListener('input', () => {
        currentPage = 1;
        updateGallery();
    });
    sortSelect.addEventListener('change', () => {
        currentPage = 1;
        updateGallery();
    });
    myPhotosCheckbox.addEventListener('change', () => {
        if (currentUser) {
            currentPage = 1;
            fetchImages(myPhotosCheckbox.checked ? currentUser.id : null);
        }
    });
    nextPageBtn.addEventListener('click', () => {
        currentPage++;
        updateGallery();
        updatePagination();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Initial Fetch
    fetchImages(currentUser ? currentUser.id : null);
});
