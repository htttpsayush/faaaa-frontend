/**
 * Aurora Ambient Background & Cursor Glow Effect
 * Interactive radial glow tracking pointer coordinates on desktop;
 * gentle floating ambient animation on touch/mobile devices.
 */

(function () {
  function initAurora() {
    const auroraCanvas = document.querySelector('.aurora-container');
    if (!auroraCanvas) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 3;
    let currentX = targetX;
    let currentY = targetY;

    // Track mouse coordinates on desktop
    window.addEventListener('pointermove', (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
    }, { passive: true });

    const glowBlob = document.querySelector('.cursor-glow');
    if (!glowBlob) return;

    // Smooth RAF interpolation for cursor glow
    function updateGlow() {
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;
      glowBlob.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      requestAnimationFrame(updateGlow);
    }

    requestAnimationFrame(updateGlow);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAurora);
  } else {
    initAurora();
  }
})();

