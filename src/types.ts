import * as vscode from 'vscode';

export interface Endpoint {
  pattern: string; // e.g. "GET /api/users/:id"
  backendFile: string;
  frontendFiles: string[];
}

export interface Field {
  name: string;
  side: 'request' | 'response';
  definedAt: vscode.Location;
  wasteScore: number; // bytes × request volume
}

export interface FieldSet {
  endpoint: Endpoint;
  definedFields: Field[];
  accessedFields: Field[];
  deadFields: Field[];
}
