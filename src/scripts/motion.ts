import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  initAnalytics,
  trackProofScreenViewed,
  type ProofScreen
} from './analytics';
import { ACORN_PROGRESS, SQUIRREL_START, GLOBE_R, arcPoint } from '@/lib/hero-geometry';

gsap.registerPlugin(ScrollTrigger);

interface NetworkInformation {
  saveData?: boolean;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
}

const screenOrder: ProofScreen[] = ['workspace_overview', 'assistant_answer', 'run_trace'];
const squirrelPathTravel = 1 - SQUIRREL_START;
const squirrelReach = 0.08;
const collectionLead = 0.065;

function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function coarsePointer(): boolean {
  return window.matchMedia('(pointer: coarse)').matches;
}

function saveDataEnabled(): boolean {
  const navigatorWithConnection = navigator as NavigatorWithConnection;
  return Boolean(
    navigatorWithConnection.connection?.saveData ||
    navigatorWithConnection.mozConnection?.saveData ||
    navigatorWithConnection.webkitConnection?.saveData
  );
}

function canEnhanceHero(): boolean {
  return window.matchMedia('(min-width: 769px) and (pointer: fine)').matches &&
    !reducedMotion() &&
    !saveDataEnabled();
}

function canEnhanceWalkthrough(): boolean {
  return window.matchMedia('(min-width: 64rem) and (min-height: 45rem) and (pointer: fine)').matches &&
    !reducedMotion() &&
    !saveDataEnabled();
}

function clamp(value: number, minimum = 0, maximum = 1): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function smoothstep(start: number, end: number, value: number): number {
  const progress = clamp((value - start) / (end - start));
  return progress * progress * (3 - 2 * progress);
}

function initSiteHeader(): void {
  const header = document.querySelector<HTMLElement>('[data-site-header]');
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  if (!header) return;

  let updateQueued = false;
  const update = () => {
    const hasPassedHero = hero
      ? hero.getBoundingClientRect().bottom <= header.offsetHeight
      : window.scrollY > 12;
    header.dataset.scrolled = String(hasPassedHero);
    updateQueued = false;
  };
  const requestUpdate = () => {
    if (updateQueued) return;
    updateQueued = true;
    requestAnimationFrame(update);
  };

  update();
  window.addEventListener('scroll', requestUpdate, { passive: true });
}

