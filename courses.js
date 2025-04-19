// courses.js - Professional Interactive Elements

document.addEventListener('DOMContentLoaded', function() {
    // =============================================
    // 1. ANIMATED PAGE TRANSITIONS
    // =============================================
    const animatePageLoad = () => {
        gsap.from('.course-hero', {
            duration: 1,
            y: 50,
            opacity: 0,
            ease: 'power3.out'
        });
        
        gsap.from('.course-hero h1', {
            duration: 0.8,
            y: 30,
            opacity: 0,
            delay: 0.3,
            ease: 'back.out'
        });
        
        gsap.from('.category-tab', {
            duration: 0.6,
            y: 20,
            opacity: 0,
            stagger: 0.1,
            delay: 0.5,
            ease: 'power2.out'
        });
    };

    // =============================================
    // 2. INTERACTIVE COURSE FILTERING
    // =============================================
    const setupCourseFilters = () => {
        const filterButtons = document.querySelectorAll('.category-tab');
        const courseItems = document.querySelectorAll('.course-item');
        
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remove active class from all buttons
                filterButtons.forEach(btn => {
                    btn.classList.remove('active');
                    gsap.to(btn, { scale: 1, duration: 0.3 });
                });
                
                // Add active class to clicked button
                this.classList.add('active');
                gsap.to(this, { 
                    scale: 1.05, 
                    duration: 0.3,
                    ease: 'back.out'
                });
                
                const filterValue = this.dataset.category;
                
                // Animate course items
                courseItems.forEach(item => {
                    if (filterValue === 'all' || item.dataset.category === filterValue) {
                        gsap.to(item, {
                            opacity: 1,
                            scale: 1,
                            y: 0,
                            duration: 0.5,
                            ease: 'power2.out',
                            display: 'block'
                        });
                    } else {
                        gsap.to(item, {
                            opacity: 0,
                            scale: 0.9,
                            y: 20,
                            duration: 0.3,
                            onComplete: () => {
                                item.style.display = 'none';
                            }
                        });
                    }
                });
            });
        });
    };

    // =============================================
    // 3. COURSE CARD HOVER ANIMATIONS
    // =============================================
    const setupCourseHoverEffects = () => {
        const courseCards = document.querySelectorAll('.course-item');
        
        courseCards.forEach(card => {
            // Initial state
            gsap.set(card, { transformPerspective: 1000 });
            
            // Hover animation
            card.addEventListener('mouseenter', () => {
                gsap.to(card, {
                    duration: 0.3,
                    y: -10,
                    scale: 1.02,
                    boxShadow: '0 15px 30px rgba(0,0,0,0.15)',
                    ease: 'power2.out'
                });
                
                gsap.to(card.querySelector('.course-image'), {
                    duration: 0.4,
                    scale: 1.05,
                    ease: 'power2.out'
                });
            });
            
            card.addEventListener('mouseleave', () => {
                gsap.to(card, {
                    duration: 0.3,
                    y: 0,
                    scale: 1,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    ease: 'power2.out'
                });
                
                gsap.to(card.querySelector('.course-image'), {
                    duration: 0.4,
                    scale: 1,
                    ease: 'power2.out'
                });
            });
        });
    };

    // =============================================
    // 4. STAGGERED COURSE ITEM ANIMATIONS
    // =============================================
    const animateCourseItems = () => {
        gsap.from('.course-item', {
            duration: 0.8,
            y: 50,
            opacity: 0,
            scale: 0.95,
            stagger: 0.1,
            delay: 0.6,
            ease: 'back.out'
        });
    };

    // =============================================
    // 5. PRICING CARD INTERACTIONS
    // =============================================
    const setupPricingCardAnimations = () => {
        const pricingCards = document.querySelectorAll('.pricing-card');
        
        pricingCards.forEach(card => {
            gsap.set(card, { transformPerspective: 1000 });
            
            card.addEventListener('mouseenter', () => {
                gsap.to(card, {
                    duration: 0.4,
                    y: -15,
                    rotateX: 5,
                    boxShadow: '0 20px 40px rgba(108,99,255,0.2)',
                    ease: 'power2.out'
                });
            });
            
            card.addEventListener('mouseleave', () => {
                gsap.to(card, {
                    duration: 0.4,
                    y: 0,
                    rotateX: 0,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    ease: 'power2.out'
                });
            });
        });
    };

    // =============================================
    // 6. SCROLL-BASED ANIMATIONS
    // =============================================
    const setupScrollAnimations = () => {
        gsap.utils.toArray('.course-feature').forEach((feature, i) => {
            ScrollTrigger.create({
                trigger: feature,
                start: 'top 80%',
                onEnter: () => {
                    gsap.from(feature, {
                        duration: 0.8,
                        x: i % 2 === 0 ? -50 : 50,
                        opacity: 0,
                        ease: 'power3.out'
                    });
                }
            });
        });
    };

    // =============================================
    // 7. LOADING STATE MANAGEMENT
    // =============================================
    const simulateLoading = () => {
        const coursesContainer = document.querySelector('.courses-container');
        coursesContainer.classList.add('loading');
        
        // Simulate API call delay
        setTimeout(() => {
            coursesContainer.classList.remove('loading');
            animateCourseItems();
        }, 1500);
    };

    // =============================================
    // INITIALIZE ALL FUNCTIONALITY
    // =============================================
    const init = () => {
        // Load GSAP plugins if needed
        if (typeof gsap !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);
            
            animatePageLoad();
            setupCourseHoverEffects();
            animateCourseItems();
            setupPricingCardAnimations();
            setupScrollAnimations();
        }
        
        setupCourseFilters();
        simulateLoading();
    };

    // Start everything
    init();
});

// =============================================
// UTILITY FUNCTIONS
// =============================================
function debounce(func, wait = 100) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(this, args);
        }, wait);
    };
}

function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}