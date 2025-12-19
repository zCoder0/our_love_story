// ===== API Base URL =====
const API_BASE = '';

// ===== Floating Hearts Animation (disabled on mobile and reduced motion) =====
const heartsContainer = document.getElementById('hearts-container');

function createFloatingHeart() {
  if (!heartsContainer || window.innerWidth <= 768 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  
  const heart = document.createElement('div');
  heart.className = 'floating-heart';
  heart.innerHTML = '♥';
  heart.style.left = Math.random() * 100 + 'vw';
  heart.style.fontSize = (15 + Math.random() * 20) + 'px';
  heart.style.animationDuration = (8 + Math.random() * 7) + 's';
  heartsContainer.appendChild(heart);

  setTimeout(() => heart.remove(), 15000);
}

// Only create hearts on desktop
if (window.innerWidth > 768 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  setInterval(createFloatingHeart, 800);
}

// ===== Navbar Scroll Effect =====
const navbar = document.querySelector('.navbar');
let navbarTicking = false;

function updateNavbar() {
  if (navbar && window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else if (navbar) {
    navbar.classList.remove('scrolled');
  }
  navbarTicking = false;
}

window.addEventListener('scroll', () => {
  if (!navbarTicking) {
    requestAnimationFrame(updateNavbar);
    navbarTicking = true;
  }
});

// ===== Mobile Menu Toggle =====
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const navLinks = document.getElementById('nav-links');

if (mobileMenuToggle && navLinks) {
  mobileMenuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    const icon = mobileMenuToggle.querySelector('i');
    if (navLinks.classList.contains('active')) {
      icon.classList.remove('fa-bars');
      icon.classList.add('fa-times');
    } else {
      icon.classList.remove('fa-times');
      icon.classList.add('fa-bars');
    }
  });
}

// ===== Smooth Scroll for Navigation Links =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      // Close mobile menu after clicking
      if (navLinks && navLinks.classList.contains('active')) {
        navLinks.classList.remove('active');
        const icon = mobileMenuToggle.querySelector('i');
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
      }
    }
  });
});

// ===== Animated Counter =====
function animateCounter(element, target) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    element.textContent = target.toLocaleString();
    return;
  }
  
  let current = 0;
  const increment = target / 60;
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      element.textContent = target.toLocaleString();
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current).toLocaleString();
    }
  }, 30);
}

// ===== Load Stats from API =====
async function loadStats() {
  try {
    const response = await fetch(`${API_BASE}/api/stats`);
    const data = await response.json();

    const statNumbers = document.querySelectorAll('.stat-number');
    const statLabels = document.querySelectorAll('.stat-label');

    // Update stats with API data
    if (statNumbers.length >= 1) {
      statNumbers[0].dataset.count = data.days_together || 0;
      if (statLabels.length >= 1) {
        statLabels[0].textContent = data.days_together === 1 ? 'Day Together' : 'Days Together';
      }
    }
    if (statNumbers.length >= 2) {
      statNumbers[1].dataset.count = data.images || 0;
      if (statLabels.length >= 2) {
        statLabels[1].textContent = data.images === 1 ? 'Photo' : 'Photos';
      }
    }
    if (statNumbers.length >= 3) {
      statNumbers[2].dataset.count = data.videos || 0;
      if (statLabels.length >= 3) {
        statLabels[2].textContent = data.videos === 1 ? 'Video' : 'Videos';
      }
    }

    // Trigger animation
    statNumbers.forEach(stat => {
      const target = parseInt(stat.dataset.count) || 0;
      animateCounter(stat, target);
    });
  } catch (error) {
    console.error('Failed to load stats:', error);
    // Animate with default values
    document.querySelectorAll('.stat-number').forEach(stat => {
      const target = parseInt(stat.dataset.count) || 0;
      animateCounter(stat, target);
    });
  }
}

// ===== Load Gallery from API =====
async function loadGallery(category = 'all') {
  const galleryGrid = document.querySelector('.gallery-grid');
  if (!galleryGrid) return;

  // Show loading state
  galleryGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: rgba(255,255,255,0.5);"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 10px;"></i><br>Loading photos...</div>';

  try {
    let url = `${API_BASE}/api/images`;
    if (category && category !== 'all') {
      url += `?category=${category}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.media && data.media.length > 0) {
      galleryGrid.innerHTML = '';

      data.media.forEach((item, index) => {
        const galleryItem = createGalleryItem(item, index);
        galleryGrid.appendChild(galleryItem);
      });

      // Re-initialize lightbox with new images
      initLightbox();

      // Trigger scroll animations
      setTimeout(() => {
        document.querySelectorAll('.gallery-item').forEach(el => {
          el.classList.add('visible');
        });
      }, 100);
    } else {
      galleryGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: rgba(255,255,255,0.5);">
          <i class="fas fa-images" style="font-size: 3rem; margin-bottom: 15px; display: block;"></i>
          <h3 style="margin-bottom: 10px; color: rgba(255,255,255,0.7);">No photos yet</h3>
          <p>Upload your first memory to get started!</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Failed to load gallery:', error);
    galleryGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: rgba(255,255,255,0.5);">
        <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px; color: #e74c3c;"></i><br>
        Failed to load photos. Please refresh the page.
      </div>
    `;
  }
}

function createGalleryItem(item, index) {
  const div = document.createElement('div');
  div.className = 'gallery-item';
  div.dataset.category = item.category;
  div.dataset.id = item.id;

  // Add size variations for desktop only
  if (window.innerWidth > 768) {
    if (index === 0) div.classList.add('large');
    else if (index === 4) div.classList.add('tall');
    else if (index === 7) div.classList.add('wide');
  }

  const formattedDate = item.date_taken ? new Date(item.date_taken).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: window.innerWidth > 768 ? 'numeric' : '2-digit'
  }) : '';

  const isMobile = window.innerWidth <= 767;
  const caption = item.caption || 'Our Memory';
  const shortCaption = isMobile && caption.length > 15 ? caption.substring(0, 15) + '...' : caption;
  
  const author = getAuthorFromItem(item);
  const authorLabel = createAuthorLabel(author);

  div.innerHTML = `
    <img src="${item.url}" alt="${item.caption || 'Memory'}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.innerHTML='<div style=\"display:flex;align-items:center;justify-content:center;height:100%;color:rgba(255,255,255,0.5);\"><i class=\"fas fa-image\"></i></div>'">
    ${authorLabel}
    <div class="gallery-overlay">
      <div class="overlay-content">
        <span class="memory-date"><i class="far fa-calendar"></i> ${formattedDate}</span>
        <h4>${shortCaption}</h4>
      </div>
      <div class="overlay-actions">
        <button class="action-btn favorite-btn ${item.is_favorite ? 'liked' : ''}" data-id="${item.id}" title="${item.is_favorite ? 'Remove from favorites' : 'Add to favorites'}">
          <i class="fas fa-heart"></i>
        </button>
        <button class="action-btn expand-btn" title="View full size"><i class="fas fa-expand"></i></button>
        <button class="action-btn delete-btn" data-id="${item.id}" title="Delete photo"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `;

  // Add event listeners
  const favoriteBtn = div.querySelector('.favorite-btn');
  favoriteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFavorite(item.id, favoriteBtn);
  });

  const deleteBtn = div.querySelector('.delete-btn');
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteMedia(item.id, div);
  });

  return div;
}

