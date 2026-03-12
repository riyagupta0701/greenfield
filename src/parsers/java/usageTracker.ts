// Person C — Java backend usage tracking
// Tracks request field access: Spring binding, @RequestBody deserialization
import { Field } from '../../types';

export function trackUsage(filePath: string): Field[] {
  // TODO: use tree-sitter to track which request fields the Java backend reads
  return [];
}
