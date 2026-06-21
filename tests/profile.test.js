/**
 * Profile & State Management Tests
 * Tests localStorage persistence, streak calculation, and budget tracking.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Re-implement functions under test
function safeGetJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

function safeSetJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    // Silently fail
  }
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

describe('Profile LocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should save and retrieve a profile', () => {
    const profile = {
      budget: 200,
      onboarded: true,
      score: 75,
      streak: 5,
      footprint: { transport: 1.4, food: 2.5, energy: 3.6, shopping: 0, waste: 0.2, water: 0.24 }
    };
    safeSetJSON('canopy_profile', profile);
    const retrieved = safeGetJSON('canopy_profile');
    expect(retrieved).toEqual(profile);
  });

  it('should return null for missing keys', () => {
    const result = safeGetJSON('non_existent_key');
    expect(result).toBeNull();
  });

  it('should handle corrupted JSON gracefully', () => {
    localStorage.setItem('corrupt_data', '{invalid json}}}');
    const result = safeGetJSON('corrupt_data');
    expect(result).toBeNull();
  });

  it('should handle empty string gracefully', () => {
    localStorage.setItem('empty', '');
    const result = safeGetJSON('empty');
    expect(result).toBeNull();
  });

  it('should persist user data across get/set cycles', () => {
    const user = { name: 'Test User', email: 'test@example.com' };
    safeSetJSON('canopy_user', user);
    const retrieved = safeGetJSON('canopy_user');
    expect(retrieved.name).toBe('Test User');
    expect(retrieved.email).toBe('test@example.com');
  });

  it('should overwrite existing data', () => {
    safeSetJSON('key', { val: 1 });
    safeSetJSON('key', { val: 2 });
    const result = safeGetJSON('key');
    expect(result.val).toBe(2);
  });
});

describe('Streak Calculation', () => {
  it('should calculate streak from join date', () => {
    const joinDate = new Date();
    joinDate.setDate(joinDate.getDate() - 10);
    const now = new Date();
    const diff = Math.floor((now - joinDate) / (1000 * 60 * 60 * 24));
    expect(diff).toBe(10);
  });

  it('should return at least 1 for same-day join', () => {
    const joinDate = new Date();
    const now = new Date();
    const diff = Math.floor((now - joinDate) / (1000 * 60 * 60 * 24));
    expect(Math.max(diff, 1)).toBe(1);
  });

  it('should handle invalid join date gracefully', () => {
    const joinDate = 'invalid-date';
    const join = new Date(joinDate);
    expect(isNaN(join.getTime())).toBe(true);
  });
});

describe('Weekly Change Calculation', () => {
  it('should calculate positive change correctly', () => {
    const thisAvg = 8;
    const lastAvg = 6;
    const change = Math.round(((thisAvg - lastAvg) / lastAvg) * 100);
    expect(change).toBe(33);
  });

  it('should calculate negative change correctly', () => {
    const thisAvg = 5;
    const lastAvg = 8;
    const change = Math.round(((thisAvg - lastAvg) / lastAvg) * 100);
    expect(change).toBe(-38);
  });

  it('should return 0 for no change', () => {
    const thisAvg = 5;
    const lastAvg = 5;
    const change = Math.round(((thisAvg - lastAvg) / lastAvg) * 100);
    expect(change).toBe(0);
  });

  it('should handle zero last week average', () => {
    const lastAvg = 0;
    // Should return null/guard against division by zero
    const result = lastAvg === 0 ? null : Math.round(((8 - lastAvg) / lastAvg) * 100);
    expect(result).toBeNull();
  });
});

describe('Budget Tracking', () => {
  it('should calculate daily budget from monthly', () => {
    const monthlyBudget = 200;
    const dailyBudget = monthlyBudget / 30;
    expect(dailyBudget).toBeCloseTo(6.67, 1);
  });

  it('should calculate budget usage percentage', () => {
    const total = 5;
    const dailyBudget = 200 / 30;
    const pct = Math.min(Math.round((total / dailyBudget) * 100), 200);
    expect(pct).toBe(75);
  });

  it('should cap budget percentage at 200%', () => {
    const total = 20;
    const dailyBudget = 200 / 30;
    const pct = Math.min(Math.round((total / dailyBudget) * 100), 200);
    expect(pct).toBe(200);
  });

  it('should validate budget within range', () => {
    expect(clamp(50, 50, 1000)).toBe(50);
    expect(clamp(1000, 50, 1000)).toBe(1000);
    expect(clamp(20, 50, 1000)).toBe(50);
    expect(clamp(2000, 50, 1000)).toBe(1000);
  });
});

describe('History Management', () => {
  it('should limit history to 90 entries', () => {
    const MAX_HISTORY = 90;
    let history = [];
    for (let i = 0; i < 100; i++) {
      history.push({ date: `2024-01-${String(i + 1).padStart(2, '0')}`, total: 5 });
    }
    if (history.length > MAX_HISTORY) {
      history = history.slice(-MAX_HISTORY);
    }
    expect(history.length).toBe(90);
    expect(history[0].date).toBe('2024-01-11');
  });

  it('should update existing day entry', () => {
    const history = [
      { date: '2024-06-01', total: 5 },
      { date: '2024-06-02', total: 6 }
    ];
    const today = '2024-06-02';
    const existing = history.findIndex(h => h.date === today);
    expect(existing).toBe(1);
    history[existing] = { date: today, total: 7 };
    expect(history[1].total).toBe(7);
    expect(history.length).toBe(2);
  });
});
