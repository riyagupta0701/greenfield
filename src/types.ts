import * as vscode from 'vscode';

export interface Endpoint {
  pattern: string
  method: string
  backendFile: string
  frontendFiles: string[]
}

export interface Field {
  name: string
  side: 'request' | 'response'
  definedAt: string
  wasteScore?: number
}

export interface FieldSet {
  endpoint: Endpoint
  definedFields: Field[]
  accessedFields: Field[]
  deadFields?: Field[]
}
