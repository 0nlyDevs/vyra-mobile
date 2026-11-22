import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import * as mobile from "./domain.ts";

// Les libellés de l'application sont ceux du site, mot pour mot. Le dépôt vyra doit être à côté
// (../vyra) ; sinon (CI de ce dépôt seul) le test est passé.
const webPath = fileURLToPath(new URL("../../../vyra/web/src/lib/domain.ts", import.meta.url));

test("chaque libellé de l'application est celui du site", { skip: !existsSync(webPath) && "dépôt vyra absent" }, async () => {
  const web = (await import(webPath)) as Record<string, unknown>;
  for (const [name, value] of Object.entries(mobile)) {
    assert.deepEqual(value, web[name], `${name} diffère du site`);
  }
});
