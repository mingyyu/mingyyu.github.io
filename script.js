/**
 * Ming Yu Portfolio - Interactive Script
 * Features: Particle system, scroll animations, magnetic hover, typing effect
 */

// ===================================
// TYPING EFFECT
// ===================================
class TypingEffect {
  constructor(elementId) {
    this.element = document.getElementById(elementId);
    this.phrases = [
      "Creative 🧐",
      "Full-stack is my playground",
      "Bridging logic with design 🎨",
      "CSS… still figuring it out 😅",
      "Colorful? Maybe a bit 😎",
      "64GB RAM — for serious coding 💻"
    ];
    this.currentPhrase = 0;
    this.currentChar = 0;
    this.isDeleting = false;
    this.typeSpeed = 80;
    this.deleteSpeed = 40;
    this.pauseEnd = 2000;
    this.pauseStart = 500;

    // Shuffle phrases on load for variety
    this.shuffleArray(this.phrases);
    this.type();
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  type() {
    const current = this.phrases[this.currentPhrase];

    if (this.isDeleting) {
      this.element.textContent = current.substring(0, this.currentChar - 1);
      this.currentChar--;
    } else {
      this.element.textContent = current.substring(0, this.currentChar + 1);
      this.currentChar++;
    }

    let timeout = this.isDeleting ? this.deleteSpeed : this.typeSpeed;

    // Finished typing
    if (!this.isDeleting && this.currentChar === current.length) {
      timeout = this.pauseEnd;
      this.isDeleting = true;
    }

    // Finished deleting
    if (this.isDeleting && this.currentChar === 0) {
      this.isDeleting = false;
      this.currentPhrase = (this.currentPhrase + 1) % this.phrases.length;
      timeout = this.pauseStart;
    }

    setTimeout(() => this.type(), timeout);
  }
}

// ===================================
// PARTICLE SYSTEM
// ===================================
class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: null, y: null };
    this.particleCount = window.innerWidth < 768 ? 40 : 80;

    this.resize();
    this.init();
    this.bindEvents();
    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  init() {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push(this.createParticle());
    }
  }

  createParticle() {
    return {
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      size: Math.random() * 2 + 1,
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: (Math.random() - 0.5) * 0.5,
      opacity: Math.random() * 0.5 + 0.2
    };
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.resize();
      this.init();
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    window.addEventListener('mouseout', () => {
      this.mouse.x = null;
      this.mouse.y = null;
    });
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles.forEach((p, i) => {
      // Update position
      p.x += p.speedX;
      p.y += p.speedY;

      // Mouse interaction
      if (this.mouse.x !== null && this.mouse.y !== null) {
        const dx = this.mouse.x - p.x;
        const dy = this.mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 150) {
          const force = (150 - dist) / 150;
          p.x -= dx * force * 0.02;
          p.y -= dy * force * 0.02;
        }
      }

      // Wrap around edges
      if (p.x < 0) p.x = this.canvas.width;
      if (p.x > this.canvas.width) p.x = 0;
      if (p.y < 0) p.y = this.canvas.height;
      if (p.y > this.canvas.height) p.y = 0;

      // Draw particle
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(0, 212, 255, ${p.opacity})`;
      this.ctx.fill();

      // Draw connections
      this.particles.slice(i + 1).forEach(p2 => {
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 120) {
          this.ctx.beginPath();
          this.ctx.moveTo(p.x, p.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.strokeStyle = `rgba(0, 212, 255, ${0.15 * (1 - dist / 120)})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.stroke();
        }
      });
    });

    requestAnimationFrame(() => this.animate());
  }
}

// ===================================
// SCROLL ANIMATIONS
// ===================================
class ScrollAnimations {
  constructor() {
    this.header = document.getElementById('sticky-header');
    this.heroContent = document.querySelector('.hero-content');
    this.cards = document.querySelectorAll('.project-card');
    this.scrollIndicator = document.querySelector('.scroll-indicator');

    this.bindEvents();
    this.setupIntersectionObserver();
  }

  bindEvents() {
    window.addEventListener('scroll', () => this.onScroll(), { passive: true });
  }

  onScroll() {
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;

    // Header visibility
    if (scrollY > windowHeight * 0.5) {
      this.header.classList.add('visible');
    } else {
      this.header.classList.remove('visible');
    }

    // Hero parallax and fade
    if (this.heroContent && scrollY < windowHeight) {
      const progress = scrollY / windowHeight;
      this.heroContent.style.transform = `translateY(${scrollY * 0.3}px) scale(${1 - progress * 0.15})`;
      this.heroContent.style.opacity = 1 - progress * 1.2;
    }

    // Hide scroll indicator
    if (this.scrollIndicator && scrollY > 100) {
      this.scrollIndicator.style.opacity = '0';
    } else if (this.scrollIndicator) {
      this.scrollIndicator.style.opacity = '1';
    }
  }

  setupIntersectionObserver() {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          // Staggered animation
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, index * 150);
        }
      });
    }, observerOptions);

    this.cards.forEach(card => observer.observe(card));
  }
}

// ===================================
// MAGNETIC HOVER EFFECT
// ===================================
class MagneticHover {
  constructor() {
    this.cards = document.querySelectorAll('[data-tilt]');
    this.bindEvents();
  }

  bindEvents() {
    this.cards.forEach(card => {
      card.addEventListener('mousemove', (e) => this.onMouseMove(e, card));
      card.addEventListener('mouseleave', (e) => this.onMouseLeave(e, card));
    });
  }

  onMouseMove(e, card) {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

    // Update glow position
    const glow = card.querySelector('.card-glow');
    if (glow) {
      const percentX = (x / rect.width) * 100;
      const percentY = (y / rect.height) * 100;
      card.style.setProperty('--mouse-x', `${percentX}%`);
      card.style.setProperty('--mouse-y', `${percentY}%`);
    }
  }

  onMouseLeave(e, card) {
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  }
}

// ===================================
// SMOOTH SCROLL FOR NAV LINKS
// ===================================
class SmoothScroll {
  constructor() {
    this.links = document.querySelectorAll('a[href^="#"]');
    this.bindEvents();
  }

  bindEvents() {
    this.links.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href.startsWith('#')) {
          e.preventDefault();
          const target = document.querySelector(href);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      });
    });
  }
}

// ===================================
// INITIALIZE
// ===================================
document.addEventListener('DOMContentLoaded', () => {
  // Initialize typing effect
  new TypingEffect('typed-text');

  // Initialize particle system
  const canvas = document.getElementById('particle-canvas');
  if (canvas) {
    new ParticleSystem(canvas);
  }

  // Initialize scroll animations
  new ScrollAnimations();

  // Initialize magnetic hover
  new MagneticHover();

  // Initialize smooth scroll
  new SmoothScroll();

  // Add transition class after page load for smooth animations
  setTimeout(() => {
    document.body.classList.add('loaded');
  }, 100);
});

// Disable particle canvas on scroll for performance (optional)
let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    window.requestAnimationFrame(() => {
      const canvas = document.getElementById('particle-canvas');
      if (canvas) {
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        // Fade out particles as user scrolls
        canvas.style.opacity = Math.max(0, 0.6 - (scrollY / windowHeight) * 0.8);
      }
      ticking = false;
    });
    ticking = true;
  }
}, { passive: true });
