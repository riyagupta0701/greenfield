// TS backend response field extraction
// Extracts fields from Express/Node.js res.json({...}) and res.send({...}) calls

import {
  CallExpression,
  Identifier,
  ObjectLiteralExpression,
  Project,
  PropertyAccessExpression,
  SyntaxKind,
  VariableDeclaration,
} from 'ts-morph';
import { Field } from '../../types';

// Common response parameter names in Express / Fastify / Koa handlers
const RESPONSE_NAMES = new Set(['res', 'response', 'resp', 'reply', 'ctx']);

function collectObjectFields(obj: ObjectLiteralExpression, filePath: string): Field[] {
  const fields: Field[] = [];
  for (const prop of obj.getProperties()) {
    if (
      prop.getKind() === SyntaxKind.PropertyAssignment ||
      prop.getKind() === SyntaxKind.ShorthandPropertyAssignment
    ) {
      const name = prop.getSymbol()?.getName();
      if (name) {
        fields.push({
          name,
          side: 'response',
          definedAt: `${filePath}:${prop.getStartLineNumber()}`,
          wasteScore: 0,
        });
      }
    }
  }
  return fields;
}

function resolveToObjectLiteral(id: Identifier): ObjectLiteralExpression | null {
  const symbol = id.getSymbol();
  if (!symbol) return null;
  const decls = symbol.getDeclarations();
  if (decls.length !== 1) return null;
  if (decls[0].getKind() !== SyntaxKind.VariableDeclaration) return null;
  const init = (decls[0] as VariableDeclaration).getInitializer();
  if (!init || init.getKind() !== SyntaxKind.ObjectLiteralExpression) return null;
  return init.asKindOrThrow(SyntaxKind.ObjectLiteralExpression);
}

/** Unwrap chained calls like res.status(200).json(...) → return the root receiver name */
function resolveReceiver(expr: PropertyAccessExpression): string | null {
  let receiver = expr.getExpression();
  // Unwrap one level of chaining: res.status(200)
  if (receiver.getKind() === SyntaxKind.CallExpression) {
    const inner = receiver.asKindOrThrow(SyntaxKind.CallExpression).getExpression();
    if (inner.getKind() === SyntaxKind.PropertyAccessExpression) {
      receiver = inner.asKindOrThrow(SyntaxKind.PropertyAccessExpression).getExpression();
    }
  }
  return receiver.getKind() === SyntaxKind.Identifier
    ? receiver.asKindOrThrow(SyntaxKind.Identifier).getText()
    : null;
}

/**
 * Extract response fields defined in a TypeScript backend file.
 * Detects:
 *   res.json({ field1, field2 })
 *   res.send({ field1, field2 })
 *   res.status(200).json({ field1, field2 })
 *   res.json(variable)  where variable = { field1, field2 }
 */
export function extractBackendResponseFields(filePath: string, project?: Project): Field[] {
  const proj = project ?? new Project({ skipLoadingLibFiles: true } as any);
  if (!proj.getSourceFile(filePath)) proj.addSourceFileAtPath(filePath);
  const sourceFile = proj.getSourceFileOrThrow(filePath);

  const fields: Field[] = [];
  const seen = new Set<string>();

  function add(f: Field) {
    if (!seen.has(f.name)) { seen.add(f.name); fields.push(f); }
  }

  sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call: CallExpression) => {
    const expr = call.getExpression();
    if (expr.getKind() !== SyntaxKind.PropertyAccessExpression) return;

    const propAccess = expr.asKindOrThrow(SyntaxKind.PropertyAccessExpression);
    const method     = propAccess.getName();
    if (method !== 'json' && method !== 'send') return;

    const receiverName = resolveReceiver(propAccess);
    if (!receiverName || !RESPONSE_NAMES.has(receiverName)) return;

    const args = call.getArguments();
    if (args.length < 1) return;
    const arg = args[0];

    if (arg.getKind() === SyntaxKind.ObjectLiteralExpression) {
      collectObjectFields(arg.asKindOrThrow(SyntaxKind.ObjectLiteralExpression), filePath)
        .forEach(add);
    } else if (arg.getKind() === SyntaxKind.Identifier) {
      const obj = resolveToObjectLiteral(arg.asKindOrThrow(SyntaxKind.Identifier));
      if (obj) collectObjectFields(obj, filePath).forEach(add);
    }
  });

  return fields;
}
