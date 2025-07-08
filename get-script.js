// get-script.js
document.addEventListener('DOMContentLoaded', () => {
    const gallery = document.getElementById('photoGallery');
    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessage = document.getElementById('errorMessage');
    const emptyGallery = document.getElementById('emptyGallery');
    const searchBar = document.getElementById('searchBar');
    const sortSelect = document.getElementById('sortSelect');
    const categoryFilter = document.getElementById('categoryFilter');

    let allImages = [];
    let activeTags = new Set();

    window.addEventListener('load', () => {
        document.getElementById('preloader').style.display = 'none';
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

    async function fetchImages() {
        try {
            loadingMessage.style.display = 'block';
            gallery.style.display = 'none'; // Ensure gallery is hidden during load
            errorMessage.style.display = 'none';
            emptyGallery.style.display = 'none';

            const response = await fetch(`/.netlify/functions/get-images?t=${Date.now()}`);
            if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);

            const data = await response.json();
            console.log('Raw fetched data:', JSON.stringify(data, null, 2));

            let images = [];
            if (Array.isArray(data)) {
                images = data;
            } else if (data.images && Array.isArray(data.images)) {
                images = data.images;
            } else {
                throw new Error(`Expected data.images to be an array, got: ${JSON.stringify(data.images)}`);
            }

            allImages = images;
            renderGallery(allImages);
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

        if (images.length === 0) {
            emptyGallery.style.display = 'block';
            gallery.style.display = 'none';
            return;
        }

        emptyGallery.style.display = 'none';
        gallery.innerHTML = images.map(image => {
            const displayTitle = formatTitle(image.title); // Use formatted title
            const thumbnailUrl = image.url.replace(/upload\/v\d+/, 'upload/w_600,h_500,q_90,c_thumb');
            return `
                <div class="photo-card">
                    <div class="image-wrapper">
                        <img src="${thumbnailUrl}" alt="${displayTitle}" loading="lazy">
                    </div>
                    <div class="photo-info">
                        <h3>${displayTitle}</h3>
                        <input type="hidden" class="original-title" value="${displayTitle}">
                    </div>
                </div>
            `;
        }).join('');

        // Explicitly set grid display and remove any inline styles that might conflict
        gallery.style.display = 'grid';
        gallery.style.gridTemplateColumns = 'repeat(auto-fill, minmax(300px, 1fr))';
        gallery.style.gap = '1.5rem';
        gallery.style.padding = '1rem';

        // Prevent right-click and drag
        document.querySelectorAll('.photo-card img').forEach(img => {
            img.addEventListener('contextmenu', e => e.preventDefault());
            img.addEventListener('dragstart', e => e.preventDefault());
        });
    }

    function renderCategoryFilter(images) {
        const allTags = [...new Set(images.flatMap(img => img.tags))];
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
                updateGallery();
                if (activeTags.size === 0 && !searchBar.value) {
                    emptyGallery.style.display = 'none';
                }
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
                return sorted.sort((a, b) => b.downloads - a.downloads);
            case 'shuffled':
                return sorted.sort(() => Math.random() - 0.5);
            default:
                return sorted;
        }
    }

    function updateGallery() {
        let filteredImages = [...allImages];
        const searchTerm = searchBar.value.toLowerCase();
        if (searchTerm) {
            filteredImages = filteredImages.filter(image =>
                formatTitle(image.title).toLowerCase().includes(searchTerm) ||
                image.description.toLowerCase().includes(searchTerm) ||
                image.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }

        if (activeTags.size > 0) {
            filteredImages = filteredImages.filter(image =>
                [...activeTags].every(tag => image.tags.includes(tag))
            );
        }

        const sortBy = sortSelect.value;
        filteredImages = sortImages(filteredImages, sortBy);
        renderGallery(filteredImages);
    }

    searchBar.addEventListener('input', () => {
        updateGallery();
        if (!searchBar.value) {
            emptyGallery.style.display = 'none';
        }
    });

    sortSelect.addEventListener('change', updateGallery);

    fetchImages();
});
