// types/next-auth.d.ts
import { User as NextAuthUser } from "next-auth";

// Extend the built-in types for NextAuth User
declare module "next-auth" {
  interface Session {
    user?: {
      // Set by the session callback in pages/api/auth/[...nextauth].ts
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    emailNotificationsEnabled?: boolean;
    emailDailyQuoteEnabled?: boolean;
    emailContinueReadingEnabled?: boolean;
    emailChangelogEnabled?: boolean;
    lastNotificationAt?: Date;
    lastVisitedAt?: Date;
    lastVisitedGlobalId?: string;
    lastVisitedPaperId?: string;
    lastVisitedPaperTitle?: string;
  }
}