function initHeroChase(): boolean {
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  const stage = hero?.querySelector<HTMLElement>('[data-hero-stage]');
  const scene = hero?.querySelector<HTMLElement>('[data-hero-globe]');
  const chasePath = hero?.querySelector<SVGPathElement>('[data-hero-chase-path]');
  const squirrel = hero?.querySelector<SVGGElement>('[data-hero-squirrel]');
  const squirrelBody = squirrel?.querySelector<SVGGElement>('[data-squirrel-body]');
  const squirrelTail = squirrel?.querySelector<SVGGElement>('[data-squirrel-tail]');
  const squirrelLegs = squirrel
    ? [...squirrel.querySelectorAll<SVGGElement>('[data-squirrel-limb]')]
    : [];
  const acorns = hero
    ? [...hero.querySelectorAll<SVGGElement>('[data-hero-acorn]')]
    : [];
  const ripples = hero
    ? [...hero.querySelectorAll<SVGEllipseElement>('[data-hero-ripple]')]
    : [];
  const globeLayers = hero
    ? [...hero.querySelectorAll<SVGGElement>('[data-hero-globe-layer]')]
    : [];
  const storyBeats = hero
    ? [...hero.querySelectorAll<HTMLElement>('[data-hero-story-beat]')]
    : [];
  const storyTitles = hero
    ? [...hero.querySelectorAll<HTMLElement>('[data-hero-story-title]')]
    : [];

  if (
    !hero ||
    !stage ||
    !scene ||
    !chasePath ||
    !squirrel ||
    !squirrelBody ||
    !squirrelTail ||
    squirrelLegs.length < 2 ||
    acorns.length !== ACORN_PROGRESS.length ||
    ripples.length !== ACORN_PROGRESS.length ||
    storyBeats.length !== ACORN_PROGRESS.length + 1 ||
    storyTitles.length !== storyBeats.length ||
    !canEnhanceHero()
  ) {
    return false;
  }

  const heroElement = hero;
  const squirrelElement = squirrel;
  const squirrelBodyElement = squirrelBody;
  const squirrelTailElement = squirrelTail;

  heroElement.dataset.enhanced = 'true';

  const acornPoses = ACORN_PROGRESS.map((progress) => arcPoint(progress));
  const collectionProgress = ACORN_PROGRESS.map((progress) =>
    (progress - squirrelReach - SQUIRREL_START) / squirrelPathTravel
  );

  acorns.forEach((acorn, index) => {
    acorn.dataset.collectionProgress = collectionProgress[index]?.toFixed(4);
  });

  let activeStoryIndex = -1;

  function activateStory(index: number): void {
    if (activeStoryIndex === index) return;
    activeStoryIndex = index;

    storyBeats.forEach((beat, beatIndex) => {
      const active = beatIndex === index;
      beat.dataset.active = String(active);
      if (active) beat.removeAttribute('aria-hidden');
      else beat.setAttribute('aria-hidden', 'true');
    });
    storyTitles.forEach((title, titleIndex) => {
      const active = titleIndex === index;
      title.dataset.active = String(active);
      if (active) title.removeAttribute('aria-hidden');
      else title.setAttribute('aria-hidden', 'true');
    });
  }

  function clearHoveredAcorn(): void {
    acorns.forEach((acorn) => {
      delete acorn.dataset.hovered;
    });
  }

  function render(progressValue: number): void {
    const progress = clamp(progressValue);
    heroElement.dataset.heroProgress = progress.toFixed(4);
    const collectedCount = collectionProgress.filter((threshold) => progress >= threshold).length;
    heroElement.dataset.heroStoryStep = String(collectedCount);
    activateStory(collectedCount);

    globeLayers.forEach((layer) => {
      const name = layer.dataset.heroGlobeLayer;
      const distance = name === 'routes' ? -72 : name === 'grid' ? -48 : -24;
      layer.setAttribute('transform', `translate(${(progress * distance).toFixed(2)} 0)`);
    });

    const squirrelPathProgress = SQUIRREL_START + squirrelPathTravel * progress;
    const squirrelPose = arcPoint(squirrelPathProgress, GLOBE_R);
    squirrelElement.dataset.pathProgress = squirrelPathProgress.toFixed(4);
    const squirrelX = squirrelPose.x;
    const squirrelY = squirrelPose.y;
    const stride = progress * Math.PI * 14;
    const strideWave = Math.sin(stride);
    const gait = (strideWave + 1) / 2;
    const bound = (Math.cos(stride) + 1) / 2;
    const bodyLift = lerp(0.5, -3.5, bound);
    const bodyPitch = lerp(2.5, -3.5, bound);
    const bodySquash = lerp(0.99, 1, bound);

    squirrelElement.setAttribute(
      'transform',
      `translate(${squirrelX.toFixed(2)} ${squirrelY.toFixed(2)}) rotate(${squirrelPose.rotation.toFixed(2)})`
    );
    squirrelBodyElement.setAttribute(
      'transform',
      `translate(0 ${bodyLift.toFixed(2)}) rotate(${bodyPitch.toFixed(2)}) scale(1 ${bodySquash.toFixed(3)})`
    );
    squirrelTailElement.style.transformOrigin = squirrelTailElement.dataset.transformOrigin || '55% 88%';
    squirrelTailElement.style.transform = `rotate(${lerp(6, -6, gait).toFixed(2)}deg)`;
    squirrelLegs.forEach((leg) => {
      const angle = leg.dataset.squirrelLimb === 'hind'
        ? lerp(6, -16, gait)
        : lerp(-22, 12, gait);
      leg.style.transformOrigin = leg.dataset.transformOrigin || 'center';
      leg.style.transform = `rotate(${angle.toFixed(2)}deg)`;
    });

    acorns.forEach((acorn, index) => {
      const acornPose = acornPoses[index];
      const threshold = collectionProgress[index];
      const squashGroup = acorn.querySelector<SVGGElement>('[data-hero-acorn-squash]');
      const ripple = ripples[index];
      if (!acornPose || threshold === undefined || !squashGroup || !ripple) return;

      const collectionStart = threshold - collectionLead;
      const collectionAmount = clamp((progress - collectionStart) / collectionLead);
      const isCollected = progress >= threshold;
      const isCollecting = collectionAmount > 0 && !isCollected;
      const targetX = squirrelX + Math.cos(squirrelPose.rotation * Math.PI / 180) * 48;
      const targetY = squirrelY + Math.sin(squirrelPose.rotation * Math.PI / 180) * 48 - 2;
      const pull = isCollecting ? collectionAmount : 0;
      const x = lerp(acornPose.x, targetX, pull);
      const y = lerp(acornPose.y, targetY, pull) - Math.sin(collectionAmount * Math.PI) * 4;
      const squashWave = Math.sin(clamp(collectionAmount / 0.72) * Math.PI);
      const exitScale = collectionAmount > 0.72
        ? 1 - (collectionAmount - 0.72) / 0.28
        : 1;
      const scaleX = (1 + squashWave * 0.16) * exitScale;
      const scaleY = (1 - squashWave * 0.24) * exitScale;

      acorn.dataset.collected = String(isCollected);
      acorn.dataset.collectionState = isCollected
        ? 'collected'
        : isCollecting
          ? 'collecting'
          : 'waiting';
      acorn.style.opacity = isCollected ? '0' : '1';
      acorn.setAttribute(
        'transform',
        `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${acornPose.rotation.toFixed(2)})`
      );
      squashGroup.setAttribute('transform', `scale(${scaleX.toFixed(3)} ${scaleY.toFixed(3)})`);

      if (isCollected) delete acorn.dataset.hovered;
      acorn.style.setProperty('--acorn-hover-rotation', acornPose.rotation < 0 ? '-8deg' : '8deg');
    });
  }

  function findNearestAcorn(event: PointerEvent): SVGGElement | undefined {
    let nearest: SVGGElement | undefined;
    let nearestDistance = 120;

    acorns.forEach((acorn) => {
      if (acorn.dataset.collected === 'true') return;
      const bounds = acorn.getBoundingClientRect();
      const distance = Math.hypot(
        event.clientX - (bounds.left + bounds.width / 2),
        event.clientY - (bounds.top + bounds.height / 2)
      );
      if (distance < nearestDistance) {
        nearest = acorn;
        nearestDistance = distance;
      }
    });

    return nearest;
  }

  scene.addEventListener('pointermove', (event) => {
    const nearest = findNearestAcorn(event);
    acorns.forEach((acorn) => {
      if (acorn === nearest) acorn.dataset.hovered = 'true';
      else delete acorn.dataset.hovered;
    });
  }, { passive: true });
  scene.addEventListener('pointerleave', clearHoveredAcorn, { passive: true });

  render(0);
  ScrollTrigger.create({
    trigger: heroElement,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => render(self.progress)
  });

  return true;
}

