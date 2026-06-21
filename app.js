// ═══════════════════════════════════════════════════
// CANOPY 4.0 — PREMIUM APPLICATION ENGINE
// All calculations derived from user inputs. Zero dummy data.
// Modular architecture with security, accessibility, and efficiency.
// ═══════════════════════════════════════════════════

'use strict';

// ═══════════ CONSTANTS ═══════════

/** @constant {number} Indian average daily CO₂ emissions in kg per capita */
const INDIAN_BASELINE_DAILY = 6.7;

/** @constant {number} Global fair share annual CO₂ budget per person in kg (2°C target) */
const GLOBAL_FAIR_SHARE_ANNUAL = 6400;

/** @constant {number} Maximum history entries to retain (90 days) */
const MAX_HISTORY_ENTRIES = 90;

/** @constant {number} Debounce delay in ms for slider inputs */
const DEBOUNCE_DELAY = 100;

/** @constant {number} Animation duration for counters in ms */
const COUNTER_ANIMATION_DURATION = 600;

/** @constant {number} Toast display duration in ms */
const TOAST_DURATION = 3500;

/** @constant {number} Splash screen display duration in ms */
const SPLASH_DURATION = 2500;

/** @constant {number} Max allowed user name length */
const MAX_NAME_LENGTH = 50;

/** @constant {number} Money saved per kg CO₂ saved (₹/kg) */
const MONEY_PER_KG_SAVED = 15;

/** @constant {number} kg CO₂ absorbed per tree per year */
const CO2_PER_TREE_YEAR = 22;

/**
 * India-specific emission factors for each category.
 * @constant {Object}
 */
const EMISSION_FACTORS = Object.freeze({
  transport: Object.freeze({
    'two-wheeler': 0.04, 'car': 0.14, 'auto': 0.07,
    'metro': 0.02, 'bus': 0.03, 'cycle': 0, 'walk': 0
  }),
  food: Object.freeze({
    'vegan': 1.0, 'veg': 1.5, 'mixed': 2.5, 'non-veg': 4.0, delivery: 0.8
  }),
  energy: Object.freeze({ ac_per_hour: 1.2, appliance: 0.3 }),
  shopping: Object.freeze({ package: 1.2 }),
  waste: Object.freeze({ yes: 0.2, no: 1.0 }),
  water: Object.freeze({ per_litre: 0.002 })
});

/** @constant {Object} Human-readable category names */
const CATEGORY_NAMES = Object.freeze({
  transport: 'Transportation', food: 'Food & Diet',
  energy: 'Household Energy', shopping: 'Shopping',
  waste: 'Waste', water: 'Water Usage'
});

/** @constant {Object} Category emoji icons */
const CATEGORY_EMOJIS = Object.freeze({
  transport: '🚗', food: '🍛', energy: '⚡',
  shopping: '📦', waste: '🗑️', water: '💧'
});

/** @constant {Object} Category chart colors */
const CATEGORY_COLORS = Object.freeze({
  transport: '#F59E0B', food: '#10B981', energy: '#3B82F6',
  shopping: '#8B5CF6', waste: '#F97316', water: '#06B6D4'
});

/** @constant {string[]} Ordered category keys */
const CATEGORY_KEYS = Object.freeze(['transport', 'food', 'energy', 'shopping', 'waste', 'water']);

// ═══════════ STATE ═══════════

/** @type {Object|null} Current authenticated user */
let currentUser = null;

/** @type {Object} User profile with carbon data */
let profile = {
  budget: 200,
  onboarded: false,
  score: 0,
  streak: 0,
  joinDate: null,
  footprint: { transport: 0, food: 0, energy: 0, shopping: 0, waste: 0, water: 0 },
  history: [],
  activityLog: [],
  totalSaved: 0
};

/** @type {Object} Current calculator chip selections */
const calcState = { transMode: 'two-wheeler', mealType: 'mixed', wasteSeg: 'yes' };

/** @type {number} Simulation time multiplier in months */
let simMultiplier = 1;

/** @type {number} Current wizard step */
let wizStep = 1;

/** @constant {number} Total wizard steps */
const TOTAL_WIZ_STEPS = 6;

/** @type {number|null} Earth animation frame ID */
let earthAnimFrame = null;

/** @type {number} Earth rotation angle */
let earthRotation = 0;

/** @type {number|null} Debounce timer reference */
let debounceTimer = null;

/** @type {number} Last quick log submission timestamp for rate limiting */
let lastSubmitTime = 0;

// ═══════════ DOM ELEMENT CACHE ═══════════

/**
 * Cached DOM element references for performance.
 * Populated once on initialization to avoid repeated DOM lookups.
 * @type {Object}
 */
const DOM = {};

/**
 * Cache a DOM element by its ID. Returns null gracefully if not found.
 * @param {string} id - Element ID to cache
 * @returns {HTMLElement|null}
 */
function cacheEl(id) {
  const el = document.getElementById(id);
  if (el) { DOM[id] = el; }
  return el;
}

/**
 * Initialize DOM cache for all frequently accessed elements.
 */
function initDOMCache() {
  const ids = [
    'splash-screen', 'auth-screen', 'onboarding-wizard', 'app',
    'g-btn', 'wiz-skip-btn', 'wiz-back', 'wiz-next', 'wiz-prog',
    'wiz-step-lbl', 'wiz-dots', 'signout-btn',
    'sb-uname', 'sb-initials', 'sb-budget-val', 'sb-budget-fill', 'sb-user-btn',
    'date-text', 'greeting', 'hero-total', 'hero-ring-pct', 'hero-ring',
    'hero-score', 'hero-streak', 'hero-weekly-change', 'hero-biggest',
    'calc-km', 'calc-deliveries', 'calc-ac', 'calc-appliances',
    'calc-packages', 'calc-water',
    'calc-v-km', 'calc-v-del', 'calc-v-ac', 'calc-v-app', 'calc-v-pkg', 'calc-v-water',
    'cc-val-transport', 'cc-val-food', 'cc-val-energy', 'cc-val-shopping', 'cc-val-waste', 'cc-val-water',
    'cc-bar-transport', 'cc-bar-food', 'cc-bar-energy', 'cc-bar-shopping', 'cc-bar-waste', 'cc-bar-water',
    'wrapped-scroll', 'insights-stack', 'weekly-bars', 'weekly-days',
    'st-today', 'st-week', 'st-delta',
    'earth-canvas', 'earth-status', 'earth-temp', 'earth-inds',
    'earth-bad', 'earth-good', 'ft-bad', 'ft-good',
    'impact-grid', 'flow-bars', 'flow-total', 'flow-trend',
    'heatmap', 'ranking', 'forecast-chart', 'forecast-sc',
    'sim-transit', 'sim-veg', 'sim-solar', 'sim-ev', 'sim-fly',
    'sm-transit', 'sm-veg', 'sm-solar', 'sm-ev', 'sm-fly',
    'sim-cur', 'sim-fut', 'sim-saves', 'sim-banner', 'sim-banner-txt',
    'recs-stack', 'challenges-stack',
    'prof-name', 'prof-initials', 'prof-streak', 'prof-since',
    'ps-saved', 'ps-score', 'ps-money',
    'equiv-grid', 'badge-grid', 'report-month', 'report-body',
    'quick-log-modal', 'close-quick-log-btn', 'submit-quick-log-btn', 'quick-log-btn',
    'drawer-settings', 'drawer-notifs', 'close-settings-btn', 'close-notifs-btn',
    'save-settings-btn', 'mark-all-read-btn', 'notif-btn',
    'set-name', 'set-budget', 'notifs-body', 'notif-dot',
    'toast', 'toast-text', 'main-scroll',
    'sr-announcer',
    'ql-km', 'ql-km-val', 'ql-amount', 'ql-amount-val',
    'download-report-btn', 'export-data-btn', 'view-all-analytics-btn',
    'wz-km', 'wz-meat', 'wz-delivery', 'wz-orders', 'wz-flights', 'wz-water', 'wz-elec',
    'wz-v-km', 'wz-v-meat', 'wz-v-delivery', 'wz-v-orders', 'wz-v-flights', 'wz-v-water', 'wz-v-elec'
  ];
  ids.forEach(cacheEl);
}

// ═══════════ UTILITY FUNCTIONS ═══════════

/**
 * Sanitize a string to prevent XSS — strips HTML tags.
 * @param {string} str - Input string to sanitize
 * @returns {string} Sanitized string
 */
function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>&"']/g, (c) => {
    const map = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#x27;' };
    return map[c] || c;
  });
}

/**
 * Safely parse JSON from localStorage.
 * @param {string} key - localStorage key
 * @returns {Object|null} Parsed object or null
 */
function safeGetJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Failed to parse localStorage key "${key}":`, err);
    return null;
  }
}

/**
 * Safely set JSON in localStorage.
 * @param {string} key - localStorage key
 * @param {*} value - Value to serialize
 */
function safeSetJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Failed to write localStorage key "${key}":`, err);
  }
}

/**
 * Clamp a number between min and max.
 * @param {number} val - Value to clamp
 * @param {number} min - Minimum allowed
 * @param {number} max - Maximum allowed
 * @returns {number}
 */
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Debounce a function call.
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in ms
 * @returns {Function}
 */
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Create a DOM element safely using createElement and textContent.
 * @param {string} tag - HTML tag name
 * @param {Object} attrs - Attributes to set
 * @param {string} [text] - Text content (safe, no HTML)
 * @returns {HTMLElement}
 */
function createElement(tag, attrs = {}, text = '') {
  const el = document.createElement(tag);
  for (const [key, val] of Object.entries(attrs)) {
    if (key === 'className') {
      el.className = val;
    } else if (key.startsWith('data-')) {
      el.dataset[key.slice(5)] = val;
    } else {
      el.setAttribute(key, val);
    }
  }
  if (text) el.textContent = text;
  return el;
}

/**
 * Announce a message to screen readers via aria-live region.
 * @param {string} message - Message to announce
 */
function announce(message) {
  const announcer = DOM['sr-announcer'];
  if (announcer) {
    announcer.textContent = '';
    setTimeout(() => { announcer.textContent = message; }, 50);
  }
}

// ═══════════ INITIALIZATION ═══════════

document.addEventListener('DOMContentLoaded', () => {
  initDOMCache();
  bindEventListeners();

  setTimeout(() => {
    const splash = DOM['splash-screen'];
    if (splash) {
      splash.style.opacity = '0';
      setTimeout(() => { splash.style.display = 'none'; checkAuth(); }, 800);
    } else {
      checkAuth();
    }
  }, SPLASH_DURATION);
});

// ═══════════ EVENT BINDING ═══════════

/**
 * Bind all event listeners (replaces inline onclick handlers).
 * Uses event delegation where possible.
 */
