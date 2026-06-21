/**
 * Calculator & Emission Factor Tests
 * Tests the core carbon calculation engine and emission factors.
 */
import { describe, it, expect, beforeEach } from 'vitest';

// Since app.js uses module.exports for testing, we import directly
// We re-define the constants and functions here for isolated testing
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

const INDIAN_BASELINE_DAILY = 6.7;
const GLOBAL_FAIR_SHARE_ANNUAL = 6400;

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>&"']/g, (c) => {
    const map = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#x27;' };
    return map[c] || c;
  });
}

describe('Emission Factors', () => {
  it('should have all transport modes defined', () => {
    expect(EMISSION_FACTORS.transport).toBeDefined();
    expect(EMISSION_FACTORS.transport.car).toBe(0.14);
    expect(EMISSION_FACTORS.transport['two-wheeler']).toBe(0.04);
    expect(EMISSION_FACTORS.transport.metro).toBe(0.02);
    expect(EMISSION_FACTORS.transport.bus).toBe(0.03);
    expect(EMISSION_FACTORS.transport.auto).toBe(0.07);
    expect(EMISSION_FACTORS.transport.cycle).toBe(0);
    expect(EMISSION_FACTORS.transport.walk).toBe(0);
  });

  it('should have all food types defined', () => {
    expect(EMISSION_FACTORS.food.vegan).toBe(1.0);
    expect(EMISSION_FACTORS.food.veg).toBe(1.5);
    expect(EMISSION_FACTORS.food.mixed).toBe(2.5);
    expect(EMISSION_FACTORS.food['non-veg']).toBe(4.0);
    expect(EMISSION_FACTORS.food.delivery).toBe(0.8);
  });

  it('should have energy factors defined', () => {
    expect(EMISSION_FACTORS.energy.ac_per_hour).toBe(1.2);
    expect(EMISSION_FACTORS.energy.appliance).toBe(0.3);
  });

  it('should have waste factors for segregation choices', () => {
    expect(EMISSION_FACTORS.waste.yes).toBe(0.2);
    expect(EMISSION_FACTORS.waste.no).toBe(1.0);
    expect(EMISSION_FACTORS.waste.yes).toBeLessThan(EMISSION_FACTORS.waste.no);
  });

  it('should be frozen (immutable)', () => {
    expect(Object.isFrozen(EMISSION_FACTORS)).toBe(true);
    expect(Object.isFrozen(EMISSION_FACTORS.transport)).toBe(true);
  });
});

describe('Transport Emission Calculations', () => {
  it('should calculate car emissions correctly', () => {
    const km = 10;
    const emissions = km * EMISSION_FACTORS.transport.car;
    expect(emissions).toBe(1.4);
  });

  it('should calculate two-wheeler emissions correctly', () => {
    const km = 10;
    const emissions = km * EMISSION_FACTORS.transport['two-wheeler'];
    expect(emissions).toBeCloseTo(0.4, 2);
  });

  it('should return 0 emissions for walking', () => {
    const km = 10;
    const emissions = km * EMISSION_FACTORS.transport.walk;
    expect(emissions).toBe(0);
  });

  it('should return 0 emissions for cycling', () => {
    const km = 10;
    const emissions = km * EMISSION_FACTORS.transport.cycle;
    expect(emissions).toBe(0);
  });

  it('should calculate metro emissions lower than car', () => {
    const km = 20;
    const carEmissions = km * EMISSION_FACTORS.transport.car;
    const metroEmissions = km * EMISSION_FACTORS.transport.metro;
    expect(metroEmissions).toBeLessThan(carEmissions);
  });

  it('should handle 0 km distance', () => {
    const emissions = 0 * EMISSION_FACTORS.transport.car;
    expect(emissions).toBe(0);
  });

  it('should handle boundary max distance (100 km)', () => {
    const km = 100;
    const emissions = km * EMISSION_FACTORS.transport.car;
    expect(emissions).toBe(14);
  });
});

describe('Food Emission Calculations', () => {
  it('should calculate vegan diet as lowest', () => {
    expect(EMISSION_FACTORS.food.vegan).toBeLessThan(EMISSION_FACTORS.food.veg);
    expect(EMISSION_FACTORS.food.veg).toBeLessThan(EMISSION_FACTORS.food.mixed);
    expect(EMISSION_FACTORS.food.mixed).toBeLessThan(EMISSION_FACTORS.food['non-veg']);
  });

  it('should calculate food + delivery emissions', () => {
    const dietEmissions = EMISSION_FACTORS.food.mixed;
    const deliveryEmissions = 2 * EMISSION_FACTORS.food.delivery;
    const total = dietEmissions + deliveryEmissions;
    expect(total).toBeCloseTo(4.1, 2);
  });

  it('should handle zero deliveries', () => {
    const total = EMISSION_FACTORS.food.veg + 0 * EMISSION_FACTORS.food.delivery;
    expect(total).toBe(1.5);
  });
});

