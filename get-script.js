// get-script.js
document.addEventListener('DOMContentLoaded', () => {
  const gallery = document.getElementById('photoGallery');
  const loadingMessage = document.getElementById('loadingMessage');
  const errorMessage = document.getElementById('errorMessage');
  const emptyGallery = document.getElementById('emptyGallery');
  const searchBar = document.getElementById('searchBar');
  const sortSelect = document.getElementById('sortSelect');
  const categoryFilter = document.getElementById('categoryFilter');
  const preloader = document.getElementById('preloader');

  let allImages = [];
  let activeTag = null; // Track the single active tag

  window.addEventListener('load', () => {
    preloader.style.display = 'none';
  });

  async function fetchImages() {
    try {
      loadingMessage.style.display = 'block';
      gallery.style.display = 'none';
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

    if (images.length === 0) {
      emptyGallery.style.display = 'block';
      gallery.style.display = 'none';
      return;
    }

    gallery.innerHTML = images.map(image => {
      const cleanTitle = image.title.replace(/-\d{13}$/, '');
      return `
        <div class="photo-card" onclick="window.location.href='photo.html?id=${encodeURIComponent(image.id)}'">
          <img src="${image.url}" alt="${cleanTitle}" loading="lazy">
          <div class="photo-info">
            <h3>${cleanTitle}</h3>
          </div>
        </div>
      `;
    }).join('');

    gallery.style.display = 'grid';
  }

  function renderCategoryFilter(images) {
    const allTags = [...new Set(images.flatMap(img => img.tags))].sort(); // Sort alphabetically
    categoryFilter.innerHTML = allTags.map(tag => `
      <button class="filter-btn${activeTag === tag ? ' active' : ''}" data-tag="${tag}">${tag}</button>
    `).join('');

    // Add click handlers to filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tag = btn.getAttribute('data-tag');
        if (activeTag === tag) {
          activeTag = null; // Deselect if clicking the active tag
        } else {
          activeTag = tag; // Set new active tag
        }
        updateFilterButtons();
        updateGallery();
      });
    });
  }

  function updateFilterButtons() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      const tag = btn.getAttribute('data-tag');
      if (tag === activeTag) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
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
        image.title.toLowerCase().includes(searchTerm) ||
        image.description.toLowerCase().includes(searchTerm) ||
        image.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    if (activeTag) {
      filteredImages = filteredImages.filter(image =>
        image.tags.includes(activeTag)
      );
    }

    const sortBy = sortSelect.value;
    filteredImages = sortImages(filteredImages, sortBy);
    renderGallery(filteredImages);
  }

  searchBar.addEventListener('input', updateGallery);
  sortSelect.addEventListener('change', updateGallery);

  fetchImages();
});
