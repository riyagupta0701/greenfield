// Person C — Python backend usage tracking
// Tracks request field access: request.json.get(), data['field'], Pydantic binding
import { Field } from '../../types';

export function trackUsage(filePath: string): Field[] {
  // TODO: use tree-sitter to track which request fields the Python backend reads
  return [];
}
