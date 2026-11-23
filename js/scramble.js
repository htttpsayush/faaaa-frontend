/**
 * PulseAI — Number Scramble Effect
 * Digits flicker through random numbers on page load and settle left-to-right on the real backend value.
 * Respects prefers-reduced-motion and preserves tabular monospace layout without layout shifts.
 */

function scrambleNumber(el, targetValue, duration = 700, suffix = '') {
  const element = typeof el === 'string' ? document.getElementById(el) : el;
  if (!element || targetValue === null || targetValue === undefined) return;

  const targetStr = String(targetValue);

  // Instant display if prefers-reduced-motion is enabled
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    element.innerHTML = targetStr + suffix;
    return;
  }

  const length = targetStr.length;
  const digits = '0123456789';
  const startTime = performance.now();
  let lastUpdate = 0;
  const frameInterval = 40; // ~25fps flicker rate for smooth visual scramble

  // Render initial randomized digits immediately so there is no blank frame
  let initial = '';
  for (let i = 0; i < length; i++) {
    initial += /\d/.test(targetStr[i]) ? digits[Math.floor(Math.random() * 10)] : targetStr[i];
  }
  element.innerHTML = initial + suffix;

  function tick(now) {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);
    const settledIndex = Math.floor(progress * length);

    if (now - lastUpdate >= frameInterval || progress >= 1) {
      lastUpdate = now;
      let display = '';
      for (let i = 0; i < length; i++) {
        const char = targetStr[i];
        if (i < settledIndex || progress >= 1) {
          display += char;
        } else if (/\d/.test(char)) {
          display += digits[Math.floor(Math.random() * 10)];
        } else {
          display += char;
        }
      }
      element.innerHTML = display + suffix;
    }

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      element.innerHTML = targetStr + suffix;
    }
  }

  requestAnimationFrame(tick);
}

if (typeof window !== 'undefined') {
  window.scrambleNumber = scrambleNumber;
}
