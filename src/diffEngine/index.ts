// Person D — Diff Engine + Sustainability Scorer
import { FieldSet } from '../types';
import { computeDiff } from './differ';
import { scoreWaste } from './scorer';

export { computeDiff } from './differ';
export { scoreWaste, estimateCO2kWh } from './scorer';

export function runDiff(fieldSet: FieldSet, avgBytes = 32, dailyRequests = 10_000): FieldSet {
  const dead = computeDiff(fieldSet.definedFields, fieldSet.accessedFields);
  const scored = dead.map(f => ({ ...f, wasteScore: scoreWaste(f, avgBytes, dailyRequests) }));
  return { ...fieldSet, deadFields: scored };
}

