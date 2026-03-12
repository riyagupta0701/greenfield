// Person B — Frontend usage tracking
// Tracks field access: destructuring, JSX, optional chaining, template literals
// Conservative rule: dynamic bracket access obj[key] → mark as possibly used
import { Field } from '../../types';

export function trackUsage(filePath: string): Field[] {
  // TODO: use ts-morph to track which response fields are actually accessed
  return [];
}
