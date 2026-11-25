/**
 * PulseAI — Expressive Shape-Driven GSAP Micro-Interactions
 *  - Slow continuous ambient rotation (360deg / 40s) + spring hover on Hero Starburst
 *  - Elastic spring pop-in (back.out(1.7)) & hover straighten on tilted floating pills
 *  - Staggered Bento card entrance & tactile press compression (scale: 0.97) on CTAs
 *  - Dock keyboard shortcuts (1-4)
 */
(function () {
  const prefersReduced = () =>
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initStarburstMotion() {
    if (prefersReduced() || typeof window.gsap === 'undefined') return;

    const starbursts = document.querySelectorAll('.hero-starburst-svg');
    starbursts.forEach((svg) => {
      window.gsap.to(svg, {
        rotation: 360,
        duration: 40,
        repeat: -1,
        ease: 'none',
        transformOrigin: '50% 50%',
      });

      const host = svg.closest('.hero-starburst-host, .card-activity-rings, .landing-visual-stage');
      if (host) {
        host.addEventListener('mouseenter', () => {
          window.gsap.to(svg, { scale: 1.07, duration: 0.35, ease: 'back.out(1.7)' });
        });
        host.addEventListener('mouseleave', () => {
          window.gsap.to(svg, { scale: 1, duration: 0.35, ease: 'power2.out' });
        });
      }
    });
  }

  function initTiltedPills() {
    const pills = document.querySelectorAll('.tilted-pill');
    if (!pills.length) return;

    if (!prefersReduced() && typeof window.gsap !== 'undefined') {
      window.gsap.fromTo(
        pills,
        { scale: 0.65, opacity: 0, y: 10 },
        {
          scale: 1,
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          delay: 0.15,
          ease: 'back.out(1.7)',
        }
      );

      pills.forEach((pill) => {
        const baseRot = parseFloat(pill.getAttribute('data-tilt') || '0');
        window.gsap.set(pill, { rotation: baseRot });

        pill.addEventListener('mouseenter', () => {
          window.gsap.to(pill, {
            rotation: 0,
            scale: 1.05,
            duration: 0.25,
            ease: 'back.out(1.7)',
          });
        });
        pill.addEventListener('mouseleave', () => {
          window.gsap.to(pill, {
            rotation: baseRot,
            scale: 1,
            duration: 0.25,
            ease: 'power2.out',
          });
        });
      });
    }
  }

  function initStaggerAndTactile() {
    if (prefersReduced() || typeof window.gsap === 'undefined') return;

    const cards = document.querySelectorAll('.card, .bento-card');
    if (cards.length) {
      window.gsap.fromTo(
        cards,
        { y: 18, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.055,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
        }
      );
    }

    const ctas = document.querySelectorAll('.btn-primary, .btn-subtle, .nav-item, .cat-tab, .pref-pill, .cr7-chip');
    ctas.forEach((btn) => {
      btn.addEventListener('mousedown', () => {
        window.gsap.to(btn, { scale: 0.97, duration: 0.08, ease: 'power1.out' });
      });
      btn.addEventListener('mouseup', () => {
        window.gsap.to(btn, { scale: 1, duration: 0.18, ease: 'back.out(1.7)' });
      });
      btn.addEventListener('mouseleave', () => {
        window.gsap.to(btn, { scale: 1, duration: 0.18, ease: 'power2.out' });
      });
    });
  }

  function initDockShortcuts() {
    const dockLinks = document.querySelectorAll('.app-nav .nav-item[href]');
    if (!dockLinks.length) return;

    document.addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable) {
        return;
      }
      const idx = parseInt(e.key, 10) - 1;
      if (idx >= 0 && idx < dockLinks.length) {
        dockLinks[idx].click();
      }
    });
  }

  function initMotion() {
    initStarburstMotion();
    initTiltedPills();
    initStaggerAndTactile();
    initDockShortcuts();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMotion);
  } else {
    initMotion();
  }
})();
