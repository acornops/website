import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const routes = ['/', '/privacy/'];

async function scrollHeroTo(page: Page, progress: number): Promise<void> {
  const hero = page.locator('[data-hero]');
  await hero.evaluate((element, nextProgress) => {
    const top = element.getBoundingClientRect().top + window.scrollY;
    const distance = element.clientHeight - window.innerHeight;
    window.scrollTo(0, top + distance * nextProgress);
  }, progress);
  await page.waitForFunction((nextProgress) => {
    const value = Number.parseFloat(document.querySelector<HTMLElement>('[data-hero]')?.dataset.heroProgress || '-1');
    return Math.abs(value - nextProgress) < 0.02;
  }, progress);
}

async function scrollWalkthroughTo(page: Page, progress: number): Promise<void> {
  const walkthrough = page.locator('[data-walkthrough]');
  await walkthrough.evaluate((element, nextProgress) => {
    const top = element.getBoundingClientRect().top + window.scrollY;
    const distance = element.clientHeight - window.innerHeight;
    window.scrollTo(0, top + distance * nextProgress);
  }, progress);
  await page.waitForFunction((nextProgress) => {
    const value = Number.parseFloat(
      document.querySelector<HTMLElement>('[data-walkthrough]')?.dataset.walkthroughProgress || '-1'
    );
    return Math.abs(value - nextProgress) < 0.02;
  }, progress);
  await page.evaluate(() => new Promise<void>((resolve) => {
    let previous = window.scrollY;
    let stableFrames = 0;
    const check = () => {
      const current = window.scrollY;
      stableFrames = Math.abs(current - previous) < 0.5 ? stableFrames + 1 : 0;
      previous = current;
      if (stableFrames >= 8) resolve();
      else requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  }));
}

for (const route of routes) {
  test(`${route} has no automatically detectable accessibility violations`, async ({ page }) => {
    test.setTimeout(60_000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(route);
    await page.evaluate(() => document.fonts.ready);
    const results = await new AxeBuilder({ page })
      .exclude('[data-brand-contrast-exception]')
      .analyze();
    expect(results.violations).toEqual([]);
  });
}

test('brand contrast exceptions stay limited to wordmarks and activation links', async ({ page }) => {
  await page.goto('/');
  const exceptionValues = await page.locator('[data-brand-contrast-exception]').evaluateAll((elements) =>
    elements.map((element) => element.getAttribute('data-brand-contrast-exception'))
  );
  expect(exceptionValues).toEqual([
    'wordmark',
    'activation',
    'activation',
    'orange-label',
    'orange-label',
    'activation',
    'wordmark'
  ]);
});

test('primary paths and all product states work without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('Turn incidents into evidence.');
  await expect(page.getByText(/self-hosted AcornOps investigates incidents/i)).toBeVisible();
  await expect(page.locator('[data-hero-story-beat]')).toHaveCount(6);
  await expect(page.getByRole('link', { name: /try the demo/i }).first()).toHaveAttribute('href', 'https://console.demo.acornops.dev/');
  await expect(page.getByRole('link', { name: /read the docs/i }).first()).toHaveAttribute('href', 'https://docs.acornops.dev/');
  await expect(page.locator('[data-hero]')).not.toHaveAttribute('data-enhanced', 'true');
  await expect(page.locator('[data-hero-acorn]')).toHaveCount(5);
  await expect(page.locator('[data-hero-acorn][data-collected="false"]')).toHaveCount(5);
  await expect(page.locator('[data-walkthrough-screen]')).toHaveCount(3);
  await expect(page.locator('[data-proof-screen="workspace_overview"]')).toContainText('See the signal before the noise.');
  await expect(page.locator('[data-proof-screen="assistant_answer"]')).toContainText('Ask in the context of the system.');
  await expect(page.locator('[data-proof-screen="run_trace"]')).toContainText('Read the work, not just the answer.');
  await expect(page.locator('[data-walkthrough]')).not.toHaveAttribute('data-enhanced', 'true');
  await expect(page.getByRole('heading', { name: /build the operation once/i })).toBeVisible();
  await context.close();
});

test('keyboard navigation exposes the skip link and visible focus', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Skip to content' });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
  await skipLink.press('Enter');
  await expect(page).toHaveURL(/#main-content$/);
});

test('homepage navigation merges with the hero and settles after scrolling', async ({ page }) => {
  await page.goto('/');
  const header = page.locator('[data-site-header]');
  await expect(page.getByRole('link', { name: 'Product' })).toHaveCount(0);
  await expect(header).toHaveAttribute('data-scrolled', 'false');
  await page.evaluate(() => window.scrollTo(0, 200));
  await expect(header).toHaveAttribute('data-scrolled', 'false');
  await page.locator('[data-hero]').evaluate((hero) => {
    const heroElement = hero as HTMLElement;
    window.scrollTo(0, heroElement.offsetTop + heroElement.clientHeight);
  });
  await expect(header).toHaveAttribute('data-scrolled', 'true');
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(header).toHaveAttribute('data-scrolled', 'false');
});

test('hero entrance settles without leaving hidden content', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => document.documentElement.dataset.motionInitialized === 'true');
  await page.waitForFunction(() => [...document.querySelectorAll('[data-hero-reveal]')]
    .every((element) => Number.parseFloat(getComputedStyle(element).opacity) > 0.98));
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('mobile and coarse pointers use native scrolling with every proof state in normal flow', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true
  });
  const page = await context.newPage();
  await page.goto('/');

  expect(await page.evaluate(() => window.matchMedia('(pointer: coarse)').matches)).toBe(true);
  await expect(page.locator('html')).not.toHaveClass(/lenis/);
  await expect(page.locator('[data-hero]')).not.toHaveAttribute('data-enhanced', 'true');
  await expect(page.locator('[data-hero-acorn][data-collected="false"]')).toHaveCount(5);
  await expect(page.locator('[data-walkthrough]')).not.toHaveAttribute('data-enhanced', 'true');
  await expect(page.locator('.site-nav__docs')).toBeVisible();
  for (const screen of ['workspace_overview', 'assistant_answer', 'run_trace']) {
    await expect(page.locator(`[data-proof-screen="${screen}"]`)).toBeVisible();
  }
  await context.close();
});

