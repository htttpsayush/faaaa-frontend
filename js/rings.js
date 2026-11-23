/**
 * PulseAI — Smartwatch Activity Rings Component
 * Three concentric SVG rings: Calories (lime), Workouts (cyan), Nutrition (orange).
 * Interactive hover/tap inspection, left-to-right number scramble, animated clockwise fills.
 */

(function () {
  const CIRCUMFERENCES = {
    calories: 540.35, // r=86
    workouts: 420.97, // r=67
    meals: 301.59     // r=48
  };

  let activeData = {
    calories: { pct: 0, valText: '0 kcal', label: 'CALORIES' },
    workouts: { pct: 0, valText: '0 / 5', label: 'TRAINING' },
    meals: { pct: 0, valText: '0 meals', label: 'NUTRITION' }
  };

  let currentActiveKey = null;

  function initActivityRings() {
    const container = document.getElementById('activityRingsCard');
    if (!container) return;

    // Attach hover / tap listeners to rings and legend items
    const rings = [
      { id: 'ringCalories', key: 'calories' },
      { id: 'ringWorkouts', key: 'workouts' },
      { id: 'ringMeals', key: 'meals' }
    ];

    rings.forEach(({ id, key }) => {
      const ringEl = document.getElementById(id);
      const legendEl = document.getElementById(`legendItem-${key}`);

      const highlight = () => setActiveHighlight(key);
      const reset = () => resetHighlight();

      if (ringEl) {
        ringEl.addEventListener('mouseenter', highlight);
        ringEl.addEventListener('mouseleave', reset);
        ringEl.addEventListener('click', () => {
          if (currentActiveKey === key) reset();
          else highlight();
        });
      }

      if (legendEl) {
        legendEl.addEventListener('mouseenter', highlight);
        legendEl.addEventListener('mouseleave', reset);
        legendEl.addEventListener('click', () => {
          if (currentActiveKey === key) reset();
          else highlight();
        });
      }
    });
  }

  function setActiveHighlight(key) {
    currentActiveKey = key;
    const ringKeys = ['calories', 'workouts', 'meals'];
    ringKeys.forEach(k => {
      const ring = document.getElementById(`ring${k.charAt(0).toUpperCase() + k.slice(1)}`);
      const leg = document.getElementById(`legendItem-${k}`);
      if (ring) {
        ring.style.opacity = k === key ? '1' : '0.25';
        ring.style.transform = k === key ? 'scale(1.02)' : 'scale(1)';
      }
      if (leg) {
        leg.classList.toggle('is-highlighted', k === key);
      }
    });

    const d = activeData[key];
    const centerVal = document.getElementById('ringCenterVal');
    const centerLbl = document.getElementById('ringCenterLabel');
    if (centerVal && centerLbl && d) {
      if (typeof window.scrambleNumber === 'function') {
        window.scrambleNumber(centerVal, `${Math.round(d.pct)}%`, 400);
      } else {
        centerVal.textContent = `${Math.round(d.pct)}%`;
      }
      centerLbl.textContent = d.label;
    }
  }

  function resetHighlight() {
    currentActiveKey = null;
    ['calories', 'workouts', 'meals'].forEach(k => {
      const ring = document.getElementById(`ring${k.charAt(0).toUpperCase() + k.slice(1)}`);
      const leg = document.getElementById(`legendItem-${k}`);
      if (ring) {
        ring.style.opacity = '1';
        ring.style.transform = 'scale(1)';
      }
      if (leg) leg.classList.remove('is-highlighted');
    });

    updateOverallCenter();
  }

  function updateOverallCenter() {
    const centerVal = document.getElementById('ringCenterVal');
    const centerLbl = document.getElementById('ringCenterLabel');
    if (!centerVal || !centerLbl) return;

    // Average overall completion
    const avg = Math.round((activeData.calories.pct + activeData.workouts.pct + activeData.meals.pct) / 3);
    if (typeof window.scrambleNumber === 'function') {
      window.scrambleNumber(centerVal, `${avg}%`, 600);
    } else {
      centerVal.textContent = `${avg}%`;
    }
    centerLbl.textContent = 'ACTIVITY';
  }

  function updateRingsData({ caloriesPct = 0, workoutsPct = 0, mealsPct = 0, caloriesText, workoutsText, mealsText }) {
    activeData.calories.pct = Math.max(0, caloriesPct);
    activeData.calories.valText = caloriesText || `${Math.round(caloriesPct)}%`;

    activeData.workouts.pct = Math.max(0, workoutsPct);
    activeData.workouts.valText = workoutsText || `${Math.round(workoutsPct)}%`;

    activeData.meals.pct = Math.max(0, mealsPct);
    activeData.meals.valText = mealsText || `${Math.round(mealsPct)}%`;

    // Legend updates
    const legCal = document.getElementById('ringLegendCalVal');
    const legWorkouts = document.getElementById('ringLegendWorkoutsVal');
    const legMeals = document.getElementById('ringLegendMealsVal');
    if (legCal) legCal.textContent = activeData.calories.valText;
    if (legWorkouts) legWorkouts.textContent = activeData.workouts.valText;
    if (legMeals) legMeals.textContent = activeData.meals.valText;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Animate rings
    animateRing('ringCalories', activeData.calories.pct, CIRCUMFERENCES.calories, 0, prefersReducedMotion);
    animateRing('ringWorkouts', activeData.workouts.pct, CIRCUMFERENCES.workouts, 150, prefersReducedMotion);
    animateRing('ringMeals', activeData.meals.pct, CIRCUMFERENCES.meals, 300, prefersReducedMotion);

    // Empty state visibility
    const emptyNotice = document.getElementById('ringsEmptyState');
    const hasAnyData = (caloriesPct > 0 || workoutsPct > 0 || mealsPct > 0);
    if (emptyNotice) {
      emptyNotice.style.display = hasAnyData ? 'none' : 'block';
    }

    updateOverallCenter();
  }

  function animateRing(elementId, pct, circumference, delayMs, reducedMotion) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const clampedPct = Math.min(100, Math.max(0, pct));
    const offset = circumference * (1 - clampedPct / 100);

    if (reducedMotion) {
      el.style.strokeDashoffset = offset;
      return;
    }

    el.style.transition = 'none';
    el.style.strokeDashoffset = circumference;

    setTimeout(() => {
      el.style.transition = 'stroke-dashoffset 900ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms, transform 200ms';
      el.style.strokeDashoffset = offset;
    }, delayMs + 50);
  }

  window.pulseRings = {
    init: initActivityRings,
    setData: updateRingsData
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initActivityRings);
  } else {
    initActivityRings();
  }
})();

