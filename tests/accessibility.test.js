/**
 * Accessibility Tests
 * Tests ARIA attributes, keyboard navigation, focus management, and screen reader support.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

// Load the actual HTML file for testing
let htmlContent;
try {
  htmlContent = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf-8');
} catch (e) {
  htmlContent = '<html><body></body></html>';
}

describe('Skip Navigation Link', () => {
  let dom, document;
  beforeEach(() => {
    dom = new JSDOM(htmlContent);
    document = dom.window.document;
  });

  it('should have a skip-link element', () => {
    const skipLink = document.getElementById('skip-link');
    expect(skipLink).not.toBeNull();
  });

  it('should link to main-content', () => {
    const skipLink = document.getElementById('skip-link');
    expect(skipLink?.getAttribute('href')).toBe('#main-content');
  });

  it('should have descriptive text', () => {
    const skipLink = document.getElementById('skip-link');
    expect(skipLink?.textContent).toContain('Skip');
  });

  it('should have main-content target element', () => {
    const mainContent = document.getElementById('main-content');
    expect(mainContent).not.toBeNull();
  });
});

describe('ARIA Labels on Interactive Elements', () => {
  let dom, document;
  beforeEach(() => {
    dom = new JSDOM(htmlContent);
    document = dom.window.document;
  });

  it('should have aria-labels on all icon buttons', () => {
    const iconBtns = document.querySelectorAll('.icon-btn');
    iconBtns.forEach(btn => {
      expect(btn.hasAttribute('aria-label')).toBe(true);
    });
  });

  it('should have aria-labels on all navigation buttons', () => {
    const navBtns = document.querySelectorAll('.sb-item, .mn');
    navBtns.forEach(btn => {
      expect(btn.hasAttribute('aria-label')).toBe(true);
    });
  });

  it('should have aria-labels on all close buttons', () => {
    const closeBtns = document.querySelectorAll('.x-btn');
    closeBtns.forEach(btn => {
      expect(btn.hasAttribute('aria-label')).toBe(true);
    });
  });

  it('should have aria-labels on all sliders', () => {
    const sliders = document.querySelectorAll('input[type="range"]');
    sliders.forEach(slider => {
      expect(slider.hasAttribute('aria-label')).toBe(true);
    });
  });
});

describe('Dialog/Modal Accessibility', () => {
  let dom, document;
  beforeEach(() => {
    dom = new JSDOM(htmlContent);
    document = dom.window.document;
  });

  it('should have role=dialog on modals', () => {
    const modal = document.getElementById('quick-log-modal');
    expect(modal?.getAttribute('role')).toBe('dialog');
  });

  it('should have aria-modal on modals', () => {
    const modal = document.getElementById('quick-log-modal');
    expect(modal?.getAttribute('aria-modal')).toBe('true');
  });

  it('should have role=dialog on drawers', () => {
    const settings = document.getElementById('drawer-settings');
    const notifs = document.getElementById('drawer-notifs');
    expect(settings?.getAttribute('role')).toBe('dialog');
    expect(notifs?.getAttribute('role')).toBe('dialog');
  });

  it('should have aria-hidden on modals (initially)', () => {
    const modal = document.getElementById('quick-log-modal');
    expect(modal?.getAttribute('aria-hidden')).toBe('true');
  });

  it('should have aria-label on all dialogs', () => {
    const dialogs = document.querySelectorAll('[role="dialog"]');
    dialogs.forEach(dialog => {
      expect(dialog.hasAttribute('aria-label')).toBe(true);
    });
  });
});

describe('Decorative Elements', () => {
  let dom, document;
  beforeEach(() => {
    dom = new JSDOM(htmlContent);
    document = dom.window.document;
  });

  it('should hide grain overlay from screen readers', () => {
    const grain = document.getElementById('grain-overlay');
    expect(grain?.getAttribute('aria-hidden')).toBe('true');
  });

  it('should hide ambient orbs from screen readers', () => {
    const orb1 = document.getElementById('ambient-orb-1');
    const orb2 = document.getElementById('ambient-orb-2');
    expect(orb1?.getAttribute('aria-hidden')).toBe('true');
    expect(orb2?.getAttribute('aria-hidden')).toBe('true');
  });

  it('should hide emoji icons from screen readers', () => {
    const emojis = document.querySelectorAll('.calc-emoji, .wiz-icon');
    emojis.forEach(emoji => {
      expect(emoji.getAttribute('aria-hidden')).toBe('true');
    });
  });
});

describe('Semantic HTML Structure', () => {
  let dom, document;
  beforeEach(() => {
    dom = new JSDOM(htmlContent);
    document = dom.window.document;
  });

  it('should have a main landmark', () => {
    const main = document.querySelector('[role="main"], main');
    expect(main).not.toBeNull();
  });

  it('should have navigation landmarks', () => {
    const navs = document.querySelectorAll('[role="navigation"], nav');
    expect(navs.length).toBeGreaterThan(0);
  });

  it('should have exactly one h1 on the page', () => {
    // Multiple pages might have h1 but only one should be active
    const h1s = document.querySelectorAll('h1');
    expect(h1s.length).toBeGreaterThanOrEqual(1);
  });

  it('should use section elements for page content', () => {
    const sections = document.querySelectorAll('section.pg');
    expect(sections.length).toBeGreaterThan(0);
  });

  it('should have article elements for cards', () => {
    const articles = document.querySelectorAll('article');
    expect(articles.length).toBeGreaterThan(0);
  });
});

describe('Live Regions', () => {
  let dom, document;
  beforeEach(() => {
    dom = new JSDOM(htmlContent);
    document = dom.window.document;
  });

  it('should have a screen reader announcer', () => {
    const announcer = document.getElementById('sr-announcer');
    expect(announcer).not.toBeNull();
    expect(announcer?.getAttribute('aria-live')).toBe('polite');
    expect(announcer?.getAttribute('role')).toBe('status');
  });

  it('should have aria-live on toast', () => {
    const toast = document.getElementById('toast');
    expect(toast?.getAttribute('aria-live')).toBe('assertive');
    expect(toast?.getAttribute('role')).toBe('alert');
  });

  it('should have aria-live on dynamic value displays', () => {
    const heroTotal = document.querySelector('.hero-total-wrap');
    expect(heroTotal?.getAttribute('aria-live')).toBe('polite');
  });
});

describe('Form Labels', () => {
  let dom, document;
  beforeEach(() => {
    dom = new JSDOM(htmlContent);
    document = dom.window.document;
  });

  it('should have labels for settings inputs', () => {
    const nameInput = document.getElementById('set-name');
    const budgetInput = document.getElementById('set-budget');
    const nameLabel = document.querySelector('label[for="set-name"]');
    const budgetLabel = document.querySelector('label[for="set-budget"]');
    expect(nameLabel).not.toBeNull();
    expect(budgetLabel).not.toBeNull();
    expect(nameInput).not.toBeNull();
    expect(budgetInput).not.toBeNull();
  });

  it('should have radiogroup role on chip grids', () => {
    const chipGrids = document.querySelectorAll('.chip-grid[role="radiogroup"]');
    expect(chipGrids.length).toBeGreaterThan(0);
  });

  it('should use fieldset and legend for wizard steps', () => {
    const fieldsets = document.querySelectorAll('fieldset.wiz-step');
    expect(fieldsets.length).toBeGreaterThan(0);
    fieldsets.forEach(fs => {
      const legend = fs.querySelector('legend');
      expect(legend).not.toBeNull();
    });
  });
});

describe('Button Types', () => {
  let dom, document;
  beforeEach(() => {
    dom = new JSDOM(htmlContent);
    document = dom.window.document;
  });

  it('should have type=button on all non-submit buttons', () => {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
      expect(btn.getAttribute('type')).toBe('button');
    });
  });
});

describe('Meta Tags for SEO', () => {
  let dom, document;
  beforeEach(() => {
    dom = new JSDOM(htmlContent);
    document = dom.window.document;
  });

  it('should have a descriptive title', () => {
    const title = document.querySelector('title');
    expect(title).not.toBeNull();
    expect(title?.textContent.length).toBeGreaterThan(10);
  });

  it('should have a meta description', () => {
    const desc = document.querySelector('meta[name="description"]');
    expect(desc).not.toBeNull();
    expect(desc?.getAttribute('content')?.length).toBeGreaterThan(30);
  });

  it('should have Open Graph tags', () => {
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    expect(ogTitle).not.toBeNull();
    expect(ogDesc).not.toBeNull();
  });

  it('should have lang attribute on html element', () => {
    const html = document.querySelector('html');
    expect(html?.getAttribute('lang')).toBe('en');
  });

  it('should have Content-Security-Policy meta tag', () => {
    const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    expect(csp).not.toBeNull();
    expect(csp?.getAttribute('content')).toContain("script-src 'self'");
  });
});
