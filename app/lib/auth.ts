import { db } from "@/app/db/index";
import { resend } from "@/app/lib/mail";
import { betterAuth } from "better-auth";
import * as schema from "@/app/db/schema";
import { getOTPEmailHtml } from "./email-otp";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP, phoneNumber, admin } from "better-auth/plugins";

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error(
    "Google OAuth credentials are not set in environment variables.",
  );
}

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...schema,
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "user" },
      username: { type: "string" },
      reputation: { type: "number", defaultValue: 0 },
      bio: { type: "string" },
      gender: { type: "string", defaultValue: "other" },
      banned: { type: "boolean", defaultValue: false },
      banReason: { type: "string", defaultValue: "" },
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },
  plugins: [
    phoneNumber({
      otpLength: 8,
      sendOTP: ({ phoneNumber, code }) => {
        console.log(`[AUTH] Mobile OTP for ${phoneNumber}: ${code}`);
      },
      signUpOnVerification: {
        getTempEmail: (phoneNumber) => `${phoneNumber}@surrealbox.app`,
        getTempName: (phoneNumber) => `User ${phoneNumber.slice(-4)}`,
      },
    }),
    emailOTP({
      otpLength: 8,
      async sendVerificationOTP({ email, otp, type }) {
        const logoPath = process.cwd() + "/public/assets/invert-logo.png";
        const logoBuffer = await require("fs").promises.readFile(logoPath);

        const { data, error } = await resend.emails.send({
          from: "Surrealbox <onboarding@resend.dev>",
          to: email,
          subject:
            type === "forget-password"
              ? "Reset your password"
              : "Verify your account",
          html: getOTPEmailHtml({ otp, type }),
          attachments: [
            {
              filename: "logo.png",
              content: logoBuffer,
              contentId: "logo",
            },
          ],
        });
        if (error) throw new Error(`Resend failed: ${error.message}`);
      },
    }),
    admin(),
    nextCookies(),
  ],
});
