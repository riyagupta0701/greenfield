import * as assert from 'assert';
import * as path from 'path';
import { trackUsage } from '../../src/parsers/python/usageTracker';

const FIXTURES = path.resolve(__dirname, '../../../test/suite/fixtures/unit');

describe('pythonUsageTracker', () => {

  describe('flask_views.py — request field reads', () => {
    let fields: ReturnType<typeof trackUsage>;

    before(() => {
      fields = trackUsage(path.join(FIXTURES, 'flask_views.py'));
    });

    it('finds "username" via request.json.get()', () => {
      assert.ok(fields.some(f => f.name === 'username'));
    });

    it('finds "password" via request.json.get()', () => {
      assert.ok(fields.some(f => f.name === 'password'));
    });

    it('finds "email" via request.json["key"]', () => {
      assert.ok(fields.some(f => f.name === 'email'));
    });

    it('finds "role" via request.json["key"]', () => {
      assert.ok(fields.some(f => f.name === 'role'));
    });

    it('finds "title" via request.form.get()', () => {
      assert.ok(fields.some(f => f.name === 'title'));
    });

    it('finds "description" via request.form.get()', () => {
      assert.ok(fields.some(f => f.name === 'description'));
    });

    it('finds "firstName" via indirect data = request.json then data.get()', () => {
      assert.ok(fields.some(f => f.name === 'firstName'));
    });

    it('finds "lastName" via indirect data["lastName"]', () => {
      assert.ok(fields.some(f => f.name === 'lastName'));
    });

    it('does NOT track dynamic bracket access data[key]', () => {
      // "key" is the variable name used in dynamic access — should not appear as a field
      assert.ok(!fields.some(f => f.name === 'key'));
    });

    it('marks all fields as side: "request"', () => {
      assert.ok(fields.every(f => f.side === 'request'));
    });

    it('attaches a definedAt location string', () => {
      assert.ok(fields.every(f => typeof f.definedAt === 'string' && f.definedAt.length > 0));
    });

    it('deduplicates fields', () => {
      const names = fields.map(f => f.name);
      const unique = new Set(names);
      assert.strictEqual(names.length, unique.size);
    });
  });

  describe('fastapi_routes.py — Pydantic model param conservative tracking', () => {
    let fields: ReturnType<typeof trackUsage>;

    before(() => {
      fields = trackUsage(path.join(FIXTURES, 'fastapi_routes.py'));
    });

    it('emits "username" as accessed (Pydantic model passed opaquely)', () => {
      assert.ok(fields.some(f => f.name === 'username'));
    });

    it('emits "email" as accessed (explicit field access in update_user)', () => {
      assert.ok(fields.some(f => f.name === 'email'));
    });

    it('emits "age" as accessed (explicit field access in update_user)', () => {
      assert.ok(fields.some(f => f.name === 'age'));
    });

    it('marks all fields as side: "request"', () => {
      assert.ok(fields.every(f => f.side === 'request'));
    });
  });

});
