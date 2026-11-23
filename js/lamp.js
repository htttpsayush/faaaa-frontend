/**
 * Theme Lamp Component
 * Hanging interactive ceiling lamp in the top-right corner.
 * Realistic thread pull physics: stretch, bounce, gentle lamp swing, instant theme toggle.
 * Default theme: dark (neon lime accent), toggles to soft light theme.
 */

(function () {
  function initThemeLamp() {
    const savedTheme = localStorage.getItem('pulseai_theme') || 'dark';
    applyTheme(savedTheme);

    let lamp = document.getElementById('themeLamp');
    if (!lamp) {
      lamp = document.createElement('div');
      lamp.id = 'themeLamp';
      lamp.className = 'theme-lamp-widget';
      lamp.setAttribute('role', 'region');
      lamp.setAttribute('aria-label', 'Theme switch lamp');
      lamp.innerHTML = `
        <div class="lamp-mount"></div>
        <div class="lamp-body" id="lampBody">
          <div class="lamp-shade"></div>
          <div class="lamp-bulb"></div>
          <div class="lamp-glow"></div>
        </div>
        <div class="lamp-cord-assembly" id="lampCordAssembly" title="Pull cord to toggle light or dark theme">
          <svg class="lamp-wire-svg" viewBox="0 0 3 22" preserveAspectRatio="none">
            <line x1="1.5" y1="0" x2="1.5" y2="22" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="1 2.5"/>
          </svg>
          <button type="button" class="lamp-pull-knob" id="lampPullKnob" aria-label="Pull cord to toggle light or dark theme">
            <span class="knob-ring"></span>
          </button>
        </div>
      `;
      document.body.prepend(lamp);
    }

    const cord = document.getElementById('lampCordAssembly');
    const knob = document.getElementById('lampPullKnob');
    const lampBody = document.getElementById('lampBody');
    if (!cord || !knob || !lampBody) return;

    let isDragging = false;
    let startY = 0;
    let currentY = 0;
    let switchedOnDrag = false;
    const DRAG_THRESHOLD = 8;
    const MAX_PULL = 20;

    const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function triggerSpringBounce(withSwitch = true) {
      if (withSwitch) toggleTheme();
      if (prefersReducedMotion()) return;

      cord.classList.remove('is-pulling');
      lampBody.classList.remove('is-swinging');
      void cord.offsetWidth; // Reflow for clean re-trigger

      cord.classList.add('is-pulling');
      lampBody.classList.add('is-swinging');

      setTimeout(() => {
        cord.classList.remove('is-pulling');
        lampBody.classList.remove('is-swinging');
      }, 500);
    }

    function onPointerDown(e) {
      isDragging = true;
      startY = e.clientY;
      currentY = 0;
      switchedOnDrag = false;
      cord.setPointerCapture(e.pointerId);
      cord.classList.remove('is-pulling');
      lampBody.classList.remove('is-swinging');
    }

    function onPointerMove(e) {
      if (!isDragging) return;
      const delta = e.clientY - startY;
      currentY = Math.max(0, Math.min(delta, MAX_PULL));

      if (!prefersReducedMotion()) {
        cord.style.transform = `translate3d(0, ${currentY}px, 0) scaleY(${1 + currentY / 60})`;
      }

      if (currentY >= DRAG_THRESHOLD && !switchedOnDrag) {
        switchedOnDrag = true;
        toggleTheme();
      }
    }

    function onPointerUp(e) {
      if (!isDragging) return;
      isDragging = false;
      try { cord.releasePointerCapture(e.pointerId); } catch (_) {}
      cord.style.transform = '';

      if (switchedOnDrag) {
        triggerSpringBounce(false);
      } else {
        triggerSpringBounce(true);
      }
    }

    cord.addEventListener('pointerdown', onPointerDown);
    cord.addEventListener('pointermove', onPointerMove);
    cord.addEventListener('pointerup', onPointerUp);
    cord.addEventListener('pointercancel', onPointerUp);

    // Keyboard support
    knob.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        triggerSpringBounce(true);
      }
    });
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pulseai_theme', theme);

    const lamp = document.getElementById('themeLamp');
    if (lamp) {
      if (theme === 'light') {
        lamp.classList.add('lamp-on');
        lamp.classList.remove('lamp-off');
      } else {
        lamp.classList.add('lamp-off');
        lamp.classList.remove('lamp-on');
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemeLamp);
  } else {
    initThemeLamp();
  }
})();
