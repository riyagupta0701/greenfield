import * as assert from 'assert';
import * as path from 'path';
import { extractFields } from '../../src/parsers/python/fieldExtractor';

const FIXTURES = path.resolve(__dirname, '../../../test/suite/fixtures/unit');

describe('pythonFieldExtractor', () => {

  describe('flask_views.py — jsonify and direct dict returns', () => {
    let fields: ReturnType<typeof extractFields>;

    before(() => {
      fields = extractFields(path.join(FIXTURES, 'flask_views.py'));
    });

    it('finds "userId" from jsonify', () => {
      assert.ok(fields.some(f => f.name === 'userId'));
    });

    it('finds "email" from jsonify', () => {
      assert.ok(fields.some(f => f.name === 'email'));
    });

    it('finds "displayName" from jsonify', () => {
      assert.ok(fields.some(f => f.name === 'displayName'));
    });

    it('finds "itemId" from direct dict return', () => {
      assert.ok(fields.some(f => f.name === 'itemId'));
    });

    it('finds "price" from direct dict return', () => {
      assert.ok(fields.some(f => f.name === 'price'));
    });

    it('marks all fields as side: "response"', () => {
      assert.ok(fields.every(f => f.side === 'response'));
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

  describe('fastapi_routes.py — JSONResponse and Pydantic BaseModel', () => {
    let fields: ReturnType<typeof extractFields>;

    before(() => {
      fields = extractFields(path.join(FIXTURES, 'fastapi_routes.py'));
    });

    it('finds "status" from JSONResponse', () => {
      assert.ok(fields.some(f => f.name === 'status'));
    });

    it('finds "version" from JSONResponse', () => {
      assert.ok(fields.some(f => f.name === 'version'));
    });

    it('finds "healthy" from direct dict return', () => {
      assert.ok(fields.some(f => f.name === 'healthy'));
    });

    it('finds "username" Pydantic field', () => {
      assert.ok(fields.some(f => f.name === 'username'));
    });

    it('finds "userId" Pydantic response field', () => {
      assert.ok(fields.some(f => f.name === 'userId'));
    });

    it('does NOT include Pydantic noise name "model_config"', () => {
      assert.ok(!fields.some(f => f.name === 'model_config'));
    });

    it('marks all fields as side: "response"', () => {
      assert.ok(fields.every(f => f.side === 'response'));
    });
  });

});
