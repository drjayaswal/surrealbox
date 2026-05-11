"use client";

import { motion } from "framer-motion";
import { 
  UsersIcon, 
  TrendUpIcon, 
  ShieldCheckIcon, 
  LightbulbIcon,
  ArrowRightIcon
} from "@phosphor-icons/react";

const FEATURES = [
  {
    title: "Weighted Reputation",
    description: "Not all votes are created equal. Your influence grows as you contribute quality answers and win debates.",
    icon: TrendUpIcon,
  },
  {
    title: "Focused Communities",
    description: "Join niche domains where depth is valued over noise. Our tag system ensures you only see what matters.",
    icon: UsersIcon,
  },
  {
    title: "Cognitive Clarity",
    description: "Designed to reduce friction and promote articulate expression. No rage-clicks, just reasoning.",
    icon: LightbulbIcon,
  },
  {
    title: "Verified Identity",
    description: "Building trust through verified interactions while maintaining the privacy you need to speak freely.",
    icon: ShieldCheckIcon,
  }
];

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto p-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h3 className="text-3xl sm:text-4xl font-semibold text-foreground mb-8 tracking-tight leading-tight">
          Surrealbox was born out of a simple realization: the internet has enough noise.
        </h3>
        
        <div className="space-y-6 text-[16px] text-muted-foreground leading-relaxed font-normal">
          <p>
            Social platforms today are optimized for engagement through outrage. They reward the loudest voices, not the most reasoned ones. We decided to build something different.
          </p>
          <p>
            Surrealbox is a weighted Q&A platform. We believe that expertise and reputation should matter. By using a sophisticated weight-based voting system, we ensure that the most valuable insights rise to the top, while low-quality noise naturally sinks.
          </p>
        </div>

        <div className="mt-10" id="reputation-system">
          <h2 className="text-primary text-[13px] font-bold uppercase mb-5">Reputation System</h2>
          <div className="space-y-6">
            {[
              { action: "Answer is upvoted", points: "+10", reason: "High-effort contribution." },
              { action: "Question is upvoted", points: "+5", reason: "Good for curiosity, but easier than answering." },
              { action: "Answer is accepted", points: "+15", reason: "The 'Gold Standard' of being helpful." },
              { action: "Question's author accept an answer", points: "+2", reason: "Encourages users to 'close the loop' on their questions." },
              { action: "Author's Question is downvoted", points: "-2", reason: "Discourages low-quality or 'troll' content." },
              { action: "You downvote someone", points: "-1", reason: "Prevents 'downvote bombing' by making it cost the voter." },
            ].map((rule, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.05 * idx }}
                className="flex items-start gap-4 p-4 rounded-full border border-primary/5 bg-gray-100/5 transition-colors"
              >
                <div className="min-w-[48px] h-12 flex items-center justify-center font-bold text-[20px]" style={{
                  color: rule.points.startsWith("-") ? "#ef4444" : "#22c55e"
                }}>
                  {rule.points}
                </div>
                <div>
                  <h4 className="text-[15px] font-semibold text-foreground mb-1">{rule.action}</h4>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{rule.reason}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-primary text-[13px] font-bold uppercase  mb-10">The Core Principles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-12">
            {FEATURES.map((feature, idx) => (
              <motion.div 
                key={feature.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * idx }}
                className="group"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary mb-5 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                  <feature.icon size={24} weight="duotone" />
                </div>
                <h4 className="text-[18px] font-semibold text-foreground mb-2">{feature.title}</h4>
                <p className="text-[14px] text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-20">
          <h2 className="text-primary text-[13px] font-bold uppercase mb-8">Safety & Moderation</h2>
          <div className="p-8 flex flex-col sm:flex-row items-center gap-8">
            <div className="space-y-4">
              <h4 className="text-[18px] font-semibold text-foreground">Advanced Content Integrity</h4>
              <p className="text-[14px] text-muted-foreground leading-relaxed">
                To maintain a professional and constructive environment, Surrealbox utilizes <strong>Facebook's BART (Bidirectional and Auto-Regressive Transformers)</strong> Large Model for real-time content moderation. 
              </p>
              <p className="text-[14px] text-muted-foreground leading-relaxed">
                This Zero-Shot classification system automatically identifies and flags toxic content, harassment, and hate speech before it reaches the community, ensuring that your experience remains focused on knowledge sharing and reasoning.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-20 p-8 sm:p-12 rounded-[32px] bg-primary text-white relative overflow-hidden">
           <div className="relative z-10">
             <h3 className="text-2xl sm:text-3xl font-medium mb-4">Ready to join the community?</h3>
             <p className="text-white/70 text-[15px] mb-8 max-w-sm">
               Join thousands of users who are already building their reputation and sharing knowledge.
             </p>
             <motion.button 
               whileHover={{ x: 5 }}
               className="flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-full font-semibold text-[14px] shadow-xl shadow-black/10"
             >
               Create your account
               <ArrowRightIcon size={16} weight="bold" />
             </motion.button>
           </div>
        </div>
        
        <div className="mt-5 pt-5 border-t border-primary/5 flex flex-col sm:flex-row items-center justify-between gap-6">
           <span className="text-muted-foreground/40 text-[13px]">© 2026 Surrealbox Platform. All rights reserved.</span>
           <div className="flex items-center gap-6">
              <a href="/privacy" className="text-[13px] text-muted-foreground/60 hover:text-primary transition-colors">Privacy Policy</a>
              <a href="/terms" className="text-[13px] text-muted-foreground/60 hover:text-primary transition-colors">Terms of Service</a>
           </div>
        </div>
      </motion.div>
    </div>

  );
}