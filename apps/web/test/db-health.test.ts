import { describe, it, expect } from 'vitest';
import { indexMatches, comparable } from '../src/app/api/utils/db-health';

describe('db-health helpers', () => {
  it('comparable normalizes undefined to null', () => {
    expect(comparable(undefined)).toBeNull();
    expect(comparable({ a: undefined })).toEqual({});
  });

  it('indexMatches detects exact match including partial and unique', () => {
    const existing = { key: { email: 1 }, unique: true, partialFilterExpression: { email: { $type: 'string' } } } as any;
    const expectedKey = { email: 1 } as any;
    const expectedOptions = { unique: true, partialFilterExpression: { email: { $type: 'string' } } } as any;
    expect(indexMatches(existing, expectedKey, expectedOptions)).toBe(true);
  });

  it('indexMatches detects mismatch in partialFilterExpression', () => {
    const existing = { key: { email: 1 }, unique: true } as any;
    const expectedKey = { email: 1 } as any;
    const expectedOptions = { unique: true, partialFilterExpression: { email: { $type: 'string' } } } as any;
    expect(indexMatches(existing, expectedKey, expectedOptions)).toBe(false);
  });

  it('indexMatches detects mismatch in unique flag', () => {
    const existing = { key: { token: 1 }, unique: false } as any;
    const expectedKey = { token: 1 } as any;
    const expectedOptions = { unique: true } as any;
    expect(indexMatches(existing, expectedKey, expectedOptions)).toBe(false);
  });
});
