import { useMemo, useState } from 'react'
import { ArrowDownUp, Search, Users } from 'lucide-react'
import { studentAverage, studentBand } from '../../lib/classModel'
import { misconceptionLabel } from '../../data/misconceptions'
import { BAND_META, pct } from '../../lib/mastery'
import type { ClassStudent, MasteryBand } from '../../types'
import { BandPill, SectionHeading } from '../Primitives'

const FILTERS: { id: MasteryBand | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'mastered', label: 'Mastered' },
  { id: 'developing', label: 'Developing' },
  { id: 'weak', label: 'At Risk' },
]

/**
 * Module 7.3 — Student Roster.
 * Searchable, filterable table with class mastery %, active misconception tags and
 * status badges. Roll #1 is the live learner.
 */
export function StudentRoster({ students }: { students: ClassStudent[] }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<MasteryBand | 'all'>('all')
  const [sortAsc, setSortAsc] = useState(true)

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return students
      .filter((student) => (filter === 'all' ? true : studentBand(student) === filter))
      .filter((student) => (!needle ? true : student.name.toLowerCase().includes(needle)))
      .sort((a, b) => {
        const diff = studentAverage(a) - studentAverage(b)
        return sortAsc ? diff : -diff
      })
  }, [students, query, filter, sortAsc])

  return (
    <div className="glass p-4">
      <SectionHeading
        icon={<Users className="h-4 w-4" />}
        title="Student Roster"
        subtitle={`${rows.length} of ${students.length} students shown`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search student…"
                className="field w-[180px] py-1.5 pl-8 text-[12px]"
              />
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`rounded-lg px-2 py-1 text-[11px] font-bold transition ${
                    filter === f.id ? 'bg-[#00F0FF]/15 text-[#bff9ff]' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        }
      />

      <div className="mt-3.5 overflow-x-auto">
        <table className="w-full min-w-[720px] border-separate border-spacing-y-1.5">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-[0.14em] text-slate-600">
              <th className="px-2 pb-1 font-bold">Roll</th>
              <th className="px-2 pb-1 font-bold">Student</th>
              <th className="px-2 pb-1">
                <button
                  type="button"
                  onClick={() => setSortAsc((s) => !s)}
                  className="inline-flex items-center gap-1 font-bold uppercase tracking-[0.14em] transition hover:text-slate-300"
                >
                  Class Mastery <ArrowDownUp className="h-3 w-3" />
                </button>
              </th>
              <th className="px-2 pb-1 font-bold">Active Misconception Tags</th>
              <th className="px-2 pb-1 font-bold">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((student) => {
              const avg = studentAverage(student)
              const band = studentBand(student)
              return (
                <tr
                  key={student.id}
                  className={`rounded-xl border text-[12px] transition hover:bg-white/[0.04] ${
                    student.isLive ? 'border-[#00F0FF]/40 bg-[#00F0FF]/[0.06]' : 'border-white/[0.06] bg-white/[0.02]'
                  }`}
                >
                  <td className="rounded-l-xl px-2 py-2">
                    <span className="mono text-[11px] font-bold text-slate-500">{String(student.rollNo).padStart(2, '0')}</span>
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100">{student.name}</span>
                      {student.isLive && (
                        <span className="inline-flex items-center rounded-full border border-[#00F0FF]/40 bg-[#00F0FF]/10 px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-[#00F0FF]">
                          live
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-[10px] text-slate-600">Attendance {student.attendance}%</div>
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-[92px] overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${avg * 100}%`, background: BAND_META[band].hex, boxShadow: `0 0 8px -1px ${BAND_META[band].hex}` }}
                        />
                      </div>
                      <span className="mono text-[11px] font-bold" style={{ color: BAND_META[band].hex }}>
                        {pct(avg)}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex flex-wrap gap-1">
                      {student.misconceptions.length === 0 ? (
                        <span className="text-[10px] text-slate-600">none detected</span>
                      ) : (
                        student.misconceptions.map((id) => (
                          <span
                            key={id}
                            title={misconceptionLabel(id)}
                            className="chip border-[#EF4444]/30 bg-[#EF4444]/10 px-2 py-0.5 text-[10px] text-[#FCA5A5]"
                          >
                            {misconceptionLabel(id)}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="rounded-r-xl px-2 py-2">
                    <BandPill mastery={avg} />
                  </td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-[12px] text-slate-500">
                  No students match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
