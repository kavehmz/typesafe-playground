// Tiny structural validator for the situation the browser sends. Unknown keys are rejected,
// free text is limited to a safe alphabet, and the server injects the rules itself.
export const num = (lo, hi) => ({ t: 'num', lo, hi });
export const int = (lo, hi) => ({ t: 'int', lo, hi });
export const str = (max = 120) => ({ t: 'str', max });
export const en = (...vals) => ({ t: 'enum', vals });
export const bool = { t: 'bool' };
export const nul = s => ({ t: 'nullable', s });
export const arr = (s, max) => ({ t: 'arr', s, max });
export const obj = (fields, optional = []) => ({ t: 'obj', fields, optional });
export const idOf = prefix => ({ t: 're', re: new RegExp(`^${prefix}-\\d{1,4}$`) });
const SAFE_TEXT = /^[\w\s.,;:()'"/%+-]{0,160}$/;

export class SchemaError extends Error {}
export function check(value, schema, path = 'situation') {
  const fail = why => { throw new SchemaError(`${path}: ${why}`); };
  switch (schema.t) {
    case 'num': if (typeof value !== 'number' || !Number.isFinite(value) || value < schema.lo || value > schema.hi) fail(`expected number in [${schema.lo}, ${schema.hi}]`); return value;
    case 'int': if (!Number.isInteger(value) || value < schema.lo || value > schema.hi) fail('expected integer'); return value;
    case 'str': if (typeof value !== 'string' || value.length > schema.max || !SAFE_TEXT.test(value)) fail('expected safe text'); return value;
    case 'enum': if (!schema.vals.includes(value)) fail(`expected one of ${schema.vals.join('|')}`); return value;
    case 'bool': if (typeof value !== 'boolean') fail('expected boolean'); return value;
    case 're': if (typeof value !== 'string' || !schema.re.test(value)) fail('expected identifier'); return value;
    case 'nullable': return value === null ? null : check(value, schema.s, path);
    case 'arr': if (!Array.isArray(value) || value.length > schema.max) fail(`expected array of at most ${schema.max}`); return value.map((v, i) => check(v, schema.s, `${path}[${i}]`));
    case 'obj': {
      if (!value || typeof value !== 'object' || Array.isArray(value)) fail('expected object');
      const out = {};
      for (const key of Object.keys(value)) if (!(key in schema.fields)) fail(`unexpected key ${key}`);
      for (const [key, s] of Object.entries(schema.fields)) {
        if (!(key in value)) { if (schema.optional.includes(key)) continue; fail(`missing key ${key}`); }
        out[key] = check(value[key], s, `${path}.${key}`);
      }
      return out;
    }
    default: fail('unknown schema');
  }
}
