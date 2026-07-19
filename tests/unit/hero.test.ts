import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('homepage hero contract', () => {
  const hero = readFileSync(resolve('src/components/TopologyRig.astro'), 'utf8');
  const heroComponent = readFileSync(resolve('src/components/home/Hero.astro'), 'utf8');
  const packageJson = JSON.parse(readFileSync(resolve('package.json'), 'utf8')) as {
    dependencies?: Record<string, string>;
  };

  it('keeps the globe scene code-native and raster-free', () => {
    expect(hero).toContain('<svg');
    expect(hero).not.toMatch(/\.(?:avif|gif|jpe?g|png|webp)/i);
    expect(heroComponent).not.toMatch(/\.(?:avif|gif|jpe?g|png|webp)/i);
  });

  it('does not add a 3D, particle, or framework runtime', () => {
    const dependencies = Object.keys(packageJson.dependencies || {}).map((dependency) => dependency.toLowerCase());
    expect(dependencies).not.toContain('three');
    expect(dependencies).not.toContain('react');
    expect(dependencies).not.toContain('vanta');
    expect(dependencies.some((dependency) => dependency.includes('react-bits'))).toBe(false);
  });

  it('exposes stable geometry and interaction hooks', () => {
    for (const hook of [
      'data-hero-globe',
      'data-hero-globe-layer',
      'data-hero-chase-path',
      'data-hero-squirrel',
      'data-squirrel-limb',
      'data-hero-acorn',
      'data-hero-ripple'
    ]) {
      expect(hero).toContain(hook);
    }
    expect(heroComponent).toContain('data-hero-stage');
  });
});