// ===== Load Videos from API =====
async function loadVideos() {
  const videoGrid = document.querySelector('.video-grid');
  if (!videoGrid) return;

  try {
    const response = await fetch(`${API_BASE}/api/videos`);
    const data = await response.json();

    if (data.media && data.media.length > 0) {
      videoGrid.innerHTML = '';

      data.media.forEach((item, index) => {
        const videoCard = createVideoCard(item, index === 0 && window.innerWidth > 768);
        videoGrid.appendChild(videoCard);
      });

      // Trigger scroll animations
      setTimeout(() => {
        document.querySelectorAll('.video-card').forEach(el => {
          el.classList.add('visible');
        });
      }, 100);
    } else {
      videoGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: rgba(255,255,255,0.5);">
          <i class="fas fa-video" style="font-size: 3rem; margin-bottom: 15px; display: block;"></i>
          <h3 style="margin-bottom: 10px; color: rgba(255,255,255,0.7);">No videos yet</h3>
          <p>Upload your first video memory!</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Failed to load videos:', error);
    videoGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: rgba(255,255,255,0.5);">
        <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px; color: #e74c3c;"></i><br>
        Failed to load videos. Please refresh the page.
      </div>
    `;
  }
}

function createVideoCard(item, isFeatured = false) {
  const div = document.createElement('div');
  div.className = 'video-card' + (isFeatured ? ' featured' : '');
  div.dataset.id = item.id;

  const formattedDate = item.date_taken ? new Date(item.date_taken).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric'
  }) : '';
  
  const author = getAuthorFromItem(item);
  const authorLabel = createAuthorLabel(author);

  div.innerHTML = `
    <div class="video-thumbnail">
      <video src="${item.url}" preload="metadata" muted></video>
      ${authorLabel}
      <div class="play-button" data-video="${item.url}">
        <i class="fas fa-play"></i>
      </div>
      <span class="video-duration">0:00</span>
    </div>
    <div class="video-info">
      <h4>${item.caption || 'Video Memory'}</h4>
      <div class="video-meta">
        <span><i class="far fa-calendar"></i> ${formattedDate}</span>
        <span class="delete-video" data-id="${item.id}" title="Delete video"><i class="fas fa-trash"></i></span>
      </div>
    </div>
  `;

  // Get video duration with error handling
  const video = div.querySelector('video');
  video.addEventListener('loadedmetadata', () => {
    const duration = formatDuration(video.duration);
    div.querySelector('.video-duration').textContent = duration;
  });
  
  video.addEventListener('error', () => {
    div.querySelector('.video-duration').textContent = 'Error';
    console.error('Failed to load video:', item.url);
  });

  // Play button click
  const playBtn = div.querySelector('.play-button');
  playBtn.addEventListener('click', () => {
    openVideoPlayer(item.url);
  });

  // Delete button
  const deleteBtn = div.querySelector('.delete-video');
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteMedia(item.id, div);
  });

  return div;
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ===== Video Player =====
function openVideoPlayer(videoUrl) {
  // Create video modal
  const modal = document.createElement('div');
  modal.className = 'video-modal';
  modal.innerHTML = `
    <div class="video-modal-content">
      <button class="video-modal-close"><i class="fas fa-times"></i></button>
      <video controls autoplay preload="metadata">
        <source src="${videoUrl}" type="video/mp4">
        <source src="${videoUrl}" type="video/webm">
        <source src="${videoUrl}" type="video/mov">
        Your browser does not support video playback.
      </video>
    </div>
  `;

  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';

  const video = modal.querySelector('video');
  
  // Pause video when modal is closed
  function closeModal() {
    video.pause();
    modal.remove();
    document.body.style.overflow = '';
  }

  // Close handlers
  modal.querySelector('.video-modal-close').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
  
  // ESC key to close
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

// ===== Toggle Favorite =====
async function toggleFavorite(mediaId, button) {
  // Add loading state
  const originalIcon = button.innerHTML;
  button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  button.disabled = true;
  
  try {
    const response = await fetch(`${API_BASE}/api/media/${mediaId}/favorite`, {
      method: 'POST'
    });
    const data = await response.json();

    if (data.success) {
      button.classList.toggle('liked', data.is_favorite);
      button.innerHTML = '<i class="fas fa-heart"></i>';
      
      if (data.is_favorite) {
        button.style.background = '#e74c3c';
        // Add a little animation
        button.style.transform = 'scale(1.2)';
        setTimeout(() => {
          button.style.transform = 'scale(1)';
        }, 200);
      } else {
        button.style.background = 'rgba(255, 255, 255, 0.1)';
      }
    } else {
      throw new Error(data.message || 'Failed to toggle favorite');
    }
  } catch (error) {
    console.error('Failed to toggle favorite:', error);
    button.innerHTML = originalIcon;
  } finally {
    button.disabled = false;
  }
}

// ===== Delete Media =====
async function deleteMedia(mediaId, element) {
  if (!confirm('Are you sure you want to delete this memory? This action cannot be undone.')) return;

  // Add loading state
  const deleteBtn = element.querySelector('.delete-btn, .delete-video');
  if (deleteBtn) {
    deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    deleteBtn.disabled = true;
  }

  try {
    const response = await fetch(`${API_BASE}/api/media/${mediaId}`, {
      method: 'DELETE'
    });
    const data = await response.json();

    if (data.success) {
      element.style.transform = 'scale(0)';
      element.style.opacity = '0';
      setTimeout(() => element.remove(), 300);

      // Update stats
      loadStats();
    } else {
      throw new Error(data.message || 'Delete failed');
    }
  } catch (error) {
    console.error('Failed to delete media:', error);
    alert('Failed to delete. Please try again.');
    
    // Restore button
    if (deleteBtn) {
      deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
      deleteBtn.disabled = false;
    }
  }
}

// ===== Gallery Filter =====
const filterBtns = document.querySelectorAll('.filter-btn');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // Prevent double-clicking
    if (btn.disabled) return;
    
    filterBtns.forEach(b => {
      b.classList.remove('active');
      b.disabled = false;
    });
    
    btn.classList.add('active');
    btn.disabled = true;

    const filter = btn.dataset.filter;
    loadGallery(filter);
    
    // Re-enable after loading
    setTimeout(() => {
      btn.disabled = false;
    }, 1000);
  });
});

// ===== Lightbox =====
let currentImageIndex = 0;
let galleryImages = [];

function initLightbox() {
  galleryImages = [];
  document.querySelectorAll('.gallery-item img').forEach((img, index) => {
    galleryImages.push(img.src);

    const expandBtn = img.closest('.gallery-item').querySelector('.expand-btn');
    if (expandBtn) {
      expandBtn.onclick = (e) => {
        e.stopPropagation();
        openLightbox(index);
      };
    }

    img.closest('.gallery-item').onclick = () => openLightbox(index);
  });
}

const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxClose = document.querySelector('.lightbox-close');
const lightboxPrev = document.querySelector('.lightbox-prev');
const lightboxNext = document.querySelector('.lightbox-next');

function openLightbox(index) {
  if (!lightbox || galleryImages.length === 0) return;
  currentImageIndex = index;
  
  // Show loading state
  lightboxImg.style.opacity = '0.5';
  lightboxImg.src = galleryImages[index];
  
  lightboxImg.onload = () => {
    lightboxImg.style.opacity = '1';
  };
  
  lightboxImg.onerror = () => {
    lightboxImg.style.opacity = '1';
    lightboxImg.alt = 'Image failed to load';
  };
  
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  if (!lightbox) return;
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
}

function showPrevImage() {
  currentImageIndex = (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
  lightboxImg.style.opacity = '0.5';
  lightboxImg.src = galleryImages[currentImageIndex];
  
  lightboxImg.onload = () => {
    lightboxImg.style.opacity = '1';
  };
}

function showNextImage() {
  currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
  lightboxImg.style.opacity = '0.5';
  lightboxImg.src = galleryImages[currentImageIndex];
  
  lightboxImg.onload = () => {
    lightboxImg.style.opacity = '1';
  };
}

if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
if (lightboxPrev) lightboxPrev.addEventListener('click', showPrevImage);
if (lightboxNext) lightboxNext.addEventListener('click', showNextImage);

if (lightbox) {
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
}

document.addEventListener('keydown', (e) => {
  if (!lightbox || !lightbox.classList.contains('active')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') showPrevImage();
  if (e.key === 'ArrowRight') showNextImage();
});

// ===== Upload Modal =====
let uploadBtn, uploadModal, uploadModalClose, dropzone, browseBtn, fileInput, uploadSubmitBtn;
let selectedFiles = [];

function initializeUploadElements() {
  uploadBtn = document.querySelector('.upload-btn');
  uploadModal = document.getElementById('upload-modal');
  uploadModalClose = document.getElementById('upload-modal-close');
  dropzone = document.getElementById('dropzone');
  browseBtn = document.querySelector('.browse-btn');
  fileInput = document.getElementById('file-input');
  uploadSubmitBtn = document.querySelector('#upload-modal .upload-submit-btn');
  
  // Initialize upload event listeners
  initializeUploadListeners();
}

function initializeUploadListeners() {
  // Upload button click
  if (uploadBtn) {
    uploadBtn.addEventListener('click', () => {
      if (uploadModal) {
        uploadModal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  }
  
  // Close modal
  if (uploadModalClose) {
    uploadModalClose.addEventListener('click', closeUploadModal);
  }
  
  if (uploadModal) {
    uploadModal.addEventListener('click', (e) => {
      if (e.target === uploadModal) closeUploadModal();
    });
  }
  
  // Browse button
  if (browseBtn) {
    browseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (fileInput) fileInput.click();
    });
  }
  
  // Dropzone
  if (dropzone) {
    dropzone.addEventListener('click', () => {
      if (fileInput) fileInput.click();
    });
    
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
    
    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });
    
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      handleFiles(e.dataTransfer.files);
    });
  }
  
  // File input
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      handleFiles(e.target.files);
    });
  }
  
  // Upload submit button
  if (uploadSubmitBtn) {
    uploadSubmitBtn.addEventListener('click', handleUploadSubmit);
  }

  // Clear preview button
  const clearPreviewBtn = document.getElementById('clear-preview-btn');
  if (clearPreviewBtn) {
    clearPreviewBtn.addEventListener('click', clearPreviews);
  }
}

// Upload event listeners are now initialized in initializeUploadListeners()

function closeUploadModal() {
  uploadModal.classList.remove('active');
  document.body.style.overflow = '';
  resetUploadForm();
}

function resetUploadForm() {
  selectedFiles = [];
  if (dropzone) {
    dropzone.querySelector('p').textContent = 'Drag & drop your files here';
    dropzone.querySelector('i').className = 'fas fa-images';
  }
  if (fileInput) fileInput.value = '';

  // Clear previews
  const previewContainer = document.getElementById('upload-preview');
  const previewGrid = document.getElementById('preview-grid');
  if (previewContainer) previewContainer.style.display = 'none';
  if (previewGrid) previewGrid.innerHTML = '';
}

// File handling event listeners are now in initializeUploadListeners()

function handleFiles(files) {
  selectedFiles = Array.from(files);
  if (selectedFiles.length > 0) {
    const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    const sizeInMB = (totalSize / (1024 * 1024)).toFixed(1);
    dropzone.querySelector('p').textContent = `Selected: ${selectedFiles.length} file(s) (${sizeInMB}MB)`;
    dropzone.querySelector('i').className = 'fas fa-check-circle';

    // Show image previews
    showPreviews(selectedFiles);
  }
}

// Preview grid event listener (added once)
let previewGridListenerAdded = false;

function showPreviews(files) {
  const previewContainer = document.getElementById('upload-preview');
  const previewGrid = document.getElementById('preview-grid');

  if (!previewContainer || !previewGrid) return;

  previewGrid.innerHTML = '';
  previewContainer.style.display = 'block';

  files.forEach((file, index) => {
    const previewItem = document.createElement('div');
    previewItem.className = 'preview-item';

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        previewItem.innerHTML = `
          <img src="${e.target.result}" alt="Preview">
          <button type="button" class="remove-file-btn" data-index="${index}">
            <i class="fas fa-times"></i>
          </button>
          <span class="file-name">${file.name.length > 15 ? file.name.substring(0, 12) + '...' : file.name}</span>
        `;
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      previewItem.innerHTML = `
        <div class="video-preview-placeholder">
          <i class="fas fa-video"></i>
        </div>
        <button type="button" class="remove-file-btn" data-index="${index}">
          <i class="fas fa-times"></i>
        </button>
        <span class="file-name">${file.name.length > 15 ? file.name.substring(0, 12) + '...' : file.name}</span>
      `;
    }

    previewGrid.appendChild(previewItem);
  });

  // Add click handler only once
  if (!previewGridListenerAdded) {
    previewGrid.addEventListener('click', (e) => {
      if (e.target.closest('.remove-file-btn')) {
        const index = parseInt(e.target.closest('.remove-file-btn').dataset.index);
        removeFile(index);
      }
    });
    previewGridListenerAdded = true;
  }
}

function removeFile(index) {
  selectedFiles.splice(index, 1);

  if (selectedFiles.length === 0) {
    clearPreviews();
  } else {
    showPreviews(selectedFiles);
    const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    const sizeInMB = (totalSize / (1024 * 1024)).toFixed(1);
    dropzone.querySelector('p').textContent = `Selected: ${selectedFiles.length} file(s) (${sizeInMB}MB)`;
  }
}

function clearPreviews() {
  const previewContainer = document.getElementById('upload-preview');
  const previewGrid = document.getElementById('preview-grid');

  if (previewContainer) previewContainer.style.display = 'none';
  if (previewGrid) previewGrid.innerHTML = '';

  selectedFiles = [];
  if (dropzone) {
    dropzone.querySelector('p').textContent = 'Drag & drop your files here';
    dropzone.querySelector('i').className = 'fas fa-images';
  }
  if (fileInput) fileInput.value = '';
}

// Upload submit handler
async function handleUploadSubmit() {
  if (selectedFiles.length === 0) {
    alert('Please select files to upload');
    return;
  }

  const category = document.querySelector('.upload-options select').value;
  const caption = document.querySelector('.upload-options input[type="text"]').value;

  uploadSubmitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
  uploadSubmitBtn.disabled = true;

  try {
    // Check file sizes (max 10MB per file)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = selectedFiles.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      alert(`Some files are too large (max 10MB). Please compress them first.`);
      return;
    }
    
    const formData = new FormData();

    for (const file of selectedFiles) {
      formData.append('files', file);
    }
    formData.append('category', category.toLowerCase());
    formData.append('caption', caption);

    const response = await fetch(`${API_BASE}/api/upload-multiple`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    const successCount = data.results.filter(r => r.success).length;

    if (successCount === selectedFiles.length) {
      // Trigger confetti celebration!
      if (typeof triggerConfetti === 'function') {
        triggerConfetti();
      }
      showSurpriseMessage('🎉 Memories Saved!', `Successfully uploaded ${selectedFiles.length} file(s)!`);
    } else {
      alert(`Uploaded ${successCount} of ${selectedFiles.length} files. Some files may have failed.`);
    }

    closeUploadModal();

    // Reload gallery and stats
    loadGallery();
    loadVideos();
    loadStats();

  } catch (error) {
    console.error('Upload failed:', error);
    alert('Upload failed. Please check your connection and try again.');
  } finally {
    uploadSubmitBtn.innerHTML = '<i class="fas fa-heart"></i> Save Memory';
    uploadSubmitBtn.disabled = false;
  }
}

// ===== Load More Button =====
const loadMoreBtn = document.querySelector('.load-more-btn');
if (loadMoreBtn) {
  loadMoreBtn.addEventListener('click', async () => {
    loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    loadMoreBtn.disabled = true;
    
    try {
      // Simulate loading more content
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, you would load more images here
      loadMoreBtn.innerHTML = '<i class="fas fa-check"></i> All Photos Loaded';
      loadMoreBtn.style.opacity = '0.5';
    } catch (error) {
      loadMoreBtn.innerHTML = '<i class="fas fa-plus"></i> Load More Photos';
      loadMoreBtn.disabled = false;
    }
  });
}

// ===== Parallax Effect on Hero (disabled on mobile for performance) =====
if (window.innerWidth > 768 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  let ticking = false;
  
  function updateParallax() {
    const scrolled = window.scrollY;
    const heroContent = document.querySelector('.hero-content');
    if (heroContent && scrolled < window.innerHeight) {
      heroContent.style.transform = `translateY(${scrolled * 0.3}px)`;
      heroContent.style.opacity = 1 - (scrolled / window.innerHeight);
    }
    ticking = false;
  }
  
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  });
}

// ===== Timeline Functions =====
const timelineContainer = document.getElementById('timeline-container');
const timelineEmpty = document.getElementById('timeline-empty');
const addTimelineBtn = document.getElementById('add-timeline-btn');
const timelineModal = document.getElementById('timeline-modal');
const timelineModalClose = document.getElementById('timeline-modal-close');
const timelineForm = document.getElementById('timeline-form');
const timelinePhotoInput = document.getElementById('timeline-photo-input');
const timelinePhotoPreview = document.getElementById('timeline-photo-preview');
const timelinePhotoImg = document.getElementById('timeline-photo-img');
const removeTimelinePhoto = document.getElementById('remove-timeline-photo');
const timelinePhotoUpload = document.getElementById('timeline-photo-upload');

let selectedTimelinePhoto = null;

// Timeline photo upload handlers
if (timelinePhotoUpload) {
  timelinePhotoUpload.addEventListener('click', () => {
    timelinePhotoInput.click();
  });
}

if (timelinePhotoInput) {
  timelinePhotoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      selectedTimelinePhoto = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        timelinePhotoImg.src = e.target.result;
        timelinePhotoImg.style.display = 'block';
        timelinePhotoPreview.style.display = 'none';
        removeTimelinePhoto.style.display = 'flex';
      };
      reader.readAsDataURL(file);
    }
  });
}

if (removeTimelinePhoto) {
  removeTimelinePhoto.addEventListener('click', (e) => {
    e.stopPropagation();
    selectedTimelinePhoto = null;
    timelinePhotoInput.value = '';
    timelinePhotoImg.src = '';
    timelinePhotoImg.style.display = 'none';
    timelinePhotoPreview.style.display = 'block';
    removeTimelinePhoto.style.display = 'none';
  });
}

async function loadTimeline() {
  if (!timelineContainer) return;

  try {
    const response = await fetch(`${API_BASE}/api/timeline`);
    const data = await response.json();

    if (data.events && data.events.length > 0) {
      timelineContainer.innerHTML = '';
      if (timelineEmpty) timelineEmpty.style.display = 'none';

      data.events.forEach((event, index) => {
        const item = createTimelineItem(event, index);
        timelineContainer.appendChild(item);
      });

      // Animate items
      setTimeout(() => {
        document.querySelectorAll('.timeline-item').forEach(el => {
          el.classList.add('visible');
        });
      }, 100);
    } else {
      timelineContainer.innerHTML = '';
      if (timelineEmpty) timelineEmpty.style.display = 'block';
    }
  } catch (error) {
    console.error('Failed to load timeline:', error);
    if (timelineEmpty) {
      timelineEmpty.innerHTML = `
        <i class="fas fa-exclamation-triangle" style="color: #e74c3c; margin-bottom: 15px;"></i>
        <p>Failed to load timeline. Please refresh the page.</p>
      `;
      timelineEmpty.style.display = 'block';
    }
  }
}

function createTimelineItem(event, index) {
  const div = document.createElement('div');
  div.className = 'timeline-item';
  div.dataset.id = event.id;

  const isMobile = window.innerWidth <= 767;
  const formattedDate = event.event_date ? new Date(event.event_date).toLocaleDateString('en-US', {
    month: isMobile ? 'short' : 'long',
    day: 'numeric',
    year: isMobile ? '2-digit' : 'numeric'
  }) : '';

  const title = event.title;
  const shortTitle = isMobile && title.length > 20 ? title.substring(0, 20) + '...' : title;
  
  const description = event.description;
  const shortDescription = isMobile && description && description.length > 80 ? description.substring(0, 80) + '...' : description;
  
  const author = getAuthorFromItem(event);
  const authorLabel = createAuthorLabel(author, 'timeline');

  div.innerHTML = `
    <div class="timeline-dot"></div>
    <div class="timeline-content">
      <button class="timeline-delete" data-id="${event.id}"><i class="fas fa-trash"></i></button>
      ${authorLabel}
      <span class="timeline-date">${formattedDate}</span>
      <h4>${shortTitle}</h4>
      ${shortDescription ? `<p>${shortDescription}</p>` : ''}
      ${event.image ? `<img src="${event.image}" alt="${event.title}" class="timeline-image">` : ''}
    </div>
  `;

  // Delete button
  const deleteBtn = div.querySelector('.timeline-delete');
  deleteBtn.addEventListener('click', () => deleteTimelineEvent(event.id, div));

  return div;
}

async function deleteTimelineEvent(eventId, element) {
  if (!confirm('Delete this milestone? This action cannot be undone.')) return;

  const deleteBtn = element.querySelector('.timeline-delete');
  if (deleteBtn) {
    deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    deleteBtn.disabled = true;
  }

  try {
    const response = await fetch(`${API_BASE}/api/timeline/${eventId}`, {
      method: 'DELETE'
    });
    const data = await response.json();

    if (data.success) {
      element.style.transform = 'scale(0)';
      element.style.opacity = '0';
      setTimeout(() => {
        element.remove();
        // Check if empty
        if (timelineContainer.children.length === 0) {
          timelineEmpty.style.display = 'block';
        }
      }, 300);
    } else {
      throw new Error(data.message || 'Delete failed');
    }
  } catch (error) {
    console.error('Failed to delete timeline event:', error);
    alert('Failed to delete milestone. Please try again.');
    
    // Restore button
    if (deleteBtn) {
      deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
      deleteBtn.disabled = false;
    }
  }
}

// Timeline modal
if (addTimelineBtn) {
  addTimelineBtn.addEventListener('click', () => {
    timelineModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  });
}

if (timelineModalClose) {
  timelineModalClose.addEventListener('click', () => {
    timelineModal.classList.remove('active');
    document.body.style.overflow = '';
    resetTimelineForm();
  });
}

if (timelineModal) {
  timelineModal.addEventListener('click', (e) => {
    if (e.target === timelineModal) {
      timelineModal.classList.remove('active');
      document.body.style.overflow = '';
      resetTimelineForm();
    }
  });
}

function resetTimelineForm() {
  if (timelineForm) timelineForm.reset();
  selectedTimelinePhoto = null;
  if (timelinePhotoInput) timelinePhotoInput.value = '';
  if (timelinePhotoImg) {
    timelinePhotoImg.src = '';
    timelinePhotoImg.style.display = 'none';
  }
  if (timelinePhotoPreview) timelinePhotoPreview.style.display = 'block';
  if (removeTimelinePhoto) removeTimelinePhoto.style.display = 'none';
}

if (timelineForm) {
  timelineForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('timeline-title').value;
    const eventDate = document.getElementById('timeline-date').value;
    const description = document.getElementById('timeline-description').value;

    const submitBtn = timelineForm.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    submitBtn.disabled = true;

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('event_date', eventDate);
      formData.append('description', description);

      // Add photo if selected
      if (selectedTimelinePhoto) {
        formData.append('image', selectedTimelinePhoto);
      }

      const response = await fetch(`${API_BASE}/api/timeline`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        timelineModal.classList.remove('active');
        document.body.style.overflow = '';
        resetTimelineForm();
        loadTimeline();
      }
    } catch (error) {
      console.error('Failed to add timeline event:', error);
      alert('Failed to add milestone. Please try again.');
    } finally {
      submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add Milestone';
      submitBtn.disabled = false;
    }
  });
}

// ===== Logout =====
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to logout?')) return;

    try {
      // Clear user identity
      localStorage.removeItem('currentUserIdentity');
      currentUserIdentity = null;
      
      const response = await fetch(`${API_BASE}/api/logout`, {
        method: 'POST'
      });
      const data = await response.json();

      if (data.success) {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Logout failed:', error);
      localStorage.removeItem('currentUserIdentity');
      window.location.href = '/login';
    }
  });
}

// ===== Profile Image Upload =====
const profileInput = document.getElementById('profile-input');
const coupleImg = document.getElementById('couple-img');

if (profileInput) {
  profileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      coupleImg.src = e.target.result;
    };
    reader.readAsDataURL(file);

    // Upload to server
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE}/api/profile-image`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();

      if (data.success) {
        coupleImg.src = data.profile_image;
      }
    } catch (error) {
      console.error('Failed to upload profile image:', error);
    }
  });
}

