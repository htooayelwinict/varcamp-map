import { hasLiveControllerLease } from './evidence.mjs';
import { createHash } from 'node:crypto';
import { isAbsolute } from 'node:path';

const moduleSha256 = '270bdd1c35f208f8b1304b785244b217f5e088921fba5c60ee1136c8b18c4dd1';
const shared = Object.freeze({ moduleSha256, moduleBytes: 30866,
  moduleUrl: `https://maps.3-1-133-135.sslip.io/varcamp-demo/bots/lyra.js?v=${moduleSha256}`,
  roomUrl: 'https://varcamp.3-1-133-135.sslip.io/~/varcamp-demo/maps/overworld.wam',
});
export const profiles = Object.freeze(Object.fromEntries([
  ['lyra', 'Lyra[BOT]', 'woka-female4'], ['nova', 'Nova[BOT]', 'woka-male2'], ['orion', 'Orion[BOT]', 'woka-male1'],
].map(([persona, botName, avatar]) => [persona, Object.freeze({ ...shared, persona, botName, avatar,
  name: `varcamp-${persona}-dev`, owner: `varcamp-${persona}-development-v1` })])));
export function selectProfile(persona = 'lyra') {
  if (typeof persona !== 'string' || !Object.hasOwn(profiles, persona)) throw Error('Invalid fixed guide persona');
  return profiles[persona];
}
export const config = selectProfile();
export const labelsFor = (profile = config) => ({
  'io.varcamp.bot.owner': profile.owner,
  'io.varcamp.bot.module-sha256': profile.moduleSha256,
  'io.varcamp.bot.persona': profile.persona,
});
export const labels = Object.freeze(labelsFor());

export function buildCreateArgs(image, seccomp, profile = config) {
  if (selectProfile(profile?.persona) !== profile) throw Error('Require a fixed profile');
  if (!/^sha256:[0-9a-f]{64}$/.test(image)) throw Error('Require an immutable local image ID (sha256:...)');
  if (!isAbsolute(seccomp) || /[\n\r]/.test(seccomp)) throw Error('Require an absolute seccomp profile path');
  return ['create', '--name', profile.name, '--init', '--user', '1000:1000',
    '--cpus', '1', '--memory', '2g', '--memory-swap', '2g', '--pids-limit', '512', '--shm-size', '512m',
    '--read-only', '--tmpfs', '/tmp:rw,nosuid,nodev,size=512m,uid=1000,gid=1000,mode=1777',
    '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges:true', '--security-opt', `seccomp=${seccomp}`,
    '--network', 'bridge', '--restart', 'no', '--stop-timeout', '15',
    '--log-driver', 'json-file', '--log-opt', 'max-size=5m', '--log-opt', 'max-file=2',
    ...Object.entries(labelsFor(profile)).flatMap(([key, value]) => ['--label', `${key}=${value}`]), '--env', `VARCAMP_BOT_PERSONA=${profile.persona}`, image];
}

export function assertOwned(container, profile = config) {
  if (container.Name !== `/${profile.name}` || !/^[0-9a-f]{64}$/.test(container.Id) ||
      Object.entries(labelsFor(profile)).some(([key, value]) => container.Config?.Labels?.[key] !== value)) {
    throw Error(`Refusing container with unverified ownership (legacy labels require the reviewed old CLI): ${profile.name}`);
  }
  return container;
}

export function verifyModule({ url, status, body }, digest = config.moduleSha256) {
  if (url !== config.moduleUrl) throw Error('Unexpected module response URL');
  if (status !== 200) throw Error(`Module HTTP status ${status}; redirects are forbidden`);
  if (!/^[0-9a-f]{64}$/.test(digest) || createHash('sha256').update(body).digest('hex') !== digest) throw Error('Module digest mismatch');
  return body;
}

export function isMapFrame(candidate) {
  return candidate.location === 'about:srcdoc' && candidate.initialized === true &&
    candidate.roomId === config.roomUrl && Array.isArray(candidate.scripts) &&
    candidate.scripts.some(src => /^https:\/\/maps\.3-1-133-135\.sslip\.io\/varcamp-demo\/assets\/src-main-[A-Za-z0-9_-]+\.js$/.test(src));
}

export class RuntimeHealth {
  constructor(profile = config) { this.profile = profile; }
  #observation;
  observe(observation) { this.#observation = observation; }
  #error; #ready = false; #updatedAt = 0; #identity;
  fail(reason) { this.#error ??= String(reason); this.#ready = false; }
  ready(identity, now = Date.now()) {
    if (this.#error) throw Error(this.#error);
    this.#identity = identity; this.#ready = true; this.#updatedAt = now;
  }
  snapshot(now = Date.now()) {
    return { healthy: this.#ready && !this.#error && (!this.#observation || hasLiveControllerLease(this.#observation, now)) && now >= this.#updatedAt && now - this.#updatedAt < 15000,
      controller: this.#observation ?? null, updatedAt: this.#updatedAt, identity: this.#identity, error: this.#error ?? null, moduleSha256: this.profile.moduleSha256, persona: this.profile.persona };
  }
}
