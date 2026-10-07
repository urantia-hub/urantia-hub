// Product analytics (PostHog). Every call is a no-op until NEXT_PUBLIC_POSTHOG_KEY is set.
import posthog from "posthog-js";

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

// Every Urantia app sends to one PostHog project. This property tells them apart.
const APP = "hub";

// The event names this app sends. Keep the list short.
export type AnalyticsEvent =
  | "paper_opened"
  | "section_read"
  | "search_performed"
  | "community_resource_clicked"
  | "parallels_opened"
  | "parallels_searched";

// Values are ids, counts, and labels. Never paragraph text, search text, or an email.
type EventProperties = Record<string, string | number | boolean | null>;

let started = false;

export function initAnalytics(): void {
  if (started || !KEY || typeof window === "undefined") return;
  started = true;

  posthog.init(KEY, {
    api_host: HOST,
    defaults: "2026-05-30",
    // Anonymous visitors stay anonymous. A person profile exists only after identify().
    person_profiles: "identified_only",
    // One visitor id across urantiahub.com and its subdomains (Dalamatia).
    cross_subdomain_cookie: true,
    disable_session_recording: true,
    // Clicks on controls only. A click on a paragraph is not captured, so no passage text is sent.
    autocapture: {
      element_allowlist: ["a", "button", "form", "input", "select", "textarea", "label"],
    },
    // Strips ?q= from captured URLs. The search text never leaves the site.
    mask_personal_data_properties: true,
    custom_personal_data_properties: ["q"],
  });
  posthog.register({ app: APP });
}

export function track(event: AnalyticsEvent, properties?: EventProperties): void {
  if (!started) return;
  posthog.capture(event, properties);
}

// Identify by the database user id. Do not pass an email or a name.
export function identifyUser(userId: string): void {
  if (!started) return;
  posthog.identify(userId);
}

export function resetUser(): void {
  if (!started) return;
  posthog.reset();
}
