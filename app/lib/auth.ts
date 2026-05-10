import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { emailOTP, phoneNumber, admin } from "better-auth/plugins";
import { db } from "@/app/db/index";
import { resend } from "@/app/lib/mail";
import * as schema from "@/app/db/schema";

// if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
//   throw new Error(
//     "Google OAuth credentials are not set in environment variables.",
//   );
// }

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
  // socialProviders: {
  //   google: {
  //     clientId: process.env.GOOGLE_CLIENT_ID,
  //     clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  //   },
  // },
  plugins: [
    nextCookies(),
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
        // const { data, error } = await resend.emails.send({
        //   from: "Surrealbox <onboarding@resend.dev>",
        //   to: email,
        //   subject:
        //     type === "forget-password"
        //       ? "Reset your password"
        //       : "Verify your account",
        //   html: `
        //     <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        //       <h2 style="color: #111;">${type === "forget-password" ? "Reset Password" : "Verification Code"}</h2>
        //       <div style="background-color: #f4f4f7; padding: 16px; text-align: center; border-radius: 4px;">
        //         <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">${otp}</span>
        //       </div>
        //     </div>`,
        // });

        // if (error) throw new Error(`Resend failed: ${error.message}`);
        
        console.log(`OTP sent to ${email} : ${otp}`);
      },
    }),
    admin(),
  ],
});