// ===== Load Profile Image =====
async function loadProfileImage() {
  try {
    const response = await fetch(`${API_BASE}/api/profile-image`);
    const data = await response.json();

    if (data.profile_image && coupleImg) {
      coupleImg.src = data.profile_image;
    }
  } catch (error) {
    console.error('Failed to load profile image:', error);
  }
}

// ===== Current User & Author Functions =====
let currentUser = null;
let currentUserIdentity = localStorage.getItem('currentUserIdentity') || null;

function getCurrentAuthor() {
  return currentUserIdentity || 'prem';
}

function showUserSelection() {
  const userSelectionModal = document.getElementById('user-selection-modal');
  if (userSelectionModal) {
    userSelectionModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function setUserIdentity(identity) {
  currentUserIdentity = identity;
  localStorage.setItem('currentUserIdentity', identity);
  
  // Set cookie for server-side access
  document.cookie = `user_identity=${identity}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
  
  const userSelectionModal = document.getElementById('user-selection-modal');
  if (userSelectionModal) {
    userSelectionModal.classList.remove('active');
    document.body.style.overflow = '';
  }
  
  // Update UI to reflect current user
  updateUIForCurrentUser();
}

function updateUIForCurrentUser() {
  const userName = currentUserIdentity === 'prem' ? 'Prem' : 'Nisha';
  const userIcon = currentUserIdentity === 'prem' ? 'fas fa-crown' : 'fas fa-heart';
  
  // Update any UI elements that show current user
  const userIndicators = document.querySelectorAll('.current-user-indicator');
  userIndicators.forEach(indicator => {
    indicator.innerHTML = `<i class="${userIcon}"></i> <span>${userName}</span>`;
    indicator.className = `current-user-indicator ${currentUserIdentity}`;
  });
}

function getAuthorFromItem(item) {
  // If item has author field, use it
  if (item.author) return item.author;
  
  // Otherwise, randomly assign based on creation time for existing items
  const hash = item.id ? item.id.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0) : 0;
  
  return Math.abs(hash) % 2 === 0 ? 'prem' : 'nisha';
}

function createAuthorLabel(author, type = 'default') {
  const icons = {
    prem: 'fas fa-crown',
    nisha: 'fas fa-heart'
  };
  
  const names = {
    prem: 'Prem',
    nisha: 'Nisha'
  };
  
  if (type === 'timeline') {
    return `<span class="timeline-author ${author}"><i class="${icons[author]}"></i> ${names[author]}</span>`;
  } else if (type === 'note') {
    return `<div class="love-note-author"><i class="${icons[author]}"></i> ${names[author]}</div>`;
  } else {
    return `<div class="author-label ${author}"><i class="${icons[author]}"></i> ${names[author]}</div>`;
  }
}

// ===== Load User Data =====
async function loadUserData() {
  try {
    const response = await fetch(`${API_BASE}/api/me`);
    const data = await response.json();

    if (data.success && data.user) {
      currentUser = data.user;
      
      const anniversaryElement = document.getElementById('anniversary-date');
      if (anniversaryElement && data.user.anniversary) {
        const anniversaryDate = new Date(data.user.anniversary);
        const formattedDate = anniversaryDate.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });
        anniversaryElement.textContent = formattedDate;
      }
    }
  } catch (error) {
    console.error('Failed to load user data:', error);
  }
}

// ===== Love Notes Functions =====
const loveNotesGrid = document.getElementById('love-notes-grid');
const addNoteBtn = document.getElementById('add-note-btn');
const loveNoteModal = document.getElementById('love-note-modal');
const loveNoteModalClose = document.getElementById('love-note-modal-close');
const loveNoteForm = document.getElementById('love-note-form');

const loveQuotes = [
  { quote: "Being deeply loved by someone gives you strength, while loving someone deeply gives you courage.", author: "Lao Tzu" },
  { quote: "The best thing to hold onto in life is each other.", author: "Audrey Hepburn" },
  { quote: "Love is not about how many days, months, or years you have been together. It's about how much you love each other every single day.", author: "Unknown" },
  { quote: "In all the world, there is no heart for me like yours.", author: "Maya Angelou" },
  { quote: "You are my today and all of my tomorrows.", author: "Leo Christopher" },
  { quote: "I love you not only for what you are, but for what I am when I am with you.", author: "Roy Croft" }
];

function displayDailyQuote() {
  const today = new Date().getDate();
  const quoteIndex = today % loveQuotes.length;
  const dailyQuote = loveQuotes[quoteIndex];
  
  const quoteElement = document.getElementById('daily-quote');
  const authorElement = document.querySelector('.quote-author');
  
  if (quoteElement && authorElement) {
    quoteElement.textContent = `"${dailyQuote.quote}"`;
    authorElement.textContent = `- ${dailyQuote.author}`;
  }
}

async function loadMemoryOfDay() {
  try {
    const response = await fetch(`${API_BASE}/api/images`);
    const data = await response.json();
    
    if (data.media && data.media.length > 0) {
      const today = new Date().getDate();
      const memoryIndex = today % data.media.length;
      const dailyMemory = data.media[memoryIndex];
      
      const memoryContainer = document.getElementById('daily-memory');
      if (memoryContainer) {
        const formattedDate = dailyMemory.date_taken ? new Date(dailyMemory.date_taken).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        }) : '';
        
        memoryContainer.innerHTML = `
          <img src="${dailyMemory.url}" alt="${dailyMemory.caption || 'Memory'}" style="width: 100%; max-width: 300px; border-radius: 15px; margin-bottom: 15px;">
          <h4 style="color: #ffd700; margin-bottom: 10px;">${dailyMemory.caption || 'Our Special Memory'}</h4>
          <p style="color: rgba(255,255,255,0.7); font-size: 0.9rem;">${formattedDate}</p>
        `;
      }
    }
  } catch (error) {
    console.error('Failed to load memory of the day:', error);
  }
}

function createLoveNote(note) {
  const div = document.createElement('div');
  div.className = `love-note ${note.color}`;
  div.style.setProperty('--rotation', `${(Math.random() - 0.5) * 6}deg`);
  div.dataset.id = note.id;
  
  const formattedDate = new Date(note.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
  
  const author = note.author || getCurrentAuthor();
  const authorLabel = createAuthorLabel(author, 'note');
  
  div.innerHTML = `
    <button class="love-note-delete" data-id="${note.id}"><i class="fas fa-times"></i></button>
    <div class="love-note-content">${note.message}</div>
    ${authorLabel}
    <div class="love-note-date">${formattedDate}</div>
  `;
  
  const deleteBtn = div.querySelector('.love-note-delete');
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteLoveNote(note.id, div);
  });
  
  return div;
}

async function loadLoveNotes() {
  if (!loveNotesGrid) return;
  
  try {
    const response = await fetch(`${API_BASE}/api/notes`);
    const data = await response.json();
    
    if (data.notes && data.notes.length > 0) {
      loveNotesGrid.innerHTML = '';
      data.notes.forEach(note => {
        const noteElement = createLoveNote(note);
        loveNotesGrid.appendChild(noteElement);
      });
    } else {
      loveNotesGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: rgba(255,255,255,0.5);">
          <i class="fas fa-heart" style="font-size: 3rem; margin-bottom: 15px; color: #ff6b9d;"></i>
          <h3 style="margin-bottom: 10px; color: rgba(255,255,255,0.7);">No love notes yet</h3>
          <p>Write your first sweet message!</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Failed to load love notes:', error);
  }
}

async function deleteLoveNote(noteId, element) {
  if (!confirm('Delete this love note?')) return;
  
  try {
    const response = await fetch(`${API_BASE}/api/notes/${noteId}`, {
      method: 'DELETE'
    });
    const data = await response.json();
    
    if (data.success) {
      element.style.transform = 'scale(0) rotate(180deg)';
      element.style.opacity = '0';
      setTimeout(() => {
        element.remove();
        if (loveNotesGrid.children.length === 0) {
          loadLoveNotes();
        }
      }, 300);
    }
  } catch (error) {
    console.error('Failed to delete love note:', error);
  }
}

if (addNoteBtn) {
  addNoteBtn.addEventListener('click', () => {
    loveNoteModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  });
}

if (loveNoteModalClose) {
  loveNoteModalClose.addEventListener('click', () => {
    loveNoteModal.classList.remove('active');
    document.body.style.overflow = '';
  });
}

if (loveNoteModal) {
  loveNoteModal.addEventListener('click', (e) => {
    if (e.target === loveNoteModal) {
      loveNoteModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}

if (loveNoteForm) {
  loveNoteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const message = document.getElementById('love-note-message').value;
    const color = document.querySelector('input[name="note-color"]:checked').value;
    
    const submitBtn = loveNoteForm.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitBtn.disabled = true;
    
    try {
      const formData = new FormData();
      formData.append('message', message);
      formData.append('color', color);
      formData.append('author', getCurrentAuthor());
      
      const response = await fetch(`${API_BASE}/api/notes`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        loveNoteModal.classList.remove('active');
        document.body.style.overflow = '';
        loveNoteForm.reset();
        loadLoveNotes();
      }
    } catch (error) {
      console.error('Failed to create love note:', error);
      alert('Failed to send love note. Please try again.');
    } finally {
      submitBtn.innerHTML = '<i class="fas fa-heart"></i> Send Love Note';
      submitBtn.disabled = false;
    }
  });
}

// ===== User Selection Event Listeners =====
const userSelectionModal = document.getElementById('user-selection-modal');

// Add click handler for user indicator to switch users
const currentUserIndicator = document.getElementById('current-user-indicator');
if (currentUserIndicator) {
  currentUserIndicator.addEventListener('click', () => {
    showUserSelection();
  });
}

// Handle user option clicks
document.addEventListener('click', (e) => {
  if (e.target.closest('.user-option')) {
    const userOption = e.target.closest('.user-option');
    const userIdentity = userOption.dataset.user;
    setUserIdentity(userIdentity);
  }
});

// ===== Fun Features =====

// Virtual Kisses
function sendKiss(to) {
  const kissBtn = document.querySelector(`.kiss-btn[data-to="${to}"]`);
  if (kissBtn) {
    kissBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    kissBtn.disabled = true;
  }
  
  const formData = new FormData();
  formData.append('to', to);
  
  fetch(`${API_BASE}/api/send-kiss`, {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      createKissAnimation();
      loadKissCounter();
      showSurpriseMessage(`💋 Kiss sent to ${to.charAt(0).toUpperCase() + to.slice(1)}!`, 'Your love is on its way! 💕');
    }
  })
  .catch(error => console.error('Failed to send kiss:', error))
  .finally(() => {
    if (kissBtn) {
      kissBtn.innerHTML = `<i class="fas fa-kiss"></i> Kiss ${to.charAt(0).toUpperCase() + to.slice(1)}`;
      kissBtn.disabled = false;
    }
  });
}

function createKissAnimation() {
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      const kiss = document.createElement('div');
      kiss.className = 'kiss-animation';
      kiss.innerHTML = ['💋', '💕', '😘', '💖', '❤️'][Math.floor(Math.random() * 5)];
      kiss.style.left = Math.random() * window.innerWidth + 'px';
      kiss.style.top = Math.random() * window.innerHeight + 'px';
      document.body.appendChild(kiss);
      
      setTimeout(() => kiss.remove(), 3000);
    }, i * 200);
  }
}

async function loadKissCounter() {
  try {
    const response = await fetch(`${API_BASE}/api/kisses`);
    const data = await response.json();
    const today = new Date().toISOString().split('T')[0];
    const todayKisses = data.kisses.filter(k => k.created_at.startsWith(today));
    
    const counter = document.getElementById('kiss-counter');
    if (counter) {
      counter.textContent = `💋 ${todayKisses.length} kisses today`;
    }
  } catch (error) {
    console.error('Failed to load kiss counter:', error);
  }
}

// Mood Tracker
function setMood(mood) {
  const message = prompt(`How are you feeling? (Optional message)`) || '';
  
  // Ensure user identity is set
  if (!currentUserIdentity) {
    showUserSelection();
    return;
  }
  
  const formData = new FormData();
  formData.append('mood', mood);
  formData.append('message', message);
  
  fetch(`${API_BASE}/api/mood`, {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      loadMoods();
      const userName = currentUserIdentity === 'prem' ? 'Prem' : 'Nisha';
      showSurpriseMessage('Mood Updated! 😊', `${userName}'s mood has been shared!`);
    }
  })
  .catch(error => console.error('Failed to set mood:', error));
}