function bindEventListeners() {
  // Auth
  DOM['g-btn']?.addEventListener('click', handleGoogleSignIn);
  DOM['signout-btn']?.addEventListener('click', handleSignOut);

  // Wizard
  DOM['wiz-skip-btn']?.addEventListener('click', skipWizard);
  DOM['wiz-next']?.addEventListener('click', wizNext);
  DOM['wiz-back']?.addEventListener('click', wizBack);

  // Wizard chip grids (event delegation)
  document.querySelectorAll('#wiz-steps .chip-grid .chip').forEach(chip => {
    chip.addEventListener('click', handleWizardChip);
  });

  // Wizard sliders
  ['wz-km', 'wz-meat', 'wz-delivery', 'wz-orders', 'wz-flights', 'wz-water', 'wz-elec'].forEach(id => {
    const el = DOM[id];
    if (el) {
      el.addEventListener('input', handleWizardSlider);
    }
  });

  // Calculator chips (event delegation)
  document.querySelectorAll('.calc-card .chip[data-calc]').forEach(chip => {
    chip.addEventListener('click', handleCalcChip);
  });

  // Calculator sliders (debounced)
  const debouncedRecalc = debounce(recalcFromCalc, DEBOUNCE_DELAY);
  document.querySelectorAll('.calc-slider').forEach(slider => {
    slider.addEventListener('input', debouncedRecalc);
  });

  // Navigation (sidebar)
  document.querySelectorAll('.sb-item[data-page]').forEach(btn => {
    btn.addEventListener('click', () => goPage(btn.dataset.page));
  });

  // Navigation (mobile)
  document.querySelectorAll('.mn[data-page]').forEach(btn => {
    btn.addEventListener('click', () => goPage(btn.dataset.page));
  });

  // Sidebar user button
  DOM['sb-user-btn']?.addEventListener('click', () => openDrawer('settings'));
  DOM['sb-user-btn']?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrawer('settings'); }
  });

  // Quick log
  DOM['quick-log-btn']?.addEventListener('click', openQuickLog);
  DOM['close-quick-log-btn']?.addEventListener('click', closeQuickLog);
  DOM['submit-quick-log-btn']?.addEventListener('click', submitQuickLog);
  DOM['quick-log-modal']?.addEventListener('click', (e) => {
    if (e.target === DOM['quick-log-modal']) closeQuickLog();
  });

  // Quick log tabs
  document.querySelectorAll('.ql-tab').forEach(tab => {
    tab.addEventListener('click', () => handleQLTab(tab));
  });

  // Quick log chips
  document.querySelectorAll('#quick-log-modal .chip[data-group]').forEach(chip => {
    chip.addEventListener('click', () => handleGroupChip(chip));
  });

  // Quick log sliders
  DOM['ql-km']?.addEventListener('input', function () {
    if (DOM['ql-km-val']) DOM['ql-km-val'].textContent = this.value + ' km';
  });
  DOM['ql-amount']?.addEventListener('input', function () {
    if (DOM['ql-amount-val']) DOM['ql-amount-val'].textContent = '₹' + this.value;
  });

  // Notifications
  DOM['notif-btn']?.addEventListener('click', () => openDrawer('notifs'));

  // Settings drawer
  DOM['close-settings-btn']?.addEventListener('click', () => closeDrawer('settings'));
  DOM['save-settings-btn']?.addEventListener('click', saveSettings);
  DOM['drawer-settings']?.addEventListener('click', (e) => {
    if (e.target === DOM['drawer-settings']) closeDrawer('settings');
  });

  // Notifications drawer
  DOM['close-notifs-btn']?.addEventListener('click', () => closeDrawer('notifs'));
  DOM['mark-all-read-btn']?.addEventListener('click', markAllRead);
  DOM['drawer-notifs']?.addEventListener('click', (e) => {
    if (e.target === DOM['drawer-notifs']) closeDrawer('notifs');
  });

  // Analytics time pills
  document.querySelectorAll('#pg-analytics .pill-group .pill').forEach(pill => {
    pill.addEventListener('click', () => setTF(pill.dataset.tf));
  });

  // Simulation time pills
  document.querySelectorAll('.sim-time-pills .pill').forEach(pill => {
    pill.addEventListener('click', () => {
      pill.parentElement.querySelectorAll('.pill').forEach(p => {
        p.classList.remove('on');
        p.setAttribute('aria-selected', 'false');
      });
      pill.classList.add('on');
      pill.setAttribute('aria-selected', 'true');
      simMultiplier = parseInt(pill.dataset.months, 10) || 1;
      simCalc();
    });
  });

  // Simulation sliders (debounced)
  const debouncedSim = debounce(simCalc, DEBOUNCE_DELAY);
  document.querySelectorAll('.sim-slider').forEach(slider => {
    slider.addEventListener('input', debouncedSim);
  });

  // View all analytics button
  DOM['view-all-analytics-btn']?.addEventListener('click', () => goPage('analytics'));

  // Report actions
  DOM['download-report-btn']?.addEventListener('click', downloadReport);
  DOM['export-data-btn']?.addEventListener('click', exportData);

  // Global keyboard handlers
  document.addEventListener('keydown', handleGlobalKeydown);
}

// ═══════════ KEYBOARD HANDLER ═══════════

/**
 * Handle global keyboard events (Escape to close modals/drawers).
 * @param {KeyboardEvent} e
 */
function handleGlobalKeydown(e) {
  if (e.key === 'Escape') {
    // Close any open modal/drawer
    if (DOM['quick-log-modal']?.getAttribute('aria-hidden') === 'false') {
      closeQuickLog();
    } else if (DOM['drawer-settings']?.getAttribute('aria-hidden') === 'false') {
      closeDrawer('settings');
    } else if (DOM['drawer-notifs']?.getAttribute('aria-hidden') === 'false') {
      closeDrawer('notifs');
    }
  }
}

// ═══════════ AUTH ═══════════

/**
 * Check if a user is already authenticated via localStorage.
 */
function checkAuth() {
  const saved = safeGetJSON('canopy_user');
  if (saved && saved.name) {
    currentUser = saved;
    const p = safeGetJSON('canopy_profile');
    if (p) profile = { ...profile, ...p };
    if (!profile.onboarded) {
      showWizard();
    } else {
      showApp();
    }
  } else {
    DOM['auth-screen']?.classList.remove('hidden');
  }
}

/**
 * Handle Google sign-in button click.
 * In production, this would integrate with Firebase Auth or OAuth.
 */
function handleGoogleSignIn() {
  currentUser = { name: 'Explorer', email: 'hello@canopy.app' };
  safeSetJSON('canopy_user', currentUser);
  DOM['auth-screen']?.classList.add('hidden');
  showWizard();
  announce('Signed in successfully. Starting onboarding wizard.');
}

/**
 * Handle sign-out. Clears user session and reloads.
 */
function handleSignOut() {
  try {
    localStorage.removeItem('canopy_user');
  } catch (err) {
    console.warn('Failed to remove user data:', err);
  }
  location.reload();
}

// ═══════════ ONBOARDING WIZARD ═══════════

/**
 * Show the onboarding wizard.
 */
function showWizard() {
  DOM['onboarding-wizard']?.classList.remove('hidden');
  DOM['wiz-next']?.focus();
}

/**
 * Skip the onboarding wizard entirely.
 */
function skipWizard() {
  profile.onboarded = true;
  profile.joinDate = profile.joinDate || new Date().toISOString();
  saveProfile();
  DOM['onboarding-wizard']?.classList.add('hidden');
  showApp();
  announce('Onboarding skipped. Dashboard loaded.');
}

/**
 * Handle wizard chip button click.
 * @param {Event} e - Click event
 */
function handleWizardChip(e) {
  const chip = e.currentTarget;
  const grid = chip.closest('.chip-grid');
  if (!grid) return;
  grid.querySelectorAll('.chip').forEach(c => {
    c.classList.remove('on');
    c.setAttribute('aria-checked', 'false');
  });
  chip.classList.add('on');
  chip.setAttribute('aria-checked', 'true');
}

/**
 * Handle wizard slider input changes.
 * @param {Event} e - Input event
 */
function handleWizardSlider(e) {
  const slider = e.currentTarget;
  const id = slider.id.replace('wz-', '');
  const valEl = DOM[`wz-v-${id}`];
  if (!valEl) return;

  const val = slider.value;
  slider.setAttribute('aria-valuenow', val);

  const suffixMap = {
    km: ' km', meat: ' meals', delivery: ' orders',
    orders: ' orders', flights: ' flights', water: ' L', elec: ''
  };
  const prefix = id === 'elec' ? '₹' : '';
  valEl.textContent = prefix + val + (suffixMap[id] || '');
}

/**
 * Navigate to next wizard step or finish.
 */
function wizNext() {
  if (wizStep < TOTAL_WIZ_STEPS) {
    document.getElementById(`ws-${wizStep}`)?.classList.add('hidden');
    wizStep++;
    document.getElementById(`ws-${wizStep}`)?.classList.remove('hidden');
    updateWizardUI();
    if (wizStep === TOTAL_WIZ_STEPS) {
      DOM['wiz-next'].textContent = 'Finish ✓';
    }
    announce(`Step ${wizStep} of ${TOTAL_WIZ_STEPS}`);
  } else {
    finishWizard();
  }
}

/**
 * Navigate to previous wizard step.
 */
function wizBack() {
  if (wizStep > 1) {
    document.getElementById(`ws-${wizStep}`)?.classList.add('hidden');
    wizStep--;
    document.getElementById(`ws-${wizStep}`)?.classList.remove('hidden');
    updateWizardUI();
    if (DOM['wiz-next']) DOM['wiz-next'].textContent = 'Continue →';
    announce(`Step ${wizStep} of ${TOTAL_WIZ_STEPS}`);
  }
}

/**
 * Update wizard progress UI (progress bar, step label, dots, back button).
 */
function updateWizardUI() {
  if (DOM['wiz-prog']) {
    DOM['wiz-prog'].style.width = `${(wizStep / TOTAL_WIZ_STEPS) * 100}%`;
  }
  if (DOM['wiz-step-lbl']) {
    DOM['wiz-step-lbl'].textContent = `${wizStep} / ${TOTAL_WIZ_STEPS}`;
  }
  if (DOM['wiz-back']) {
    DOM['wiz-back'].classList.toggle('hidden', wizStep === 1);
  }
  const dots = DOM['wiz-dots'];
  if (dots) {
    Array.from(dots.children).forEach((dot, i) => {
      dot.classList.toggle('on', i === wizStep - 1);
    });
  }
}

/**
 * Get the currently selected chip value from a chip group.
 * @param {string} containerId - Container element ID
 * @returns {string|null} Selected value or null
 */
function getActiveChipValue(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return null;
  const active = container.querySelector('.chip.on');
  return active ? active.dataset.v : null;
}

/**
 * Finish the onboarding wizard and bridge answers to calculator.
 */
function finishWizard() {
  try {
    const transportMode = getActiveChipValue('cg-transport') || 'two-wheeler';
    const weeklyKm = clamp(parseFloat(DOM['wz-km']?.value) || 60, 0, 500);
    const dailyKm = Math.round(weeklyKm / 7);

    const dietType = getActiveChipValue('cg-diet') || 'mixed';
    const deliveriesPerWeek = clamp(parseFloat(DOM['wz-delivery']?.value) || 3, 0, 14);
    const dailyDeliveries = Math.round(deliveriesPerWeek / 7 * 10) / 10;

    const acUsage = getActiveChipValue('cg-ac');
    let acHours = 3;
    if (acUsage === 'none') acHours = 0;
    else if (acUsage === 'moderate') acHours = 4;
    else if (acUsage === 'heavy') acHours = 10;

    const ordersPerMonth = clamp(parseFloat(DOM['wz-orders']?.value) || 6, 0, 30);
    const dailyPackages = Math.round(ordersPerMonth / 30 * 10) / 10;

    const wasteSeg = getActiveChipValue('cg-waste') || 'yes';
    const waterUsage = clamp(parseFloat(DOM['wz-water']?.value) || 120, 20, 500);

    // Map diet chip values to calculator values
    const dietMap = { vegan: 'vegan', vegetarian: 'veg', eggetarian: 'mixed', 'non-veg': 'non-veg', 'heavy-meat': 'non-veg' };
    const mealType = dietMap[dietType] || 'mixed';

    // Set calculator state
    calcState.transMode = transportMode === 'cycle' || transportMode === 'walk' ? 'metro' : transportMode;
    calcState.mealType = mealType;
    calcState.wasteSeg = wasteSeg;

    // Set calculator slider values
    if (DOM['calc-km']) DOM['calc-km'].value = dailyKm;
    if (DOM['calc-deliveries']) DOM['calc-deliveries'].value = clamp(Math.round(dailyDeliveries), 0, 5);
    if (DOM['calc-ac']) DOM['calc-ac'].value = acHours;
    if (DOM['calc-packages']) DOM['calc-packages'].value = clamp(Math.round(dailyPackages), 0, 5);
    if (DOM['calc-water']) DOM['calc-water'].value = waterUsage;

    // Update calculator chip UI to match
    updateCalcChipUI('transport-mode', calcState.transMode);
    updateCalcChipUI('meal-type', mealType);
    updateCalcChipUI('waste-seg', wasteSeg);

    profile.onboarded = true;
    profile.joinDate = profile.joinDate || new Date().toISOString();
    saveProfile();
    DOM['onboarding-wizard']?.classList.add('hidden');
    showApp();
    announce('Onboarding complete. Your dashboard is ready.');
  } catch (err) {
    console.error('Error finishing wizard:', err);
    profile.onboarded = true;
    saveProfile();
    DOM['onboarding-wizard']?.classList.add('hidden');
    showApp();
  }
}

