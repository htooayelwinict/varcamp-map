#!/usr/bin/env node
// Live acceptance smoke test for the deployed VarCamp WorkAdventure demo.
// Opt-in: run via `npm run acceptance:smoke` (never part of `npm test`).
// Usage: node ops/acceptance/smoke.mjs [--url <wam url>] [--name <visitor>] [--out <dir>]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const DEFAULT_URL = 'https://varcamp.3-1-133-135.sslip.io/~/varcamp-demo/maps/overworld.wam';
const TOTAL_BUDGET_MS = 3 * 60 * 1000;
const WORLD_TIMEOUT_MS = 60_000;
const BENIGN_CONSOLE = [
  // Optional entity catalog that is expected to 404 (both the fetch failure line and the app's own warning mention the URL).
  /https:\/\/maps\.3-1-133-135\.sslip\.io\/assets\/entities\/entities\.json/,
  /Cannot load previous WOKA textures/,
  // Headless SwiftShader renderer chatter, not an application problem.
  /GL Driver Message \(OpenGL, Performance/,
];

function parseArgs(argv) {
  const options = { url: DEFAULT_URL, name: 'Smoke', out: join(here, 'output') };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    const value = argv[i + 1];
    if (flag === '--url' && value) { options.url = value; i += 1; }
    else if (flag === '--name' && value) { options.name = value; i += 1; }
    else if (flag === '--out' && value) { options.out = resolve(value); i += 1; }
    else if (flag === '--help' || flag === '-h') {
      console.log('Usage: node ops/acceptance/smoke.mjs [--url <wam url>] [--name <visitor>] [--out <dir>]');
      process.exit(0);
    } else throw new Error(`Unknown argument: ${flag}`);
  }
  if (options.name.length < 1 || options.name.length > 10) throw new Error('--name must be 1..10 characters');
  return options;
}

const options = parseArgs(process.argv.slice(2));
mkdirSync(options.out, { recursive: true });
const origin = new URL(options.url).origin;
const secondMapUrl = options.url.replace(/[^/]+\.wam(\?.*)?$/, 'speaker-aries.wam');

const summary = { url: options.url, name: options.name, out: options.out, startedAt: new Date().toISOString(), steps: [], screenshots: [], console: { errors: [], warnings: [], ignored: [] }, ok: false };
let stepIndex = 0;
let page;
let browser;

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function screenshot(label) {
  if (!page || page.isClosed()) return null;
  const file = join(options.out, `${String(stepIndex).padStart(2, '0')}-${label}.png`);
  try { await page.screenshot({ path: file, fullPage: false, timeout: 10_000 }); summary.screenshots.push(file); return file; }
  catch (error) { summary.screenshots.push(`${file} (failed: ${error.message.split('\n')[0]})`); return null; }
}

async function step(name, fn) {
  stepIndex += 1;
  const started = Date.now();
  const record = { step: stepIndex, name, ok: false, durationMs: 0, screenshot: null, error: null };
  summary.steps.push(record);
  try { await fn(); record.ok = true; }
  catch (error) { record.error = String(error?.message ?? error).split('\n').slice(0, 3).join(' | '); }
  record.durationMs = Date.now() - started;
  record.screenshot = await screenshot(name.replace(/[^a-z0-9]+/gi, '-').toLowerCase());
  if (!record.ok) throw new Error(`Step "${name}" failed: ${record.error}`);
}

function finish(exitCode) {
  summary.finishedAt = new Date().toISOString();
  summary.ok = exitCode === 0;
  console.log(JSON.stringify(summary, null, 2));
  process.exit(exitCode);
}

const budget = setTimeout(async () => {
  summary.steps.push({ step: stepIndex + 1, name: 'total runtime budget', ok: false, durationMs: TOTAL_BUDGET_MS, screenshot: null, error: `Exceeded ${TOTAL_BUDGET_MS} ms total budget` });
  try { await screenshot('timeout'); await browser?.close(); } catch { /* ignore */ }
  finish(1);
}, TOTAL_BUDGET_MS);

function recordConsole(message) {
  const type = message.type();
  if (type !== 'error' && type !== 'warning') return;
  // "Failed to load resource" messages carry the URL only in location(), so append it for the benign filter.
  const location = message.location?.();
  const text = location?.url && /Failed to load resource/.test(message.text()) ? `${message.text()} (${location.url})` : message.text();
  const entry = { type, text: text.slice(0, 500), url: page?.url() ?? null, at: new Date().toISOString() };
  if (BENIGN_CONSOLE.some(pattern => pattern.test(text))) summary.console.ignored.push(entry);
  else if (type === 'error') summary.console.errors.push(entry);
  else summary.console.warnings.push(entry);
}

