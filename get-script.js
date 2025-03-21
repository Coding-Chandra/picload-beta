        const gallery = document.getElementById('photoGallery');
        const emptyGallery = document.getElementById('emptyGallery');
        const loadingMessage = document.getElementById('loadingMessage');
        const errorMessage = document.getElementById('errorMessage');
        const categoryFilter = document.getElementById('categoryFilter');
        const searchBar = document.getElementById('searchBar');
        const sortSelect = document.getElementById('sortSelect');
        let imagesData = [];

        async function loadImages() {
            try {
                loadingMessage.style.display = 'block';
                gallery.style.display = 'none';
                emptyGallery.style.display = 'none';
                errorMessage.style.display = 'none';

                const response = await fetch('/.netlify/functions/get-images');
                if (!response.ok) throw new Error(`Fetch failed with status ${response.status}`);

                imagesData = await response.json();
                console.log('Raw images data:', imagesData);
                loadingMessage.style.display = 'none';

                if (!Array.isArray(imagesData)) throw new Error('Response is not an array');

                displayImages(imagesData);
                updateFilters();
            } catch (error) {
                console.error('Error in loadImages:', error);
                loadingMessage.style.display = 'none';
                errorMessage.style.display = 'block';
                errorMessage.textContent = `Error: ${error.message}`;
                gallery.style.display = 'none';
                emptyGallery.style.display = 'none';
            }
        }

        function displayImages(images) {
            if (!images || images.length === 0) {
                gallery.style.display = 'none';
                emptyGallery.style.display = 'block';
                return;
            }

            gallery.style.display = 'grid';
            emptyGallery.style.display = 'none';
            gallery.innerHTML = '';

            images.forEach((image) => {
                if (!image.url || !image.title) {
                    console.warn('Image missing required fields:', image);
                    return;
                }
                const card = document.createElement('div');
                card.className = 'photo-card';
                card.setAttribute('data-tags', image.tags ? image.tags.join(',') : '');
                card.setAttribute('data-date', image.date || '');
                card.setAttribute('data-downloads', image.downloads || 0);
                card.innerHTML = `
                    <img src="${image.url}" alt="${image.title}" onerror="console.error('Image failed to load:', '${image.url}')">
                    <div class="photo-info">
                        <h3>${image.title}</h3>
                        <p>${image.description || 'No description'}</p>
                    </div>
                `;
                card.addEventListener('click', () => {
                    window.location.href = `photo.html?id=${encodeURIComponent(image.id)}`;
                });
                gallery.appendChild(card);
            });
        }

        function updateFilters() {
            const allTags = new Set();
            imagesData.forEach(image => {
                if (image.tags) image.tags.forEach(tag => allTags.add(tag));
            });

            categoryFilter.innerHTML = '<button class="filter-btn active" data-category="all">All Photos</button>';
            allTags.forEach(tag => {
                const btn = document.createElement('button');
                btn.className = 'filter-btn';
                btn.setAttribute('data-category', tag);
                btn.textContent = tag.charAt(0).toUpperCase() + tag.slice(1);
                btn.addEventListener('click', function() {
                    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    applyCurrentFilterAndSort();
                });
                categoryFilter.appendChild(btn);
            });
        }

        function applyCurrentFilterAndSort(searchQuery = '') {
            const activeFilter = document.querySelector('.filter-btn.active')?.getAttribute('data-category') || 'all';
            const activeSort = sortSelect.value || 'new-to-old';

            let filteredImages = imagesData.slice();
            if (activeFilter !== 'all') {
                filteredImages = filteredImages.filter(image => 
                    image.tags && image.tags.includes(activeFilter)
                );
            } else {
                filteredImages = imagesData.slice(); // Explicitly reset to all images
            }

            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                filteredImages = filteredImages.filter(image => 
                    (image.tags && image.tags.some(tag => tag.toLowerCase().includes(query))) ||
                    (image.description && image.description.toLowerCase().includes(query)) ||
                    image.title.toLowerCase().includes(query)
                );
            }

            sortImages(filteredImages, activeSort);
            displayImages(filteredImages);
        }

        function sortImages(images, sortType) {
            switch (sortType) {
                case 'new-to-old':
                    images.sort((a, b) => new Date(b.date) - new Date(a.date));
                    break;
                case 'old-to-new':
                    images.sort((a, b) => new Date(a.date) - new Date(b.date));
                    break;
                case 'most-downloaded':
                    images.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
                    break;
                case 'shuffled':
                    for (let i = images.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [images[i], images[j]] = [images[j], images[i]];
                    }
                    break;
            }
            return images;
        }

        document.addEventListener('DOMContentLoaded', loadImages);

        sortSelect.addEventListener('change', () => applyCurrentFilterAndSort(searchBar.value));
        searchBar.addEventListener('input', () => applyCurrentFilterAndSort(searchBar.value));
        
        // Moved filter button event listener out of updateFilters to ensure it works after DOM updates
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                applyCurrentFilterAndSort(searchBar.value);
            }
        });