test('reduced motion keeps native scrolling and all proof states in normal flow', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('html')).not.toHaveClass(/lenis/);
  await expect(page.locator('[data-hero]')).not.toHaveAttribute('data-enhanced', 'true');
  await expect(page.locator('[data-walkthrough]')).not.toHaveAttribute('data-enhanced', 'true');
  await expect(page.locator('[data-walkthrough-screen]:visible')).toHaveCount(3);
});

test('save-data keeps native scrolling and all proof states in normal flow', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'connection', { configurable: true, value: { saveData: true } });
  });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('html')).not.toHaveClass(/lenis/);
  await expect(page.locator('[data-hero]')).not.toHaveAttribute('data-enhanced', 'true');
  await expect(page.locator('[data-walkthrough]')).not.toHaveAttribute('data-enhanced', 'true');
  await expect(page.locator('[data-walkthrough-screen]:visible')).toHaveCount(3);
  await context.close();
});

test('short desktop viewports keep the complete stacked walkthrough fallback', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 700 } });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('[data-walkthrough]')).not.toHaveAttribute('data-enhanced', 'true');
  await expect(page.locator('[data-walkthrough-screen]:visible')).toHaveCount(3);
  await context.close();
});

test('desktop scroll and rail clicks select reversible cinematic scenes without pinning', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'no-preference',
    colorScheme: 'light'
  });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('[data-hero]')).toHaveAttribute('data-enhanced', 'true');
  const walkthrough = page.locator('[data-walkthrough]');
  await expect(walkthrough).toHaveAttribute('data-enhanced', 'true');
  await expect(page.locator('html')).toHaveClass(/lenis/);
  await expect(page.locator('[data-proof-screen="workspace_overview"]')).toHaveAttribute('data-active', 'true');
  await expect(page.locator('[data-walkthrough-step]').first()).toHaveAttribute('aria-current', 'step');

  await page.locator('[data-walkthrough-step]').nth(1).click();
  await expect(page.locator('[data-proof-screen="assistant_answer"]')).toHaveAttribute('data-active', 'true');
  await expect(page.locator('[data-walkthrough-step]').nth(1)).toHaveAttribute('aria-current', 'step');

  await page.locator('[data-walkthrough-step]').nth(2).click();
  await expect(page.locator('[data-proof-screen="run_trace"]')).toHaveAttribute('data-active', 'true');

  await scrollWalkthroughTo(page, 0.5);
  await expect(page.locator('[data-proof-screen="assistant_answer"]')).toHaveAttribute('data-active', 'true');
  await scrollWalkthroughTo(page, 0.14);
  await expect(page.locator('[data-proof-screen="workspace_overview"]')).toHaveAttribute('data-active', 'true');
  await expect(page.locator('.pin-spacer')).toHaveCount(0);
  await context.close();
});

