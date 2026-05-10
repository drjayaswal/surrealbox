"use client"

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UsersThreeIcon,
  ChatCircleDotsIcon,
  ChartLineUpIcon,
  ListIcon,
  EmptyIcon,
  ChecksIcon,
  QuestionIcon,
  ThumbsUpIcon,
} from '@phosphor-icons/react'
import { apiRequest } from '../../lib/api-client'

type DashboardData = {
  summary: {
    users: { total: number; emailVerified: number }
    questions: { total: number }
    answers: { total: number }
    votes: { total: number }
    auth: { activeSessions: number; uniqueUsersActive: number; totalAccounts: number }
  }
  timelines: {
    userCreation: string[]
    questionActivity: string[]
  }
}

function buildDailyBuckets(isoStrings: (string | Date)[], days = 7) {
  const buckets = Array.from({ length: days }).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (days - 1 - i))

    const localStr = d.toLocaleDateString('en-CA')

    return {
      dateString: localStr,
      shortLabel: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayLabel: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: 0,
    }
  })

  isoStrings.forEach(iso => {
    if (!iso) return
    try {
      const d = new Date(iso)
      if (isNaN(d.getTime())) return

      const ds = d.toLocaleDateString('en-CA')

      const idx = buckets.findIndex(b => b.dateString === ds)
      if (idx !== -1) {
        buckets[idx].count++
      }
    } catch (e) {
      console.error('Failed to parse date:', iso)
    }
  })
  return buckets
}

function CountUp({ target, duration = 1000 }: { target: number; duration?: number }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    let startTime: number | null = null;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setN(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration])
  return <>{n.toLocaleString()}</>
}

function TimelineSection({ questionBuckets, userBuckets }: {
  questionBuckets: ReturnType<typeof buildDailyBuckets>
  userBuckets: ReturnType<typeof buildDailyBuckets>
}) {
  const [activeTab, setActiveTab] = useState<'questions' | 'users'>('questions')
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  const currentData = activeTab === 'questions' ? questionBuckets : userBuckets
  const max = Math.max(...currentData.map(b => b.count), 1)
  const total = currentData.reduce((acc, b) => acc + b.count, 0)

  const blackColor = activeTab === 'questions' ? 'bg-teal-500' : 'bg-indigo-500'
  const textColor = activeTab === 'questions' ? 'text-teal-600' : 'text-indigo-600'

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-xl font-bold text-gray-900 ">Growth & Engagement</h3>
          <p className="text-sm text-gray-400 font-medium">Monitoring platform activity over time.</p>
        </div>

        <div className="flex p-1 bg-gray-50 rounded-2xl border border-gray-200/50 self-start">
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${activeTab === 'questions' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Questions
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${activeTab === 'users' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            New Users
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-end gap-2 sm:gap-4 relative min-h-[220px] px-2">
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-[0.03]">
          {[...Array(10)].map((_, i) => <div key={i} className="w-full border-t border-black" />)}
        </div>
        {currentData.map((b, i) => {
          const height = (b.count / max) * 100;
          const minBarHeight = b.count > 0 ? '4px' : '0px';

          return (
            <div
              key={b.dateString}
              className="flex-1 flex flex-col items-center gap-3 group relative h-full"
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
            >
              <div className="relative flex-1 w-full flex items-end justify-center min-h-[180px]">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ type: "spring", damping: 20, stiffness: 100 }}
                  style={{ minHeight: minBarHeight }}
                  className={`w-full max-w-[32px] transition-colors duration-300 ${hoverIdx === i
                    ? blackColor
                    : activeTab === 'questions' ? 'bg-teal-500' : 'bg-indigo-500'
                    }`}
                />
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase er">
                {b.shortLabel}
              </span>
              <AnimatePresence>
                {hoverIdx === i && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-xl z-20 whitespace-nowrap"
                  >
                    {b.count} {activeTab === 'questions' ? 'questions' : 'users'}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      <div className="mt-6 border-t border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${blackColor}`} />
          <span className={`text-xs font-bold ${textColor}`}>Total: {total.toLocaleString()}</span>
        </div>
        <span className="text-[10px] font-bold text-gray-400 uppercase st">Last 7 Days</span>
      </div>
    </div>
  )
}

export default function AdminOverview() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ; (async () => {
      try {
        const res = await apiRequest<{ success: boolean; data: DashboardData }>(
          '/api/admin/overview', { method: 'GET' }
        )
        if (res.success) setData(res.data)
        else throw new Error('API request failed')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const timelines = useMemo(() => ({
    questions: buildDailyBuckets(data?.timelines.questionActivity ?? []),
    users: buildDailyBuckets(data?.timelines.userCreation ?? [])
  }), [data])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 border-2 border-main/10 border-t-main rounded-full animate-spin" />
      </div>
    </div>
  )

  if (error || !data) return (
    <div className="flex flex-col min-h-screen items-center justify-center px-6 text-center">
      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
        <EmptyIcon size={32} className="text-main" weight="fill" />
      </div>
    </div>
  )

  const { summary } = data

  const kpis = [
    { label: 'Platform Users', value: summary.users.total, sub: `${summary.auth.uniqueUsersActive} active sessions`, icon: UsersThreeIcon, color: 'text-teal-500', bg: 'bg-teal-500/10' },
    { label: 'Questions', value: +summary.questions.total, sub: `Active Discussions`, icon: QuestionIcon, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { label: 'Answers', value: summary.answers.total, sub: 'Contributions', icon: ChatCircleDotsIcon, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Votes', value: summary.votes.total, sub: 'Engagement', icon: ThumbsUpIcon, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { label: 'Active Sessions', value: summary.auth.activeSessions, sub: 'Real-time telemetry', icon: ChartLineUpIcon, color: 'text-main', bg: 'bg-main/10' },
  ]

  return (
    <div className="mx-auto flex flex-col gap-4 w-full">
      <header className="relative mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <ListIcon size={40} weight="regular" className="text-main" />
          <div>
            <h1 className="text-xl font-extrabold  text-black sm:text-3xl">
              Overview
            </h1>
            <p className="text-xs font-medium text-main/70 sm:text-sm">
              Holistic monitoring for Surrealbox Q&A platform
            </p>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpis.map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col gap-3 group"
          >
            <div className="flex items-center justify-between">
              <div className={`w-9 h-9 ${kpi.bg} rounded-xl flex items-center justify-center shrink-0`}>
                <kpi.icon size={18} weight="fill" className={kpi.color} />
              </div>
              <span className="text-[10px] flex items-center gap-2 font-bold text-gray-400 uppercase ">
                <h4 className="text-2xl font-bold text-gray-900 er">
                  <CountUp target={kpi.value} />
                </h4>
                {kpi.label}
              </span>
            </div>

            <div className="text-[10px] font-semibold flex items-center gap-2 text-gray-400 truncate">
              <div className='w-1 h-1 bg-black rounded-full' />
              {kpi.sub}
            </div>
          </motion.div>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-5 h-full">
          <TimelineSection questionBuckets={timelines.questions} userBuckets={timelines.users} />
        </div>
      </section>

    </div>
  )
}