async function loadMoods() {
  try {
    const response = await fetch(`${API_BASE}/api/moods`);
    const data = await response.json();
    
    const container = document.getElementById('current-moods');
    if (container && data.moods) {
      container.innerHTML = '';
      
      const premMood = data.moods.find(m => m.author === 'prem');
      const nishaMood = data.moods.find(m => m.author === 'nisha');
      
      if (premMood) {
        container.innerHTML += `
          <div class="mood-display">
            <span class="mood-emoji">${premMood.mood}</span>
            <div class="mood-name">Prem</div>
          </div>
        `;
      }
      
      if (nishaMood) {
        container.innerHTML += `
          <div class="mood-display">
            <span class="mood-emoji">${nishaMood.mood}</span>
            <div class="mood-name">Nisha</div>
          </div>
        `;
      }
      
      if (!premMood && !nishaMood) {
        container.innerHTML = '<p style="color: rgba(255,255,255,0.5); font-size: 0.9rem;">No moods set today</p>';
      }
    }
  } catch (error) {
    console.error('Failed to load moods:', error);
  }
}

// Love Meter
async function loadLoveMeter() {
  try {
    const response = await fetch(`${API_BASE}/api/love-meter`);
    const data = await response.json();
    
    const meterFill = document.getElementById('meter-fill');
    const meterScore = document.getElementById('meter-score');
    
    if (meterFill && meterScore) {
      setTimeout(() => {
        meterFill.style.width = data.score + '%';
        meterScore.textContent = data.score + '%';
      }, 500);
    }
  } catch (error) {
    console.error('Failed to load love meter:', error);
  }
}