const bodyIncludes = text => page.waitForFunction(needle => (document.body?.innerText ?? '').toLowerCase().includes(needle.toLowerCase()), text, { timeout: WORLD_TIMEOUT_MS, polling: 500 });
const continueButton = () => page.getByRole('button', { name: 'Continue', exact: true });
const cameraSaveButton = () => page.getByRole('button', { name: /^(Save|Let's go)$/ });

async function passCameraSceneIfShown(timeoutMs, { orWorld = false } = {}) {
  // Resolves 'camera' when the camera/mic scene shows, 'world' when (orWorld) the action bar shows first, or false on timeout.
  // Compare case-insensitively: the heading is uppercased by CSS, which innerText reflects.
  const which = await page.waitForFunction(({ orWorld }) => {
    const text = (document.body?.innerText ?? '').toLowerCase();
    if (text.includes('turn on your camera and microphone')) return 'camera';
    if (orWorld && text.includes('explore the room')) return 'world';
    return false;
  }, { orWorld }, { timeout: timeoutMs, polling: 500 }).then(h => h.jsonValue()).catch(() => false);
  if (which !== 'camera') return which;
  await cameraSaveButton().first().click({ timeout: 10_000 });
  return 'camera';
}

async function waitForWorld() {
  await bodyIncludes('Explore the room');
}

async function fillLoginAndSubmit() {
  const input = page.locator('[data-testid=loginSceneNameInput]');
  await input.waitFor({ state: 'visible', timeout: 45_000 });
  await input.fill(options.name);
  await sleep(300);
  const submit = page.locator('button.loginSceneFormSubmit');
  await submit.waitFor({ state: 'attached', timeout: 10_000 });
  if (await submit.isDisabled()) return false;
  await submit.click({ timeout: 5_000 });
  // Belt and braces: if the login scene is still showing after a short grace period, submit the form directly.
  try { await input.waitFor({ state: 'hidden', timeout: 5_000 }); }
  catch {
    await page.evaluate(() => { document.querySelector('form')?.requestSubmit?.(); });
    await input.waitFor({ state: 'hidden', timeout: 10_000 });
  }
  return true;
}

async function main() {
  browser = await chromium.launch({ headless: true, args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: false });
  await context.grantPermissions(['camera', 'microphone'], { origin });
  page = await context.newPage();
  page.on('console', recordConsole);
  page.on('pageerror', error => summary.console.errors.push({ type: 'pageerror', text: String(error?.message ?? error).slice(0, 500), url: page.url(), at: new Date().toISOString() }));

  await step('login scene', async () => {
    await page.goto(options.url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    if (!(await fillLoginAndSubmit())) {
      // Known gotcha: the Svelte validator can stick on "Name is too long"; reload once and retry.
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 45_000 });
      if (!(await fillLoginAndSubmit())) throw new Error('Continue button stayed disabled after reload');
    }
  });

  await step('woka scene', async () => {
    await continueButton().waitFor({ state: 'visible', timeout: 30_000 });
    await continueButton().click({ timeout: 10_000 });
  });

  await step('camera scene', async () => {
    if ((await passCameraSceneIfShown(30_000)) !== 'camera') throw new Error('Camera/microphone scene did not appear');
  });

  await step('enter world', async () => {
    await waitForWorld();
    try { await page.waitForFunction(() => document.body.innerText.toLowerCase().includes('open the welcome directory'), null, { timeout: 10_000, polling: 500 }); summary.welcomePromptSeen = true; }
    catch { summary.welcomePromptSeen = false; }
  });

  await step('quest journal via space', async () => {
    const journal = page.locator('iframe[title="VarCamp Quest Journal"][src*="/src/journal/index.html"]');
    await page.keyboard.press('Space');
    try { await journal.waitFor({ state: 'visible', timeout: 8_000 }); }
    catch {
      // Focus may have drifted off the game canvas: focus it and press again.
      await page.locator('canvas').first().focus().catch(() => {});
      await page.keyboard.press('Space');
      await journal.waitFor({ state: 'visible', timeout: 10_000 });
    }
    await screenshot('quest-journal-open');
    await page.locator('button.btn-danger.btn-square').first().click({ timeout: 10_000 });
    await journal.waitFor({ state: 'hidden', timeout: 10_000 });
  });

  await step('avatar menu without retired guides', async () => {
    // The name sits in a plain div; the clickable ancestor is the chip container itself (class "group bg-contrast/80 ... cursor-pointer").
    const nameChip = page.locator('div[class^="group bg-contrast"][class*="cursor-pointer"]', { hasText: options.name }).first();
    await nameChip.waitFor({ state: 'visible', timeout: 15_000 });
    await nameChip.click();
    const allSettings = page.getByRole('button', { name: 'All settings' });
    await allSettings.waitFor({ state: 'visible', timeout: 10_000 });
    await allSettings.click();
    for (const label of ['Return to Plaza', 'Go to Solar Hall', 'Go to Lunar Hall', 'Quest Journal']) {
      await page.getByRole('button', { name: label, exact: true }).first().waitFor({ state: 'visible', timeout: 10_000 });
    }
    await screenshot('full-menu');
    if (await page.getByRole('button', { name: 'Talk to Nearby Guides', exact: true }).count()) {
      throw new Error('Retired guide menu is still registered');
    }
    await page.keyboard.press('Escape');
  });

  await step('second map loads', async () => {
    summary.secondMapUrl = secondMapUrl;
    await page.goto(secondMapUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    // Name and WOKA are remembered; the camera scene may or may not reappear.
    const seen = await passCameraSceneIfShown(WORLD_TIMEOUT_MS, { orWorld: true });
    summary.secondMapCameraSceneShown = seen === 'camera';
    await waitForWorld();
  });

  await browser.close();
  clearTimeout(budget);
  finish(0);
}

main().catch(async error => {
  if (!summary.steps.some(s => !s.ok)) summary.steps.push({ step: stepIndex + 1, name: 'unexpected failure', ok: false, durationMs: 0, screenshot: null, error: String(error?.message ?? error).split('\n')[0] });
  summary.failure = String(error?.message ?? error).split('\n').slice(0, 3).join(' | ');
  try { await browser?.close(); } catch { /* ignore */ }
  clearTimeout(budget);
  finish(1);
});