test('cinematic walkthrough keeps captures at native scale through every scene', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'no-preference'
  });
  const page = await context.newPage();
  await page.goto('/');

  for (const [progress, screen] of [
    [0.14, 'workspace_overview'],
    [0.5, 'assistant_answer'],
    [0.82, 'run_trace']
  ] as const) {
    await scrollWalkthroughTo(page, progress);
    const panel = page.locator(`[data-proof-screen="${screen}"]`);
    await expect(panel).toHaveAttribute('data-active', 'true');
    await expect(panel.locator('img')).toHaveCSS('transform', 'none');
  }

  for (const progress of [0.332, 0.347, 0.662, 0.677]) {
    await scrollWalkthroughTo(page, progress);
    const paintingPanels = await page.locator('[data-walkthrough-screen]').evaluateAll((panels) =>
      panels.filter((panel) => {
        const style = getComputedStyle(panel);
        return style.visibility === 'visible' && Number.parseFloat(style.opacity) > 0.01;
      }).length
    );
    expect(paintingPanels).toBeLessThanOrEqual(1);
  }

  await context.close();
});

test('hero chase maps direct and reverse scroll to five deterministic collection states', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'no-preference'
  });
  const page = await context.newPage();
  await page.goto('/');
  const hero = page.locator('[data-hero]');
  const acorns = page.locator('[data-hero-acorn]');
  const squirrel = page.locator('[data-hero-squirrel]');

  await expect(hero).toHaveAttribute('data-enhanced', 'true');
  await expect(acorns).toHaveCount(5);

  for (const [progress, count] of [[0.1, 1], [0.26, 2], [0.43, 3], [0.6, 4], [0.78, 5]] as const) {
    await scrollHeroTo(page, progress);
    await expect(page.locator('[data-hero-acorn][data-collected="true"]')).toHaveCount(count);
    await expect(hero).toHaveAttribute('data-hero-story-step', String(count));
    await expect(page.locator('[data-hero-story-beat][data-active="true"]')).toHaveCount(1);
    await expect(page.locator('[data-hero-story-beat]').nth(count)).not.toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('[data-hero-story-title]').nth(count)).not.toHaveAttribute('aria-hidden', 'true');
  }

  await scrollHeroTo(page, 1);
  await expect(squirrel).toHaveAttribute('data-path-progress', '1.0000');

  await scrollHeroTo(page, 0.56);
  await expect(page.locator('[data-hero-acorn][data-collected="true"]')).toHaveCount(3);
  await scrollHeroTo(page, 0);
  await expect(page.locator('[data-hero-acorn][data-collected="true"]')).toHaveCount(0);
  await expect(hero).toHaveAttribute('data-hero-story-step', '0');
  await expect(page.locator('[data-hero-story-beat]').first()).not.toHaveAttribute('aria-hidden', 'true');
  await expect(acorns.filter({ has: page.locator('[data-hero-acorn-hover]') }).first()).toHaveAttribute('data-collection-state', 'waiting');
  await context.close();
});

test('hero actions remain clear of the acorn trail on shorter and zoom-equivalent desktop screens', async ({ browser }) => {
  for (const viewport of [
    { width: 1024, height: 720 },
    { width: 1280, height: 800 },
    { width: 1440, height: 825 },
    { width: 1309, height: 750 }
  ]) {
    const context = await browser.newContext({ viewport, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    await page.goto('/');
    await scrollHeroTo(page, 0);

    const actions = await page.locator('.hero__actions').boundingBox();
    const acornBounds = await page.locator('[data-hero-acorn][data-collected="false"]').evaluateAll((acorns) =>
      acorns.map((acorn) => acorn.getBoundingClientRect().top)
    );
    expect(actions).not.toBeNull();
    expect(acornBounds).toHaveLength(5);
    if (actions) expect(actions.y + actions.height + 12).toBeLessThanOrEqual(Math.min(...acornBounds));
    await context.close();
  }
});

test('nearest uncollected acorn lifts and settles after pointer hover', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'no-preference'
  });
  const page = await context.newPage();
  await page.goto('/');
  await scrollHeroTo(page, 0);

  const acorn = page.locator('[data-hero-acorn][data-collected="false"]').first();
  const hoverLayer = acorn.locator('[data-hero-acorn-hover]');
  const bounds = await acorn.boundingBox();
  expect(bounds).not.toBeNull();
  if (!bounds) throw new Error('The first acorn has no browser bounds.');

  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await expect(acorn).toHaveAttribute('data-hovered', 'true');
  await expect.poll(() => hoverLayer.evaluate((element) => getComputedStyle(element).transform)).not.toBe('none');

  await page.mouse.move(1400, 120);
  await expect(acorn).not.toHaveAttribute('data-hovered', 'true');
  await expect.poll(() => hoverLayer.evaluate((element) => getComputedStyle(element).transform), { timeout: 500 }).toBe('none');
  await context.close();
});