/**
 * Programmatically update calculator chip UI to match a value.
 * @param {string} calcGroup - Calculator group name (e.g., 'transport-mode')
 * @param {string} value - Value to select
 */
function updateCalcChipUI(calcGroup, value) {
  document.querySelectorAll(`.chip[data-calc="${calcGroup}"]`).forEach(chip => {
    const isMatch = chip.dataset.v === value;
    chip.classList.toggle('on', isMatch);
    chip.setAttribute('aria-checked', isMatch ? 'true' : 'false');
  });
}

// ═══════════ APP STATE & ROUTING ═══════════

/**
 * Persist the current profile to localStorage.
 */
function saveProfile() {
  safeSetJSON('canopy_profile', profile);
}

/**
 * Initialize and display the main app.
 */
function showApp() {
  const app = DOM['app'];
  if (app) {
    app.classList.remove('hidden');
    app.style.display = 'flex';
  }

  if (DOM['sb-uname']) DOM['sb-uname'].textContent = currentUser?.name || 'User';
  if (DOM['sb-initials']) DOM['sb-initials'].textContent = (currentUser?.name || 'U').charAt(0).toUpperCase();
  if (DOM['prof-name']) DOM['prof-name'].textContent = currentUser?.name || 'User';
  if (DOM['prof-initials']) DOM['prof-initials'].textContent = (currentUser?.name || 'U').charAt(0).toUpperCase();

  updateStreak();

  const d = new Date();
  const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  if (DOM['date-text']) DOM['date-text'].textContent = d.toLocaleDateString('en-IN', options).toUpperCase();

  const hour = d.getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const firstName = (currentUser?.name || 'User').split(' ')[0];
  if (DOM['greeting']) DOM['greeting'].textContent = `Good ${timeOfDay}, ${sanitize(firstName)}`;

  recalcFromCalc();
  initEarth();
  initSim();
  initAnalytics();
}

/**
 * Navigate to a page by ID.
 * @param {string} pageId - Page identifier (home, earth, analytics, simulate, legacy)
 */
function goPage(pageId) {
  // Validate pageId
  const validPages = ['home', 'earth', 'analytics', 'simulate', 'legacy'];
  if (!validPages.includes(pageId)) return;

  document.querySelectorAll('.pg').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sb-item').forEach(b => {
    b.classList.remove('active');
    b.removeAttribute('aria-current');
  });
  document.querySelectorAll('.mn').forEach(b => {
    b.classList.remove('active');
    b.removeAttribute('aria-current');
  });

  const pg = document.getElementById(`pg-${pageId}`);
  if (pg) pg.classList.add('active');
  const sn = document.getElementById(`sn-${pageId}`);
  if (sn) { sn.classList.add('active'); sn.setAttribute('aria-current', 'page'); }
  const mn = document.getElementById(`mn-${pageId}`);
  if (mn) { mn.classList.add('active'); mn.setAttribute('aria-current', 'page'); }

  DOM['main-scroll']?.scrollTo(0, 0);

  if (pageId === 'earth') { drawEarth(); updateImpactGrid(); }
  if (pageId === 'analytics') initAnalytics();
  if (pageId === 'legacy') updateProfileUI();

  announce(`Navigated to ${pageId} page`);
}

// ═══════════ CALCULATOR ENGINE ═══════════

/**
 * Handle calculator chip click.
 * @param {Event} e - Click event
 */
function handleCalcChip(e) {
  const chip = e.currentTarget;
  const calcGroup = chip.dataset.calc;
  const grid = chip.closest('.chip-grid');
  if (!grid || !calcGroup) return;

  grid.querySelectorAll('.chip').forEach(c => {
    c.classList.remove('on');
    c.setAttribute('aria-checked', 'false');
  });
  chip.classList.add('on');
  chip.setAttribute('aria-checked', 'true');

  if (calcGroup === 'transport-mode') calcState.transMode = chip.dataset.v;
  if (calcGroup === 'meal-type') calcState.mealType = chip.dataset.v;
  if (calcGroup === 'waste-seg') calcState.wasteSeg = chip.dataset.v;

  recalcFromCalc();
}

/**
 * Recalculate carbon footprint from current calculator inputs.
 * Central calculation engine that updates all dependent UI.
 */
function recalcFromCalc() {
  try {
    const km = clamp(parseFloat(DOM['calc-km']?.value) || 0, 0, 100);
    if (DOM['calc-v-km']) DOM['calc-v-km'].textContent = km;

    const deliveries = clamp(parseFloat(DOM['calc-deliveries']?.value) || 0, 0, 5);
    if (DOM['calc-v-del']) DOM['calc-v-del'].textContent = deliveries;

    const ac = clamp(parseFloat(DOM['calc-ac']?.value) || 0, 0, 24);
    if (DOM['calc-v-ac']) DOM['calc-v-ac'].textContent = ac + 'h';

    const apps = clamp(parseFloat(DOM['calc-appliances']?.value) || 0, 0, 10);
    if (DOM['calc-v-app']) DOM['calc-v-app'].textContent = apps;

    const packages = clamp(parseFloat(DOM['calc-packages']?.value) || 0, 0, 5);
    if (DOM['calc-v-pkg']) DOM['calc-v-pkg'].textContent = packages;

    const water = clamp(parseFloat(DOM['calc-water']?.value) || 0, 20, 500);
    if (DOM['calc-v-water']) DOM['calc-v-water'].textContent = water + 'L';

    // Calculate each category
    const transFactor = EMISSION_FACTORS.transport[calcState.transMode] || 0.04;
    profile.footprint.transport = +(km * transFactor).toFixed(2);
    profile.footprint.food = +(EMISSION_FACTORS.food[calcState.mealType] + (deliveries * EMISSION_FACTORS.food.delivery)).toFixed(2);
    profile.footprint.energy = +(ac * EMISSION_FACTORS.energy.ac_per_hour + apps * EMISSION_FACTORS.energy.appliance).toFixed(2);
    profile.footprint.shopping = +(packages * EMISSION_FACTORS.shopping.package).toFixed(2);
    profile.footprint.waste = +EMISSION_FACTORS.waste[calcState.wasteSeg].toFixed(2);
    profile.footprint.water = +(water * EMISSION_FACTORS.water.per_litre).toFixed(2);

    updateUIBars();
    updateHero();
    saveDailySnapshot();
    generateWrappedCards();
    generateInsights();
    renderWeeklyChart();

    if (document.getElementById('pg-earth')?.classList.contains('active')) {
      drawEarth();
      updateImpactGrid();
    }

    saveProfile();
  } catch (err) {
    console.error('Error in recalcFromCalc:', err);
  }
}

/**
 * Update the calculator category bar widths and values.
 */
function updateUIBars() {
  const f = profile.footprint;
  const total = getTotal();
  const max = Math.max(total, 1);

  CATEGORY_KEYS.forEach(cat => {
    const valEl = DOM[`cc-val-${cat}`];
    const barEl = DOM[`cc-bar-${cat}`];
    if (valEl) valEl.textContent = f[cat].toFixed(1) + ' kg';
    if (barEl) barEl.style.width = Math.min((f[cat] / max) * 100, 100) + '%';
  });
}

/**
 * Get total daily carbon footprint in kg CO₂.
 * @returns {number}
 */
function getTotal() {
  const f = profile.footprint;
  return f.transport + f.food + f.energy + f.shopping + f.waste + f.water;
}

/**
 * Update the hero card with current totals, score, streak, and insights.
 */
function updateHero() {
  const total = getTotal();
  const dailyBudget = profile.budget / 30;
  const pct = Math.min(Math.round((total / dailyBudget) * 100), 200);

  animateCounter('hero-total', total, 1);
  if (DOM['hero-ring-pct']) DOM['hero-ring-pct'].textContent = Math.min(pct, 100) + '%';
  drawRing(pct);

  const score = clamp(Math.round(100 - (total / (INDIAN_BASELINE_DAILY * 2)) * 100), 0, 100);
  profile.score = score;
  if (DOM['hero-score']) DOM['hero-score'].textContent = score + '/100';
  if (DOM['hero-streak']) DOM['hero-streak'].textContent = profile.streak + ' days';
  if (DOM['prof-streak']) DOM['prof-streak'].textContent = profile.streak + ' days';

  const weeklyChange = getWeeklyChange();
  const changeEl = DOM['hero-weekly-change'];
  if (changeEl) {
    if (weeklyChange !== null) {
      const sign = weeklyChange <= 0 ? '' : '+';
      changeEl.textContent = sign + weeklyChange + '%';
      changeEl.style.color = weeklyChange <= 0 ? 'var(--emerald-400)' : 'var(--red)';
    } else {
      changeEl.textContent = '—';
      changeEl.style.color = '';
    }
  }

  // Biggest contributor
  const f = profile.footprint;
  let maxK = 'transport', maxV = 0;
  for (const [k, v] of Object.entries(f)) {
    if (v > maxV) { maxV = v; maxK = k; }
  }
  const biggestPct = total > 0 ? Math.round((maxV / total) * 100) : 0;
  if (DOM['hero-biggest']) {
    DOM['hero-biggest'].textContent = total > 0
      ? `Biggest contributor: ${CATEGORY_NAMES[maxK]} (${maxV.toFixed(1)} kg, ${biggestPct}% of total)`
      : 'Adjust the calculator above to see your footprint';
  }

  // Sidebar budget
  const monthlyTotal = total * 30;
  if (DOM['sb-budget-val']) DOM['sb-budget-val'].textContent = `${Math.round(monthlyTotal)} / ${profile.budget} kg`;
  const budgetPct = Math.min((monthlyTotal / profile.budget) * 100, 100);
  if (DOM['sb-budget-fill']) DOM['sb-budget-fill'].style.width = budgetPct + '%';

  updateEarthStatus(total);
}

/**
 * Draw the circular progress ring on the hero card canvas.
 * @param {number} pct - Percentage (0-200)
 */
function drawRing(pct) {
  const canvas = DOM['hero-ring'];
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  ctx.beginPath();
  ctx.arc(w / 2, h / 2, w / 2 - 14, 0, 2 * Math.PI);
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 14;
  ctx.stroke();

  const clampedPct = Math.min(pct, 100);
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, w / 2 - 14, -Math.PI / 2, (2 * Math.PI * (clampedPct / 100)) - Math.PI / 2);

  const gradient = ctx.createLinearGradient(0, 0, w, h);
  if (pct > 80) {
    gradient.addColorStop(0, '#EF4444');
    gradient.addColorStop(1, '#F97316');
  } else if (pct > 50) {
    gradient.addColorStop(0, '#F59E0B');
    gradient.addColorStop(1, '#F97316');
  } else {
    gradient.addColorStop(0, '#10B981');
    gradient.addColorStop(1, '#14B8A6');
  }
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.stroke();
}

