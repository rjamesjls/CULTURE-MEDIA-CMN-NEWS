// =================================================================
// HERO CAROUSEL - Auto-rotating image carousel
// =================================================================

document.addEventListener('DOMContentLoaded', function () {

    const carousel = document.getElementById('heroCarousel');
    if (!carousel) return; // Exit if no carousel on page

    const slides = carousel.querySelectorAll('.carousel-slide');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');
    const indicators = carousel.querySelectorAll('.indicator');

    let currentSlide = 0;
    let autoPlayInterval;
    const autoPlayDelay = 3000; // 3 seconds

    // =================================================================
    // NAVIGATION FUNCTIONS
    // =================================================================

    function showSlide(index) {
        // Remove active class from all slides
        slides.forEach(slide => slide.classList.remove('active'));
        indicators.forEach(indicator => indicator.classList.remove('active'));

        // Ensure index is within bounds
        if (index >= slides.length) {
            currentSlide = 0;
        } else if (index < 0) {
            currentSlide = slides.length - 1;
        } else {
            currentSlide = index;
        }

        // Add active class to current slide
        if (slides[currentSlide]) {
            slides[currentSlide].classList.add('active');
        }
        if (indicators.length > 0 && indicators[currentSlide]) {
            indicators[currentSlide].classList.add('active');
        }
    }

    function nextSlide() {
        if (slides.length <= 1) return;
        showSlide(currentSlide + 1);
    }

    function prevSlide() {
        if (slides.length <= 1) return;
        showSlide(currentSlide - 1);
    }

    // =================================================================
    // AUTO PLAY
    // =================================================================

    function startAutoPlay() {
        autoPlayInterval = setInterval(nextSlide, autoPlayDelay);
    }

    function stopAutoPlay() {
        clearInterval(autoPlayInterval);
    }

    function restartAutoPlay() {
        stopAutoPlay();
        startAutoPlay();
    }

    // =================================================================
    // EVENT LISTENERS
    // =================================================================

    // Previous button
    if (prevBtn) {
        prevBtn.addEventListener('click', function () {
            prevSlide();
            restartAutoPlay();
        });
    }

    // Next button
    if (nextBtn) {
        nextBtn.addEventListener('click', function () {
            nextSlide();
            restartAutoPlay();
        });
    }

    // Indicators
    indicators.forEach(function (indicator, index) {
        indicator.addEventListener('click', function () {
            showSlide(index);
            restartAutoPlay();
        });
    });

    // Pause on hover
    carousel.addEventListener('mouseenter', stopAutoPlay);
    carousel.addEventListener('mouseleave', startAutoPlay);

    // Keyboard navigation
    document.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') {
            prevSlide();
            restartAutoPlay();
        } else if (e.key === 'ArrowRight') {
            nextSlide();
            restartAutoPlay();
        }
    });

    // Touch/Swipe support
    let touchStartX = 0;
    let touchEndX = 0;

    carousel.addEventListener('touchstart', function (e) {
        touchStartX = e.changedTouches[0].screenX;
        stopAutoPlay();
    }, { passive: true });

    carousel.addEventListener('touchend', function (e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
        startAutoPlay();
    }, { passive: true });

    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swipe left - next slide
                nextSlide();
            } else {
                // Swipe right - previous slide
                prevSlide();
            }
        }
    }

    // =================================================================
    // PRELOAD IMAGES
    // =================================================================

    function preloadImages() {
        slides.forEach(function (slide) {
            const img = slide.querySelector('.carousel-image');
            if (img && img.dataset.src) {
                const preloadImg = new Image();
                preloadImg.src = img.dataset.src;
            }
        });
    }

    // =================================================================
    // INITIALIZE
    // =================================================================

    // Show first slide
    showSlide(0);

    // Preload images
    preloadImages();

    // Start auto-play
    startAutoPlay();

    // Pause auto-play when page is not visible
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            stopAutoPlay();
        } else {
            startAutoPlay();
        }
    });

});
