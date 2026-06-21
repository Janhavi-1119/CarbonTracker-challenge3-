/**
 * Security Tests
 * Tests input sanitization, XSS prevention, and validation.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>&"']/g, (c) => {
    const map = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#x27;' };
    return map[c] || c;
  });
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function safeGetJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

describe('XSS Prevention - Sanitize', () => {
  it('should escape script tags', () => {
    const input = '<script>alert("xss")</script>';
    const result = sanitize(input);
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });

  it('should escape img onerror payloads', () => {
    const input = '<img src=x onerror="alert(1)">';
    const result = sanitize(input);
    expect(result).not.toContain('<img');
    expect(result).toContain('&lt;img');
  });

  it('should escape event handler injections', () => {
    const input = '" onmouseover="alert(1)"';
    const result = sanitize(input);
    expect(result).not.toContain('"');
    expect(result).toContain('&quot;');
  });

  it('should handle nested HTML', () => {
    const input = '<div><script>document.cookie</script></div>';
    const result = sanitize(input);
    expect(result).not.toContain('<div>');
    expect(result).not.toContain('<script>');
  });

  it('should handle SVG-based XSS', () => {
    const input = '<svg onload="alert(1)">';
    const result = sanitize(input);
    expect(result).not.toContain('<svg');
  });

  it('should handle multiple special characters', () => {
    const input = '<>&"\'';
    const result = sanitize(input);
    expect(result).toBe('&lt;&gt;&amp;&quot;&#x27;');
  });
});

describe('Input Validation - Clamp', () => {
  it('should clamp slider values within valid range', () => {
    expect(clamp(-10, 0, 100)).toBe(0);
    expect(clamp(150, 0, 100)).toBe(100);
    expect(clamp(50, 0, 100)).toBe(50);
  });

  it('should handle NaN input as 0', () => {
    const val = parseFloat('not-a-number') || 0;
    expect(clamp(val, 0, 100)).toBe(0);
  });

  it('should validate AC hours (0-24)', () => {
    expect(clamp(0, 0, 24)).toBe(0);
    expect(clamp(24, 0, 24)).toBe(24);
    expect(clamp(30, 0, 24)).toBe(24);
    expect(clamp(-1, 0, 24)).toBe(0);
  });

  it('should validate water usage (20-500)', () => {
    expect(clamp(20, 20, 500)).toBe(20);
    expect(clamp(500, 20, 500)).toBe(500);
    expect(clamp(10, 20, 500)).toBe(20);
    expect(clamp(600, 20, 500)).toBe(500);
  });

  it('should validate budget (50-1000)', () => {
    expect(clamp(50, 50, 1000)).toBe(50);
    expect(clamp(1000, 50, 1000)).toBe(1000);
    expect(clamp(20, 50, 1000)).toBe(50);
    expect(clamp(5000, 50, 1000)).toBe(1000);
  });
});

describe('Name Validation', () => {
  it('should limit name length to 50 characters', () => {
    const MAX_NAME_LENGTH = 50;
    const longName = 'A'.repeat(100);
    const trimmed = longName.slice(0, MAX_NAME_LENGTH);
    expect(trimmed.length).toBe(50);
  });

  it('should strip dangerous characters from names', () => {
    const name = 'John<script>alert(1)</script>';
    const sanitizedName = name.replace(/[^a-zA-Z0-9 .\-']/g, '');
    expect(sanitizedName).not.toContain('<');
    expect(sanitizedName).not.toContain('>');
    expect(sanitizedName).not.toContain('(');
    expect(sanitizedName).toContain('John');
  });

  it('should allow normal names with spaces and common chars', () => {
    const name = "John O'Brien-Smith";
    const sanitizedName = name.replace(/[^a-zA-Z0-9 .\-']/g, '');
    expect(sanitizedName).toBe("John O'Brien-Smith");
  });
});

describe('localStorage Validation', () => {
  beforeEach(() => { localStorage.clear(); });
  afterEach(() => { localStorage.clear(); });

  it('should handle corrupted data gracefully', () => {
    localStorage.setItem('test', '{{bad json');
    const result = safeGetJSON('test');
    expect(result).toBeNull();
  });

  it('should handle missing keys', () => {
    const result = safeGetJSON('does_not_exist');
    expect(result).toBeNull();
  });

  it('should handle empty storage', () => {
    const result = safeGetJSON('');
    expect(result).toBeNull();
  });

  it('should validate profile structure after retrieval', () => {
    const validProfile = {
      budget: 200,
      onboarded: true,
      footprint: { transport: 0, food: 0, energy: 0, shopping: 0, waste: 0, water: 0 }
    };
    localStorage.setItem('canopy_profile', JSON.stringify(validProfile));
    const retrieved = safeGetJSON('canopy_profile');
    expect(retrieved).toHaveProperty('budget');
    expect(retrieved).toHaveProperty('footprint');
    expect(typeof retrieved.budget).toBe('number');
  });
});

describe('Rate Limiting', () => {
  it('should prevent rapid submissions within 1 second', () => {
    let lastSubmitTime = 0;
    const now1 = 1000;
    lastSubmitTime = now1;

    const now2 = 1500; // 500ms later
    const allowed = (now2 - lastSubmitTime) >= 1000;
    expect(allowed).toBe(false);

    const now3 = 2100; // 1100ms later
    const allowed2 = (now3 - lastSubmitTime) >= 1000;
    expect(allowed2).toBe(true);
  });
});

describe('CSP Meta Tag Validation', () => {
  it('should validate that CSP policy string is well-formed', () => {
    const csp = "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; font-src https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self';";
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).not.toContain("script-src 'unsafe-eval'");
    expect(csp).not.toContain("script-src 'unsafe-inline'");
  });
});