test('proof screenshots keep their natural aspect ratio', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const images = page.locator('[data-proof-capture] img');
  for (let index = 0; index < await images.count(); index += 1) {
    const image = images.nth(index);
    await image.scrollIntoViewIfNeeded();
    await expect(image).toHaveJSProperty('naturalWidth', 1280);
    await expect(image).toHaveJSProperty('naturalHeight', 889);
    const ratio = await image.evaluate((proofImage) => {
      const element = proofImage as HTMLImageElement;
      const bounds = element.getBoundingClientRect();
      return { natural: element.naturalWidth / element.naturalHeight, rendered: bounds.width / bounds.height };
    });
    expect(Math.abs(ratio.natural - ratio.rendered)).toBeLessThan(0.005);
  }
});

test('proof captures are presented as non-interactive images', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('picture.walkthrough-screen__capture')).toHaveCount(3);
  await expect(page.locator('.walkthrough-screen__capture a')).toHaveCount(0);
  await expect(page.locator('.walkthrough-screen__open')).toHaveCount(0);
});

test('analytics stays disabled when no production domain is configured', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('script[data-domain]')).toHaveCount(0);
});

test('cinematic proof and completion analytics fire at most once', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => {
    const analyticsWindow = window as typeof window & {
      __proofEvents: Array<{ name: string; props: Record<string, string> }>;
    };
    analyticsWindow.__proofEvents = [];
    window.plausible = (name, options) => {
      analyticsWindow.__proofEvents.push({ name, props: options.props });
    };
  });
  const page = await context.newPage();
  await page.goto('/');

  for (const progress of [0.5, 0.82, 0.14, 0.82]) {
    await scrollWalkthroughTo(page, progress);
  }

  const events = await page.evaluate(() => {
    const analyticsWindow = window as typeof window & {
      __proofEvents: Array<{ name: string; props: Record<string, string> }>;
    };
    return analyticsWindow.__proofEvents;
  });
  for (const screen of ['workspace_overview', 'assistant_answer', 'run_trace']) {
    expect(events.filter((event) => event.name === 'Product Proof Viewed' && event.props.screen === screen)).toHaveLength(1);
  }
  expect(events.filter((event) => event.name === 'Incident Trail Complete')).toHaveLength(1);
  await context.close();
});

for (const viewport of [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 }
]) {
  test(`static visual snapshot at ${viewport.width}px`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const proofImages = page.locator('[data-walkthrough-screen] img');
    for (let index = 0; index < await proofImages.count(); index += 1) {
      const image = proofImages.nth(index);
      await image.scrollIntoViewIfNeeded();
      await expect(image).toHaveJSProperty('naturalWidth', 1280);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.locator('[data-walkthrough]')).not.toHaveAttribute('data-enhanced', 'true');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    const globeBounds = await page.locator('.hero-globe__base').boundingBox();
    expect(globeBounds).not.toBeNull();
    if (globeBounds) {
      expect(Math.abs(globeBounds.width - globeBounds.height)).toBeLessThan(1);
      expect(globeBounds.y / viewport.height).toBeGreaterThan(0.58);
      expect(globeBounds.y / viewport.height).toBeLessThan(0.73);
    }
    await expect(page).toHaveScreenshot(`home-${viewport.name}.png`, { fullPage: true, timeout: 30_000 });
  });
}

for (const beat of [
  { name: 'detect', progress: 0.14, screen: 'workspace_overview' },
  { name: 'investigate', progress: 0.5, screen: 'assistant_answer' },
  { name: 'verify', progress: 0.82, screen: 'run_trace' }
]) {
  test(`desktop cinematic ${beat.name} visual snapshot`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('[data-walkthrough]')).toHaveAttribute('data-enhanced', 'true');
    await scrollWalkthroughTo(page, beat.progress);
    await expect(page.locator(`[data-proof-screen="${beat.screen}"]`)).toHaveAttribute('data-active', 'true');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await expect(page).toHaveScreenshot(`home-desktop-${beat.name}.png`, { timeout: 30_000 });
  });
}
