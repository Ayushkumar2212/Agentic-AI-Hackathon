import { useMemo } from 'react'
import { Activity, Flame, Gauge, Radar, Users, Waves } from 'lucide-react'
import {
  CLASS_NAME,
  buildClassModel,
  conceptStats,
  misconceptionFeed,
  topBottlenecks,
} from '../../lib/classModel'
import { learnerStrength, pct } from '../../lib/mastery'
import type { PrepPilotsApi } from '../../state/usePrepPilots'
import { StatTile } from '../Primitives'
import { MasteryHeatmap } from './MasteryHeatmap'
import { MisconceptionFeed } from './MisconceptionFeed'
import { StudentRoster } from './StudentRoster'

interface TeacherATCProps {
  api: PrepPilotsApi
}

/**
 * Teacher view — Air Traffic Control.
 * Class-wide mastery heatmap, misconception feed (with remedial sheet generation)
 * and the student roster — all dynamically linked to the live learner (roll #1).
 */
export function TeacherATC({ api }: TeacherATCProps) {
  const { state } = api

  const students = useMemo(() => buildClassModel(state), [state])
  const stats = useMemo(() => conceptStats(students), [students])
  const bottlenecks = useMemo(() => topBottlenecks(stats), [stats])
  const feed = useMemo(() => misconceptionFeed(students, state), [students, state])

  const classAverage =
    students.reduce((sum, s) => sum + Object.values(s.mastery).reduce((a, b) => a + b, 0) / 9, 0) / Math.max(1, students.length)
  const liveStrength = learnerStrength(state.nodes, state.currentDay)
  const liveStudent = students[0]

  return (
    <div className="space-y-4">
      {/* ATC board header */}
      <div className="glass flex flex-wrap items-center gap-3 p-3.5">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#8B5CF6]/35 bg-[#8B5CF6]/12 text-[#C4B5FD]">
          <Radar className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="section-label">Air Traffic Control · Live Flight Board</div>
          <div className="mt-0.5 text-[14px] font-bold text-white">
            {CLASS_NAME}
            <span className="mono ml-2 text-[11px] font-medium text-slate-500">
              {students.length} students tracked · Flight Day {state.currentDay}
            </span>
          </div>
        </div>
        <span className="chip border-[#10B981]/35 bg-[#10B981]/10 text-[#A7F3D0]">
          <Waves className="h-3 w-3" /> live sync active
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          icon={<Users className="h-3.5 w-3.5" />}
          label="Class Strength"
          value={students.length}
          hint={CLASS_NAME}
          accent="cyan"
        />
        <StatTile
          icon={<Gauge className="h-3.5 w-3.5" />}
          label="Class Average"
          value={pct(classAverage)}
          hint="mean mastery across 9 concepts"
          accent="violet"
        />
        <StatTile
          icon={<Flame className="h-3.5 w-3.5" />}
          label="Bottleneck Concepts"
          value={bottlenecks.length}
          hint="> 40% of class below 50%"
          accent="crimson"
        />
        <StatTile
          icon={<Activity className="h-3.5 w-3.5" />}
          label="Live Learner"
          value={pct(liveStrength)}
          hint={`${liveStudent?.name ?? 'Roll 1'} · syncs with the Cockpit`}
          accent="emerald"
        />
      </div>

      <MasteryHeatmap students={students} stats={stats} bottlenecks={bottlenecks} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <MisconceptionFeed feed={feed} stats={stats} students={students} />
        <div className="glass flex flex-col items-center justify-center gap-2 p-8 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#00F0FF]/30 bg-[#00F0FF]/10 text-[#00F0FF]">
            <Radar className="h-6 w-6" />
          </span>
          <div className="text-[13px] font-bold text-white">Remedial radar stands watch</div>
          <p className="max-w-sm text-[12px] leading-relaxed text-slate-500">
            The feed aggregates every reasoning flaw the rollout X-Ray has tagged. Hit{' '}
            <span className="font-semibold text-slate-300">Generate Class Remedial Sheet</span> to convert the top
            bottlenecks and misconceptions into a printable, board-style drill pack.
          </p>
        </div>
      </div>

      <StudentRoster students={students} />
    </div>
  )
}
