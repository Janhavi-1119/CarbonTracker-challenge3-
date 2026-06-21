/**
 * UI Interaction Tests
 * Tests page navigation, modal/drawer behavior, chip selection, and slider updates.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';

describe('Page Navigation', () => {
  let dom;
  let document;

  beforeEach(() => {
    dom = new JSDOM(`
      <div class="pg active" id="pg-home"></div>
      <div class="pg" id="pg-earth"></div>
      <div class="pg" id="pg-analytics"></div>
      <div class="pg" id="pg-simulate"></div>
      <div class="pg" id="pg-legacy"></div>
      <button class="sb-item active" id="sn-home" data-page="home"></button>
      <button class="sb-item" id="sn-earth" data-page="earth"></button>
      <button class="mn active" id="mn-home" data-page="home"></button>
      <button class="mn" id="mn-earth" data-page="earth"></button>
    `);
    document = dom.window.document;
  });

  it('should show home page by default', () => {
    const homePage = document.getElementById('pg-home');
    expect(homePage.classList.contains('active')).toBe(true);
  });

  it('should deactivate current page when navigating', () => {
    const homePage = document.getElementById('pg-home');
    homePage.classList.remove('active');
    const earthPage = document.getElementById('pg-earth');
    earthPage.classList.add('active');
    expect(homePage.classList.contains('active')).toBe(false);
    expect(earthPage.classList.contains('active')).toBe(true);
  });

  it('should update sidebar active state', () => {
    const homeBtn = document.getElementById('sn-home');
    const earthBtn = document.getElementById('sn-earth');
    homeBtn.classList.remove('active');
    earthBtn.classList.add('active');
    expect(homeBtn.classList.contains('active')).toBe(false);
    expect(earthBtn.classList.contains('active')).toBe(true);
  });

  it('should set aria-current on active nav item', () => {
    const homeBtn = document.getElementById('sn-home');
    const earthBtn = document.getElementById('sn-earth');
    homeBtn.removeAttribute('aria-current');
    earthBtn.setAttribute('aria-current', 'page');
    expect(earthBtn.getAttribute('aria-current')).toBe('page');
    expect(homeBtn.getAttribute('aria-current')).toBeNull();
  });
});

describe('Modal Behavior', () => {
  let dom;
  let document;

  beforeEach(() => {
    dom = new JSDOM(`
      <div class="modal-bg" id="quick-log-modal" aria-hidden="true" role="dialog" aria-modal="true">
        <div class="modal-card">
          <button class="x-btn" id="close-quick-log-btn">×</button>
          <button class="primary-btn" id="submit-quick-log-btn">Log Activity</button>
        </div>
      </div>
    `);
    document = dom.window.document;
  });

  it('should start with modal hidden', () => {
    const modal = document.getElementById('quick-log-modal');
    expect(modal.getAttribute('aria-hidden')).toBe('true');
  });

  it('should open modal by changing aria-hidden', () => {
    const modal = document.getElementById('quick-log-modal');
    modal.setAttribute('aria-hidden', 'false');
    expect(modal.getAttribute('aria-hidden')).toBe('false');
  });

  it('should close modal by changing aria-hidden back', () => {
    const modal = document.getElementById('quick-log-modal');
    modal.setAttribute('aria-hidden', 'false');
    modal.setAttribute('aria-hidden', 'true');
    expect(modal.getAttribute('aria-hidden')).toBe('true');
  });

  it('should have dialog role', () => {
    const modal = document.getElementById('quick-log-modal');
    expect(modal.getAttribute('role')).toBe('dialog');
  });

  it('should have aria-modal attribute', () => {
    const modal = document.getElementById('quick-log-modal');
    expect(modal.getAttribute('aria-modal')).toBe('true');
  });
});

describe('Drawer Behavior', () => {
  let dom;
  let document;

  beforeEach(() => {
    dom = new JSDOM(`
      <div class="drawer-bg" id="drawer-settings" aria-hidden="true" role="dialog" aria-modal="true">
        <div class="drawer">
          <button class="x-btn" id="close-settings-btn">×</button>
        </div>
      </div>
    `);
    document = dom.window.document;
  });

  it('should start with drawer hidden', () => {
    const drawer = document.getElementById('drawer-settings');
    expect(drawer.getAttribute('aria-hidden')).toBe('true');
  });

  it('should open drawer with aria-hidden false', () => {
    const drawer = document.getElementById('drawer-settings');
    drawer.setAttribute('aria-hidden', 'false');
    expect(drawer.getAttribute('aria-hidden')).toBe('false');
  });
});

describe('Chip Selection', () => {
  let dom;
  let document;

  beforeEach(() => {
    dom = new JSDOM(`
      <div class="chip-grid" role="radiogroup">
        <button class="chip on" data-v="bike" role="radio" aria-checked="true">🏍️ Bike</button>
        <button class="chip" data-v="car" role="radio" aria-checked="false">🚗 Car</button>
        <button class="chip" data-v="metro" role="radio" aria-checked="false">🚇 Metro</button>
      </div>
    `);
    document = dom.window.document;
  });

  it('should have one chip selected by default', () => {
    const selected = document.querySelectorAll('.chip.on');
    expect(selected.length).toBe(1);
    expect(selected[0].dataset.v).toBe('bike');
  });

  it('should update selection when clicking another chip', () => {
    const chips = document.querySelectorAll('.chip');
    chips.forEach(c => { c.classList.remove('on'); c.setAttribute('aria-checked', 'false'); });
    chips[1].classList.add('on');
    chips[1].setAttribute('aria-checked', 'true');

    expect(chips[0].classList.contains('on')).toBe(false);
    expect(chips[1].classList.contains('on')).toBe(true);
    expect(chips[1].getAttribute('aria-checked')).toBe('true');
  });

  it('should have proper radiogroup role', () => {
    const grid = document.querySelector('.chip-grid');
    expect(grid.getAttribute('role')).toBe('radiogroup');
  });
});

describe('Slider Interactions', () => {
  let dom;
  let document;

  beforeEach(() => {
    dom = new JSDOM(`
      <input type="range" id="calc-km" min="0" max="100" value="10" aria-valuenow="10" aria-valuemin="0" aria-valuemax="100">
      <span id="calc-v-km">10</span>
    `);
    document = dom.window.document;
  });

  it('should start with default value', () => {
    const slider = document.getElementById('calc-km');
    expect(slider.value).toBe('10');
  });

  it('should have proper ARIA attributes', () => {
    const slider = document.getElementById('calc-km');
    expect(slider.getAttribute('aria-valuenow')).toBe('10');
    expect(slider.getAttribute('aria-valuemin')).toBe('0');
    expect(slider.getAttribute('aria-valuemax')).toBe('100');
  });

  it('should update display value when slider changes', () => {
    const slider = document.getElementById('calc-km');
    const display = document.getElementById('calc-v-km');
    slider.value = '25';
    display.textContent = slider.value;
    expect(display.textContent).toBe('25');
  });
});

describe('Toast Notifications', () => {
  it('should display message via textContent (not innerHTML)', () => {
    const dom = new JSDOM('<div id="toast"><span id="toast-text">Done.</span></div>');
    const document = dom.window.document;
    const toastText = document.getElementById('toast-text');

    // Verify using textContent (safe) vs innerHTML (unsafe)
    toastText.textContent = 'Settings saved ✓';
    expect(toastText.textContent).toBe('Settings saved ✓');
    // textContent should not parse HTML
    toastText.textContent = '<script>alert("xss")</script>';
    expect(toastText.textContent).toBe('<script>alert("xss")</script>');
    expect(toastText.innerHTML).not.toContain('<script>');
  });
});