// Surprise Messages
function showSurpriseMessage(title, message) {
  const surpriseDiv = document.createElement('div');
  surpriseDiv.className = 'surprise-message';
  surpriseDiv.innerHTML = `
    <h3>${title}</h3>
    <p>${message}</p>
    <button class="surprise-close" onclick="this.parentElement.remove()">💕 Aww, Thanks!</button>
  `;
  
  document.body.appendChild(surpriseDiv);
  
  setTimeout(() => {
    if (surpriseDiv.parentElement) {
      surpriseDiv.remove();
    }
  }, 5000);
}

// Random surprise messages
const surpriseMessages = [
  { title: '💕 Love Reminder', message: 'You two are absolutely perfect together!' },
  { title: '✨ Sweet Thought', message: 'Every photo tells a story of your beautiful love!' },
  { title: '🌟 Daily Affirmation', message: 'Your love grows stronger with each passing day!' },
  { title: '💖 Relationship Goals', message: 'You inspire others with your amazing bond!' },
  { title: '🎉 Love Celebration', message: 'Celebrating another day of your wonderful journey!' }
];

function showRandomSurprise() {
  if (Math.random() < 0.3) { // 30% chance
    const surprise = surpriseMessages[Math.floor(Math.random() * surpriseMessages.length)];
    setTimeout(() => {
      showSurpriseMessage(surprise.title, surprise.message);
    }, Math.random() * 10000 + 5000); // Random delay 5-15 seconds
  }
}

