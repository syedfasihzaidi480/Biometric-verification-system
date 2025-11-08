export function comparable(obj: unknown): any;

export function indexMatches(
  existing: {
    key: Record<string, 1 | -1>;
    unique?: boolean;
    sparse?: boolean;
    partialFilterExpression?: Record<string, any> | null;
  },
  expectedKey: Record<string, 1 | -1>,
  expectedOptions?: {
    unique?: boolean;
    sparse?: boolean;
    partialFilterExpression?: Record<string, any> | null;
  }
): boolean;

export interface DbHealthReport {
  ok: boolean;
  byCollection: Record<
    string,
    {
      ok: string[];
      missing: string[];
      mismatched: Array<{ name: string; existing: any; expected: any }> | string[];
      legacyPresent: string[];
      present: string[];
    }
  >;
  suggestions: string[];
}

export function checkDbIndexes(): Promise<DbHealthReport>;

declare const _default: typeof checkDbIndexes;
export default _default;
