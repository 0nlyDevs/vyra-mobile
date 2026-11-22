import assert from "node:assert/strict";
import test from "node:test";

import { caseIdFrom, readError } from "./api-core.ts";

test("readError reads the site's error shape", () => {
  const error = readError(401, { error: { code: "INVALID_CREDENTIALS", message: "E-mail ou mot de passe incorrect." } });
  assert.equal(error.code, "INVALID_CREDENTIALS");
  assert.equal(error.status, 401);
  assert.equal(error.message, "E-mail ou mot de passe incorrect.");
});

test("readError survives a body that is not JSON", () => {
  const error = readError(502, null);
  assert.equal(error.code, "ERROR");
  assert.equal(error.status, 502);
});

test("caseIdFrom finds the case id in every link shape", () => {
  const id = "00000000-0000-4000-8000-000000000001";
  for (const href of [`/court/${id}`, `/cases/${id}`, `/verifier/${id}`]) assert.equal(caseIdFrom(href), id);
  assert.equal(caseIdFrom("/feed"), null);
});
