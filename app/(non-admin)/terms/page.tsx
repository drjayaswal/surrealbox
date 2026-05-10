"use client";

import { motion } from "framer-motion";

const sections = [
  {
    title: "Acceptance of Terms",
    content: "By accessing and using Surrealbox, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. These terms constitute a legally binding agreement between you and Surrealbox.",
    number: "01"
  },
  {
    title: "Account Responsibility",
    content: "You are responsible for maintaining the confidentiality of your account credentials. Any activities that occur under your account are your sole responsibility. You agree to notify us immediately of any unauthorized use.",
    number: "02"
  },
  {
    title: "Acceptable Use",
    content: "Our platform is designed for respectful and intellectual discourse. You agree not to post content that is unlawful, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable. We reserve the right to remove any content.",
    number: "03"
  },
  {
    title: "Intellectual Property",
    content: "All content provided on Surrealbox is the property of Surrealbox or its content suppliers. You may not reproduce, duplicate, copy, or sell any portion of the platform without express written permission.",
    number: "04"
  },
  {
    title: "Data Collection",
    content: "We collect minimal personal information—typically your name and email—to facilitate meaningful participation in our discussions. Your identity is protected and used solely for account management and attribution of your contributions.",
    number: "05"
  },
  {
    title: "Privacy by Design",
    content: "Your data is encrypted and stored securely. We implement industry-standard security protocols to ensure that your private information remains private. We do not track your activity across other websites.",
    number: "06"
  },
  {
    title: "Cookies & Tracking",
    content: "We use essential session cookies to keep you authenticated. We may use anonymous analytics to understand how users interact with the platform and improve the search and discovery experience.",
    number: "07"
  },
  {
    title: "Transparency & Control",
    content: "We believe in total transparency regarding how your data is used. You have the right to request a copy of your data or ask for its deletion at any time through your account settings.",
    number: "08"
  },
  {
    title: "No Third-Party Sharing",
    content: "We never sell, rent, or trade your personal data with third parties for marketing purposes. Your information is only visible to other registered members as part of the community interaction.",
    number: "09"
  }
];

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto p-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl sm:text-5xl font-semibold text-black tracking-tight leading-tight">
            Privacy and Policy
          </h1>
          <p className="text-[17px] text-black/50 max-w-2xl leading-relaxed">
            Please read these terms and privacy guidelines carefully. They govern your access to, use of, and data privacy within the Surrealbox platform.
          </p>
        </div>

        <div className="space-y-16 pt-10">
          {sections.map((section, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i + 0.2 }}
              className="group flex gap-8 sm:gap-12"
            >
              <div className="hidden sm:flex flex-col items-center gap-4">
                <span className="text-2xl font-bold text-black/10 group-hover:text-black transition-colors duration-300 tabular-nums">
                  {section.number}
                </span>
                <div className="w-px flex-1 bg-black/10 group-hover:bg-black/20 transition-colors" />
              </div>
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-black">
                    {section.title}
                  </h2>
                </div>
                <p className="text-[15px] text-black/60 leading-relaxed max-w-2xl font-medium">
                  {section.content}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt- border-t border-black/5 text-black/40 text-[13px] font-medium">
          Last updated: May 2026
        </div>
      </motion.div>
    </div>
  );
}