function initHeroEntrance(): void {
  if (
    !window.matchMedia('(min-width: 769px) and (pointer: fine)').matches ||
    coarsePointer() ||
    reducedMotion() ||
    saveDataEnabled()
  ) return;
  const elements = gsap.utils.toArray<HTMLElement>('[data-hero-reveal]');
  if (elements.length === 0) return;

  gsap.from(elements, {
    autoAlpha: 0,
    y: 16,
    duration: 0.48,
    stagger: 0.06,
    ease: 'power4.out',
    clearProps: 'opacity,transform,visibility'
  });
}

function initLenis(): void {
  if (coarsePointer() || reducedMotion() || saveDataEnabled()) return;

  const lenis = new Lenis({
    duration: 1.05,
    smoothWheel: true,
    syncTouch: false,
    wheelMultiplier: 0.9
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

function initWalkthrough(): boolean {
  const walkthrough = document.querySelector<HTMLElement>('[data-walkthrough]');
  const frame = walkthrough?.querySelector<HTMLElement>('[data-walkthrough-frame]');
  const trace = walkthrough?.querySelector<HTMLElement>('[data-walkthrough-trace]');
  const screens = walkthrough
    ? [...walkthrough.querySelectorAll<HTMLElement>('[data-walkthrough-screen]')]
    : [];
  const steps = walkthrough
    ? [...walkthrough.querySelectorAll<HTMLButtonElement>('[data-walkthrough-step]')]
    : [];

  if (
    !walkthrough ||
    !frame ||
    !trace ||
    screens.length !== screenOrder.length ||
    steps.length !== screenOrder.length ||
    !canEnhanceWalkthrough()
  ) {
    return false;
  }

  const walkthroughElement = walkthrough;
  const frameElement = frame;
  const traceElement = trace;

  walkthroughElement.dataset.enhanced = 'true';

  const sceneRanges = [
    { start: 0, end: 0.34 },
    { start: 0.34, end: 0.67 },
    { start: 0.67, end: 1 }
  ] as const;
  const sceneTargets = [0.14, 0.5, 0.82] as const;

  function sceneOpacity(index: number, progress: number): number {
    if (index === 0) return 1 - smoothstep(0.325, 0.34, progress);
    if (index === 1) {
      return smoothstep(0.34, 0.355, progress) * (1 - smoothstep(0.655, 0.67, progress));
    }
    return smoothstep(0.67, 0.685, progress);
  }

  let activeIndex = -1;

  function activate(index: number, shouldTrack = true): void {
    const screen = screenOrder[index];
    if (!screen || activeIndex === index) return;
    activeIndex = index;

    steps.forEach((step, stepIndex) => {
      const active = stepIndex === index;
      step.dataset.active = String(active);
      if (active) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
    });
    screens.forEach((panel, panelIndex) => {
      const active = panelIndex === index;
      panel.dataset.active = String(active);
      panel.setAttribute('aria-hidden', String(!active));
    });

    if (shouldTrack) trackProofScreenViewed(screen);
  }

  function render(progressValue: number): void {
    const progress = clamp(progressValue);
    walkthroughElement.dataset.walkthroughProgress = progress.toFixed(4);
    traceElement.style.setProperty('--walkthrough-progress', progress.toFixed(4));
    frameElement.style.setProperty('--frame-shadow-y', `${lerp(1.25, 2.15, progress).toFixed(3)}rem`);
    frameElement.style.setProperty('--frame-shadow-blur', `${lerp(3.25, 5.25, progress).toFixed(3)}rem`);

    const nextIndex = progress < sceneRanges[0].end ? 0 : progress < sceneRanges[1].end ? 1 : 2;
    activate(nextIndex);

    screens.forEach((panel, index) => {
      const range = sceneRanges[index];
      if (!range) return;
      const opacity = sceneOpacity(index, progress);
      panel.style.setProperty('--scene-opacity', opacity.toFixed(4));
      panel.style.visibility = opacity > 0.001 ? 'visible' : 'hidden';
    });
  }

  steps.forEach((step, index) => {
    step.addEventListener('click', () => {
      const sectionTop = walkthroughElement.getBoundingClientRect().top + window.scrollY;
      const scrollDistance = walkthroughElement.offsetHeight - window.innerHeight;
      window.scrollTo({
        top: sectionTop + scrollDistance * (sceneTargets[index] ?? 0),
        behavior: 'smooth'
      });
    });
  });

  render(0);
  trackProofScreenViewed('workspace_overview');

  ScrollTrigger.create({
    id: 'incident-walkthrough',
    trigger: walkthroughElement,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => render(self.progress)
  });

  return true;
}

export function initMarketingSite(): void {
  if (document.documentElement.dataset.motionInitialized === 'true') return;
  document.documentElement.dataset.motionInitialized = 'true';

  initSiteHeader();
  initHeroChase();
  const walkthroughEnhanced = initWalkthrough();
  initAnalytics({ observeProofScreens: !walkthroughEnhanced });
  initHeroEntrance();
  initLenis();
}
