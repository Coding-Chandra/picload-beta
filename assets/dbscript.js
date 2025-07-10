document.addEventListener('DOMContentLoaded', () => {
    // Simulated authentication state (replace with actual auth system)
    let currentUser = JSON.parse(localStorage.getItem('user')) || null;

    // Check login status
    if (!currentUser) {
        window.location.href = '/signup.html';
        return;
    }

    // Update UI with user data
    document.getElementById('userEmail').textContent = currentUser.email;
    document.getElementById('userEmailDisplay').textContent = currentUser.email;
    document.getElementById('userName').textContent = currentUser.name || 'No name set';
    document.getElementById('profilePhoto').src = currentUser.profilePhoto || '/assets/default-profile.png';

    // Logout functionality (site-wide)
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('user');
        window.location.href = '/signup.html';
    });

    // Profile form submission
    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('nameInput').value;
        const profilePhotoInput = document.getElementById('profilePhotoInput').files[0];

        // Update name
        if (name) {
            currentUser.name = name;
            document.getElementById('userName').textContent = name;
        }

        // Update profile photo (simulated upload to admin.html)
        if (profilePhotoInput) {
            const reader = new FileReader();
            reader.onload = (event) => {
                currentUser.profilePhoto = event.target.result;
                document.getElementById('profilePhoto').src = currentUser.profilePhoto;
                localStorage.setItem('user', JSON.stringify(currentUser));
                alert('Profile photo updated! (Simulated upload to admin.html)');
            };
            reader.readAsDataURL(profilePhotoInput);
        } else {
            localStorage.setItem('user', JSON.stringify(currentUser));
            alert('Profile updated!');
        }
    });

    // Simulated photo data (replace with actual database fetch)
    let photos = JSON.parse(localStorage.getItem('photos')) || [];

    // Display photos
    const photoList = document.getElementById('photoList');
    const noPhotosMessage = document.getElementById('noPhotosMessage');
    if (photos.length === 0) {
        noPhotosMessage.style.display = 'block';
    } else {
        noPhotosMessage.style.display = 'none';
        photos.forEach((photo, index) => {
            const photoCard = document.createElement('div');
            photoCard.className = 'border p-4 rounded-lg';
            photoCard.innerHTML = `
                <img src="${photo.url}" alt="${photo.name}" class="w-full h-48 object-cover rounded">
                <input type="text" value="${photo.name}" class="w-full p-2 border rounded mt-2" data-index="${index}">
                <input type="text" value="${photo.tags.join(', ')}" class="w-full p-2 border rounded mt-2" data-index="${index}">
                <div class="flex justify-between mt-2">
                    <button class="updatePhoto px-2 py-1 rounded text-white" data-index="${index}" style="background: linear-gradient(135deg, #007AFF, #005BB5);">Update</button>
                    <button class="deletePhoto px-2 py-1 rounded text-white" data-index="${index}" style="background: linear-gradient(135deg, #007AFF, #005BB5);">Delete</button>
                </div>
            `;
            photoList.appendChild(photoCard);
        });
    }

    // Update photo (name and tags)
    photoList.addEventListener('click', (e) => {
        if (e.target.classList.contains('updatePhoto')) {
            const index = e.target.dataset.index;
            const nameInput = photoList.querySelector(`input[type="text"][data-index="${index}"]:nth-child(2)`);
            const tagsInput = photoList.querySelector(`input[type="text"][data-index="${index}"]:nth-child(3)`);
            photos[index].name = nameInput.value;
            photos[index].tags = tagsInput.value.split(',').map(tag => tag.trim());
            localStorage.setItem('photos', JSON.stringify(photos));
            alert('Photo updated!');
        }
    });

    // Delete photo
    photoList.addEventListener('click', (e) => {
        if (e.target.classList.contains('deletePhoto')) {
            const index = e.target.dataset.index;
            photos.splice(index, 1);
            localStorage.setItem('photos', JSON.stringify(photos));
            window.location.reload();
        }
    });
});

// Simulated signup function (site-wide, in auth.js)
function signup(email, password) {
    // Replace with actual authentication logic
    const user = { email, name: '', profilePhoto: '' };
    local  Storage.setItem('user', JSON.stringify(user));
    window.location.href = '/dashboard.html';
}

// Simulated function for admin photo upload
function uploadPhoto(file, name, tags) {
    const reader = new FileReader();
    reader.onload = (event) => {
        const photos = JSON.parse(localStorage.getItem('photos')) || [];
        photos.push({ url: event.target.result, name, tags: tags.split(',').map(tag => tag.trim()) });
        localStorage.setItem('photos', JSON.stringify(photos));
    };
    reader.readAsDataURL(file);
}
