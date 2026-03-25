/**
 * Unit tests — Person D's Diff Engine + Sustainability Scorer
 *
 * Covers: computeDiff, scoreWaste, estimateCO2kWh, runDiff
 */

import * as assert from 'assert';
import { computeDiff } from '../../src/diffEngine/differ';
import { scoreWaste, estimateCO2kWh } from '../../src/diffEngine/scorer';
import { runDiff } from '../../src/diffEngine';
import { Field, FieldSet, Endpoint } from '../../src/types';

// Helpers

function field(name: string, side: 'request' | 'response' = 'response'): Field {
  return { name, side, definedAt: `test.ts:1`, wasteScore: 0 };
}

const ENDPOINT: Endpoint = {
  pattern: 'GET /api/test',
  method: 'GET',
  backendFile: 'server.ts',
  frontendFiles: ['client.ts'],
};

// computeDiff 

describe('computeDiff', () => {
  it('returns all defined fields when none are accessed', () => {
    const defined  = [field('id'), field('name'), field('secret')];
    const accessed: Field[] = [];
    const dead = computeDiff(defined, accessed);
    assert.deepStrictEqual(dead.map(f => f.name), ['id', 'name', 'secret']);
  });

  it('returns empty array when all defined fields are accessed', () => {
    const defined  = [field('id'), field('name')];
    const accessed = [field('id'), field('name')];
    const dead = computeDiff(defined, accessed);
    assert.strictEqual(dead.length, 0);
  });

  it('returns only the unaccessed fields', () => {
    const defined  = [field('id'), field('name'), field('email'), field('lastLoginIp')];
    const accessed = [field('id'), field('name')];
    const dead = computeDiff(defined, accessed);
    assert.deepStrictEqual(dead.map(f => f.name).sort(), ['email', 'lastLoginIp']);
  });

  it('returns empty array when both inputs are empty', () => {
    assert.strictEqual(computeDiff([], []).length, 0);
  });

  it('ignores extra accessed fields not in defined (no crash, no false positives)', () => {
    const defined  = [field('id')];
    const accessed = [field('id'), field('phantom')];
    const dead = computeDiff(defined, accessed);
    assert.strictEqual(dead.length, 0);
  });

  it('treats field names case-sensitively', () => {
    const defined  = [field('Email')];
    const accessed = [field('email')];        // different case
    const dead = computeDiff(defined, accessed);
    assert.strictEqual(dead.length, 1);
    assert.strictEqual(dead[0].name, 'Email');
  });

  it('preserves field metadata on dead fields', () => {
    const f: Field = { name: 'secret', side: 'response', definedAt: 'server.ts:42', wasteScore: 0 };
    const dead = computeDiff([f], []);
    assert.strictEqual(dead[0].definedAt, 'server.ts:42');
    assert.strictEqual(dead[0].side, 'response');
  });

  it('works for request-side fields', () => {
    const defined  = [field('customerId', 'request'), field('shippingAddress', 'request')];
    const accessed = [field('customerId', 'request')];
    const dead = computeDiff(defined, accessed);
    assert.deepStrictEqual(dead.map(f => f.name), ['shippingAddress']);
  });
});

// scoreWaste

describe('scoreWaste', () => {
  it('returns avgBytes × dailyRequests', () => {
    const result = scoreWaste(field('email'), 32, 10_000);
    assert.strictEqual(result, 320_000);
  });

  it('returns 0 when avgBytes is 0', () => {
    assert.strictEqual(scoreWaste(field('email'), 0, 10_000), 0);
  });

  it('returns 0 when dailyRequests is 0', () => {
    assert.strictEqual(scoreWaste(field('email'), 32, 0), 0);
  });

  it('scales linearly with request volume', () => {
    const low  = scoreWaste(field('f'), 32, 1_000);
    const high = scoreWaste(field('f'), 32, 10_000);
    assert.strictEqual(high / low, 10);
  });
});

// estimateCO2kWh 

describe('estimateCO2kWh', () => {
  it('uses the 0.000000006 kWh/byte coefficient (Aslan et al. 2018)', () => {
    const result = estimateCO2kWh(1_000_000);
    assert.strictEqual(result, 1_000_000 * 0.000000006);
  });

  it('returns 0 for 0 wasted bytes', () => {
    assert.strictEqual(estimateCO2kWh(0), 0);
  });

  it('is proportional to wasted bytes', () => {
    const a = estimateCO2kWh(500);
    const b = estimateCO2kWh(1000);
    assert.strictEqual(b / a, 2);
  });
});

// runDiff 

describe('runDiff', () => {
  it('returns a FieldSet with deadFields populated', () => {
    const fs: FieldSet = {
      endpoint:      ENDPOINT,
      definedFields:  [field('id'), field('name'), field('secret')],
      accessedFields: [field('id'), field('name')],
    };
    const result = runDiff(fs);
    assert.ok(result.deadFields, 'deadFields should be set');
    assert.deepStrictEqual(result.deadFields!.map(f => f.name), ['secret']);
  });

  it('attaches a positive wasteScore to each dead field', () => {
    const fs: FieldSet = {
      endpoint:      ENDPOINT,
      definedFields:  [field('secret')],
      accessedFields: [],
    };
    const result = runDiff(fs, 32, 10_000);
    assert.ok(result.deadFields![0].wasteScore > 0);
    assert.strictEqual(result.deadFields![0].wasteScore, 320_000);
  });

  it('returns empty deadFields when all fields are accessed', () => {
    const fs: FieldSet = {
      endpoint:      ENDPOINT,
      definedFields:  [field('id'), field('name')],
      accessedFields: [field('id'), field('name')],
    };
    const result = runDiff(fs);
    assert.strictEqual(result.deadFields!.length, 0);
  });

  it('does not mutate the original FieldSet', () => {
    const original: FieldSet = {
      endpoint:      ENDPOINT,
      definedFields:  [field('id')],
      accessedFields: [],
    };
    runDiff(original);
    assert.strictEqual(original.deadFields, undefined);
  });

  it('uses provided avgBytes and dailyRequests for scoring', () => {
    const fs: FieldSet = {
      endpoint:      ENDPOINT,
      definedFields:  [field('x')],
      accessedFields: [],
    };
    const result = runDiff(fs, 100, 500);
    assert.strictEqual(result.deadFields![0].wasteScore, 50_000); // 100 × 500
  });

  it('preserves all original FieldSet properties', () => {
    const fs: FieldSet = {
      endpoint:      ENDPOINT,
      definedFields:  [field('id')],
      accessedFields: [field('id')],
    };
    const result = runDiff(fs);
    assert.strictEqual(result.endpoint, ENDPOINT);
    assert.strictEqual(result.definedFields, fs.definedFields);
    assert.strictEqual(result.accessedFields, fs.accessedFields);
  });
});
