import posthog from "posthog-js";
import type { Properties } from "posthog-js";

/** Mirrors `main.tsx`: PostHog is only initialized when both env vars are set. */
export function isPostHogConfigured(): boolean {
  return Boolean(import.meta.env.VITE_PUBLIC_POSTHOG_KEY && import.meta.env.VITE_PUBLIC_POSTHOG_HOST);
}

export function capturePostHog(
  eventName: string,
  properties?: Properties | null,
  options?: Parameters<typeof posthog.capture>[2]
): void {
  if (!isPostHogConfigured()) return;
  posthog.capture(eventName, properties ?? undefined, options);
}

export function identifyPostHog(
  distinctId?: string,
  propertiesToSet?: Properties,
  propertiesToSetOnce?: Properties
): void {
  if (!isPostHogConfigured()) return;
  posthog.identify(distinctId, propertiesToSet, propertiesToSetOnce);
}

export function resetPostHog(resetDeviceId?: boolean): void {
  if (!isPostHogConfigured()) return;
  posthog.reset(resetDeviceId);
}
