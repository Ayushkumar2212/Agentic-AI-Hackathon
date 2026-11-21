import { CONCEPTS, CONCEPT_MAP } from '../data/concepts'
import { MISCONCEPTION_MAP, SIGNATURE_MISCONCEPTIONS } from '../data/misconceptions'
import { mulberry32 } from '../data/questions'
import type { ClassStudent, ConceptId, ConceptStat, LearnerState, MasteryBand } from '../types'
import { bandOf, clamp, effectiveMastery } from './mastery'

const CLASS_CONCEPT_BASE: Record<ConceptId, number> = {
  charge_current: 0.72,
  ohms_law: 0.66,
  resistance_factors: 0.6,
  series_parallel: 0.5,
  electric_power: 0.44,
  reflection_laws: 0.7,
  spherical_mirrors: 0.58,
  mirror_formula: 0.48,
  refraction_snell: 0.42,
}

const NAMES = [
  'Aarav Sharma',
  'Aditi Verma',
  'Arjun Nair',
  'Diya Patel',
  'Ishaan Gupta',
  'Kavya Iyer',
  'Rohan Mehta',
  'Saanvi Reddy',
  'Vivaan Joshi',
  'Ananya Singh',
  'Advait Desai',
  'Myra Kulkarni',
  'Kabir Chawla',
  'Nitya Rao',
  'Reyansh Bose',
  'Aadhya Menon',
  'Shaurya Bansal',
  'Ira Pillai',
  'Dhruv Malhotra',
  'Tanvi Chatterjee',
  'Aryan Sinha',
  'Sara Fernandes',
  'Krishna Varma',
  'Meera Trivedi',
  'Yash Agarwal',
  'Riya Saxena',
  'Neel Kapadia',
  'Anvi Ghosh',
  'Om Prakash Rout',
  'Prisha Bhatt',
  'Rudra Shetty',
  'Ishita Dubey',
  'Harsh Vardhan',
  'Kiaan Arora',
  'Sia Grewal',
]