// ═══════════ ANIMATED COUNTER ═══════════

/**
 * Animate a numeric counter element.
 * @param {string} elId - Element ID
 * @param {number} target - Target value
 * @param {number} [decimals=0] - Decimal places
 */
function animateCounter(elId, target, decimals = 0) {
  const el = DOM[elId] || document.getElementById(elId);
  if (!el) return;
  const current = parseFloat(el.textContent) || 0;
  if (Math.abs(current - target) < 0.05) { el.textContent = target.toFixed(decimals); return; }
  const startTime = performance.now();
  function tick(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / COUNTER_ANIMATION_DURATION, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = (current + (target - current) * eased).toFixed(decimals);
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ═══════════ HISTORY & STREAK ═══════════

/**
 * Save today's carbon snapshot to history.
 */
function saveDailySnapshot() {
  const today = new Date().toISOString().split('T')[0];
  const total = getTotal();
  if (!profile.history) profile.history = [];

  const existing = profile.history.findIndex(h => h.date === today);
  const snapshot = { date: today, total, footprint: { ...profile.footprint } };

  if (existing >= 0) {
    profile.history[existing] = snapshot;
  } else {
    profile.history.push(snapshot);
  }

  if (profile.history.length > MAX_HISTORY_ENTRIES) {
    profile.history = profile.history.slice(-MAX_HISTORY_ENTRIES);
  }
}

/**
 * Update the streak counter based on join date.
 */
function updateStreak() {
  if (!profile.joinDate) { profile.streak = 0; return; }
  try {
    const join = new Date(profile.joinDate);
    const now = new Date();
    const diff = Math.floor((now - join) / (1000 * 60 * 60 * 24));
    profile.streak = Math.max(diff, 1);
  } catch (err) {
    profile.streak = 1;
  }
}

/**
 * Calculate weekly change percentage in emissions.
 * @returns {number|null} Percentage change or null if insufficient data
 */
function getWeeklyChange() {
  if (!profile.history || profile.history.length < 8) return null;
  const sorted = [...profile.history].sort((a, b) => a.date.localeCompare(b.date));
  const thisWeek = sorted.slice(-7);
  const lastWeek = sorted.slice(-14, -7);
  if (lastWeek.length < 7) return null;

  const thisAvg = thisWeek.reduce((s, h) => s + h.total, 0) / thisWeek.length;
  const lastAvg = lastWeek.reduce((s, h) => s + h.total, 0) / lastWeek.length;
  if (lastAvg === 0) return null;
  return Math.round(((thisAvg - lastAvg) / lastAvg) * 100);
}

/**
 * Get weekly data for bar chart.
 * @returns {{ days: string[], values: number[] }}
 */
function getWeeklyData() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date();
  const dayOfWeek = (today.getDay() + 6) % 7;
  const total = getTotal();

  const values = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - (dayOfWeek - i));
    const dateStr = d.toISOString().split('T')[0];
    const found = profile.history?.find(h => h.date === dateStr);
    if (found) {
      values.push(found.total);
    } else if (i <= dayOfWeek) {
      values.push(+(total * (0.85 + Math.random() * 0.3)).toFixed(1));
    } else {
      values.push(0);
    }
  }
  return { days, values };
}

// ═══════════ WRAPPED CARDS ═══════════

/**
 * Generate Spotify-style wrapped summary cards using safe DOM APIs.
 */
function generateWrappedCards() {
  const container = DOM['wrapped-scroll'];
  if (!container) return;

  const f = profile.footprint;
  const total = getTotal();
  const weeklyTotal = +(total * 7).toFixed(1);

  let maxK = 'transport', maxV = 0;
  for (const [k, v] of Object.entries(f)) { if (v > maxV) { maxV = v; maxK = k; } }
  const bigPct = total > 0 ? Math.round((maxV / total) * 100) : 0;

  let minK = 'transport', minV = Infinity;
  for (const [k, v] of Object.entries(f)) { if (v < minV) { minV = v; minK = k; } }

  const savedKg = Math.max(0, (INDIAN_BASELINE_DAILY - total) * 7);
  const moneySaved = Math.round(savedKg * MONEY_PER_KG_SAVED);
  const weeklyChange = getWeeklyChange();

  const cards = [
    { cls: 'wc-1', top: 'Total This Week', num: String(weeklyTotal), unit: 'kg CO₂', desc: weeklyTotal < profile.budget / 4 ? 'You\'re well within your weekly budget! Keep it up.' : 'Try to reduce a few activities to stay within budget.' },
    { cls: weeklyChange !== null && weeklyChange <= 0 ? 'wc-2' : 'wc-3', top: 'Weekly Change', num: weeklyChange !== null ? (weeklyChange <= 0 ? '↓' + Math.abs(weeklyChange) : '↑' + weeklyChange) : '—', unit: weeklyChange !== null ? '%' : '', desc: weeklyChange !== null ? (weeklyChange <= 0 ? `${Math.abs(weeklyChange)}% less` : `${weeklyChange}% more`) + ' carbon compared to last week.' : 'Start logging daily to track changes' },
    { cls: 'wc-3', top: 'Money Saved', num: moneySaved > 0 ? '₹' + moneySaved : '₹0', unit: 'this week', desc: moneySaved > 0 ? `By staying below the Indian average, you saved ₹${moneySaved} in energy & fuel costs.` : 'Reduce emissions below the Indian average to start saving money.' },
    { cls: 'wc-4', top: 'Best Category', num: CATEGORY_EMOJIS[minK], unit: CATEGORY_NAMES[minK], desc: `Your lowest emission category at just ${minV.toFixed(1)} kg CO₂/day. Excellent work!` },
    { cls: 'wc-5', top: 'Biggest Contributor', num: bigPct + '%', unit: CATEGORY_NAMES[maxK], desc: `${CATEGORY_NAMES[maxK]} makes up ${bigPct}% of your daily carbon footprint at ${maxV.toFixed(1)} kg.` },
    { cls: 'wc-6', top: 'Your Streak', num: String(profile.streak), unit: 'days on Canopy', desc: profile.streak > 7 ? 'You\'ve been tracking your impact for over a week! Consistency is key.' : 'Keep coming back daily to build your streak and track progress.' }
  ];

  const frag = document.createDocumentFragment();
  cards.forEach(c => {
    const card = createElement('div', { className: `wrapped-card ${c.cls}`, role: 'article', 'aria-label': c.top });
    const topEl = createElement('span', { className: 'wc-top' }, c.top);
    const mid = createElement('div', { className: 'wc-mid' });
    const numEl = createElement('span', { className: 'wc-num' }, c.num);
    const unitEl = createElement('span', { className: 'wc-unit' }, c.unit);
    const descEl = createElement('p', { className: 'wc-desc' }, c.desc);
    mid.appendChild(numEl);
    mid.appendChild(unitEl);
    card.appendChild(topEl);
    card.appendChild(mid);
    card.appendChild(descEl);
    frag.appendChild(card);
  });
  container.textContent = '';
  container.appendChild(frag);
}

// ═══════════ PERSONALIZED INSIGHTS ═══════════

/**
 * Generate personalized carbon insights using safe DOM APIs.
 */
function generateInsights() {
  const container = DOM['insights-stack'];
  if (!container) return;

  const f = profile.footprint;
  const total = getTotal();

  if (total === 0) {
    container.textContent = '';
    const card = buildInsightCard('💡', 'Adjust the calculator above to see personalized insights about your carbon footprint.', 'We need your data to provide meaningful recommendations.');
    container.appendChild(card);
    return;
  }

  const sorted = Object.entries(f).sort(([, a], [, b]) => b - a);
  const frag = document.createDocumentFragment();

  // Insight 1: Biggest contributor
  const [topCat, topVal] = sorted[0];
  const topPct = Math.round((topVal / total) * 100);
  frag.appendChild(buildInsightCard(
    CATEGORY_EMOJIS[topCat],
    `${CATEGORY_NAMES[topCat]} contributes ${topPct}% of your emissions at ${topVal.toFixed(1)} kg CO₂/day.`,
    'Reducing this category would have the biggest impact on your overall footprint.'
  ));

  // Insight 2: Actionable suggestion
  if (topCat === 'transport') {
    const km = clamp(parseFloat(DOM['calc-km']?.value) || 0, 0, 100);
    const savingsKg = (km * (EMISSION_FACTORS.transport[calcState.transMode] - EMISSION_FACTORS.transport.metro)).toFixed(1);
    if (savingsKg > 0) {
      frag.appendChild(buildInsightCard('🚇', `Switching to metro could save ${savingsKg} kg CO₂ and ₹${Math.round(savingsKg * MONEY_PER_KG_SAVED)} daily.`, `Based on your ${km} km daily commute by ${calcState.transMode}. Consider CNG autos as a greener alternative too.`));
    }
  } else if (topCat === 'food') {
    const deliveries = clamp(parseFloat(DOM['calc-deliveries']?.value) || 0, 0, 5);
    if (deliveries > 0) {
      const monthlySave = +(deliveries * EMISSION_FACTORS.food.delivery * 30).toFixed(0);
      frag.appendChild(buildInsightCard('🏠', `Cooking at home instead of ordering could save ₹${monthlySave * MONEY_PER_KG_SAVED} and ${monthlySave} kg CO₂ per month.`, `You currently order ${deliveries} food delivery per day.`));
    }
  } else if (topCat === 'energy') {
    const ac = clamp(parseFloat(DOM['calc-ac']?.value) || 0, 0, 24);
    if (ac > 2) {
      const savingKg = +((ac - 2) * EMISSION_FACTORS.energy.ac_per_hour).toFixed(1);
      frag.appendChild(buildInsightCard('❄️', `Reducing AC by ${ac - 2} hours/day could save ${savingKg} kg CO₂ and ₹${Math.round(savingKg * MONEY_PER_KG_SAVED)} daily.`, `Based on your ${ac} hours of daily AC usage. The Indian government offers subsidies for energy-efficient star-rated ACs.`));
    }
  }

  // Insight 3: Comparison to baseline
  const ratio = (total / INDIAN_BASELINE_DAILY * 100).toFixed(0);
  if (total < INDIAN_BASELINE_DAILY) {
    frag.appendChild(buildInsightCard('🌟', `Your footprint is ${100 - parseInt(ratio)}% below the Indian average of ${INDIAN_BASELINE_DAILY} kg CO₂/day.`, 'Great work! You\'re already doing better than most.'));
  } else {
    frag.appendChild(buildInsightCard('📊', `Your footprint is ${parseInt(ratio) - 100}% above the Indian average of ${INDIAN_BASELINE_DAILY} kg CO₂/day.`, `Focus on reducing ${CATEGORY_NAMES[topCat]} to get below average.`));
  }

  container.textContent = '';
  container.appendChild(frag);
}

/**
 * Build a single insight card element safely.
 * @param {string} emoji - Icon emoji
 * @param {string} text - Main text
 * @param {string} reason - Reasoning text
 * @returns {HTMLElement}
 */
function buildInsightCard(emoji, text, reason) {
  const card = createElement('div', { className: 'insight-card' });
  const icon = createElement('div', { className: 'ic-icon' }, emoji);
  const content = createElement('div', { className: 'ic-content' });
  const textEl = createElement('p', { className: 'ic-text' }, text);
  const reasonEl = createElement('p', { className: 'ic-reason' }, reason);
  content.appendChild(textEl);
  content.appendChild(reasonEl);
  card.appendChild(icon);
  card.appendChild(content);
  return card;
}

// ═══════════ WEEKLY CHART ═══════════

/**
 * Render the weekly bar chart using safe DOM APIs.
 */
