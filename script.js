// Gallery and Lightbox System
class PortfolioApp {
    constructor() {
        this.lightbox = document.getElementById('lightbox');
        this.lightboxImg = document.getElementById('lightbox-img');
        this.currentIndex = 0;
        this.galleryImages = [];
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.galleryItems = document.querySelectorAll('.gallery-item');
        
        this.init();
    }

    init() {
        this.collectGalleryImages();
        this.setupEventListeners();
        this.setupIntersectionObserver();
        this.setupScrollAnimation();
    }

    // Collect all clickable images
    collectGalleryImages() {
        const allImages = document.querySelectorAll('.gallery-item img, .price-img');
        this.galleryImages = Array.from(allImages);
    }

    // Setup all event listeners
    setupEventListeners() {
        // Image click handlers
        this.galleryImages.forEach((img, index) => {
            img.addEventListener('click', () => this.openLightbox(index));
        });

        // Lightbox controls
        document.querySelector('.lightbox-close').addEventListener('click', () => this.closeLightbox());
        this.lightbox.addEventListener('click', (e) => {
            if (e.target === this.lightbox) this.closeLightbox();
        });

        // Lightbox navigation
        document.querySelector('.prev-btn').addEventListener('click', () => this.previousImage());
        document.querySelector('.next-btn').addEventListener('click', () => this.nextImage());

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (this.lightbox.style.display === 'block') {
                if (e.key === 'ArrowLeft') this.previousImage();
                if (e.key === 'ArrowRight') this.nextImage();
                if (e.key === 'Escape') this.closeLightbox();
            }
        });

        // Gallery filters
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', () => this.filterGallery(btn));
        });

        // Back-to-top button
        const backToTop = document.getElementById('back-to-top');
        window.addEventListener('scroll', () => this.toggleBackToTop(backToTop));
        backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

        // Discord copy button
        this.setupDiscordButton();
    }

    // Lightbox functions
    openLightbox(index) {
        // Only open lightbox for gallery items, not price examples
        const clickedImg = this.galleryImages[index];
        const isGalleryImg = clickedImg.closest('.gallery-item');
        
        if (!isGalleryImg) return;

        this.currentIndex = Array.from(document.querySelectorAll('.gallery-item img')).indexOf(clickedImg);
        this.lightboxImg.src = clickedImg.src;
        this.lightboxImg.alt = clickedImg.alt;
        this.updateLightboxCounter();
        this.lightbox.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeLightbox() {
        this.lightbox.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    previousImage() {
        const galleryImgs = document.querySelectorAll('.gallery-item img');
        this.currentIndex = (this.currentIndex - 1 + galleryImgs.length) % galleryImgs.length;
        this.lightboxImg.src = galleryImgs[this.currentIndex].src;
        this.lightboxImg.alt = galleryImgs[this.currentIndex].alt;
        this.updateLightboxCounter();
    }

    nextImage() {
        const galleryImgs = document.querySelectorAll('.gallery-item img');
        this.currentIndex = (this.currentIndex + 1) % galleryImgs.length;
        this.lightboxImg.src = galleryImgs[this.currentIndex].src;
        this.lightboxImg.alt = galleryImgs[this.currentIndex].alt;
        this.updateLightboxCounter();
    }

    updateLightboxCounter() {
        const galleryImgs = document.querySelectorAll('.gallery-item:not(.hidden) img');
        document.getElementById('current-img').textContent = this.currentIndex + 1;
        document.getElementById('total-imgs').textContent = galleryImgs.length;
    }

    // Gallery filtering
    filterGallery(activeBtn) {
        const filter = activeBtn.dataset.filter;

        // Update button states
        this.filterButtons.forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-selected', 'false');
        });
        activeBtn.classList.add('active');
        activeBtn.setAttribute('aria-selected', 'true');

        // Filter gallery items
        this.galleryItems.forEach(item => {
            const category = item.dataset.category;
            const shouldShow = filter === 'all' || category === filter;

            if (shouldShow) {
                item.classList.remove('hidden');
                item.style.animation = 'none';
                setTimeout(() => { item.style.animation = ''; }, 10);
            } else {
                item.classList.add('hidden');
            }
        });
    }

    // Scroll animations with Intersection Observer
    setupIntersectionObserver() {
        const options = { threshold: 0.1, rootMargin: '0px 0px -100px 0px' };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                    observer.unobserve(entry.target);
                }
            });
        }, options);

        // Observe gallery items, price cards, and sections
        document.querySelectorAll('.gallery-item, .price-card, .col').forEach(el => {
            observer.observe(el);
        });
    }

    setupScrollAnimation() {
        document.documentElement.style.scrollBehavior = 'smooth';
    }

    // Back-to-top visibility
    toggleBackToTop(btn) {
        if (window.scrollY > 300) {
            btn.classList.add('show');
        } else {
            btn.classList.remove('show');
        }
    }

    // Discord copy functionality
    setupDiscordButton() {
        const discordBtn = document.getElementById('discordBtn');
        if (!discordBtn) return;

        const tooltip = discordBtn.querySelector('.tooltip');
        discordBtn.addEventListener('click', async () => {
            const user = discordBtn.getAttribute('data-user');
            try {
                await navigator.clipboard.writeText(user);
                const originalText = discordBtn.childNodes[0].textContent;
                discordBtn.childNodes[0].textContent = 'Copied! ';
                tooltip.style.visibility = 'visible';
                tooltip.style.opacity = '1';
                setTimeout(() => {
                    discordBtn.childNodes[0].textContent = 'Discord: ' + user + ' ';
                    tooltip.style.visibility = 'hidden';
                    tooltip.style.opacity = '0';
                }, 2000);
            } catch (err) {
                console.error('[v0] Clipboard copy failed:', err);
            }
        });
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    new PortfolioApp();
});
