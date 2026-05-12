"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CROSLoader from "./loader";

type Sentiment = "critical" | "info" | "neutral" | "low";

interface Email {
  id: string;
  thread_id: string;
  envelope: {
    from_address: string;
    subject: string;
    date: string;
  };
  flags: {
    unread: boolean;
    has_attachments: boolean;
    priority_hint: boolean;
  };
  content: {
    snippet: string;
    body: string;
  };
  attachments: {
    filename: string;
    size?: number;
  }[];
}

interface Analysis {
  id: string;
  analysis: string;
  sentiment: Sentiment;
  tags: string[];
}

interface CROSData {
  version: string;
  timestamp: string;
  emails: Email[];
}

const DUMMY_DATA: CROSData = {
  version: "0.2.0",
  timestamp: "2026-05-12T01:37:05.942366",
  emails: [
    {
      id: "18e1a2b3c4d5",
      thread_id: "18e1a2b3c4d5",
      envelope: {
        from_address: "Google <no-reply@accounts.google.com>",
        subject: "Security alert for your account",
        date: "Mon, 11 May 2026 18:50:28 GMT",
      },
      flags: { unread: true, has_attachments: false, priority_hint: true },
      content: {
        snippet: "Your account was signed in from a new device in Mumbai, India.",
        body: "We noticed a new sign-in to your Google Account. If this was you, you can ignore this message. If not, please secure your account.",
      },
      attachments: [],
    },
    {
      id: "18e1a2b3c4d6",
      thread_id: "18e1a2b3c4d6",
      envelope: {
        from_address: "GitHub <noreply@github.com>",
        subject: "[CROS] Pull request #42 merged",
        date: "Mon, 11 May 2026 15:22:11 GMT",
      },
      flags: { unread: true, has_attachments: false, priority_hint: false },
      content: {
        snippet: "aryan-dani merged 3 commits into main from feature/refactor-fetcher",
        body: "Pull request #42 has been successfully merged. Changes include recursive MIME parser improvements and attachment deduplication logic.",
      },
      attachments: [],
    },
    {
      id: "18e1a2b3c4d7",
      thread_id: "18e1a2b3c4d7",
      envelope: {
        from_address: "AWS Billing <aws-billing@amazon.com>",
        subject: "Your AWS bill is ready",
        date: "Sun, 10 May 2026 09:00:00 GMT",
      },
      flags: { unread: false, has_attachments: true, priority_hint: true },
      content: {
        snippet: "Your April 2026 bill of $12.47 is now available.",
        body: "Your AWS bill for April 2026 is ready. Total charges: $12.47. Services used: Lambda, S3, CloudWatch. View detailed breakdown in the billing console.",
      },
      attachments: [{ filename: "invoice_apr2026.pdf", size: 48210 }],
    },
    {
      id: "18e1a2b3c4d8",
      thread_id: "18e1a2b3c4d8",
      envelope: {
        from_address: "Vercel <system@vercel.com>",
        subject: "Deployment failed: cros-dashboard",
        date: "Sun, 10 May 2026 22:14:55 GMT",
      },
      flags: { unread: true, has_attachments: false, priority_hint: true },
      content: {
        snippet: "Build error in cros-dashboard: Module not found 'framer-motion'",
        body: "Your deployment to cros-dashboard.vercel.app failed. Error: Cannot find module 'framer-motion'. Check your package.json and redeploy.",
      },
      attachments: [],
    },
    {
      id: "18e1a2b3c4d9",
      thread_id: "18e1a2b3c4d9",
      envelope: {
        from_address: "Notion <notify@mail.notion.so>",
        subject: "Aryan shared a page with you",
        date: "Sat, 9 May 2026 11:30:00 GMT",
      },
      flags: { unread: false, has_attachments: false, priority_hint: false },
      content: {
        snippet: "CROS - Architecture Spec has been shared with you.",
        body: "Aryan Dani has shared 'CROS - Architecture Spec v2' with you on Notion. Click to open the document.",
      },
      attachments: [],
    },
    {
      id: "18e1a2b3c4e0",
      thread_id: "18e1a2b3c4e0",
      envelope: {
        from_address: "Stripe <receipts@stripe.com>",
        subject: "Your receipt from Anthropic",
        date: "Fri, 8 May 2026 08:00:00 GMT",
      },
      flags: { unread: false, has_attachments: true, priority_hint: false },
      content: {
        snippet: "Receipt for $20.00 — Claude Pro subscription, May 2026.",
        body: "Payment of $20.00 was received for your Claude Pro subscription. Thank you for your business.",
      },
      attachments: [{ filename: "receipt_may2026.pdf", size: 22400 }],
    },
    {
      id: "18e1a2b3c4e1",
      thread_id: "18e1a2b3c4e1",
      envelope: {
        from_address: "LinkedIn <messages-noreply@linkedin.com>",
        subject: "You have 3 new connection requests",
        date: "Fri, 8 May 2026 14:45:00 GMT",
      },
      flags: { unread: true, has_attachments: false, priority_hint: false },
      content: {
        snippet: "Priya S., Rohan M., and Dev K. want to connect with you.",
        body: "You have 3 pending connection requests on LinkedIn. Visit your network to review and respond.",
      },
      attachments: [],
    },
    {
      id: "18e1a2b3c4e2",
      thread_id: "18e1a2b3c4e2",
      envelope: {
        from_address: "Cloudflare <noreply@notify.cloudflare.com>",
        subject: "DDoS attack mitigated on cros-api",
        date: "Thu, 7 May 2026 03:22:10 GMT",
      },
      flags: { unread: false, has_attachments: false, priority_hint: true },
      content: {
        snippet: "We detected and mitigated a DDoS attack on your zone cros-api.dev.",
        body: "A DDoS attack targeting cros-api.dev was automatically mitigated. 48,200 requests were blocked. No downtime was recorded.",
      },
      attachments: [],
    },
    {
      id: "18e1a2b3c4e3",
      thread_id: "18e1a2b3c4e3",
      envelope: {
        from_address: "Figma <noreply@figma.com>",
        subject: "Design file 'CROS UI Kit' updated",
        date: "Wed, 6 May 2026 16:00:00 GMT",
      },
      flags: { unread: false, has_attachments: false, priority_hint: false },
      content: {
        snippet: "Sana edited 7 frames in CROS UI Kit — see what changed.",
        body: "Sana has made updates to the CROS UI Kit design file on Figma. 7 frames were modified including the email card component and sidebar.",
      },
      attachments: [],
    },
    {
      id: "18e1a2b3c4e4",
      thread_id: "18e1a2b3c4e4",
      envelope: {
        from_address: "Jira <jira@atlassian.com>",
        subject: "[CROS-109] Bug: Attachment siphon fails on .eml files",
        date: "Tue, 5 May 2026 10:15:00 GMT",
      },
      flags: { unread: true, has_attachments: false, priority_hint: true },
      content: {
        snippet: "New critical bug assigned to you: Attachment siphon fails on .eml files.",
        body: "A critical bug has been filed and assigned to you in CROS project. The attachment siphon pipeline crashes when processing nested .eml file attachments. Reproduction steps are in the ticket.",
      },
      attachments: [],
    },
    {
      id: "18e1a2b3c4e5",
      thread_id: "18e1a2b3c4e5",
      envelope: {
        from_address: "HackerNews Digest <digest@hackernewsdigest.com>",
        subject: "Top stories: AI agent orchestration, Rust async runtimes",
        date: "Mon, 4 May 2026 07:00:00 GMT",
      },
      flags: { unread: false, has_attachments: false, priority_hint: false },
      content: {
        snippet: "Today's top 5: LLM orchestration patterns, Tokio 3.0 release, Python 4 roadmap...",
        body: "Top HN stories for May 4: 1. LLM orchestration at scale — 847 points. 2. Tokio 3.0 released — 612 points. 3. Python 4 roadmap — 540 points.",
      },
      attachments: [],
    },
    {
      id: "18e1a2b3c4e6",
      thread_id: "18e1a2b3c4e6",
      envelope: {
        from_address: "Render <support@render.com>",
        subject: "Scheduled maintenance: May 13, 02:00 UTC",
        date: "Sun, 3 May 2026 18:00:00 GMT",
      },
      flags: { unread: false, has_attachments: false, priority_hint: false },
      content: {
        snippet: "Render will perform scheduled maintenance on May 13 between 02:00–04:00 UTC.",
        body: "We will perform scheduled infrastructure maintenance on May 13, 2026 from 02:00 to 04:00 UTC. Brief service interruptions may occur for some services.",
      },
      attachments: [],
    },
    {
      id: "18e1a2b3c4e7",
      thread_id: "18e1a2b3c4e7",
      envelope: {
        from_address: "Google Workspace <workspace-noreply@google.com>",
        subject: "Storage quota: 87% used",
        date: "Sat, 2 May 2026 09:30:00 GMT",
      },
      flags: { unread: true, has_attachments: false, priority_hint: true },
      content: {
        snippet: "You're using 13.1 GB of your 15 GB Google storage quota.",
        body: "Your Google account storage is 87% full. Consider deleting large files or upgrading your plan to avoid interruptions to Gmail, Drive, and Photos.",
      },
      attachments: [],
    },
    {
      id: "18e1a2b3c4e8",
      thread_id: "18e1a2b3c4e8",
      envelope: {
        from_address: "Docker Hub <noreply@docker.com>",
        subject: "Image scan: 2 critical CVEs found in cros-backend",
        date: "Fri, 1 May 2026 12:00:00 GMT",
      },
      flags: { unread: true, has_attachments: false, priority_hint: true },
      content: {
        snippet: "2 critical vulnerabilities found in cros-backend:latest — CVE-2025-1337, CVE-2025-2048.",
        body: "Automated image scan detected 2 critical CVEs in your cros-backend:latest image. CVE-2025-1337 affects base Python 3.10 layer. CVE-2025-2048 affects libssl. Rebuild with updated base image.",
      },
      attachments: [],
    },
    {
      id: "18e1a2b3c4e9",
      thread_id: "18e1a2b3c4e9",
      envelope: {
        from_address: "Postman <notifications@postman.com>",
        subject: "Monitor alert: CROS /fetch endpoint down",
        date: "Thu, 30 Apr 2026 22:05:00 GMT",
      },
      flags: { unread: false, has_attachments: false, priority_hint: true },
      content: {
        snippet: "Your Postman monitor detected downtime on POST /fetch — 3 consecutive failures.",
        body: "The Postman monitor for CROS API has detected 3 consecutive failures on POST /fetch. Last successful run: 21:45 UTC. Response code received: 503.",
      },
      attachments: [],
    },
  ],
};