function gauss(rng: () => number, mean: number, sd: number): number {
  const u = Math.max(rng(), 1e-9)
  const v = rng()
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

export const CLASS_NAME = 'Class 10 - Section A'
export const CLASS_STRENGTH = 35

/**
 * Seeds a realistic 35-student cohort whose mastery pattern matches the
 * documented Class 10 bottlenecks, then injects the live learner as roll #1.
 */
export function buildClassModel(learner: LearnerState | null): ClassStudent[] {
  const rng = mulberry32(20261121)
  const students: ClassStudent[] = []

  for (let i = 0; i < CLASS_STRENGTH; i++) {
    const isLive = i === 0
    const ability = clamp(gauss(rng, 0.62, 0.15), 0.18, 0.97)
    const mastery = {} as Record<ConceptId, number>

    for (const concept of CONCEPTS) {
      if (isLive && learner) {
        mastery[concept.id] = effectiveMastery(learner.nodes[concept.id], learner.currentDay)
        continue
      }
      const value = 0.35 * ability + 0.65 * CLASS_CONCEPT_BASE[concept.id] + gauss(rng, 0, 0.09)
      mastery[concept.id] = clamp(value, 0.05, 0.99)
    }

    const misconceptions: string[] = []
    if (isLive && learner) {
      const detected = new Set<string>()
      for (const node of Object.values(learner.nodes)) {
        for (const id of Object.keys(node.misconceptions)) detected.add(id)
      }
      misconceptions.push(...detected)
    } else {
      for (const concept of CONCEPTS) {
        if (mastery[concept.id] >= 0.62) continue
        if (rng() > 0.55) continue
        const pool = SIGNATURE_MISCONCEPTIONS[concept.id]
        const id = pool[Math.floor(rng() * pool.length)]
        if (id && !misconceptions.includes(id)) misconceptions.push(id)
      }
    }

    students.push({
      id: isLive ? 'live-learner' : `stu_${i}`,
      rollNo: i + 1,
      name: isLive && learner ? `${learner.studentName} (live)` : NAMES[i] ?? `Student ${i + 1}`,
      isLive,
      mastery,
      misconceptions: misconceptions.slice(0, 3),
      attendance: Math.round(clamp(0.78 + ability * 0.22, 0.7, 1) * 100),
    })
  }

  return students
}

export function studentAverage(student: ClassStudent): number {
  const values = CONCEPTS.map((c) => student.mastery[c.id])
  return values.reduce((a, b) => a + b, 0) / values.length
}

export function studentBand(student: ClassStudent): MasteryBand {
  return bandOf(studentAverage(student))
}

export function conceptStats(students: ClassStudent[]): ConceptStat[] {
  return CONCEPTS.map((concept) => {
    const values = students.map((s) => s.mastery[concept.id])
    const classAverage = values.reduce((a, b) => a + b, 0) / Math.max(1, values.length)
    const stuck = values.filter((v) => v < 0.5).length
    const stuckRatio = stuck / Math.max(1, values.length)
    return {
      conceptId: concept.id,
      classAverage,
      stuckRatio,
      isBottleneck: stuckRatio > 0.4,
    }
  }).sort((a, b) => b.stuckRatio - a.stuckRatio)
}

export function topBottlenecks(stats: ConceptStat[], count = 3): ConceptStat[] {
  return stats.filter((s) => s.isBottleneck).slice(0, count)
}

export interface MisconceptionFeedRow {
  id: string
  label: string
  topic: string
  conceptId: ConceptId
  count: number
  share: number
  liveFlag: boolean
}

export function misconceptionFeed(students: ClassStudent[], learner: LearnerState | null): MisconceptionFeedRow[] {
  const liveIds = new Set<string>()
  if (learner) {
    for (const node of Object.values(learner.nodes)) {
      for (const id of Object.keys(node.misconceptions)) liveIds.add(id)
    }
  }

  const counts = new Map<string, number>()
  for (const student of students) {
    for (const id of student.misconceptions) {
      counts.set(id, (counts.get(id) ?? 0) + 1)
    }
  }

  return Array.from(counts.entries())
    .map(([id, count]) => {
      const meta = MISCONCEPTION_MAP[id]
      return {
        id,
        label: meta?.label ?? 'Unclassified reasoning gap',
        topic: meta?.topic ?? 'General',
        conceptId: (meta?.concepts[0] ?? 'charge_current') as ConceptId,
        count,
        share: count / Math.max(1, students.length),
        liveFlag: liveIds.has(id),
      }
    })
    .sort((a, b) => b.count - a.count || Number(b.liveFlag) - Number(a.liveFlag))
}

export interface RemedialDrill {
  prompt: string
  answer: string
}

const DRILLS: Record<ConceptId, RemedialDrill[]> = {
  charge_current: [
    { prompt: 'A charge of 300 C flows through a wire in 5 minutes. Find the current.', answer: 'I = Q/t = 300 C ÷ 300 s = 1 A' },
    {
      prompt: 'How many electrons make up a charge of 1 C? (e = 1.6 × 10⁻¹⁹ C)',
      answer: 'n = Q/e = 1 ÷ (1.6 × 10⁻¹⁹) = 6.25 × 10¹⁸ electrons',
    },
  ],
  ohms_law: [
    { prompt: 'A 4 Ω resistor carries a current of 0.75 A. Find the potential difference across it.', answer: 'V = IR = 0.75 × 4 = 3 V' },
    { prompt: 'A bulb draws 0.5 A when connected to 220 V. Find its resistance.', answer: 'R = V/I = 220 ÷ 0.5 = 440 Ω' },
  ],
  resistance_factors: [
    { prompt: 'A wire of resistance 6 Ω is stretched to three times its original length. Find its new resistance.', answer: 'R′ = n²R = 3² × 6 = 54 Ω' },
    { prompt: 'A 20 Ω wire is cut into 4 equal parts which are joined in parallel. Find the equivalent resistance.', answer: 'Each part 5 Ω; Rₚ = 5/4 = 1.25 Ω' },
  ],
  series_parallel: [
    { prompt: 'Resistors of 2 Ω, 3 Ω and 5 Ω are in series with a 20 V battery. Find the current and the p.d. across the 5 Ω resistor.', answer: 'Rₛ = 10 Ω, I = 20/10 = 2 A, V₅ = 2 × 5 = 10 V' },
    { prompt: 'A 6 Ω and a 3 Ω resistor are joined in parallel across a 12 V battery. Find Rₚ and the total current.', answer: 'Rₚ = (6 × 3)/(6 + 3) = 2 Ω, I = 12/2 = 6 A (4 A + 2 A)' },
  ],
  electric_power: [
    { prompt: 'A bulb marked 100 W is operated at 250 V. Find the current drawn and its resistance.', answer: 'I = P/V = 100/250 = 0.4 A, R = V²/P = 62500/100 = 625 Ω' },
    { prompt: 'A 2 kW heater runs for 3 hours. Express the energy consumed in kWh and in joules.', answer: 'E = 2 × 3 = 6 kWh = 6 × 3.6 × 10⁶ = 2.16 × 10⁷ J' },
  ],
  reflection_laws: [
    { prompt: 'A ray of light is incident on a plane mirror at 40° to the normal. Find the angle between the incident and the reflected ray.', answer: '∠i = ∠r = 40°, so the angle between them is 80°' },
    { prompt: 'A ray makes an angle of 55° with the surface of a plane mirror. Find the angle of incidence.', answer: '∠i = 90° − 55° = 35° (measured from the normal)' },
  ],
  spherical_mirrors: [
    { prompt: 'A concave mirror has f = 12 cm. Find R and state where an object must be placed to get an image of the same size.', answer: 'R = 2f = 24 cm; the object must be at C, i.e. u = −24 cm (m = −1)' },
    { prompt: 'Why is a convex mirror preferred as a rear-view mirror?', answer: 'It always gives a virtual, erect, diminished image and has a much wider field of view' },
  ],
  mirror_formula: [
    { prompt: 'An object is 25 cm from a concave mirror of focal length 20 cm. Find v and m.', answer: '1/v = 1/(−20) + 1/25 = −1/100 ⇒ v = −100 cm, m = −v/u = −4 (real, inverted, 4× enlarged)' },
    { prompt: 'A convex mirror of focal length 20 cm has an object 30 cm in front of it. Find v.', answer: '1/v = 1/20 − (−1/30) ⇒ v = +12 cm, so the image is virtual and 12 cm behind the mirror' },
  ],
  refraction_snell: [
    { prompt: 'Light passes from air into water (n = 1.33) at an angle of incidence of 40°. Find the angle of refraction.', answer: 'sin r = sin 40°/1.33 = 0.483 ⇒ r ≈ 28.9°, so the ray bends towards the normal' },
    { prompt: 'The speed of light in a medium is 2 × 10⁸ m/s. Find its refractive index and identify the medium.', answer: 'n = c/v = (3 × 10⁸)/(2 × 10⁸) = 1.5, which is glass' },
  ],
}

export interface RemedialSection {
  conceptId: ConceptId
  name: string
  formula: string
  classAverage: number
  stuckRatio: number
  reframe: string
  keyIdeas: string[]
  drills: RemedialDrill[]
}

export interface RemedialPlan {
  className: string
  generatedAt: string
  strength: number
  touchpoints: string
  sections: RemedialSection[]
  misconceptionFixes: { id: string; label: string; correctFrame: string; formula: string; count: number }[]
}

export function buildRemedialPlan(
  stats: ConceptStat[],
  feed: MisconceptionFeedRow[],
  students: ClassStudent[],
): RemedialPlan {
  const bottlenecks = topBottlenecks(stats)
  const weakestMisconceptions = feed.slice(0, 4)

  const sections: RemedialSection[] = bottlenecks.map((stat) => {
    const concept = CONCEPT_MAP[stat.conceptId]
    const signature = SIGNATURE_MISCONCEPTIONS[stat.conceptId][0]
    const meta = MISCONCEPTION_MAP[signature]
    return {
      conceptId: stat.conceptId,
      name: concept.name,
      formula: concept.formula,
      classAverage: stat.classAverage,
      stuckRatio: stat.stuckRatio,
      reframe: meta?.correctFrame ?? concept.summary,
      keyIdeas: concept.keyIdeas.slice(0, 3),
      drills: DRILLS[stat.conceptId],
    }
  })

  return {
    className: CLASS_NAME,
    generatedAt: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
    strength: students.length,
    touchpoints: `${sections.length} bottleneck concepts · ${weakestMisconceptions.length} recurring reasoning errors`,
    sections,
    misconceptionFixes: weakestMisconceptions.map((row) => ({
      id: row.id,
      label: row.label,
      correctFrame: MISCONCEPTION_MAP[row.id]?.correctFrame ?? '',
      formula: MISCONCEPTION_MAP[row.id]?.formula ?? '',
      count: row.count,
    })),
  }
}

export function remedialPlanToText(plan: RemedialPlan): string {
  const lines: string[] = []
  lines.push(`# ${plan.className} — PrepPilots Class Remedial Sheet`)
  lines.push(`Generated: ${plan.generatedAt} | Strength: ${plan.strength} students | ${plan.touchpoints}`)
  lines.push('')
  lines.push('## Part 1 — Bottleneck concept repair')
  plan.sections.forEach((section, index) => {
    lines.push('')
    lines.push(`### ${index + 1}. ${section.name}  (${section.formula})`)
    lines.push(`Class average ${Math.round(section.classAverage * 100)}% · ${Math.round(section.stuckRatio * 100)}% of the class below 50%`)
    lines.push(`Reframe: ${section.reframe}`)
    lines.push('Must-know:')
    section.keyIdeas.forEach((idea) => lines.push(`  - ${idea}`))
    lines.push('Board-style drills:')
    section.drills.forEach((drill, i) => {
      lines.push(`  Q${i + 1}. ${drill.prompt}`)
      lines.push(`      Ans: ${drill.answer}`)
    })
  })
  lines.push('')
  lines.push('## Part 2 — Misconception de-brief (reasoning level)')
  plan.misconceptionFixes.forEach((fix, index) => {
    lines.push('')
    lines.push(`${index + 1}. ${fix.label}  (${fix.count} students)`)
    lines.push(`   Correct frame: ${fix.correctFrame}`)
    lines.push(`   Formula anchor: ${fix.formula}`)
  })
  lines.push('')
  lines.push('Homework: attempt all drills above, then run a PrepPilots Pre-Flight Calibration to verify the mastery shift.')
  return lines.join('\n')
}
