// IMPORTANT: This must be the very first thing imported in the application
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { env } from "./env";

Sentry.init({
  dsn: "https://edde8a73152e2a2945f9919abc45ad5d@o4512103603372032.ingest.de.sentry.io/4512103666155600",
  integrations: [
    nodeProfilingIntegration(),
  ],
  // Tracing
  tracesSampleRate: 1.0, // Capture 100% of the transactions
  // Set sampling rate for profiling - this is evaluated only once per SDK.init call
  profileSessionSampleRate: 1.0,
  // Trace lifecycle automatically enables profiling during active traces
  profileLifecycle: 'trace',
  dataCollection: {
    // userInfo: false,
    // httpBodies: [],
  },
});
