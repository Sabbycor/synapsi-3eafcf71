import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import posthog from "posthog-js";
import { isPostHogConfigured } from "@/lib/posthogAnalytics";

// opt_out_capturing() blocks all events (not only replay). In DEV we only disable session recording
// so custom events still reach PostHog; replay stays off to avoid noisy / sensitive local recordings.
if (isPostHogConfigured()) {
  posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
    disable_session_recording: import.meta.env.DEV,
    session_recording: {
      maskAllInputs: true,
      maskInputOptions: { password: true },
    },
    capture_pageview: true,
    capture_pageleave: true,
  });
}

createRoot(document.getElementById("root")!).render(<App />);