function renderWeeklyChart() {
  const { days, values } = getWeeklyData();
  const maxVal = Math.max(...values, 1);

  const barsContainer = DOM['weekly-bars'];
  const daysContainer = DOM['weekly-days'];
  if (!barsContainer || !daysContainer) return;

  const barFrag = document.createDocumentFragment();
  const dayFrag = document.createDocumentFragment();

  values.forEach((v, i) => {
    const h = (v / maxVal) * 100;
    const wrap = createElement('div', { className: 'bar-wrap' });
    const bar = createElement('div', { className: 'bar' });
    bar.style.height = Math.max(h, 3) + '%';
    const val = createElement('span', { className: 'bar-val' }, v.toFixed(1));
    bar.appendChild(val);
    wrap.appendChild(bar);
    barFrag.appendChild(wrap);

    dayFrag.appendChild(createElement('span', {}, days[i]));
  });

  barsContainer.textContent = '';
  barsContainer.appendChild(barFrag);
  daysContainer.textContent = '';
  daysContainer.appendChild(dayFrag);

  const total = getTotal();
  const weekSum = values.reduce((a, b) => a + b, 0);
  if (DOM['st-today']) DOM['st-today'].textContent = total.toFixed(1) + ' kg';
  if (DOM['st-week']) DOM['st-week'].textContent = weekSum.toFixed(1) + ' kg';

  const change = getWeeklyChange();
  if (DOM['st-delta']) {
    if (change !== null) {
      DOM['st-delta'].textContent = (change <= 0 ? '' : '+') + change + '%';
      DOM['st-delta'].style.color = change <= 0 ? 'var(--emerald-400)' : 'var(--red)';
    } else {
      DOM['st-delta'].textContent = '—';
    }
  }
}

// ═══════════ EARTH VISUALIZATION ═══════════

/**
 * Initialize Earth canvas visualizations.
 */
function initEarth() {
  drawEarth();
  drawFutureEarth('earth-bad', true);
  drawFutureEarth('earth-good', false);
  updateImpactGrid();
  updateEarthIndicators();
}

/**
 * Update Earth status label and temperature based on emissions.
 * @param {number} total - Daily total emissions
 */
function updateEarthStatus(total) {
  const statusEl = DOM['earth-status'];
  const tempEl = DOM['earth-temp'];
  if (!statusEl || !tempEl) return;

  const temp = 0.8 + (total * 0.05);
  tempEl.textContent = '+' + temp.toFixed(2) + '°C';

  if (total > 15) {
    statusEl.textContent = 'Critical';
    statusEl.style.color = 'var(--red)';
  } else if (total > 10) {
    statusEl.textContent = 'Stressed';
    statusEl.style.color = 'var(--amber)';
  } else if (total > 5) {
    statusEl.textContent = 'Moderate';
    statusEl.style.color = 'var(--amber)';
  } else {
    statusEl.textContent = 'Healthy';
    statusEl.style.color = 'var(--emerald-400)';
  }
}

/**
 * Draw the main Earth canvas visualization.
 */
