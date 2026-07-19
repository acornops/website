import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { allowedProperties, eventNames, track } from '../../src/scripts/analytics';

describe('analytics contract', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exposes only the four approved event names', () => {
    expect(eventNames).toEqual([
      'CTA Click',
      'Navigation Click',
      'Incident Trail Complete',
      'Product Proof Viewed'
    ]);
  });

  it('uses finite, identifier-free property values', () => {
    const values = Object.values(allowedProperties).flat();
    expect(values).not.toContain('url');
    expect(values).not.toContain('email');
    expect(values.every((value) => /^[a-z_]+$/.test(value))).toBe(true);
  });

  it('includes the three finite walkthrough states', () => {
    expect(allowedProperties.proofScreen).toEqual([
      'workspace_overview',
      'assistant_answer',
      'run_trace'
    ]);
  });

  it('passes only typed event properties to Plausible', () => {
    const plausible = vi.fn();
    vi.stubGlobal('window', { plausible });

    track({ name: 'CTA Click', properties: { location: 'hero', destination: 'demo' } });

    expect(plausible).toHaveBeenCalledWith('CTA Click', {
      props: { location: 'hero', destination: 'demo' }
    });
  });

  it('gates the Plausible script on production and an explicit domain', () => {
    const layout = readFileSync(resolve('src/layouts/BaseLayout.astro'), 'utf8');
    expect(layout).toContain('import.meta.env.PROD && Boolean(plausibleDomain)');
    expect(layout).toContain('PUBLIC_PLAUSIBLE_DOMAIN');
    expect(layout).toContain('PUBLIC_PLAUSIBLE_SRC');
  });

  it('does not collect free-form browser, identity, or location values', () => {
    const adapter = readFileSync(resolve('src/scripts/analytics.ts'), 'utf8');
    expect(adapter).not.toMatch(/location\.href|document\.URL|userId|emailAddress|innerText/);
  });
});
