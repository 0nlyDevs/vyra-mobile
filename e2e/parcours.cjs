// Parcours de l'application dans un navigateur, lancé par la CI contre le site démarré en mode démo :
// connexion par un compte de démo, puis chaque écran en clair et en sombre, à la taille d'un
// téléphone. Échoue sur une erreur non rattrapée, une route introuvable ou une page qui déborde
// de côté. Les captures et le rapport vont dans `e2e/resultats/` (artefact de la CI).
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require("playwright");

const PORT = 8081;
const APP = `http://localhost:${PORT}`;
const DIST = path.join(__dirname, "..", "dist");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".ttf": "font/ttf", ".ico": "image/x-icon" };
const OUT = path.join(__dirname, "resultats");
const CASE_ID = "00000000-0000-4000-8000-000000000002";
const SCAN_TABS = ["image", "video", "audio", "link", "texte", "source", "sceau"];
const SCREENS = [
  ["fil", "/"],
  ["enquetes", "/cases"],
  ...SCAN_TABS.map((tab) => [`scan-${tab}`, `/scan?onglet=${tab}`]),
  ["alertes", "/reports"],
  ["compte", "/account"],
  ["dossier", `/case/${CASE_ID}`],
  ["annuaire", "/directory"],
  ["assistant", "/assistant"],
];

const failures = [];
const notes = [];

async function settle(page) {
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => null);
  await page.waitForTimeout(600);
}

async function signIn(page, profileName, tag) {
  await page.goto(APP);
  await page.getByText("Comptes de démo").waitFor({ timeout: 30_000 });
  await page.screenshot({ path: path.join(OUT, `${tag}-connexion.png`), fullPage: true });
  await page.getByText(profileName, { exact: true }).click();
  await page.getByText("Enquêtes", { exact: true }).first().waitFor({ timeout: 30_000 });
}

async function visit(page, tag, name, route) {
  const errors = [];
  const onError = (error) => errors.push(error.message);
  page.on("pageerror", onError);
  await page.goto(`${APP}${route}`);
  await settle(page);
  page.off("pageerror", onError);
  const body = await page.evaluate(() => ({
    text: document.body.innerText,
    overflow: document.documentElement.scrollWidth - window.innerWidth,
  }));
  await page.screenshot({ path: path.join(OUT, `${tag}-${name}.png`), fullPage: true });
  const where = `${tag} ${route}`;
  for (const message of errors) failures.push(`${where} : erreur non rattrapée : ${message}`);
  if (/Unmatched Route|This screen doesn't exist|Something went wrong/i.test(body.text)) failures.push(`${where} : écran d'erreur d'Expo Router`);
  if (body.overflow > 1) failures.push(`${where} : la page déborde de ${body.overflow}px sur le côté`);
  if (body.text.trim().length < 20) failures.push(`${where} : écran vide`);
}

async function run(browser, { tag, profile, colorScheme, screens }) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme, locale: "fr-FR" });
  const page = await context.newPage();
  page.on("console", (message) => {
    if (message.type() === "error") notes.push(`${tag} console : ${message.text()}`);
  });
  page.on("response", (response) => {
    if (response.url().includes("/api/v1/") && response.status() >= 400) {
      notes.push(`${tag} API ${response.status()} ${response.request().method()} ${new URL(response.url()).pathname}`);
    }
  });
  try {
    await signIn(page, profile, tag);
    for (const [name, route] of screens) await visit(page, tag, name, route);
  } catch (error) {
    failures.push(`${tag} : parcours interrompu : ${error.message.split("\n")[0]}`);
    await page.screenshot({ path: path.join(OUT, `${tag}-interrompu.png`), fullPage: true }).catch(() => null);
  }
  await context.close();
}

// Sert `dist/` comme un hébergeur d'application d'une page : une adresse sans fichier
// (/cases, /case/…) reçoit index.html, et le routeur de l'application prend le relais.
function serve() {
  const server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, APP).pathname);
    let file = path.join(DIST, pathname);
    if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, "index.html");
    response.writeHead(200, { "Content-Type": TYPES[path.extname(file)] ?? "application/octet-stream" });
    fs.createReadStream(file).pipe(response);
  });
  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const server = await serve();
  const browser = await chromium.launch();
  await run(browser, { tag: "citoyen-clair", profile: "Hery", colorScheme: "light", screens: SCREENS });
  await run(browser, { tag: "verificateur-sombre", profile: "Rasoa", colorScheme: "dark", screens: SCREENS });
  await browser.close();
  server.close();
  const report = [
    `Échecs (${failures.length})`,
    ...failures,
    "",
    `Remarques (${notes.length}) : erreurs de la console et réponses 4xx/5xx de l'API`,
    ...[...new Set(notes)],
  ].join("\n");
  fs.writeFileSync(path.join(OUT, "rapport.txt"), report);
  process.stdout.write(`${report}\n`);
  process.exit(failures.length > 0 ? 1 : 0);
})();
