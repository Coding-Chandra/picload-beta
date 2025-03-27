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

      // Clean titles in the data immediately
      allImages = images.map(image => ({
        ...image,
        title: image.title.replace(/-\d{13}$/, '')
      }));
      renderGallery(allImages);

      const allTags = [...new Set(allImages.flatMap(img => img.tags))];
      categoryFilter.innerHTML = allTags.map(tag => `
  <label><input type="checkbox" value="${tag}" class="category-checkbox"><span>${tag}</span></label>
`).join('');

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

    gallery.innerHTML = images.map(image => `
      <div class="photo-card" onclick="window.location.href='photo.html?id=${encodeURIComponent(image.id)}'">
        <img src="${image.url}" alt="${image.title}" loading="lazy">
        <div class="photo-info">
          <h3>${image.title}</h3>
        </div>
      </div>
    `).join('');

    gallery.style.display = 'grid';
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

    const selectedCategories = Array.from(document.querySelectorAll('.category-checkbox:checked'))
      .map(cb => cb.value);
    if (selectedCategories.length > 0) {
      filteredImages = filteredImages.filter(image =>
        selectedCategories.every(cat => image.tags.includes(cat))
      );
    }

    const sortBy = sortSelect.value;
    filteredImages = sortImages(filteredImages, sortBy);
    renderGallery(filteredImages);
  }

  // Event listeners
  searchBar.addEventListener('input', updateGallery);
  sortSelect.addEventListener('change', updateGallery);
  categoryFilter.addEventListener('change', updateGallery); // Ensure this triggers on checkbox change

  fetchImages();
});
