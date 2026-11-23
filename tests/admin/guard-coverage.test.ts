// Every admin Server Action and admin data function must authorize itself
// before doing anything else. This test fails when a new export forgets to
// start with `await requireAdmin()`.

import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, it } from "node:test";
import ts from "typescript";

const root = join(import.meta.dirname, "..", "..");

/** Exports allowed to run without a session. */
const PUBLIC_EXPORTS = new Set(["src/app/admin/login/actions.ts#signIn"]);

const UNGUARDED_MODULES = new Set([
  "auth.ts",
  "session.ts",
  "token.ts",
  "password.ts",
  "validation.ts",
  "db-errors.ts",
]);

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const guardedFiles = [
  ...walk(join(root, "src/app/admin")).filter((path) =>
    path.endsWith("actions.ts"),
  ),
  // Every admin data module, so new ones are checked automatically. Only the
  // auth plumbing and pure helpers (no data access) are exempt.
  ...readdirSync(join(root, "src/lib/admin"))
    .filter((name) => name.endsWith(".ts") && !UNGUARDED_MODULES.has(name))
    .map((name) => join(root, "src/lib/admin", name)),
];

function isRequireAdminCall(statement: ts.Statement | undefined) {
  if (!statement || !ts.isExpressionStatement(statement)) return false;
  const expression = statement.expression;
  return (
    ts.isAwaitExpression(expression) &&
    ts.isCallExpression(expression.expression) &&
    expression.expression.expression.getText() === "requireAdmin"
  );
}

describe("admin guard coverage", () => {
  it("finds the admin action and data files", () => {
    assert.ok(
      guardedFiles.length >= 9,
      `only found ${guardedFiles.length} files`,
    );
  });

  for (const file of guardedFiles) {
    const path = relative(root, file).replaceAll("\\", "/");
    it(`${path}: every exported async function starts with requireAdmin()`, () => {
      const source = ts.createSourceFile(
        file,
        readFileSync(file, "utf8"),
        ts.ScriptTarget.Latest,
        true,
      );
      let checked = 0;
      for (const statement of source.statements) {
        if (!ts.isFunctionDeclaration(statement) || !statement.name) continue;
        const modifiers = ts.getModifiers(statement) ?? [];
        const exported = modifiers.some(
          (m) => m.kind === ts.SyntaxKind.ExportKeyword,
        );
        const isAsync = modifiers.some(
          (m) => m.kind === ts.SyntaxKind.AsyncKeyword,
        );
        if (!exported || !isAsync) continue;

        const name = `${path}#${statement.name.text}`;
        checked++;
        if (PUBLIC_EXPORTS.has(name)) continue;
        assert.ok(
          isRequireAdminCall(statement.body?.statements[0]),
          `${name} must start with \`await requireAdmin()\``,
        );
      }
      // Exported arrow functions would slip past the check above.
      const arrowExports = source.statements.filter(
        (statement) =>
          ts.isVariableStatement(statement) &&
          ts
            .getModifiers(statement)
            ?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) &&
          statement.declarationList.declarations.some(
            (d) => d.initializer && ts.isArrowFunction(d.initializer),
          ),
      );
      assert.equal(
        arrowExports.length,
        0,
        `${path}: export functions as declarations`,
      );
      assert.ok(checked > 0, `${path} exports no async functions`);
    });
  }
});
