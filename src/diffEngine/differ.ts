// Person D — Dead field diff computation
// dead_response_fields = Defined(backend response) − Accessed(frontend)
// dead_request_fields  = Defined(frontend request) − Accessed(backend)
import { Field, FieldSet } from '../types';

export function computeDiff(defined: Field[], accessed: Field[]): Field[] {
  // TODO: return fields present in defined but absent in accessed
  return [];
}
