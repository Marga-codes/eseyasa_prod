// animations.js - Shared Framer-like animation initializer for Eseyasa Productions

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Intersection Observer for Framer reveals
  const revealElements = document.querySelectorAll('.framer-reveal, .framer-reveal-left, .framer-reveal-right, .framer-reveal-zoom');
  
  const observerOptions = {
    root: null, // viewport
    rootMargin: '0px -10% -10% 0px', // slightly trigger before/after entry for smooth flow
    threshold: 0.1 // 10% visible
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('framer-visible');
        // Unobserve after showing to keep performance optimal (Framer behavior)
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  revealElements.forEach(el => {
    revealObserver.observe(el);
  });

  // Dynamic parallax scroll for elements with data-speed
  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallaxEl = document.querySelectorAll('.framer-parallax');
    parallaxEl.forEach(el => {
      const speed = parseFloat(el.getAttribute('data-speed')) || 0.2;
      el.style.transform = `translateY(${scrolled * speed}px)`;
    });
  });

  // Add subtle interactive scale effect on click for elements with class .framer-btn
  const interactiveBtns = document.querySelectorAll('.framer-btn, button, .artist-card');
  interactiveBtns.forEach(btn => {
    btn.addEventListener('mousedown', () => {
      btn.style.transform = (btn.style.transform || '') + ' scale(0.96)';
      btn.style.transition = 'transform 0.1s ease';
    });
    btn.addEventListener('mouseup', () => {
      btn.style.transform = btn.style.transform.replace(' scale(0.96)', '');
      btn.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = btn.style.transform.replace(' scale(0.96)', '');
    });
  });
});
