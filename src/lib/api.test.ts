import assert from "node:assert/strict";
import test from "node:test";

import { caseIdFrom, formatDate, formatPhone, formatSecond, readError, sealQuery, splitDataUrl } from "./api-core.ts";

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

test("sealQuery reads the QR link or the typed code", () => {
  const id = "00000000-0000-4000-8000-000000000002";
  assert.equal(sealQuery(`http://localhost:3000/verifier/sceau?c=${id}&s=ab%2Bc_d-e`), `c=${id}&s=ab%2Bc_d-e`);
  assert.equal(sealQuery("  vy-tkhk-vexf "), "code=vy-tkhk-vexf");
  assert.equal(sealQuery("   "), null);
});

test("formatSecond writes m:ss", () => {
  assert.equal(formatSecond(1.1), "0:01");
  assert.equal(formatSecond(75.6), "1:16");
});

test("formatPhone groups a Malagasy number like the site", () => {
  assert.equal(formatPhone("341234567"), "034 12 345 67");
  assert.equal(formatPhone("261341234567"), "034 12 345 67");
  assert.equal(formatPhone("12345"), "12345");
});

test("splitDataUrl separates the type and the base64", () => {
  assert.deepEqual(splitDataUrl("data:image/jpeg;base64,/9j/4A=="), { mimeType: "image/jpeg", base64: "/9j/4A==" });
  assert.equal(splitDataUrl("https://example.org/a.jpg"), null);
});

test("formatDate writes a French date", () => {
  assert.equal(formatDate("2019-03-12T12:00:00.000Z"), "12 mars 2019");
  assert.equal(formatDate("pas une date"), "pas une date");
});

test("readError keeps the field errors of a refused form", () => {
  const error = readError(400, { error: { code: "VALIDATION_FAILED", message: "Invalide.", fieldErrors: { phones: ["Un numéro a de 9 à 13 chiffres."] } } });
  assert.deepEqual(error.fieldErrors, { phones: ["Un numéro a de 9 à 13 chiffres."] });
});
