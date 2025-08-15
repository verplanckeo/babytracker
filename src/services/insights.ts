// insights.ts
import { ApplicationInsights, SeverityLevel } from "@microsoft/applicationinsights-web";

export const appInsights = new ApplicationInsights({
  config: {
    // Prefer connection string over instrumentation key
    connectionString: import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING,
    enableAutoRouteTracking: true,   // SPA route changes
    enableAjaxErrorStatusText: true, // better AJAX error info
    disableFetchTracking: false,     // track fetch by default
    // …add other config as you need
  },
});

appInsights.loadAppInsights();

// Helpful: identify the user/session if you have it
export function setUser(id?: string) {
  appInsights.setAuthenticatedUserContext(id || "anonymous", undefined, true);
}

export { SeverityLevel };