const AI_ANALYSIS_RESPONSES: Analysis[] = [
  {
    id: "18e1a2b3c4d5",
    analysis:
      "⚠️ Priority: HIGH — Security alert from Google. Originating IP appears consistent with a VPN exit node. Recommend immediate account review and enabling 2FA if not already active.",
    sentiment: "critical",
    tags: ["security", "account", "auth"],
  },
  {
    id: "18e1a2b3c4d6",
    analysis:
      "✅ Routine CI/CD event. PR #42 merged cleanly. Refactor changes are non-breaking. No action required.",
    sentiment: "neutral",
    tags: ["devops", "github", "code"],
  },
  {
    id: "18e1a2b3c4d7",
    analysis:
      "📄 Billing document attached. Monthly AWS cost within expected range. Lambda usage increased 12% MoM — investigate cold start patterns.",
    sentiment: "info",
    tags: ["billing", "aws", "finance"],
  },
  {
    id: "18e1a2b3c4d8",
    analysis:
      "🔴 Deployment failure detected. Missing dependency 'framer-motion' in production build. Run `npm install framer-motion --save` and redeploy.",
    sentiment: "critical",
    tags: ["deploy", "error", "vercel"],
  },
  {
    id: "18e1a2b3c4d9",
    analysis:
      "📝 Collaborative document shared. Architecture spec update — schedule a review session with team.",
    sentiment: "neutral",
    tags: ["collaboration", "notion", "docs"],
  },
  {
    id: "18e1a2b3c4e0",
    analysis:
      "💳 Subscription receipt logged. No anomalies in billing amount. Archived for accounting.",
    sentiment: "info",
    tags: ["billing", "stripe", "subscription"],
  },
  {
    id: "18e1a2b3c4e1",
    analysis:
      "👤 Low-priority social notification. Batch-process connection requests during weekly review.",
    sentiment: "low",
    tags: ["social", "linkedin", "networking"],
  },
  {
    id: "18e1a2b3c4e2",
    analysis:
      "🛡️ DDoS event successfully mitigated. Zero downtime recorded. Review firewall rules to tune rate limiting thresholds.",
    sentiment: "info",
    tags: ["security", "ddos", "cloudflare"],
  },
  {
    id: "18e1a2b3c4e3",
    analysis:
      "🎨 Design file updated. 7 frames modified. Cross-check with implemented components before next sprint.",
    sentiment: "neutral",
    tags: ["design", "figma", "ui"],
  },
  {
    id: "18e1a2b3c4e4",
    analysis:
      "🐛 Critical bug: nested .eml parsing failure. Affects attachment siphon pipeline. Prioritize in current sprint — root cause likely in recursive MIME handler.",
    sentiment: "critical",
    tags: ["bug", "jira", "backend"],
  },
  {
    id: "18e1a2b3c4e5",
    analysis:
      "📰 Newsletter digest. Flagged: LLM orchestration patterns article is directly relevant to CROS architecture. Review recommended.",
    sentiment: "low",
    tags: ["news", "reading", "ai"],
  },
  {
    id: "18e1a2b3c4e6",
    analysis:
      "🔧 Planned maintenance window noted. Schedule no deployments between 02:00–04:00 UTC on May 13.",
    sentiment: "info",
    tags: ["maintenance", "infra", "render"],
  },
  {
    id: "18e1a2b3c4e7",
    analysis:
      "⚠️ Storage quota at 87%. Action required before quota exhaustion disrupts Gmail delivery. Purge large Drive files or upgrade plan.",
    sentiment: "critical",
    tags: ["storage", "quota", "google"],
  },
  {
    id: "18e1a2b3c4e8",
    analysis:
      "🔴 2 critical CVEs in Docker image. CVE-2025-1337 has public exploit available. Rebuild image immediately using python:3.12-slim base.",
    sentiment: "critical",
    tags: ["security", "docker", "cve"],
  },
  {
    id: "18e1a2b3c4e9",
    analysis:
      "📡 API monitor failure. 503 suggests upstream timeout. Check CROS fetcher worker health — likely exhausted connection pool.",
    sentiment: "critical",
    tags: ["api", "monitor", "downtime"],
  },
];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function senderInitials(from: string) {
  const name = from.split("<")[0].trim();
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function senderName(from: string) {
  return from.split("<")[0].trim();
}

function senderDomain(from: string) {
  const match = from.match(/<.*@(.+?)>/);
  return match ? match[1] : "";
}

const sentimentColors: Record<Sentiment, string> = {
  critical: "text-red-500",
  info: "text-emerald-500",
  neutral: "text-white/60",
  low: "text-white/40",
};

const sentimentBg: Record<Sentiment, string> = {
  critical: "bg-red-500/10 border-red-500/20",
  info: "bg-emerald-500/10 border-emerald-500/20",
  neutral: "bg-white/5 border-white/10",
  low: "bg-white/5 border-white/10",
};

const tagColors = [
  "bg-white/10 text-white/90",
  "bg-white/5 text-white/70",
];

function tagColor(tag: string) {
  let hash = 0;
  for (let c of tag) hash = (hash * 31 + c.charCodeAt(0)) % tagColors.length;
  return tagColors[hash];
}

export default function CROSDashboard() {
  const [running, setRunning] = useState(false);
  const [analysisMap, setAnalysisMap] = useState<Record<string, Analysis>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<string>("all");
  const [loadingScreen, setLoadingScreen] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queueRef = useRef<Analysis[]>([]);

  const emails = DUMMY_DATA.emails;

  const unreadCount = emails.filter((e) => e.flags.unread).length;
  const analyzedCount = Object.keys(analysisMap).length;

  const filteredEmails = emails.filter((e) => {
    if (filter === "unread") return e.flags.unread;
    if (filter === "analyzed") return !!analysisMap[e.id];
    if (filter === "attachments") return e.flags.has_attachments;
    return true;
  });

  const selectedEmail = emails.find((e) => e.id === selectedId);
  const selectedAnalysis = selectedId ? analysisMap[selectedId] : null;

  function startAnalysis() {
    if (running) return;
    setRunning(true);
    const remaining = AI_ANALYSIS_RESPONSES.filter((r) => !analysisMap[r.id]);
    queueRef.current = [...remaining];
    processNext();
  }

  function processNext() {
    if (queueRef.current.length === 0) {
      setRunning(false);
      return;
    }
    const item = queueRef.current.shift();
    if (!item) {
      setRunning(false);
      return;
    }

    setProcessingIds((prev) => {
      const next = new Set(Array.from(prev));
      next.add(item.id);
      return next;
    });
    const delay = 600 + Math.random() * 800;
    intervalRef.current = setTimeout(() => {
      setAnalysisMap((prev) => ({ ...prev, [item.id]: item }));
      setProcessingIds((prev) => {
        const next = new Set(Array.from(prev));
        next.delete(item.id);
        return next;
      });
      processNext();
    }, delay);
  }

  function stopAnalysis() {
    if (intervalRef.current) clearTimeout(intervalRef.current);
    setRunning(false);
    setProcessingIds(new Set());
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, []);

  const progress = emails.length > 0 ? (analyzedCount / emails.length) * 100 : 0;

  if (loadingScreen) {
    return <CROSLoader onComplete={() => setLoadingScreen(false)}/>
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
      {/* Top Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-0.5 z-[100] bg-white/10">
        <motion.div
          className="h-full bg-white"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ ease: "easeInOut", duration: 0.5 }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-white flex items-center justify-center rounded-sm">
              <span className="text-black text-[12px] font-black">C</span>
            </div>
            <span className="text-[11px] font-bold tracking-[0.2em] uppercase">Surrealbox</span>
          </div>
          <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />
          <div className="hidden md:flex items-center gap-4 text-[10px] font-medium text-white/40 uppercase tracking-widest">
            <span>{emails.length} Objects</span>
            <span>{analyzedCount} Siphoned</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={running ? stopAnalysis : startAnalysis}
            disabled={!running && analyzedCount === emails.length}
            className={`px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all border ${
              running 
                ? "bg-white text-black border-white" 
                : "bg-transparent text-white border-white/20 hover:border-white hover:bg-white/5"
            } disabled:opacity-20 disabled:pointer-events-none`}
          >
            {running ? "Stop Siphon" : "Siphon AI"}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex h-[calc(100vh-53px)] overflow-hidden">
        {/* Sidebar / List */}
        <div className={`${selectedId ? "hidden lg:flex" : "flex"} flex-col w-full lg:w-[400px] border-r border-white/10 overflow-hidden`}>
          {/* Tabs - Fixed the "hiding" by removing overflow-x-auto and using a stable flex container */}
          <div className="px-2 py-2 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            {["all", "unread", "analyzed", "attachments"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-all ${
                  filter === f 
                    ? "text-white bg-white/10 rounded-sm" 
                    : "text-white/30 hover:text-white/60"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar">
            <AnimatePresence initial={false}>
              {filteredEmails.map((email) => {
                const isSelected = email.id === selectedId;
                const isProcessing = processingIds.has(email.id);
                const analysis = analysisMap[email.id];

                return (
                  <motion.div
                    key={email.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setSelectedId(email.id)}
                    className={`px-4 py-4 cursor-pointer border-b border-white/5 transition-all relative group ${
                      isSelected ? "bg-white/5" : "hover:bg-white/[0.02]"
                    }`}
                  >
                    {isProcessing && (
                      <motion.div 
                        className="absolute bottom-0 left-0 h-[1px] bg-white"
                        animate={{ width: ["0%", "100%", "0%"] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      />
                    )}
                    
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${email.flags.unread ? "text-amber-500" : "text-white/40"}`}>
                        {senderName(email.envelope.from_address)}
                      </span>
                      <span className="text-[9px] text-white/20 font-medium">
                        {formatDate(email.envelope.date)}
                      </span>
                    </div>

                    <h3 className={`text-[12px] font-medium leading-tight mb-1 truncate ${isSelected ? "text-white" : "text-white/80"}`}>
                      {email.envelope.subject}
                    </h3>
                    
                    <p className="text-[11px] text-white/40 line-clamp-1">
                      {email.content.snippet}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      {analysis && (
                        <div className={`w-1 h-1 rounded-full ${
                          analysis.sentiment === "critical" ? "bg-red-500" : 
                          analysis.sentiment === "info" ? "bg-emerald-500" : "bg-white"
                        }`} />
                      )}
                      {email.flags.unread && (
                        <div className="w-1 h-1 rounded-full bg-amber-500" />
                      )}
                      {email.flags.has_attachments && (
                        <span className="text-[8px] text-white/20 uppercase font-bold tracking-tighter">ATTACHED</span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Content View */}
        <div className={`${!selectedId ? "hidden lg:flex" : "flex"} flex-1 flex-col overflow-y-auto bg-black`}>
          <AnimatePresence mode="wait">
            {selectedId && selectedEmail ? (
              <motion.div
                key={selectedId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-6 lg:p-12 max-w-4xl"
              >
                <button 
                  onClick={() => setSelectedId(null)}
                  className="lg:hidden mb-8 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white"
                >
                  ← Close
                </button>

                <div className="space-y-8">
                  <header className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Subject</p>
                      <h1 className="text-xl lg:text-3xl font-bold tracking-tight leading-tight">{selectedEmail.envelope.subject}</h1>
                    </div>
                    
                    <div className="flex flex-wrap gap-x-8 gap-y-4 pt-4 border-t border-white/10">
                      <div>
                        <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] mb-1">From</p>
                        <p className="text-[11px] font-medium">{selectedEmail.envelope.from_address}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] mb-1">Date</p>
                        <p className="text-[11px] font-medium text-white/60">{formatDate(selectedEmail.envelope.date)}</p>
                      </div>
                    </div>
                  </header>

                  <section className="space-y-4">
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Body</p>
                    <div className="text-[13px] leading-relaxed text-white/80 font-normal whitespace-pre-wrap selection:bg-white selection:text-black">
                      {selectedEmail.content.body}
                    </div>
                  </section>

                  {selectedEmail.attachments.length > 0 && (
                    <section className="space-y-3">
                      <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Assets</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedEmail.attachments.map((a, i) => (
                          <div key={i} className="px-3 py-2 border border-white/10 rounded-sm flex items-center gap-3 hover:bg-white/5 transition-colors">
                            <span className="text-[10px] font-bold text-emerald-500">PDF</span>
                            <span className="text-[10px] text-white/60">{a.filename}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  <section className="pt-8 border-t border-white/10">
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-4">Siphon Analysis</p>
                    {processingIds.has(selectedId) ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <motion.div 
                            className="w-2 h-2 bg-white rounded-full"
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                          />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Processing Data...</span>
                        </div>
                        <div className="space-y-2">
                          <div className="h-1 bg-white/5 w-full rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-white"
                              animate={{ x: ["-100%", "100%"] }}
                              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                              style={{ width: "40%" }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : selectedAnalysis ? (
                      <div className="space-y-6">
                        <p className={`text-[14px] leading-relaxed font-medium ${sentimentColors[selectedAnalysis.sentiment]}`}>
                          {selectedAnalysis.analysis}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedAnalysis.tags.map((tag) => (
                            <span key={tag} className="px-2 py-1 bg-white/10 text-[9px] font-bold uppercase tracking-widest text-white/60">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 border border-dashed border-white/10 text-center">
                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Awaiting Analysis</p>
                      </div>
                    )}
                  </section>
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-12 text-center">
                <div className="space-y-4">
                  <div className="w-12 h-12 border border-white/10 mx-auto flex items-center justify-center">
                    <span className="text-white/10 text-2xl font-black">C</span>
                  </div>
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em]">Select an object to siphon</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}