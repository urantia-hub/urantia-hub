import { beforeEach, describe, expect, it, vi } from "vitest";

const posthog = vi.hoisted(() => ({
  init: vi.fn(),
  register: vi.fn(),
  capture: vi.fn(),
  identify: vi.fn(),
  reset: vi.fn(),
}));
vi.mock("posthog-js", () => ({ default: posthog }));

// The module reads the key at import time, so each test imports a fresh copy.
async function load(key?: string) {
  vi.resetModules();
  if (key) vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", key);
  else vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
  return import("@/libs/analytics");
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("analytics without a key", () => {
  it("never starts PostHog and every call is a no-op", async () => {
    const analytics = await load();
    analytics.initAnalytics();
    analytics.track("paper_opened", { paper_id: "1" });
    analytics.identifyUser("user-1");
    analytics.resetUser();

    expect(posthog.init).not.toHaveBeenCalled();
    expect(posthog.capture).not.toHaveBeenCalled();
    expect(posthog.identify).not.toHaveBeenCalled();
    expect(posthog.reset).not.toHaveBeenCalled();
  });
});

describe("analytics with a key", () => {
  it("starts once with the privacy settings and tags events with the app", async () => {
    const analytics = await load("phc_test");
    analytics.initAnalytics();
    analytics.initAnalytics();

    expect(posthog.init).toHaveBeenCalledTimes(1);
    const [key, config] = posthog.init.mock.calls[0];
    expect(key).toBe("phc_test");
    expect(config.person_profiles).toBe("identified_only");
    expect(config.disable_session_recording).toBe(true);
    expect(config.cross_subdomain_cookie).toBe(true);
    expect(config.custom_personal_data_properties).toContain("q");
    expect(config.autocapture.element_allowlist).not.toContain("p");
    expect(config.autocapture.element_allowlist).not.toContain("div");
    expect(posthog.register).toHaveBeenCalledWith({ app: "hub" });
  });

  it("does not track before init", async () => {
    const analytics = await load("phc_test");
    analytics.track("paper_opened", { paper_id: "1" });
    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it("captures a named event, identifies by id, and resets", async () => {
    const analytics = await load("phc_test");
    analytics.initAnalytics();
    analytics.track("search_performed", { result_count: 3, query_length: 12 });
    analytics.identifyUser("user-1");
    analytics.resetUser();

    expect(posthog.capture).toHaveBeenCalledWith("search_performed", {
      result_count: 3,
      query_length: 12,
    });
    expect(posthog.identify).toHaveBeenCalledWith("user-1");
    expect(posthog.reset).toHaveBeenCalledTimes(1);
  });
});
