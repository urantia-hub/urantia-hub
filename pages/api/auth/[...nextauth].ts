// Node modules.
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import NextAuth, { type Session } from "next-auth";
import type { Adapter, AdapterUser } from "next-auth/adapters";
import { PrismaAdapter } from "@auth/prisma-adapter";
// Relative modules.
import { getResendClient } from "@/libs/resend";
import { getPrismaClient } from "@/libs/prisma/client";
import {
  getMagicLinkEmailHTML,
  getMagicLinkEmailText,
} from "@/utils/email-templates/magicLink";
import createLogger from "@/utils/logger";

const logger = createLogger("auth");

const prisma = getPrismaClient();

export const authOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    EmailProvider({
      from: process.env.EMAIL_FROM,
      sendVerificationRequest: async ({ identifier: email, url }) => {
        try {
          logger.info("Sending magic link email", { email });
          await getResendClient().emails.send({
            from: process.env.EMAIL_FROM as string,
            to: email,
            subject: "Sign in to UrantiaHub",
            html: getMagicLinkEmailHTML(url),
            text: getMagicLinkEmailText(url),
          });
          logger.info("Magic link sent successfully");
        } catch (error: unknown) {
          logger.error("Error sending magic link email", error);
          throw new Error("Error sending magic link email");
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    // Expose the user id to the client. Analytics identifies by it, never by email.
    session({ session, user }: { session: Session; user: AdapterUser }) {
      if (session.user) session.user.id = user.id;
      return session;
    },
  },
  pages: {
    error: "/auth/error",
    signIn: "/auth/sign-in",
    signOut: "/auth/sign-out",
    verifyRequest: "/auth/verify-request",
  },
};

export default NextAuth(authOptions);
