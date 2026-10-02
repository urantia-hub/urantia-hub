// Node modules.
import { Analytics } from "@vercel/analytics/react";
import { SessionProvider, useSession } from "next-auth/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Lato } from "next/font/google";
import { useEffect, useRef } from "react";
import * as Sentry from "@sentry/nextjs";
import type { AppProps } from "next/app";
import type { NextComponentType, NextPageContext } from "next";
// Relative modules.
import { ThemeProvider } from "@/context/theme";
import { identifyUser, initAnalytics, resetUser } from "@/libs/analytics";
import "@/styles/globals.css";
import SentryErrorBoundary from "@/components/SentryErrorBoundary";
import { Toaster } from "sonner";

// Start analytics at module load. A page's effects run before the app's, so
// an init inside an effect here would drop each page's first event.
initAnalytics();

const googleFont = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

interface AppContentProps {
  Component: NextComponentType<NextPageContext, unknown, Record<string, unknown>>;
  pageProps: Record<string, unknown>;
}

// Wrap the actual app content with session tracking
function AppContent({ Component, pageProps }: AppContentProps) {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      if (status === "authenticated" && session?.user) {
        Sentry.setUser(session.user as Sentry.User);
      } else {
        Sentry.setUser(null);
      }
    }
  }, [session, status]);

  // Tie analytics events to the signed-in user's id.
  const userId = session?.user?.id;
  const wasSignedIn = useRef(false);
  useEffect(() => {
    if (status === "authenticated" && userId) {
      identifyUser(userId);
      wasSignedIn.current = true;
    } else if (status === "unauthenticated" && wasSignedIn.current) {
      resetUser();
      wasSignedIn.current = false;
    }
  }, [status, userId]);

  return (
    <SentryErrorBoundary>
      <Toaster className="toaster" richColors />
      <Component {...pageProps} />
    </SentryErrorBoundary>
  );
}

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    <div className={googleFont.className}>
      <ThemeProvider>
        <SessionProvider session={session}>
          <AppContent Component={Component} pageProps={pageProps} />
        </SessionProvider>
      </ThemeProvider>
      {process.env.NODE_ENV !== "development" && <SpeedInsights />}
      {process.env.NODE_ENV !== "development" && <Analytics />}
    </div>
  );
}