// ===== Initialize on Load =====
document.addEventListener('DOMContentLoaded', () => {
  // Initialize upload elements
  initializeUploadElements();
  
  // Debug: Check if upload elements exist
  console.log('Upload button found:', !!uploadBtn);
  console.log('Upload modal found:', !!uploadModal);
  
  // Check if user identity is set, if not show selection modal
  if (!currentUserIdentity) {
    setTimeout(() => showUserSelection(), 1000);
  } else {
    // Set cookie for existing identity
    document.cookie = `user_identity=${currentUserIdentity}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    updateUIForCurrentUser();
  }
  
  // Load data from API
  loadStats();
  loadGallery();
  loadVideos();
  loadProfileImage();
  loadTimeline();
  loadUserData();
  
  // Load magical features
  displayDailyQuote();
  loadMemoryOfDay();
  loadLoveNotes();
  
  // Load fun features
  loadLoveMeter();
  loadKissCounter();
  loadMoods();
  
  // Show random surprise messages
  setTimeout(showRandomSurprise, 30000); // After 30 seconds
  setInterval(showRandomSurprise, 300000); // Every 5 minutes

  // Initialize lightbox for default images
  setTimeout(initLightbox, 500);

  // Add visible class to elements in view
  setTimeout(() => {
    document.querySelectorAll('.gallery-item, .video-card, .timeline-item').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        el.classList.add('visible');
      }
    });
  }, 100);
  
  // Close mobile menu when clicking outside
  document.addEventListener('click', (e) => {
    if (navLinks && navLinks.classList.contains('active')) {
      if (!navLinks.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
        navLinks.classList.remove('active');
        const icon = mobileMenuToggle.querySelector('i');
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
      }
    }
  });
  
  // Prevent body scroll when modals are open
  const modals = [uploadModal, timelineModal, lightbox, loveNoteModal, userSelectionModal];
  modals.forEach(modal => {
    if (modal) {
      const observer = new MutationObserver(() => {
        if (modal.classList.contains('active')) {
          document.body.style.overflow = 'hidden';
        }
      });
      observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
    }
  });
});

// ===== Scroll Animation Observer =====
const scrollObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
});

// Observe elements when they're added to the DOM
function observeNewElements() {
  document.querySelectorAll('.gallery-item:not(.observed), .video-card:not(.observed), .timeline-item:not(.observed)').forEach(el => {
    scrollObserver.observe(el);
    el.classList.add('observed');
  });
}

// Initial observation
observeNewElements();

// Re-observe when new content is loaded
setInterval(observeNewElements, 1000);

// ===== Fun Features Event Listeners =====

// Kiss buttons
document.addEventListener('click', (e) => {
  if (e.target.closest('.kiss-btn')) {
    const kissBtn = e.target.closest('.kiss-btn');
    const to = kissBtn.dataset.to;
    sendKiss(to);
  }
});

// Mood buttons
document.addEventListener('click', (e) => {
  if (e.target.closest('.mood-btn')) {
    const moodBtn = e.target.closest('.mood-btn');
    const mood = moodBtn.dataset.mood;

    // Update active state
    document.querySelectorAll('.mood-btn').forEach(btn => btn.classList.remove('active'));
    moodBtn.classList.add('active');

    setMood(mood);
  }
});

// ===== Anniversary Countdown =====
let countdownInterval;

function startAnniversaryCountdown() {
  const daysEl = document.getElementById('countdown-days');
  const hoursEl = document.getElementById('countdown-hours');
  const minutesEl = document.getElementById('countdown-minutes');
  const secondsEl = document.getElementById('countdown-seconds');

  if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

  function updateCountdown() {
    // Get anniversary date from user data or use default
    let anniversaryDate = new Date();
    const anniversaryText = document.getElementById('anniversary-date')?.textContent;

    if (anniversaryText && currentUser?.anniversary) {
      anniversaryDate = new Date(currentUser.anniversary);
    } else if (anniversaryText) {
      try {
        anniversaryDate = new Date(anniversaryText);
      } catch(e) {
        anniversaryDate = new Date('2025-01-14');
      }
    }

    // Calculate next anniversary
    const now = new Date();
    let nextAnniversary = new Date(now.getFullYear(), anniversaryDate.getMonth(), anniversaryDate.getDate());

    if (nextAnniversary <= now) {
      nextAnniversary.setFullYear(now.getFullYear() + 1);
    }

    const diff = nextAnniversary - now;

    if (diff <= 0) {
      // It's the anniversary!
      daysEl.textContent = '0';
      hoursEl.textContent = '0';
      minutesEl.textContent = '0';
      secondsEl.textContent = '0';
      document.querySelector('.countdown-container h3').textContent = '🎉 Happy Anniversary! 🎉';
      triggerConfetti();
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    daysEl.textContent = days;
    hoursEl.textContent = hours;
    minutesEl.textContent = minutes;
    secondsEl.textContent = seconds;
  }

  updateCountdown();
  countdownInterval = setInterval(updateCountdown, 1000);
}

// ===== Heart Rain Animation =====
function triggerHeartRain() {
  const hearts = ['❤️', '💕', '💖', '💗', '💓', '💘', '💝', '🥰', '😍'];
  const rainCount = 50;

  for (let i = 0; i < rainCount; i++) {
    setTimeout(() => {
      const heart = document.createElement('div');
      heart.className = 'heart-rain';
      heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
      heart.style.left = Math.random() * 100 + 'vw';
      heart.style.animationDuration = (3 + Math.random() * 2) + 's';
      heart.style.fontSize = (1 + Math.random() * 1.5) + 'rem';
      document.body.appendChild(heart);

      setTimeout(() => heart.remove(), 5000);
    }, i * 100);
  }
}

// Heart rain button
const heartRainBtn = document.getElementById('heart-rain-btn');
if (heartRainBtn) {
  heartRainBtn.addEventListener('click', () => {
    triggerHeartRain();
    showSurpriseMessage('💕 Love is in the air!', 'Hearts are falling just for you two!');
  });
}

// ===== Confetti Animation =====
function triggerConfetti() {
  const colors = ['#e74c3c', '#f1c40f', '#9b59b6', '#3498db', '#2ecc71', '#ff6b9d'];
  const confettiCount = 100;

  for (let i = 0; i < confettiCount; i++) {
    setTimeout(() => {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.top = '-10px';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.width = (5 + Math.random() * 10) + 'px';
      confetti.style.height = (5 + Math.random() * 10) + 'px';
      confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
      confetti.style.animationDuration = (2 + Math.random() * 2) + 's';
      document.body.appendChild(confetti);

      setTimeout(() => confetti.remove(), 4000);
    }, i * 30);
  }
}

// ===== Daily Love Challenges =====
const loveChallenges = [
  "Give your partner 3 genuine compliments today 💬",
  "Write a short love note and hide it somewhere they'll find 📝",
  "Cook or order their favorite meal together 🍽️",
  "Share 5 things you love about them ❤️",
  "Take a silly selfie together 📸",
  "Give a 5-minute massage 💆",
  "Dance together to your song 💃🕺",
  "Watch the sunset or sunrise together 🌅",
  "Plan a surprise date for next week 📅",
  "Send a sweet good morning text 🌞",
  "Hold hands for 10 minutes while talking 🤝",
  "Share a childhood memory with each other 👶",
  "Try something new together today 🆕",
  "Write down 3 goals for your relationship 🎯",
  "Give a warm 30-second hug 🤗",
  "Play a game together (board game, video game, etc.) 🎮",
  "Make a playlist of songs that remind you of them 🎵",
  "Take a walk together without phones 🚶",
  "Share what you're grateful for about each other 🙏",
  "Look through old photos together 📷",
  "Leave a sweet voicemail for them 📱",
  "Recreate your first date 💑",
  "Learn something new about each other 🧠",
  "Make a fun TikTok or video together 📹",
  "Stargaze together tonight ⭐",
  "Cook breakfast in bed 🥞",
  "Give butterfly kisses 🦋",
  "Create a bucket list together 📋",
  "Tell them why you fell in love with them 💘",
  "Plan your dream vacation together ✈️"
];

function loadDailyChallenge() {
  const challengeText = document.getElementById('challenge-text');
  const completeBtn = document.getElementById('complete-challenge-btn');
  const streakCount = document.getElementById('streak-count');

  if (!challengeText) return;

  // Get today's challenge based on date
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  const challengeIndex = dayOfYear % loveChallenges.length;

  challengeText.textContent = loveChallenges[challengeIndex];

  // Check if already completed today
  const lastCompleted = localStorage.getItem('lastChallengeCompleted');
  const todayStr = today.toDateString();

  if (lastCompleted === todayStr) {
    completeBtn.classList.add('completed');
    completeBtn.innerHTML = '<i class="fas fa-check-circle"></i> Completed!';
    completeBtn.disabled = true;
  }

  // Load streak
  const streak = parseInt(localStorage.getItem('challengeStreak') || '0');
  if (streakCount) streakCount.textContent = streak;
}

function completeChallenge() {
  const completeBtn = document.getElementById('complete-challenge-btn');
  const streakCount = document.getElementById('streak-count');

  if (!completeBtn || completeBtn.classList.contains('completed')) return;

  const today = new Date();
  const todayStr = today.toDateString();
  const lastCompleted = localStorage.getItem('lastChallengeCompleted');
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Calculate streak
  let streak = parseInt(localStorage.getItem('challengeStreak') || '0');

  if (lastCompleted === yesterday.toDateString()) {
    streak++;
  } else if (lastCompleted !== todayStr) {
    streak = 1;
  }

  localStorage.setItem('challengeStreak', streak.toString());
  localStorage.setItem('lastChallengeCompleted', todayStr);

  if (streakCount) streakCount.textContent = streak;

  completeBtn.classList.add('completed');
  completeBtn.innerHTML = '<i class="fas fa-check-circle"></i> Completed!';
  completeBtn.disabled = true;

  // Celebration
  triggerConfetti();
  showSurpriseMessage('🎉 Challenge Complete!', `Amazing! Your streak is now ${streak} days!`);
}

// Challenge button listener
const completeChallengeBtn = document.getElementById('complete-challenge-btn');
if (completeChallengeBtn) {
  completeChallengeBtn.addEventListener('click', completeChallenge);
}

// ===== Date Idea Generator =====
const dateIdeas = [
  { idea: "Picnic in the park 🧺", type: "outdoor" },
  { idea: "Movie marathon night at home 🎬", type: "home" },
  { idea: "Cook a new recipe together 👨‍🍳", type: "home" },
  { idea: "Visit a local museum or art gallery 🎨", type: "adventure" },
  { idea: "Sunset beach walk 🌅", type: "outdoor" },
  { idea: "Game night with snacks 🎮", type: "home" },
  { idea: "Try a new restaurant 🍽️", type: "food" },
  { idea: "Go stargazing ⭐", type: "outdoor" },
  { idea: "Take a day trip to nearby city 🚗", type: "adventure" },
  { idea: "Spa day at home 🧖", type: "home" },
  { idea: "Karaoke night 🎤", type: "fun" },
  { idea: "Build a blanket fort 🏰", type: "home" },
  { idea: "Go bowling 🎳", type: "fun" },
  { idea: "Have a breakfast date 🥞", type: "food" },
  { idea: "Take a dance class 💃", type: "adventure" },
  { idea: "Visit a botanical garden 🌸", type: "outdoor" },
  { idea: "Coffee shop hopping ☕", type: "food" },
  { idea: "Photo walk around the city 📸", type: "adventure" },
  { idea: "Board game cafe 🎲", type: "fun" },
  { idea: "Make homemade pizza 🍕", type: "home" },
  { idea: "Watch sunrise together 🌄", type: "outdoor" },
  { idea: "Go to an escape room 🔐", type: "adventure" },
  { idea: "Ice cream date 🍦", type: "food" },
  { idea: "Mini golf 🏌️", type: "fun" },
  { idea: "Paint night together 🎨", type: "home" },
  { idea: "Farmers market visit 🥕", type: "outdoor" },
  { idea: "Bike ride around town 🚴", type: "outdoor" },
  { idea: "Attend a local event/festival 🎪", type: "adventure" },
  { idea: "Make dessert together 🍰", type: "home" },
  { idea: "Candlelight dinner at home 🕯️", type: "home" }
];

function generateDateIdea() {
  const display = document.getElementById('date-idea-display');
  if (!display) return;

  const randomIdea = dateIdeas[Math.floor(Math.random() * dateIdeas.length)];

  // Add spinning animation
  display.style.transform = 'rotateY(180deg)';
  display.style.opacity = '0';

  setTimeout(() => {
    display.innerHTML = `
      <i class="fas fa-heart" style="color: #e74c3c;"></i>
      <p>${randomIdea.idea}</p>
    `;
    display.style.transform = 'rotateY(0deg)';
    display.style.opacity = '1';
  }, 200);
}

// Date idea button
const generateDateBtn = document.getElementById('generate-date-btn');
if (generateDateBtn) {
  generateDateBtn.addEventListener('click', generateDateIdea);
}

// ===== Milestone Badges =====
const milestones = [
  { id: 'first_photo', icon: '📸', name: 'First Photo', condition: (stats) => stats.images >= 1 },
  { id: 'photo_lover', icon: '🖼️', name: '10 Photos', condition: (stats) => stats.images >= 10 },
  { id: 'photographer', icon: '📷', name: '50 Photos', condition: (stats) => stats.images >= 50 },
  { id: 'first_video', icon: '🎬', name: 'First Video', condition: (stats) => stats.videos >= 1 },
  { id: 'first_note', icon: '💌', name: 'Love Note', condition: (stats) => stats.notes >= 1 },
  { id: 'note_writer', icon: '✉️', name: '10 Notes', condition: (stats) => stats.notes >= 10 },
  { id: 'first_kiss', icon: '💋', name: 'First Kiss', condition: (stats) => stats.kisses >= 1 },
  { id: 'kiss_master', icon: '😘', name: '50 Kisses', condition: (stats) => stats.kisses >= 50 },
  { id: 'week_together', icon: '📅', name: '1 Week', condition: (stats) => stats.days >= 7 },
  { id: 'month_together', icon: '🗓️', name: '1 Month', condition: (stats) => stats.days >= 30 },
  { id: 'year_together', icon: '🎂', name: '1 Year', condition: (stats) => stats.days >= 365 },
  { id: 'milestone_king', icon: '👑', name: 'Milestone', condition: (stats) => stats.timeline >= 5 }
];

async function loadBadges() {
  const badgesGrid = document.getElementById('badges-grid');
  if (!badgesGrid) return;

  try {
    // Get stats
    const statsResponse = await fetch(`${API_BASE}/api/stats`);
    const stats = await statsResponse.json();

    const notesResponse = await fetch(`${API_BASE}/api/notes`);
    const notesData = await notesResponse.json();

    const kissesResponse = await fetch(`${API_BASE}/api/kisses`);
    const kissesData = await kissesResponse.json();

    const timelineResponse = await fetch(`${API_BASE}/api/timeline`);
    const timelineData = await timelineResponse.json();

    const fullStats = {
      images: stats.images || 0,
      videos: stats.videos || 0,
      days: stats.days_together || 0,
      notes: notesData.notes?.length || 0,
      kisses: kissesData.kisses?.length || 0,
      timeline: timelineData.events?.length || 0
    };

    badgesGrid.innerHTML = '';

    milestones.forEach(milestone => {
      const isUnlocked = milestone.condition(fullStats);
      const badgeDiv = document.createElement('div');
      badgeDiv.className = `badge-item ${isUnlocked ? 'unlocked' : 'locked'}`;
      badgeDiv.innerHTML = `
        <span class="badge-icon">${milestone.icon}</span>
        <span class="badge-name">${milestone.name}</span>
      `;
      badgesGrid.appendChild(badgeDiv);
    });
  } catch (error) {
    console.error('Failed to load badges:', error);
    badgesGrid.innerHTML = '<p style="color: rgba(255,255,255,0.5); font-size: 0.8rem;">Loading badges...</p>';
  }
}

// Initialize new features on page load
document.addEventListener('DOMContentLoaded', () => {
  // Start countdown
  setTimeout(startAnniversaryCountdown, 1000);

  // Load challenge
  loadDailyChallenge();

  // Load badges
  setTimeout(loadBadges, 500);
});
