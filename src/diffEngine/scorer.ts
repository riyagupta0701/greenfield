// Person D — Waste scorer
// score = avg_field_value_bytes × estimated_daily_requests
// CO₂/day = wasted_bytes × request_volume × 0.000000006 kWh/byte (Aslan et al. 2018)
import { Field } from '../types';

export function scoreWaste(field: Field, avgBytes: number, dailyRequests: number): number {
  // TODO: compute waste score and attach CO₂ estimate
  return 0;
}
