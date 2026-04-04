import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import posthog from "posthog-js";

const posthogKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
const posthogHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST;

// opt_out_capturing() blocks all events (not only replay). In DEV we only disable session recording
// so custom events still reach PostHog; replay stays off to avoid noisy / sensitive local recordings.
if (posthogKey && posthogHost) {
  posthog.init(posthogKey, {
    api_host: posthogHost,
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