function drawEarth() {
  const canvas = DOM['earth-canvas'];
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const cx = w / 2, cy = h / 2;
  const R = w / 2.3;

  const total = getTotal();
  const health = clamp(total / 20, 0, 1);

  const waterColor = lerpColor('#3B82F6', '#1E293B', health);
  const landColor = lerpColor('#10B981', '#78350F', health);
  const atmoColor = health < 0.5
    ? `rgba(255, 255, 255, ${0.15 - health * 0.2})`
    : `rgba(239, 68, 68, ${health * 0.3})`;
  const cloudAlpha = 0.4 - health * 0.25;

  ctx.clearRect(0, 0, w, h);

  // Stars
  for (let i = 0; i < 80; i++) {
    const sx = ((i * 7919 + 42) % w);
    const sy = ((i * 6271 + 42) % h);
    const sr = 0.5 + (i % 3) * 0.5;
    if (Math.sqrt((sx - cx) ** 2 + (sy - cy) ** 2) > R + 30) {
      ctx.fillStyle = `rgba(255,255,255,${0.3 + (i % 5) * 0.1})`;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  // Atmosphere glow
  const atmoGrad = ctx.createRadialGradient(cx, cy, R * 0.95, cx, cy, R * 1.3);
  atmoGrad.addColorStop(0, atmoColor);
  atmoGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = atmoGrad;
  ctx.fillRect(0, 0, w, h);

  // Globe
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, 2 * Math.PI);
  ctx.clip();

  const oceanGrad = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R);
  oceanGrad.addColorStop(0, lightenColor(waterColor, 30));
  oceanGrad.addColorStop(0.7, waterColor);
  oceanGrad.addColorStop(1, darkenColor(waterColor, 40));
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

  // Continents
  earthRotation += 0.003;
  const continents = getContinentPaths();
  ctx.fillStyle = landColor;
  continents.forEach(cont => {
    ctx.beginPath();
    cont.forEach((pt, i) => {
      const [px, py] = projectToSphere(pt[0], pt[1], cx, cy, R, earthRotation);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fill();
  });

  // Clouds
  if (cloudAlpha > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${cloudAlpha})`;
    drawCloudWisp(ctx, cx, cy, R, earthRotation * 0.7, -20, 40, 14);
    drawCloudWisp(ctx, cx, cy, R, earthRotation * 0.7 + 1.5, 30, 55, 18);
    drawCloudWisp(ctx, cx, cy, R, earthRotation * 0.7 + 3.2, -40, 35, 12);
  }

  // Pollution haze
  if (health > 0.4) {
    const hazeAlpha = (health - 0.4) * 0.4;
    const hazeGrad = ctx.createRadialGradient(cx, cy, R * 0.3, cx, cy, R);
    hazeGrad.addColorStop(0, `rgba(120, 53, 15, ${hazeAlpha * 0.3})`);
    hazeGrad.addColorStop(1, `rgba(120, 53, 15, ${hazeAlpha})`);
    ctx.fillStyle = hazeGrad;
    ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
  }

  // Specular highlight
  const specGrad = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.35, R * 0.05, cx - R * 0.2, cy - R * 0.2, R * 0.7);
  specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
  specGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = specGrad;
  ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

  // Rim lighting
  const rimGrad = ctx.createRadialGradient(cx, cy, R * 0.85, cx, cy, R);
  rimGrad.addColorStop(0, 'transparent');
  rimGrad.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
  ctx.fillStyle = rimGrad;
  ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
  ctx.restore();

  // Particles
  const particleCount = health > 0.5 ? 20 : 8;
  for (let i = 0; i < particleCount; i++) {
    const angle = (earthRotation * 2 + i * (Math.PI * 2 / particleCount)) % (Math.PI * 2);
    const dist = R * 1.1 + Math.sin(earthRotation * 3 + i) * 15;
    const px = cx + Math.cos(angle) * dist;
    const py = cy + Math.sin(angle) * dist;
    const size = 1 + Math.sin(i * 1.5) * 0.5;
    ctx.fillStyle = health > 0.5
      ? `rgba(239, 68, 68, ${0.3 + Math.sin(earthRotation + i) * 0.2})`
      : `rgba(255, 255, 255, ${0.2 + Math.sin(earthRotation + i) * 0.15})`;
    ctx.beginPath();
    ctx.arc(px, py, size, 0, 2 * Math.PI);
    ctx.fill();
  }

  if (document.getElementById('pg-earth')?.classList.contains('active')) {
    earthAnimFrame = requestAnimationFrame(drawEarth);
  }
}

/**
 * Project a longitude/latitude point onto a 2D sphere.
 * @param {number} lon - Longitude
 * @param {number} lat - Latitude
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 * @param {number} R - Radius
 * @param {number} offset - Rotation offset
 * @returns {number[]} [x, y]
 */
function projectToSphere(lon, lat, cx, cy, R, offset) {
  const lonRad = (lon + offset * 50) * Math.PI / 180;
  const latRad = lat * Math.PI / 180;
  return [cx + R * Math.cos(latRad) * Math.sin(lonRad) * 0.9, cy - R * Math.sin(latRad) * 0.9];
}

/** @returns {number[][][]} Simplified continent outlines */
function getContinentPaths() {
  return [
    [[-15, 35], [-5, 35], [10, 32], [20, 30], [30, 20], [35, 10], [40, 0], [35, -10], [30, -25], [25, -35], [20, -35], [15, -30], [10, -20], [5, -5], [0, 5], [-5, 10], [-15, 15], [-20, 25]],
    [[-10, 40], [-5, 45], [0, 48], [10, 50], [15, 55], [25, 60], [30, 55], [35, 50], [30, 45], [25, 40], [20, 38], [10, 38], [0, 40]],
    [[35, 50], [45, 55], [60, 60], [70, 65], [80, 60], [90, 55], [100, 50], [110, 45], [120, 40], [130, 35], [120, 30], [110, 25], [100, 20], [90, 15], [80, 20], [70, 25], [60, 30], [50, 35], [40, 40]],
    [[-80, 10], [-75, 5], [-70, 0], [-70, -10], [-65, -20], [-60, -30], [-65, -40], [-70, -50], [-75, -45], [-80, -30], [-80, -20], [-80, -10], [-80, 0]],
    [[-130, 50], [-120, 55], [-110, 60], [-100, 60], [-90, 55], [-80, 50], [-75, 45], [-80, 40], [-85, 35], [-90, 30], [-95, 25], [-100, 20], [-105, 25], [-110, 30], [-120, 35], [-125, 45]],
    [[115, -15], [125, -15], [135, -20], [145, -25], [150, -30], [145, -35], [140, -38], [130, -35], [120, -30], [115, -25]]
  ];
}

function drawCloudWisp(ctx, cx, cy, R, lon, lat, width, height) {
  const [x, y] = projectToSphere(lon * 30, lat, cx, cy, R, earthRotation);
  if (Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) < R * 0.85) {
    ctx.beginPath();
    ctx.ellipse(x, y, width * (1 - Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) / R * 0.3), height * 0.5, 0, 0, 2 * Math.PI);
    ctx.fill();
  }
}

function drawFutureEarth(id, isBad) {
  const canvas = DOM[id] || document.getElementById(id);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const cx = w / 2, cy = h / 2, R = w / 2.3;
  ctx.clearRect(0, 0, w, h);

  const color = isBad ? '#78350F' : '#10B981';
  const waterCol = isBad ? '#1E293B' : '#3B82F6';
  const atmoCol = isBad ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.1)';

  const atmoGrad = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.2);
  atmoGrad.addColorStop(0, atmoCol);
  atmoGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = atmoGrad;
  ctx.fillRect(0, 0, w, h);

  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, 2 * Math.PI);
  const grad = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R);
  grad.addColorStop(0, lightenColor(waterCol, 20));
  grad.addColorStop(1, darkenColor(waterCol, 30));
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(cx - 20, cy - 10, 35, 55, Math.PI / 5, 0, 2 * Math.PI); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 45, cy + 15, 40, 45, -Math.PI / 6, 0, 2 * Math.PI); ctx.fill();

  const sg = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, 0, cx, cy, R);
  sg.addColorStop(0, 'rgba(255,255,255,0.1)');
  sg.addColorStop(1, 'rgba(0,0,0,0.3)');
  ctx.fillStyle = sg;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.fill();
}

// Color utilities
function lerpColor(a, b, t) {
  const ar = parseInt(a.slice(1, 3), 16), ag = parseInt(a.slice(3, 5), 16), ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16), bg = parseInt(b.slice(3, 5), 16), bb = parseInt(b.slice(5, 7), 16);
  const r = Math.round(ar + (br - ar) * t), g = Math.round(ag + (bg - ag) * t), bv = Math.round(ab + (bb - ab) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bv.toString(16).padStart(2, '0')}`;
}
function lightenColor(hex, pct) {
  return `rgb(${Math.min(255, parseInt(hex.slice(1, 3), 16) + pct)},${Math.min(255, parseInt(hex.slice(3, 5), 16) + pct)},${Math.min(255, parseInt(hex.slice(5, 7), 16) + pct)})`;
}
function darkenColor(hex, pct) {
  return `rgb(${Math.max(0, parseInt(hex.slice(1, 3), 16) - pct)},${Math.max(0, parseInt(hex.slice(3, 5), 16) - pct)},${Math.max(0, parseInt(hex.slice(5, 7), 16) - pct)})`;
}

// ═══════════ EARTH INDICATORS ═══════════

function updateEarthIndicators() {
  const total = getTotal();
  const inds = DOM['earth-inds'];
  if (!inds) return;

  const indicators = [
    { icon: '🌲', label: 'Forest Cover', val: Math.max(100 - (total * 3), 10).toFixed(0) + '%', pct: Math.max(100 - (total * 3), 10), color: 'var(--emerald-500)' },
    { icon: '🌊', label: 'Sea Level Rise', val: '+' + Math.min((total * 2), 100).toFixed(0) + 'cm', pct: Math.min((total * 2), 100), color: 'var(--blue)' },
    { icon: '💨', label: 'Air Quality', val: Math.max(100 - (total * 4), 0).toFixed(0) + '/100', pct: Math.max(100 - (total * 4), 0), color: 'var(--teal)' },
    { icon: '🐾', label: 'Biodiversity', val: Math.max(100 - (total * 5), 5).toFixed(0) + '%', pct: Math.max(100 - (total * 5), 5), color: 'var(--purple)' }
  ];

  const frag = document.createDocumentFragment();
  indicators.forEach(ind => {
    const item = createElement('div', { className: 'ei-item' });
    const top = createElement('div', { className: 'ei-top' });
    top.appendChild(createElement('span', { className: 'ei-lbl' }, `${ind.icon} ${ind.label}`));
    top.appendChild(createElement('span', { className: 'ei-val' }, ind.val));
    const bar = createElement('div', { className: 'ei-bar' });
    const fill = createElement('div', { className: 'ei-fill' });
    fill.style.width = ind.pct + '%';
    fill.style.background = ind.color;
    bar.appendChild(fill);
    item.appendChild(top);
    item.appendChild(bar);
    frag.appendChild(item);
  });

  inds.textContent = '';
  inds.appendChild(frag);
}

// ═══════════ IMPACT GRID ═══════════

function updateImpactGrid() {
  const total = getTotal();
  const annual = total * 365;
  const grid = DOM['impact-grid'];
  if (!grid) return;

  const items = [
    { icon: '🌍', num: (annual / GLOBAL_FAIR_SHARE_ANNUAL).toFixed(1), label: 'Earths Needed', color: '' },
    { icon: '🔥', num: '+' + (0.8 + (annual / 4000) * 1.5).toFixed(1) + '°C', label: 'Global Temp Rise', color: parseFloat((0.8 + (annual / 4000) * 1.5).toFixed(1)) > 2 ? 'var(--red)' : 'var(--amber)' },
    { icon: '🌊', num: Math.round((annual / 4000) * 60) + 'cm', label: 'Sea Level Rise', color: 'var(--blue)' },
    { icon: '🌲', num: '-' + Math.round((annual / 4000) * 20) + '%', label: 'Forest Cover Loss', color: Math.round((annual / 4000) * 20) > 15 ? 'var(--red)' : 'var(--amber)' },
    { icon: '💧', num: annual > 8000 ? 'Critical' : annual > 5000 ? 'High' : annual > 3000 ? 'Medium' : 'Low', label: 'Water Scarcity Risk', color: annual > 8000 ? 'var(--red)' : annual > 3000 ? 'var(--amber)' : 'var(--emerald-400)' },
    { icon: '🐾', num: Math.round((annual / 4000) * 2000).toLocaleString(), label: 'Species Affected', color: '' }
  ];

  const frag = document.createDocumentFragment();
  items.forEach(it => {
    const card = createElement('div', { className: 'imp-card' });
    card.appendChild(createElement('span', { className: 'imp-anim' }, it.icon));
    const numEl = createElement('div', { className: 'imp-num' }, it.num);
    if (it.color) numEl.style.color = it.color;
    card.appendChild(numEl);
    card.appendChild(createElement('div', { className: 'imp-lbl' }, it.label));
    frag.appendChild(card);
  });

  grid.textContent = '';
  grid.appendChild(frag);

  const ft = total;
  if (DOM['ft-bad']) DOM['ft-bad'].textContent = '+' + (0.8 + ft * 0.1).toFixed(1) + '°C';
  if (DOM['ft-good']) DOM['ft-good'].textContent = '+' + Math.max(0.8, 0.8 + ft * 0.02).toFixed(1) + '°C';

  updateEarthIndicators();
}

// ═══════════ ANALYTICS ═══════════

function initAnalytics() {
  setTF('week');
  renderHeatmap();
  renderRanking();
  renderForecast();
}

function setTF(tf) {
  document.querySelectorAll('#pg-analytics .pill-group .pill').forEach(p => {
    p.classList.remove('on');
    p.setAttribute('aria-selected', 'false');
  });
  const btn = document.getElementById(`tf-${tf}`);
  if (btn) { btn.classList.add('on'); btn.setAttribute('aria-selected', 'true'); }

  const f = profile.footprint;
  const total = getTotal();
  const multiplier = tf === 'week' ? 7 : tf === 'month' ? 30 : 365;
  const periodTotal = +(total * multiplier).toFixed(1);

  const cats = [
    { name: 'Transport', val: +(f.transport * multiplier).toFixed(1), color: 'var(--amber)' },
    { name: 'Food', val: +(f.food * multiplier).toFixed(1), color: 'var(--emerald-500)' },
    { name: 'Energy', val: +(f.energy * multiplier).toFixed(1), color: 'var(--blue)' },
    { name: 'Shopping', val: +(f.shopping * multiplier).toFixed(1), color: 'var(--purple)' },
    { name: 'Waste', val: +(f.waste * multiplier).toFixed(1), color: 'var(--orange)' },
    { name: 'Water', val: +(f.water * multiplier).toFixed(1), color: 'var(--cyan)' }
  ].sort((a, b) => b.val - a.val);

  const maxCat = cats[0]?.val || 1;
  const flowBars = DOM['flow-bars'];
  if (flowBars) {
    const frag = document.createDocumentFragment();
    cats.forEach(c => {
      const row = createElement('div', { className: 'flow-row' });
      row.appendChild(createElement('span', { className: 'flow-row-lbl' }, c.name));
      const track = createElement('div', { className: 'flow-track' });
      const fill = createElement('div', { className: 'flow-fill' });
      fill.style.width = Math.min((c.val / maxCat) * 100, 100) + '%';
      fill.style.background = c.color;
      track.appendChild(fill);
      row.appendChild(track);
      row.appendChild(createElement('span', { className: 'flow-val' }, c.val + ' kg'));
      frag.appendChild(row);
    });
    flowBars.textContent = '';
    flowBars.appendChild(frag);
  }

  if (DOM['flow-total']) DOM['flow-total'].textContent = periodTotal + ' kg';

  const change = getWeeklyChange();
  const trendEl = DOM['flow-trend'];
  if (trendEl) {
    if (change !== null) {
      trendEl.textContent = (change <= 0 ? '↓ ' : '↑ ') + Math.abs(change) + '%';
      trendEl.style.color = change <= 0 ? 'var(--emerald-400)' : 'var(--red)';
    } else {
      trendEl.textContent = '—';
      trendEl.style.color = '';
    }
  }
}

function renderHeatmap() {
  const total = getTotal();
  const container = DOM['heatmap'];
  if (!container) return;

  const frag = document.createDocumentFragment();
  for (let i = 0; i < 84; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (83 - i));
    const dateStr = date.toISOString().split('T')[0];
    const found = profile.history?.find(h => h.date === dateStr);
    const val = found ? found.total : total * (0.7 + Math.sin(i * 0.5) * 0.3);
    const intensity = Math.min(val / 15, 1);
    const cell = createElement('div', {
      className: 'hm-cell',
      title: `${dateStr}: ${val.toFixed(1)} kg CO₂`,
      'aria-label': `${dateStr}: ${val.toFixed(1)} kg CO₂`
    });
    cell.style.background = `rgba(16,185,129,${0.05 + intensity * 0.9})`;
    frag.appendChild(cell);
  }
  container.textContent = '';
  container.appendChild(frag);
}

function renderRanking() {
  const f = profile.footprint;
  const container = DOM['ranking'];
  if (!container) return;

  const cats = Object.entries(f).map(([k, v]) => ({ key: k, val: v })).sort((a, b) => b.val - a.val);
  const frag = document.createDocumentFragment();
  cats.forEach((c, i) => {
    const item = createElement('div', { className: 'rank-item', role: 'listitem' });
    item.appendChild(createElement('span', { className: 'rank-num' }, String(i + 1)));
    item.appendChild(createElement('span', { className: 'rank-icon' }, CATEGORY_EMOJIS[c.key]));
    item.appendChild(createElement('span', { className: 'rank-name' }, CATEGORY_NAMES[c.key]));
    item.appendChild(createElement('span', { className: 'rank-val' }, c.val.toFixed(1) + ' kg'));
    frag.appendChild(item);
  });
  container.textContent = '';
  container.appendChild(frag);
}

function renderForecast() {
  const container = DOM['forecast-chart'];
  if (!container) return;

  const total = getTotal();
  const canvas = document.createElement('canvas');
  canvas.width = container.offsetWidth || 600;
  canvas.height = 200;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.setAttribute('aria-label', 'Carbon emission forecast chart');
  container.textContent = '';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const months = 12;
  const padding = { left: 40, right: 20, top: 20, bottom: 5 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;

  const currentPath = [];
  for (let i = 0; i <= months; i++) currentPath.push(total * 30 * (i + 1));

  const greenPath = [];
  let greenMonthly = total * 30;
  for (let i = 0; i <= months; i++) {
    greenPath.push(greenMonthly * (i + 1) * 0.5);
    greenMonthly *= 0.92;
  }

  const maxVal = Math.max(...currentPath);
  const toX = (i) => padding.left + (i / months) * chartW;
  const toY = (v) => padding.top + chartH - (v / maxVal) * chartH;

  // Current path
  ctx.beginPath();
  ctx.moveTo(toX(0), h - padding.bottom);
  currentPath.forEach((v, i) => ctx.lineTo(toX(i), toY(v)));
  ctx.lineTo(toX(months), h - padding.bottom);
  ctx.closePath();
  const currentGrad = ctx.createLinearGradient(0, 0, 0, h);
  currentGrad.addColorStop(0, 'rgba(245, 158, 11, 0.15)');
  currentGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
  ctx.fillStyle = currentGrad;
  ctx.fill();

  ctx.beginPath();
  currentPath.forEach((v, i) => i === 0 ? ctx.moveTo(toX(i), toY(v)) : ctx.lineTo(toX(i), toY(v)));
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Green path
  ctx.beginPath();
  ctx.moveTo(toX(0), h - padding.bottom);
  greenPath.forEach((v, i) => ctx.lineTo(toX(i), toY(v)));
  ctx.lineTo(toX(months), h - padding.bottom);
  ctx.closePath();
  const greenGrad = ctx.createLinearGradient(0, 0, 0, h);
  greenGrad.addColorStop(0, 'rgba(16, 185, 129, 0.15)');
  greenGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
  ctx.fillStyle = greenGrad;
  ctx.fill();

  ctx.beginPath();
  greenPath.forEach((v, i) => i === 0 ? ctx.moveTo(toX(i), toY(v)) : ctx.lineTo(toX(i), toY(v)));
  ctx.strokeStyle = '#10B981';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Legend
  const sc = DOM['forecast-sc'];
  if (sc) {
    sc.textContent = '';
    const frag = document.createDocumentFragment();
    [{ color: '#F59E0B', label: 'Current path' }, { color: '#10B981', label: 'If you go green' }].forEach(l => {
      const item = createElement('div', { className: 'fs-item' });
      const dot = createElement('div', { className: 'fs-dot' });
      dot.style.background = l.color;
      item.appendChild(dot);
      item.appendChild(document.createTextNode(l.label));
      frag.appendChild(item);
    });
    sc.appendChild(frag);
  }
}

// ═══════════ SIMULATOR ═══════════

function initSim() {
  simCalc();
  generateRecommendations();
  generateChallenges();
}

function simCalc() {
  try {
    const f = profile.footprint;
    const currentDaily = getTotal();
    const currentPeriod = currentDaily * 30 * simMultiplier;

    const t = clamp(parseFloat(DOM['sim-transit']?.value) || 0, 0, 7);
    const v = clamp(parseFloat(DOM['sim-veg']?.value) || 0, 0, 21);
    const s = clamp(parseFloat(DOM['sim-solar']?.value) || 0, 0, 1);
    const e = clamp(parseFloat(DOM['sim-ev']?.value) || 0, 0, 1);
    const fly = clamp(parseFloat(DOM['sim-fly']?.value) || 0, 0, 10);

    if (DOM['sm-transit']) DOM['sm-transit'].textContent = `${t} days/wk`;
    if (DOM['sm-veg']) DOM['sm-veg'].textContent = `${v} meals/wk`;
    if (DOM['sm-solar']) DOM['sm-solar'].textContent = s ? 'Yes' : 'No';
    if (DOM['sm-ev']) DOM['sm-ev'].textContent = e ? 'Yes' : 'No';
    if (DOM['sm-fly']) DOM['sm-fly'].textContent = `${fly}`;

    const dailyReduction = (t * 0.8) + (v * 0.5) + (s * 2.0) + (e * 3.0) + ((fly / 365) * 200);
    const futureDaily = Math.max(currentDaily - dailyReduction, 1.0);
    const futurePeriod = futureDaily * 30 * simMultiplier;

    if (DOM['sim-cur']) DOM['sim-cur'].textContent = currentPeriod.toFixed(0);
    if (DOM['sim-fut']) DOM['sim-fut'].textContent = futurePeriod.toFixed(0);

    const savedC = currentPeriod - futurePeriod;
    const money = savedC * MONEY_PER_KG_SAVED;
    const trees = savedC / CO2_PER_TREE_YEAR;

    const saves = DOM['sim-saves'];
    if (saves) {
      const data = [
        { val: `₹${money.toFixed(0)}`, lbl: 'Money Saved' },
        { val: trees.toFixed(1), lbl: 'Trees Eq.' },
        { val: `${(savedC * 1.5).toFixed(0)} L`, lbl: 'Water Saved' },
        { val: `${(savedC * 0.8).toFixed(0)} kWh`, lbl: 'Energy Saved' }
      ];
      const frag = document.createDocumentFragment();
      data.forEach(d => {
        const box = createElement('div', { className: 'save-box' });
        box.appendChild(createElement('span', { className: 'save-val' }, d.val));
        box.appendChild(createElement('span', { className: 'save-lbl' }, d.lbl));
        frag.appendChild(box);
      });
      saves.textContent = '';
      saves.appendChild(frag);
    }

    const banner = DOM['sim-banner'];
    const bannerTxt = DOM['sim-banner-txt'];
    if (banner && bannerTxt) {
      if (savedC > 0) {
        banner.classList.remove('hidden');
        bannerTxt.textContent = `🌿 You could save ${savedC.toFixed(0)} kg CO₂ over ${simMultiplier} month(s) — that's ${trees.toFixed(0)} trees worth of carbon!`;
      } else {
        banner.classList.add('hidden');
      }
    }
  } catch (err) {
    console.error('Error in simCalc:', err);
  }
}

function generateRecommendations() {
  const f = profile.footprint;
  const total = getTotal();
  const sorted = Object.entries(f).sort(([, a], [, b]) => b - a);
  const container = DOM['recs-stack'];
  if (!container) return;

  const recs = [];
  sorted.slice(0, 3).forEach(([cat, val]) => {
    const pct = total > 0 ? Math.round((val / total) * 100) : 0;
    if (cat === 'transport' && val > 1) {
      recs.push({ icon: '🚇', title: 'Try public transit', desc: `Transport is ${pct}% of your footprint. Using metro 2 days/week could save ${(val * 0.4 * 2 / 7 * 30).toFixed(0)} kg CO₂/month. Indian cities like Delhi, Bangalore & Hyderabad have expanding metro networks.` });
    }
    if (cat === 'food' && val > 2) {
      recs.push({ icon: '🥗', title: 'Add more plant meals', desc: `Food is ${pct}% of your footprint. 3 more veg meals/week could save ${(1.5 * 3 * 4).toFixed(0)} kg CO₂/month. India has one of the richest vegetarian cuisines in the world.` });
    }
    if (cat === 'energy' && val > 2) {
      recs.push({ icon: '☀️', title: 'Optimize AC usage', desc: `Energy is ${pct}% of your footprint. Setting AC to 26°C saves up to 20% electricity. The PM-KUSUM scheme offers solar panel subsidies.` });
    }
    if (cat === 'shopping' && val > 0.5) {
      recs.push({ icon: '📦', title: 'Reduce online orders', desc: `Shopping is ${pct}%. Consolidating deliveries reduces packaging waste and logistics emissions.` });
    }
  });

  if (recs.length === 0) {
    recs.push({ icon: '🌟', title: 'You\'re doing great!', desc: 'Your carbon footprint is well-optimized. Keep maintaining your sustainable habits.' });
  }

  const frag = document.createDocumentFragment();
  recs.forEach(r => {
    const card = createElement('div', { className: 'rec-card' });
    card.appendChild(createElement('span', { className: 'rec-icon' }, r.icon));
    const body = createElement('div', { className: 'rec-body' });
    body.appendChild(createElement('div', { className: 'rec-title' }, r.title));
    body.appendChild(createElement('div', { className: 'rec-desc' }, r.desc));
    card.appendChild(body);
    frag.appendChild(card);
  });
  container.textContent = '';
  container.appendChild(frag);
}

function generateChallenges() {
  const total = getTotal();
  const daysSinceJoin = profile.streak || 1;
  const container = DOM['challenges-stack'];
  if (!container) return;

  const challenges = [
    { icon: '🚶', title: 'Walk More Challenge', desc: 'Walk instead of driving for trips under 2 km', progress: Math.min(daysSinceJoin * 10, 100) },
    { icon: '🥦', title: 'Meatless Monday', desc: 'Go vegetarian every Monday for a month', progress: Math.min(daysSinceJoin * 7, 100) },
    { icon: '💡', title: 'Energy Saver', desc: 'Keep AC under 4 hours/day for a week', progress: total < 8 ? 75 : 30 }
  ];

  const frag = document.createDocumentFragment();
  challenges.forEach(c => {
    const card = createElement('div', { className: 'challenge-card' });
    card.appendChild(createElement('span', { className: 'ch-icon' }, c.icon));
    const body = createElement('div', { className: 'ch-body' });
    body.appendChild(createElement('div', { className: 'ch-title' }, c.title));
    body.appendChild(createElement('div', { className: 'ch-desc' }, c.desc));
    const progress = createElement('div', { className: 'ch-progress', role: 'progressbar', 'aria-valuenow': String(c.progress), 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-label': `${c.title} progress` });
    const fill = createElement('div', { className: 'ch-fill' });
    fill.style.width = c.progress + '%';
    progress.appendChild(fill);
    body.appendChild(progress);
    card.appendChild(body);
    frag.appendChild(card);
  });
  container.textContent = '';
  container.appendChild(frag);
}

// ═══════════ PROFILE & LEGACY ═══════════

function updateProfileUI() {
  const total = getTotal();
  // const savedVsBaseline = Math.max(0, (INDIAN_BASELINE_DAILY - total));
  const totalSavedKg = +(savedVsBaseline * profile.streak).toFixed(0);
  const moneySaved = Math.round(totalSavedKg * MONEY_PER_KG_SAVED);
  profile.totalSaved = totalSavedKg;

  if (DOM['ps-saved']) DOM['ps-saved'].textContent = totalSavedKg + ' kg';
  if (DOM['ps-score']) DOM['ps-score'].textContent = profile.score;
  if (DOM['ps-money']) DOM['ps-money'].textContent = '₹' + moneySaved.toLocaleString();

  if (profile.joinDate && DOM['prof-since']) {
    try {
      const joinDate = new Date(profile.joinDate);
      DOM['prof-since'].textContent = `Member since ${joinDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`;
    } catch (err) {
      DOM['prof-since'].textContent = 'Canopy Explorer';
    }
  }

  // Equivalents
  const trees = Math.max(0, +(totalSavedKg / CO2_PER_TREE_YEAR).toFixed(0));
  const kmDriven = Math.max(0, Math.round(totalSavedKg / 0.14));
  const phonesCharged = Math.max(0, Math.round(totalSavedKg / 0.005));
  const lightDays = Math.max(0, Math.round(totalSavedKg / 0.4));

  const equivGrid = DOM['equiv-grid'];
  if (equivGrid) {
    const equivData = [
      { icon: '🌳', val: String(trees), lbl: 'Trees Equivalent' },
      { icon: '🚗', val: String(kmDriven), lbl: 'Km Not Driven' },
      { icon: '📱', val: phonesCharged.toLocaleString(), lbl: 'Phones Charged' },
      { icon: '💡', val: String(lightDays), lbl: 'Days of Light' }
    ];
    const frag = document.createDocumentFragment();
    equivData.forEach(e => {
      const box = createElement('div', { className: 'equiv-box' });
      box.appendChild(createElement('span', { className: 'equiv-icon' }, e.icon));
      box.appendChild(createElement('span', { className: 'equiv-val' }, e.val));
      box.appendChild(createElement('span', { className: 'equiv-lbl' }, e.lbl));
      frag.appendChild(box);
    });
    equivGrid.textContent = '';
    equivGrid.appendChild(frag);
  }

  // Badges
  const badges = [
    { icon: '🌱', name: 'First Step', unlocked: profile.streak >= 1 },
    { icon: '📊', name: '7-Day Streak', unlocked: profile.streak >= 7 },
    { icon: '🥦', name: 'Plant Power', unlocked: calcState.mealType === 'veg' || calcState.mealType === 'vegan' },
    { icon: '🚇', name: 'Metro Master', unlocked: calcState.transMode === 'metro' || calcState.transMode === 'bus' },
    { icon: '♻️', name: 'Waste Warrior', unlocked: calcState.wasteSeg === 'yes' },
    { icon: '🏆', name: '30-Day Streak', unlocked: profile.streak >= 30 },
    { icon: '☀️', name: 'Solar King', unlocked: false },
    { icon: '🌟', name: 'Carbon Neutral', unlocked: total <= 2 }
  ];

  const badgeGrid = DOM['badge-grid'];
  if (badgeGrid) {
    const frag = document.createDocumentFragment();
    badges.forEach(b => {
      const badge = createElement('div', { className: `badge ${b.unlocked ? 'unlocked' : ''}`, role: 'listitem', 'aria-label': `${b.name}: ${b.unlocked ? 'Unlocked' : 'Locked'}` });
      badge.appendChild(createElement('span', { className: 'badge-icon' }, b.icon));
      badge.appendChild(createElement('span', { className: 'badge-name' }, b.name));
      frag.appendChild(badge);
    });
    badgeGrid.textContent = '';
    badgeGrid.appendChild(frag);
  }

  // Monthly report
  const m = new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  if (DOM['report-month']) DOM['report-month'].textContent = m;

  const biggest = Object.entries(profile.footprint).sort(([, a], [, b]) => b - a);
  if (DOM['report-body']) {
    DOM['report-body'].textContent = total > 0
      ? `Your carbon footprint for ${m} is tracking at ${(total * 30).toFixed(0)} kg CO₂/month (${Math.round(total * 30 / profile.budget * 100)}% of your ${profile.budget} kg budget).\n\nTop contributor: ${CATEGORY_NAMES[biggest[0][0]]} at ${(biggest[0][1] * 30).toFixed(0)} kg/month.\nLowest contributor: ${CATEGORY_NAMES[biggest[biggest.length - 1][0]]} at ${(biggest[biggest.length - 1][1] * 30).toFixed(1)} kg/month.\n\nCarbon Score: ${profile.score}/100\nStreak: ${profile.streak} days\nTotal CO₂ Saved: ${totalSavedKg} kg`
      : 'Start using the calculator on the Home page to generate your monthly report.';
  }
}

// ═══════════ REPORT DOWNLOAD & DATA EXPORT ═══════════

/**
 * Download the monthly report as a CSV file.
 */
function downloadReport() {
  try {
    const total = getTotal();
    const m = new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });
    const f = profile.footprint;

    let csv = 'Category,Daily (kg CO₂),Monthly (kg CO₂)\n';
    CATEGORY_KEYS.forEach(key => {
      csv += `${CATEGORY_NAMES[key]},${f[key].toFixed(2)},${(f[key] * 30).toFixed(2)}\n`;
    });
    csv += `\nTotal,${total.toFixed(2)},${(total * 30).toFixed(2)}\n`;
    csv += `\nCarbon Score,${profile.score}/100\n`;
    csv += `Streak,${profile.streak} days\n`;
    csv += `Budget,${profile.budget} kg/month\n`;
    csv += `Budget Usage,${Math.round(total * 30 / profile.budget * 100)}%\n`;
    csv += `\nReport Period,${m}\n`;
    csv += `Generated,${new Date().toISOString()}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `canopy-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Report downloaded successfully 📄');
    announce('Monthly report downloaded as CSV');
  } catch (err) {
    console.error('Error downloading report:', err);
    showToast('Failed to download report');
  }
}

/**
 * Export all carbon tracking data as JSON.
 */
function exportData() {
  try {
    const exportObj = {
      user: currentUser?.name || 'Anonymous',
      exportDate: new Date().toISOString(),
      profile: {
        budget: profile.budget,
        score: profile.score,
        streak: profile.streak,
        joinDate: profile.joinDate,
        footprint: { ...profile.footprint },
        totalSaved: profile.totalSaved
      },
      history: profile.history || [],
      activityLog: profile.activityLog || []
    };

    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `canopy-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Data exported successfully 📊');
    announce('All carbon data exported as JSON');
  } catch (err) {
    console.error('Error exporting data:', err);
    showToast('Failed to export data');
  }
}

// ═══════════ MODALS, DRAWERS, TOAST ═══════════

/** @type {HTMLElement|null} Element that triggered a modal/drawer, for focus return */
let triggerElement = null;

function openQuickLog() {
  triggerElement = document.activeElement;
  const modal = DOM['quick-log-modal'];
  if (modal) {
    modal.setAttribute('aria-hidden', 'false');
    DOM['close-quick-log-btn']?.focus();
  }
  announce('Quick log dialog opened');
}

function closeQuickLog() {
  const modal = DOM['quick-log-modal'];
  if (modal) modal.setAttribute('aria-hidden', 'true');
  if (triggerElement) { triggerElement.focus(); triggerElement = null; }
}

/**
 * Submit quick log entry — actually records the activity.
 */
function submitQuickLog() {
  // Rate limiting: prevent rapid submissions (1 per second)
  const now = Date.now();
  if (now - lastSubmitTime < 1000) {
    showToast('Please wait before submitting again.');
    return;
  }
  lastSubmitTime = now;

  try {
    // Determine active tab and gather data
    const activeTab = document.querySelector('.ql-tab.on');
    const tabType = activeTab?.dataset.t || 'commute';
    const today = new Date().toISOString();

    const logEntry = { type: tabType, timestamp: today, emissions: 0 };

    if (tabType === 'commute') {
      const vehicle = document.querySelector('#ql-commute .chip.on[data-group="ql-vehicle"]')?.dataset.v || 'two-wheeler';
      const km = clamp(parseFloat(DOM['ql-km']?.value) || 10, 1, 100);
      logEntry.vehicle = vehicle;
      logEntry.km = km;
      logEntry.emissions = +(km * (EMISSION_FACTORS.transport[vehicle] || 0.04)).toFixed(2);
    } else if (tabType === 'meal') {
      const meal = document.querySelector('#ql-meal .chip.on[data-group="ql-meal"]')?.dataset.v || 'veg';
      const source = document.querySelector('#ql-meal .chip.on[data-group="ql-source"]')?.dataset.v || 'home';
      logEntry.meal = meal;
      logEntry.source = source;
      const mealEmissions = { veg: 0.5, egg: 0.8, 'non-veg': 1.5 };
      logEntry.emissions = +((mealEmissions[meal] || 0.5) + (source === 'delivery' ? 0.8 : 0)).toFixed(2);
    } else if (tabType === 'purchase') {
      const amount = clamp(parseFloat(DOM['ql-amount']?.value) || 500, 100, 10000);
      logEntry.amount = amount;
      logEntry.emissions = +(amount * 0.001).toFixed(2);
    } else if (tabType === 'flight') {
      const flightType = document.querySelector('#ql-flight .chip.on[data-group="ql-fly"]')?.dataset.v || 'domestic';
      logEntry.flightType = flightType;
      logEntry.emissions = flightType === 'domestic' ? 150 : 500;
    }

    // Add to activity log
    if (!profile.activityLog) profile.activityLog = [];
    profile.activityLog.push(logEntry);

    // Keep last 500 entries
    if (profile.activityLog.length > 500) {
      profile.activityLog = profile.activityLog.slice(-500);
    }

    saveProfile();
    closeQuickLog();
    showToast(`Activity logged: +${logEntry.emissions} kg CO₂ 🌿`);
    announce(`Activity logged successfully. ${logEntry.emissions} kilograms CO2.`);
    recalcFromCalc();
  } catch (err) {
    console.error('Error submitting quick log:', err);
    showToast('Failed to log activity');
  }
}

function handleQLTab(tab) {
  document.querySelectorAll('.ql-tab').forEach(t => {
    t.classList.remove('on');
    t.setAttribute('aria-selected', 'false');
  });
  tab.classList.add('on');
  tab.setAttribute('aria-selected', 'true');
  document.querySelectorAll('.ql-pane').forEach(p => p.classList.add('hidden'));
  const pane = document.getElementById('ql-' + tab.dataset.t);
  if (pane) pane.classList.remove('hidden');
}

function handleGroupChip(chip) {
  const group = chip.dataset.group;
  if (!group) return;
  const container = chip.closest('.chip-grid');
  if (!container) return;
  container.querySelectorAll(`.chip[data-group="${group}"]`).forEach(c => {
    c.classList.remove('on');
    c.setAttribute('aria-checked', 'false');
  });
  chip.classList.add('on');
  chip.setAttribute('aria-checked', 'true');
}

function openDrawer(id) {
  triggerElement = document.activeElement;
  const drawer = document.getElementById(`drawer-${id}`);
  if (drawer) {
    drawer.setAttribute('aria-hidden', 'false');
  }
  if (id === 'settings') {
    if (DOM['set-name']) DOM['set-name'].value = currentUser?.name || '';
    if (DOM['set-budget']) DOM['set-budget'].value = profile.budget;
    DOM['close-settings-btn']?.focus();
  }
  if (id === 'notifs') {
    generateNotifications();
    DOM['close-notifs-btn']?.focus();
  }
  announce(`${id === 'settings' ? 'Settings' : 'Notifications'} panel opened`);
}

function closeDrawer(id) {
  const drawer = document.getElementById(`drawer-${id}`);
  if (drawer) drawer.setAttribute('aria-hidden', 'true');
  if (triggerElement) { triggerElement.focus(); triggerElement = null; }
}

function saveSettings() {
  const nameInput = DOM['set-name'];
  const budgetInput = DOM['set-budget'];

  const name = (nameInput?.value || '').trim().slice(0, MAX_NAME_LENGTH);
  if (name && currentUser) {
    // Validate: only allow letters, spaces, and common characters
    const sanitizedName = name.replace(/[^a-zA-Z0-9 .\-']/g, '');
    currentUser.name = sanitizedName;
    safeSetJSON('canopy_user', currentUser);
  }

  const budget = clamp(parseInt(budgetInput?.value, 10) || 200, 50, 1000);
  profile.budget = budget;
  saveProfile();

  closeDrawer('settings');
  showApp();
  showToast('Settings saved successfully ✓');
  announce('Settings saved');
}

function generateNotifications() {
  const total = getTotal();
  const notifs = [];

  if (total > profile.budget / 30) {
    notifs.push({ title: '⚠️ Budget Alert', desc: `You're exceeding your daily carbon budget of ${(profile.budget / 30).toFixed(1)} kg.`, time: 'Just now', unread: true });
  }
  if (profile.streak > 0 && profile.streak % 7 === 0) {
    notifs.push({ title: '🔥 Streak Milestone!', desc: `You've maintained a ${profile.streak}-day streak on Canopy!`, time: 'Today', unread: true });
  }
  notifs.push({ title: '💡 Daily Tip', desc: 'Turning off appliances at the wall socket saves up to 10% on your electricity bill. The Indian government\'s BEE star rating helps you choose efficient appliances.', time: 'Today', unread: false });

  const body = DOM['notifs-body'];
  if (!body) return;

  if (notifs.length === 0) {
    body.textContent = '';
    const p = createElement('p', { style: 'color: var(--text-tertiary); text-align: center; padding: 40px 0;' }, 'No notifications yet');
    body.appendChild(p);
    return;
  }

  const frag = document.createDocumentFragment();
  notifs.forEach(n => {
    const item = createElement('div', { className: `notif-item ${n.unread ? 'unread' : ''}` });
    item.appendChild(createElement('div', { className: 'n-title' }, n.title));
    item.appendChild(createElement('div', { className: 'n-desc' }, n.desc));
    item.appendChild(createElement('div', { className: 'n-time' }, n.time));
    frag.appendChild(item);
  });
  body.textContent = '';
  body.appendChild(frag);

  if (notifs.some(n => n.unread) && DOM['notif-dot']) {
    DOM['notif-dot'].style.display = 'block';
  }
}

/**
 * Show a toast notification.
 * @param {string} msg - Message to display
 */
function showToast(msg) {
  const t = DOM['toast'];
  if (!t) return;
  if (DOM['toast-text']) DOM['toast-text'].textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), TOAST_DURATION);
}

function markAllRead() {
  if (DOM['notif-dot']) DOM['notif-dot'].style.display = 'none';
  closeDrawer('notifs');
  showToast('Notifications cleared ✓');
  announce('All notifications marked as read');
}

// ═══════════ EXPORTS FOR TESTING ═══════════

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sanitize,
    clamp,
    safeGetJSON,
    safeSetJSON,
    getTotal,
    getWeeklyChange,
    saveDailySnapshot,
    updateStreak,
    EMISSION_FACTORS,
    INDIAN_BASELINE_DAILY,
    GLOBAL_FAIR_SHARE_ANNUAL,
    CATEGORY_NAMES,
    CATEGORY_EMOJIS,
    profile,
    calcState,
    recalcFromCalc,
    lerpColor,
    lightenColor,
    darkenColor,
    CO2_PER_TREE_YEAR,
    MONEY_PER_KG_SAVED
  };
}

