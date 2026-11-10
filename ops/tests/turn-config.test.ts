import {execFileSync} from 'node:child_process';
import {describe, expect, it} from 'vitest';

const keys = ['STUN_SERVER', 'TURN_SERVER', 'TURN_USER', 'TURN_PASSWORD', 'TURN_STATIC_AUTH_SECRET'] as const;
function rendered(values: Record<string, string> = {}) {
  const env = {...process.env};
  for (const key of keys) delete env[key];
  return JSON.parse(execFileSync('docker', [
    'compose', '--env-file', 'ops/.env.example', '-f', 'ops/compose.yml', 'config', '--format', 'json',
  ], {encoding: 'utf8', env: {...env, ...values}}));
}

describe('external TURN configuration', () => {
  it('delivers provider endpoints and credentials to the service that generates attendee ICE servers', () => {
    const values = {
      STUN_SERVER: 'stun:relay.example.invalid:3478',
      TURN_SERVER: 'turn:relay.example.invalid:3478?transport=udp,turns:relay.example.invalid:443?transport=tcp',
      TURN_USER: 'varcamp-test-user',
      TURN_PASSWORD: 'synthetic-test-credential',
    };
    const config = rendered(values);
    expect(config.services.play.environment).toMatchObject(values);
    expect(config.services.play.environment.TURN_STATIC_AUTH_SECRET || '').toBe('');
  });

  it('supports the runtime shared-secret mode without requiring static user credentials', () => {
    const config = rendered({
      TURN_SERVER: 'turns:relay.example.invalid:443?transport=tcp',
      TURN_STATIC_AUTH_SECRET: 'synthetic-coturn-test-secret',
    });
    expect(config.services.play.environment.TURN_SERVER).toBe('turns:relay.example.invalid:443?transport=tcp');
    expect(config.services.play.environment.TURN_STATIC_AUTH_SECRET).toBe('synthetic-coturn-test-secret');
    expect(config.services.play.environment.TURN_USER || '').toBe('');
    expect(config.services.play.environment.TURN_PASSWORD || '').toBe('');
  });

  it('does not change unrelated services, ports, networks, images, mounts or editor access', () => {
    const baseline = rendered();
    const configured = rendered({
      STUN_SERVER: 'stun:relay.example.invalid:3478',
      TURN_SERVER: 'turns:relay.example.invalid:443?transport=tcp',
      TURN_USER: 'varcamp-test-user', TURN_PASSWORD: 'synthetic-test-credential',
    });
    for (const config of [baseline, configured]) {
      for (const key of keys) delete config.services.play.environment[key];
    }
    expect(configured).toEqual(baseline);
  });

  it('keeps an unconfigured deployment disabled instead of advertising a placeholder relay', () => {
    const env = rendered().services.play.environment;
    for (const key of keys) expect(env[key] || '').toBe('');
  });
});