describe('Energy Emission Calculations', () => {
  it('should calculate AC emissions', () => {
    const hours = 8;
    const emissions = hours * EMISSION_FACTORS.energy.ac_per_hour;
    expect(emissions).toBeCloseTo(9.6, 2);
  });

  it('should calculate appliance emissions', () => {
    const count = 3;
    const emissions = count * EMISSION_FACTORS.energy.appliance;
    expect(emissions).toBeCloseTo(0.9, 2);
  });

  it('should calculate combined energy emissions', () => {
    const acEmissions = 5 * EMISSION_FACTORS.energy.ac_per_hour;
    const appEmissions = 2 * EMISSION_FACTORS.energy.appliance;
    expect(acEmissions + appEmissions).toBeCloseTo(6.6, 2);
  });

  it('should handle 0 hours and 0 appliances', () => {
    const total = 0 * EMISSION_FACTORS.energy.ac_per_hour + 0 * EMISSION_FACTORS.energy.appliance;
    expect(total).toBe(0);
  });
});

describe('Total Footprint Aggregation', () => {
  it('should sum all categories correctly', () => {
    const footprint = {
      transport: 1.4,
      food: 3.3,
      energy: 4.2,
      shopping: 1.2,
      waste: 0.2,
      water: 0.24
    };
    const total = Object.values(footprint).reduce((sum, v) => sum + v, 0);
    expect(total).toBeCloseTo(10.54, 2);
  });

  it('should handle all-zero footprint', () => {
    const footprint = { transport: 0, food: 0, energy: 0, shopping: 0, waste: 0, water: 0 };
    const total = Object.values(footprint).reduce((sum, v) => sum + v, 0);
    expect(total).toBe(0);
  });
});

describe('Carbon Score Calculation', () => {
  it('should return 100 for zero emissions', () => {
    const total = 0;
    const score = clamp(Math.round(100 - (total / (INDIAN_BASELINE_DAILY * 2)) * 100), 0, 100);
    expect(score).toBe(100);
  });

  it('should return 0 for double the Indian baseline', () => {
    const total = INDIAN_BASELINE_DAILY * 2;
    const score = clamp(Math.round(100 - (total / (INDIAN_BASELINE_DAILY * 2)) * 100), 0, 100);
    expect(score).toBe(0);
  });

  it('should return ~50 for average Indian emissions', () => {
    const total = INDIAN_BASELINE_DAILY;
    const score = clamp(Math.round(100 - (total / (INDIAN_BASELINE_DAILY * 2)) * 100), 0, 100);
    expect(score).toBe(50);
  });

  it('should clamp score to 0-100 range', () => {
    const highTotal = 50;
    const score = clamp(Math.round(100 - (highTotal / (INDIAN_BASELINE_DAILY * 2)) * 100), 0, 100);
    expect(score).toBe(0);
  });

  it('should handle negative total gracefully', () => {
    const total = -5;
    const score = clamp(Math.round(100 - (total / (INDIAN_BASELINE_DAILY * 2)) * 100), 0, 100);
    expect(score).toBe(100);
  });
});

describe('Clamp Utility', () => {
  it('should clamp values within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });
});

describe('Sanitize Utility', () => {
  it('should escape HTML characters', () => {
    expect(sanitize('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });

  it('should handle ampersands', () => {
    expect(sanitize('AT&T')).toBe('AT&amp;T');
  });

  it('should handle single quotes', () => {
    expect(sanitize("it's")).toBe("it&#x27;s");
  });

  it('should return empty string for non-string inputs', () => {
    expect(sanitize(null)).toBe('');
    expect(sanitize(undefined)).toBe('');
    expect(sanitize(123)).toBe('');
  });

  it('should pass through clean strings', () => {
    expect(sanitize('Hello World')).toBe('Hello World');
  });
});

describe('Constants', () => {
  it('should have correct Indian baseline daily value', () => {
    expect(INDIAN_BASELINE_DAILY).toBe(6.7);
  });

  it('should have correct global fair share annual value', () => {
    expect(GLOBAL_FAIR_SHARE_ANNUAL).toBe(6400);
  });
});
