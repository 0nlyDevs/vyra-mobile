import assert from "node:assert/strict";
import test from "node:test";

import { appRoute } from "./site-links.ts";

const id = "00000000-0000-4000-8000-000000000002";

test("une affaire, même proposée vers le tribunal, ouvre son dossier", () => {
  assert.deepEqual(appRoute(`/cases/${id}`), { pathname: "/case/[id]", params: { id } });
  assert.deepEqual(appRoute(`/court/${id}`), { pathname: "/case/[id]", params: { id } });
  assert.deepEqual(appRoute(`/verifier/${id}`), { pathname: "/case/[id]", params: { id } });
});

test("les formulaires pré-remplis gardent leur texte", () => {
  assert.deepEqual(appRoute("/reports?text=Coupure%20d%E2%80%99eau"), { pathname: "/reports", params: { text: "Coupure d’eau" } });
  assert.deepEqual(appRoute("/cases?information=abc"), { pathname: "/cases", params: { information: "abc" } });
});

test("le sceau d'une carte ouvre l'onglet Sceau du scan", () => {
  assert.deepEqual(appRoute("https://vyra.mg/verifier/sceau?c=x&s=y"), { pathname: "/scan", params: { onglet: "sceau", c: "x", s: "y" } });
});

test("le tribunal et le jeu restent sur le site", () => {
  assert.equal(appRoute("/court"), null);
  assert.equal(appRoute("/game"), null);
});
