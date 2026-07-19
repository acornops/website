export const eventNames = [
  'CTA Click',
  'Navigation Click',
  'Incident Trail Complete',
  'Product Proof Viewed'
] as const;

export type AnalyticsEventName = (typeof eventNames)[number];

export const allowedProperties = {
  ctaLocation: ['navigation', 'hero', 'proof', 'final'] as const,
  ctaDestination: ['demo', 'docs'] as const,
  navigationDestination: ['home', 'docs', 'github', 'privacy', 'console'] as const,
  incidentTarget: ['kubernetes_cluster', 'linux_vm'] as const,
  proofScreen: ['workspace_overview', 'assistant_answer', 'run_trace'] as const
};

type CtaLocation = (typeof allowedProperties.ctaLocation)[number];
type CtaDestination = (typeof allowedProperties.ctaDestination)[number];
type NavigationDestination = (typeof allowedProperties.navigationDestination)[number];
type IncidentTarget = (typeof allowedProperties.incidentTarget)[number];
export type ProofScreen = (typeof allowedProperties.proofScreen)[number];

export type AnalyticsEvent =
  | { name: 'CTA Click'; properties: { location: CtaLocation; destination: CtaDestination } }
  | { name: 'Navigation Click'; properties: { destination: NavigationDestination } }
  | { name: 'Incident Trail Complete'; properties: { target: IncidentTarget } }
  | { name: 'Product Proof Viewed'; properties: { screen: ProofScreen } };

declare global {
  interface Window {
    plausible?: (name: AnalyticsEventName, options: { props: Record<string, string> }) => void;
  }
}

const observedScreens = new Set<ProofScreen>();
let completionTracked = false;

function includes<T extends string>(values: readonly T[], value: string | undefined): value is T {
  return Boolean(value && values.includes(value as T));
}

export function track(event: AnalyticsEvent): void {
  window.plausible?.(event.name, { props: event.properties });
}

export function trackIncidentTrailComplete(target: IncidentTarget): void {
  if (!includes(allowedProperties.incidentTarget, target) || completionTracked) return;
  completionTracked = true;
  track({ name: 'Incident Trail Complete', properties: { target } });
}

export function trackProofScreenViewed(screen: ProofScreen): void {
  if (!includes(allowedProperties.proofScreen, screen) || observedScreens.has(screen)) return;
  observedScreens.add(screen);
  track({ name: 'Product Proof Viewed', properties: { screen } });
  if (screen === 'run_trace') trackIncidentTrailComplete('kubernetes_cluster');
}

export function initAnalytics({ observeProofScreens = true } = {}): void {
  if (document.documentElement.dataset.analyticsInitialized === 'true') return;
  document.documentElement.dataset.analyticsInitialized = 'true';

  document.addEventListener('click', (event) => {
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a');
    if (!link) return;

    const location = link.dataset.trackCtaLocation;
    const ctaDestination = link.dataset.trackCtaDestination;
    if (
      includes(allowedProperties.ctaLocation, location) &&
      includes(allowedProperties.ctaDestination, ctaDestination)
    ) {
      track({ name: 'CTA Click', properties: { location, destination: ctaDestination } });
      return;
    }

    const navigationDestination = link.dataset.trackNavigation;
    if (includes(allowedProperties.navigationDestination, navigationDestination)) {
      track({ name: 'Navigation Click', properties: { destination: navigationDestination } });
    }
  });

  const proofElements = document.querySelectorAll<HTMLElement>('[data-proof-screen]');
  if (!observeProofScreens || !('IntersectionObserver' in window) || proofElements.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const screen = (entry.target as HTMLElement).dataset.proofScreen;
      if (!includes(allowedProperties.proofScreen, screen)) continue;
      trackProofScreenViewed(screen);
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.55 });

  proofElements.forEach((element) => observer.observe(element));
}
