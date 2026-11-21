import type { ConceptId, Difficulty, Question, QuestionSource } from '../types'
import { CONCEPT_MAP, DIAGNOSTIC_CONCEPTS } from './concepts'

/* ------------------------------------------------------------------ */
/* Deterministic RNG helpers (so demos stay reproducible when seeded) */
/* ------------------------------------------------------------------ */

export type Rng = () => number

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a += 0x6d2b79f5
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(rng: Rng, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)] ?? arr[0]
}

function shuffle<T>(rng: Rng, arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

const SUP = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹']

function sup(n: number): string {
  const sign = n < 0 ? '⁻' : ''
  return (
    sign +
    Math.abs(n)
      .toString()
      .split('')
      .map((d) => SUP[Number(d)])
      .join('')
  )
}

/** 3960000 -> "3.96 × 10⁶" */
export function fmtSci(value: number, decimals = 2): string {
  if (value === 0) return '0'
  const exp = Math.floor(Math.log10(Math.abs(value)))
  let mantissa = value / Math.pow(10, exp)
  let e = exp
  mantissa = Number(mantissa.toFixed(decimals))
  if (Math.abs(mantissa) >= 10) {
    mantissa = mantissa / 10
    e += 1
  }
  return `${mantissa} × 10${sup(e)}`
}

/* ------------------------------------------------------------------ */
/* Question templates                                                  */
/* ------------------------------------------------------------------ */

interface Choice {
  text: string
  ok?: boolean
  /** misconception this distractor betrays */
  trap?: string
}

interface Generated {
  stem: string
  choices: Choice[]
  explanation: string
  primaryMisconception: string
  tags: string[]
}

type Template = (rng: Rng) => Generated

function build(
  stem: string,
  choices: Choice[],
  explanation: string,
  primaryMisconception: string,
  tags: string[] = [],
): Generated {
  return { stem, choices, explanation, primaryMisconception, tags }
}

const BANK: Record<ConceptId, Record<Difficulty, Template[]>> = {
  /* ================================ ELECTRICITY ================================ */
  charge_current: {
    Easy: [
      (rng) => {
        const [I, t] = pick(rng, [
          [0.5, 120],
          [0.25, 60],
          [2, 30],
          [0.4, 300],
          [0.05, 600],
        ] as const)
        const Q = I * t
        return build(
          `A steady current of ${I} A flows through a copper wire for ${t} s. Calculate the charge that crosses a section of the wire in this time.`,
          [
            { text: `${Q} C`, ok: true },
            { text: `${Number((I / t).toFixed(4))} C`, trap: 'charge_current_confusion' },
            { text: `${I + t} C`, trap: 'dimension_slip' },
            { text: `${Q * 2} C`, trap: 'dimension_slip' },
          ],
          `Current is charge per unit time, so Q = It = ${I} A × ${t} s = ${Q} C. Checking units: A × s = C s⁻¹ × s = C.`,
          'charge_current_confusion',
          ['I = Q/t'],
        )
      },
      (rng) => {
        const e = '1.6 × 10⁻¹⁹ C'
        const variant = pick(rng, [0, 1] as const)
        if (variant === 0) {
          return build(
            'Which statement about electric current is correct?',
            [
              { text: 'Current is the rate of flow of charge, I = Q/t, and it is measured in amperes', ok: true },
              { text: 'Current is the total amount of charge stored inside a conductor', trap: 'charge_current_confusion' },
              { text: 'Current gets used up as it passes through a resistor in a series circuit', trap: 'current_consumption' },
              {
                text: 'The conventional current direction is the same as the direction of electron drift',
                trap: 'charge_current_confusion',
              },
            ],
            `1 A = 1 C s⁻¹. Charge is quantised as Q = ne with e = ${e}, and conventional current is opposite to the electron drift.`,
            'charge_current_confusion',
            ['quantisation'],
          )
        }
        return build(
          `The charge on an electron is ${e}. How many electrons make up a charge of 8 × 10⁻¹⁹ C?`,
          [
            { text: '5 electrons', ok: true },
            { text: '1.28 × 10⁻¹⁹ electrons', trap: 'dimension_slip' },
            { text: '8 electrons', trap: 'charge_current_confusion' },
            { text: '1.6 × 10⁻¹⁹ electrons', trap: 'dimension_slip' },
          ],
          `Q = ne ⇒ n = Q/e = (8 × 10⁻¹⁹ C) / (1.6 × 10⁻¹⁹ C) = 5 electrons. Charge is always an integral multiple of e.`,
          'charge_current_confusion',
          ['Q = ne'],
        )
      },
    ],
    Medium: [
      (rng) => {
        const [Q, t] = pick(rng, [
          [1500, 300],
          [600, 120],
          [360, 90],
          [720, 180],
          [240, 30],
        ] as const)
        const I = Q / t
        return build(
          `A charge of ${Q} C flows through an electric heater in ${t} s. What is the steady current in the circuit?`,
          [
            { text: `${I} A`, ok: true },
            { text: `${Q / (t / 60)} A`, trap: 'dimension_slip' },
            { text: `${Number((t / Q).toFixed(4))} A`, trap: 'charge_current_confusion' },
            { text: `${I * 2} A`, trap: 'dimension_slip' },
          ],
          `I = Q/t = ${Q} C ÷ ${t} s = ${I} A. Note that the distractor ${Q / (t / 60)} A comes from dividing by time in minutes instead of seconds.`,
          'charge_current_confusion',
          ['I = Q/t', 'unit conversion'],
        )
      },
      (rng) => {
        const [I, t] = pick(rng, [
          [2, 4],
          [4, 8],
          [0.5, 8],
          [1.6, 15],
        ] as const)
        const Q = I * t
        const electrons = Q / 1.6e-19
        const sciCorrect = fmtSci(electrons, 2)
        const exp = Math.floor(Math.log10(electrons))
        const mantissa = Number((electrons / Math.pow(10, exp)).toFixed(2))
        return build(
          `A current of ${I} A flows through a metallic conductor for ${t} s. Taking the charge on an electron as 1.6 × 10⁻¹⁹ C, how many electrons pass through any cross-section in this time?`,
          [
            { text: sciCorrect, ok: true },
            { text: fmtSci(Number((mantissa * Math.pow(10, exp - 1)).toFixed(2)), 2), trap: 'dimension_slip' },
            { text: fmtSci(Number((mantissa * Math.pow(10, exp + 1)).toFixed(2)), 2), trap: 'dimension_slip' },
            { text: `1.6 × 10${sup(exp)}`, trap: 'charge_current_confusion' },
          ],
          `Q = It = ${I} × ${t} = ${Q} C, then n = Q/e = ${Q} ÷ (1.6 × 10⁻¹⁹) = ${sciCorrect} electrons.`,
          'dimension_slip',
          ['Q = ne'],
        )
      },
    ],
    Hard: [
      (rng) => {
        const [I, t] = pick(rng, [
          [0.4, 10],
          [1.2, 25],
          [0.6, 40],
          [0.25, 16],
        ] as const)
        const Q = I * t
        const electrons = Q / 1.6e-19
        const exp = Math.floor(Math.log10(electrons))
        const mantissa = Number((electrons / Math.pow(10, exp)).toFixed(2))
        return build(
          `A steady current of ${I} A flows through a conductor. Find the number of electrons crossing its cross-section in ${t} s (e = 1.6 × 10⁻¹⁹ C).`,
          [
            { text: fmtSci(electrons, 2), ok: true },
            { text: `${Q} electrons`, trap: 'charge_current_confusion' },
            { text: fmtSci(Number((mantissa * Math.pow(10, exp - 1)).toFixed(2)), 2), trap: 'dimension_slip' },
            { text: fmtSci(Q * 1.6e-19, 2), trap: 'dimension_slip' },
          ],
          `Two steps: first the charge Q = It = ${I} × ${t} = ${Q} C, then divide by the electronic charge: n = Q/e = ${fmtSci(electrons, 2)} electrons.`,
          'charge_current_confusion',
          ['Q = ne', 'multi-step'],
        )
      },
      (rng) => {
        const [I, t] = pick(rng, [
          [0.5, 20],
          [0.2, 50],
          [1.5, 8],
        ] as const)
        return build(
          `In a metal wire the current is ${I} A. If the current flows for ${t} minutes, how much charge passes through the wire?`,
          [
            { text: `${I * t * 60} C`, ok: true },
            { text: `${I * t} C`, trap: 'dimension_slip' },
            { text: `${I * t * 3600} C`, trap: 'dimension_slip' },
            { text: `${I / (t * 60)} C`, trap: 'charge_current_confusion' },
          ],
          `Convert time to seconds first: ${t} min = ${t * 60} s, then Q = It = ${I} × ${t * 60} = ${I * t * 60} C.`,
          'dimension_slip',
          ['unit conversion'],
        )
      },
    ],
  },

  ohms_law: {
    Easy: [
      (rng) => {
        const [I, R] = pick(rng, [
          [2, 3],
          [0.8, 5],
          [1.5, 4],
          [0.5, 12],
          [0.25, 20],
        ] as const)
        const V = I * R
        return build(
          `A resistor of ${R} Ω carries a current of ${I} A. What is the potential difference across the resistor?`,
          [
            { text: `${V} V`, ok: true },
            { text: `${Number((I / R).toFixed(3))} V`, trap: 'dimension_slip' },
            { text: `${I + R} V`, trap: 'dimension_slip' },
            { text: `${V * 2} V`, trap: 'dimension_slip' },
          ],
          `By Ohm's law V = IR = ${I} A × ${R} Ω = ${V} V. Check units: A × Ω = V (1 Ω = 1 V A⁻¹).`,
          'resistance_voltage_dependence',
          ['V = IR'],
        )
      },
      () =>
        build(
          'The V–I graph of a metallic conductor at constant temperature is a straight line through the origin. What does the slope of this graph represent?',
          [
            { text: 'The resistance R of the conductor, in ohms', ok: true },
            { text: 'The reciprocal of the resistance, 1/R', trap: 'resistance_voltage_dependence' },
            { text: 'The electric power dissipated in the conductor', trap: 'power_formula_slip' },
            { text: 'The charge flowing through the conductor', trap: 'charge_current_confusion' },
          ],
          'With V on the y-axis and I on the x-axis, slope = V/I = R (ohm). If the graph were plotted as I against V, its slope would be 1/R.',
          'resistance_voltage_dependence',
          ['V–I graph'],
        ),
    ],
    Medium: [
      (rng) => {
        const [V, I] = pick(rng, [
          [12, 0.3],
          [6, 0.5],
          [9, 0.6],
          [4, 0.8],
          [6, 1.2],
          [220, 0.5],
        ] as const)
        const R = V / I
        return build(
          `When a potential difference of ${V} V is applied across a conductor, the current through it is ${I} A. Calculate the resistance of the conductor.`,
          [
            { text: `${R} Ω`, ok: true },
            { text: `${Number((V * I).toFixed(3))} Ω`, trap: 'dimension_slip' },
            { text: `${Number((I / V).toFixed(4))} Ω`, trap: 'resistance_voltage_dependence' },
            { text: `${V + I} Ω`, trap: 'dimension_slip' },
          ],
          `R = V/I = ${V} ÷ ${I} = ${R} Ω. Resistance is a property of the conductor: changing the supply voltage changes the current, not R.`,
          'resistance_voltage_dependence',
          ['V = IR'],
        )
      },
      (rng) => {
        const [V1, I1, R] = pick(rng, [
          [3, 0.5, 6],
          [4, 0.2, 20],
          [6, 0.3, 20],
          [2, 0.4, 5],
          [12, 0.3, 40],
        ] as const)
        const V2 = V1 * 2
        const I2 = I1 * 2
        return build(
          `When the potential difference across a conductor is raised from ${V1} V to ${V2} V, the current rises from ${I1} A to ${I2} A. The resistance of the conductor is`,
          [
            { text: `${R} Ω`, ok: true },
            { text: `${Number((V2 / I1).toFixed(2))} Ω`, trap: 'resistance_voltage_dependence' },
            { text: `${Number(((I2 - I1) / (V2 - V1)).toFixed(4))} Ω`, trap: 'dimension_slip' },
            { text: `${R / 2} Ω`, trap: 'dimension_slip' },
          ],
          `Use either pair: R = V/I = ${V1}/${I1} = ${R} Ω. Equivalently ΔV/ΔI = ${V2 - V1}/${Number((I2 - I1).toFixed(2))} = ${R} Ω, which is the slope of the V–I line.`,
          'resistance_voltage_dependence',
          ['V–I slope'],
        )
      },
    ],
    Hard: [
      () =>
        build(
          'Which statement about an ohmic conductor at constant temperature is correct?',
          [
            { text: 'The ratio V/I stays constant, so its V–I graph is a straight line through the origin', ok: true },
            { text: 'Its resistance increases as the applied voltage is increased', trap: 'resistance_voltage_dependence' },
            { text: 'Its V–I graph is a curve, because resistance keeps changing with the current', trap: 'resistance_voltage_dependence' },
            { text: 'Its resistance becomes zero because V and I both increase together', trap: 'dimension_slip' },
          ],
          'Ohm’s law: V ∝ I at constant temperature, so V/I = R is fixed. Curved V–I graphs belong to non-ohmic conductors such as a semiconductor diode or a hot filament lamp.',
          'resistance_voltage_dependence',
          ['ohmic vs non-ohmic'],
        ),
      (rng) => {
        const [R1, R2, V] = pick(rng, [
          [4, 6, 20],
          [2, 3, 10],
          [3, 5, 16],
          [1, 4, 10],
          [2, 6, 16],
          [2, 8, 20],
        ] as const)
        const Rs = R1 + R2
        const I = V / Rs
        const V2 = I * R2
        const V1 = I * R1
        return build(
          `Two resistors of ${R1} Ω and ${R2} Ω are joined in series to a ${V} V battery. Find the current in the circuit and the potential difference across the ${R2} Ω resistor.`,
          [
            { text: `I = ${I} A and V = ${V2} V`, ok: true },
            { text: `I = ${I} A and V = ${V1} V`, trap: 'series_current_split' },
            { text: `I = ${I / 2} A and V = ${V2} V`, trap: 'current_consumption' },
            { text: `I = ${I * 2} A and V = ${V2} V`, trap: 'dimension_slip' },
          ],
          `Rₛ = ${R1} + ${R2} = ${Rs} Ω, so I = V/Rₛ = ${V}/${Rs} = ${I} A through both resistors (series ⇒ same current). Then V across ${R2} Ω = IR = ${I} × ${R2} = ${V2} V.`,
          'series_current_split',
          ['series circuits', 'V = IR'],
        )
      },
    ],
  },

  resistance_factors: {
    Easy: [
      (rng) => {
        const [n, R] = pick(rng, [
          [2, 4],
          [2, 5],
          [3, 2],
          [4, 1],
        ] as const)
        const newR = n * n * R
        return build(
          `A wire of resistance ${R} Ω is stretched so that its length becomes ${n} times the original length, its volume remaining the same. What is its new resistance?`,
          [
            { text: `${newR} Ω`, ok: true },
            { text: `${n * R} Ω`, trap: 'constant_volume_geometry' },
            { text: `${Number((R / n).toFixed(2))} Ω`, trap: 'constant_volume_geometry' },
            { text: `${R} Ω (unchanged)`, trap: 'resistance_voltage_dependence' },
          ],
          `Volume is constant, so length ×${n} makes the area 1/${n} times. Hence R′ = ρl′/A′ = ρ(${n}l)/(A/${n}) = ${n}² × ${R} = ${newR} Ω — the length factor acts twice.`,
          'constant_volume_geometry',
          ['R = ρl/A'],
        )
      },
      () =>
        build(
          'Which one of the following does NOT affect the resistance of a metallic wire?',
          [
            { text: 'The current flowing through the wire', ok: true },
            { text: 'The length of the wire', trap: 'resistance_voltage_dependence' },
            { text: 'The area of cross-section of the wire', trap: 'resistance_voltage_dependence' },
            { text: 'The nature of the material of the wire', trap: 'resistance_voltage_dependence' },
          ],
          'R = ρl/A depends on length, area and the material (and on temperature). The current is an effect of the voltage and resistance, not a cause of resistance.',
          'resistance_voltage_dependence',
          ['R = ρl/A'],
        ),
    ],
    Medium: [
      (rng) => {
        const [l, A, R] = pick(rng, [
          [2, 1e-6, 0.034],
          [1, 1e-6, 0.017],
          [3, 2e-6, 0.0255],
          [4, 2e-6, 0.034],
        ] as const)
        const rho = 1.7e-8
        return build(
          `A copper wire of length ${l} m and cross-sectional area ${A.toExponential(0).replace('e-6', ' × 10⁻⁶')} m² has resistivity 1.7 × 10⁻⁸ Ω m. Calculate its resistance.`,
          [
            { text: `${R} Ω`, ok: true },
            { text: `${Number((rho / A).toExponential(2))} Ω`, trap: 'dimension_slip' },
            { text: `${Number((rho * l * A).toExponential(2))} Ω`, trap: 'dimension_slip' },
            { text: `${R * 1000} Ω`, trap: 'dimension_slip' },
          ],
          `R = ρl/A = (1.7 × 10⁻⁸ × ${l}) ÷ (${A.toExponential(0)}) = ${R} Ω. Because copper has a very low resistivity, a normal copper wire has a minute resistance.`,
          'dimension_slip',
          ['R = ρl/A'],
        )
      },
      () =>
        build(
          'Which statement about the resistivity ρ of a conductor is correct?',
          [
            { text: 'It depends on the material and its temperature, but not on the length or thickness of the sample', ok: true },
            { text: 'It increases when the wire is made longer', trap: 'resistance_voltage_dependence' },
            { text: 'It is measured in ohms (Ω)', trap: 'dimension_slip' },
            { text: 'It is the same for every metal', trap: 'resistance_voltage_dependence' },
          ],
          'Resistivity is a material property measured in Ω m: ρ = RA/l. Nichrome and manganin have high resistivity (ideal for heating elements), while copper and silver have very low resistivity.',
          'resistance_voltage_dependence',
          ['resistivity'],
        ),
    ],
    Hard: [
      (rng) => {
        const [n, R] = pick(rng, [
          [5, 10],
          [3, 9],
          [4, 8],
          [2, 8],
        ] as const)
        const eq = R / (n * n)
        return build(
          `A wire of resistance ${R} Ω is cut into ${n} equal pieces and all the pieces are joined in parallel. What is the equivalent resistance of the combination?`,
          [
            { text: `${eq} Ω`, ok: true },
            { text: `${Number((R / n).toFixed(2))} Ω`, trap: 'dimension_slip' },
            { text: `${n * R} Ω`, trap: 'parallel_formula_in_series' },
            { text: `${R} Ω`, trap: 'dimension_slip' },
          ],
          `Each piece has R/${n} = ${R / n} Ω. In parallel, equal resistors give Rₚ = R_piece/n = ${R / n} ÷ ${n} = ${eq} Ω. Cutting a wire always reduces the resistance drastically.`,
          'dimension_slip',
          ['R = ρl/A', 'parallel'],
        )
      },
      (rng) => {
        const [r1, r2] = pick(rng, [
          [1, 2],
          [1, 3],
          [2, 3],
        ] as const)
        return build(
          `Two wires of the same material and the same length have radii in the ratio ${r1} : ${r2}. The ratio of their resistances R₁ : R₂ is`,
          [
            { text: `${r2 * r2} : ${r1 * r1}`, ok: true },
            { text: `${r2} : ${r1}`, trap: 'constant_volume_geometry' },
            { text: `${r1} : ${r2}`, trap: 'constant_volume_geometry' },
            { text: '1 : 1, because the material and length are the same', trap: 'resistance_voltage_dependence' },
          ],
          `A = πr², so R ∝ 1/r². With r₁ : r₂ = ${r1} : ${r2}, R₁ : R₂ = r₂² : r₁² = ${r2 * r2} : ${r1 * r1}.`,
          'constant_volume_geometry',
          ['R = ρl/A'],
        )
      },
    ],
  },

  series_parallel: {
    Easy: [
      (rng) => {
        const [R1, R2] = pick(rng, [
          [3, 6],
          [4, 6],
          [5, 10],
          [2, 7],
        ] as const)
        const Rp = (R1 * R2) / (R1 + R2)
        return build(
          `Two resistors of ${R1} Ω and ${R2} Ω are connected in series. What is the equivalent resistance of the combination?`,
          [
            { text: `${R1 + R2} Ω`, ok: true },
            { text: `${Number(Rp.toFixed(2))} Ω`, trap: 'parallel_formula_in_series' },
            { text: `${Math.abs(R2 - R1)} Ω`, trap: 'dimension_slip' },
            { text: `${R1 * R2} Ω`, trap: 'dimension_slip' },
          ],
          `In series, Rₛ = R₁ + R₂ = ${R1} + ${R2} = ${R1 + R2} Ω. Both resistors carry the same current, so their resistances simply add.`,
          'parallel_formula_in_series',
          ['series'],
        )
      },
      (rng) => {
        const [R1, R2] = pick(rng, [
          [4, 6],
          [3, 6],
          [6, 12],
          [5, 20],
        ] as const)
        const Rp = (R1 * R2) / (R1 + R2)
        return build(
          `Two resistors of ${R1} Ω and ${R2} Ω are connected in parallel. What is the equivalent resistance?`,
          [
            { text: `${Number(Rp.toFixed(2))} Ω`, ok: true },
            { text: `${R1 + R2} Ω`, trap: 'additive_parallel' },
            { text: `${Number(Math.min(R1, R2))} Ω`, trap: 'parallel_formula_in_series' },
            { text: `${Number((Rp / 2).toFixed(2))} Ω`, trap: 'dimension_slip' },
          ],
          `1/Rₚ = 1/${R1} + 1/${R2} ⇒ Rₚ = (${R1} × ${R2})/(${R1} + ${R2}) = ${Number(Rp.toFixed(2))} Ω. Sanity check: ${Number(Rp.toFixed(2))} Ω is smaller than the smallest branch (${Math.min(R1, R2)} Ω), exactly as it must be.`,
          'additive_parallel',
          ['parallel'],
        )
      },
    ],
    Medium: [
      (rng) => {
        const R = pick(rng, [9, 6, 12, 15, 30])
        return build(
          `Three resistors, each of resistance ${R} Ω, are connected in parallel. The equivalent resistance of the combination is`,
          [
            { text: `${R / 3} Ω`, ok: true },
            { text: `${3 * R} Ω`, trap: 'additive_parallel' },
            { text: `${R} Ω`, trap: 'parallel_formula_in_series' },
            { text: `${R / 9} Ω`, trap: 'dimension_slip' },
          ],
          `For n equal resistors in parallel Rₚ = R/n, so Rₚ = ${R}/3 = ${R / 3} Ω. Note the series answer would be 3R = ${3 * R} Ω.`,
          'additive_parallel',
          ['parallel', 'equal resistors'],
        )
      },
      (rng) => {
        const [R1, R2, R3, V] = pick(rng, [
          [2, 3, 6, 6],
          [1, 2, 6, 6],
          [2, 2, 2, 6],
          [1, 4, 4, 12],
          [2, 6, 3, 12],
        ] as const)
        const Rp = (R2 * R3) / (R2 + R3)
        const Rt = R1 + Rp
        const I = V / Rt
        const Vp = I * Rp
        const I2 = Vp / R2
        const I3 = Vp / R3
        return build(
          `In the circuit, the ${R2} Ω and ${R3} Ω resistors are in parallel and this combination is in series with a ${R1} Ω resistor. The battery is ${V} V. Find the current through the ${R2} Ω resistor.`,
          [
            { text: `${I2} A`, ok: true },
            { text: `${I} A`, trap: 'series_current_split' },
            { text: `${I3} A`, trap: 'series_current_split' },
            { text: `${Number((V / R2).toFixed(2))} A`, trap: 'series_current_split' },
          ],
          `Parallel pair: Rₚ = (${R2} × ${R3})/(${R2} + ${R3}) = ${Rp} Ω. Total R = ${R1} + ${Rp} = ${Rt} Ω, so I = ${V}/${Rt} = ${I} A. The parallel section has p.d. Vₚ = I × Rₚ = ${Vp} V, hence I through ${R2} Ω = ${Vp}/${R2} = ${I2} A while the ${R3} Ω branch carries ${I3} A (they add to ${I} A).`,
          'series_current_split',
          ['mixed circuit'],
        )
      },
    ],
    Hard: [
      (rng) => {
        const [R1, R2, V] = pick(rng, [
          [6, 3, 6],
          [8, 2, 8],
          [10, 5, 10],
          [12, 4, 12],
        ] as const)
        const I1 = V / R1
        const I2 = V / R2
        const It = I1 + I2
        return build(
          `A ${R1} Ω and a ${R2} Ω resistor are connected in parallel across a ${V} V battery. Which statement is correct?`,
          [
            { text: `The ${R2} Ω resistor carries ${I2} A and the ${R1} Ω resistor carries ${I1} A, so the total current is ${It} A`, ok: true },
            { text: `The ${R1} Ω resistor carries the larger current because it has the larger resistance`, trap: 'series_current_split' },
            { text: `The potential difference across the ${R2} Ω resistor is half of that across the ${R1} Ω resistor`, trap: 'series_current_split' },
            { text: `The total current drawn from the battery is only ${I1} A, because current is used up in the first branch`, trap: 'current_consumption' },
          ],
          `Both resistors are across the same ${V} V, so I₁ = ${V}/${R1} = ${I1} A and I₂ = ${V}/${R2} = ${I2} A. The total current is the sum, ${It} A, and Rₚ = V/I_total = ${Number(((R1 * R2) / (R1 + R2)).toFixed(2))} Ω, which is less than ${Math.min(R1, R2)} Ω.`,
          'series_current_split',
          ['parallel', 'current division'],
        )
      },
      (rng) => {
        const n = pick(rng, [2, 3, 4, 5])
        return build(
          `${n} resistors, each of resistance R, are connected first in series and then in parallel. The ratio of the equivalent resistance in the series arrangement to that in the parallel arrangement is`,
          [
            { text: `${n * n} : 1`, ok: true },
            { text: `${n} : 1`, trap: 'dimension_slip' },
            { text: `1 : ${n * n}`, trap: 'additive_parallel' },
            { text: '1 : 1', trap: 'parallel_formula_in_series' },
          ],
          `Series: Rₛ = ${n}R. Parallel: Rₚ = R/${n}. Ratio = ${n}R ÷ (R/${n}) = ${n}² : 1 = ${n * n} : 1.`,
          'additive_parallel',
          ['series', 'parallel'],
        )
      },
    ],
  },

  electric_power: {
    Easy: [
      (rng) => {
        const [I, V] = pick(rng, [
          [0.5, 220],
          [0.25, 240],
          [2, 220],
          [0.2, 110],
          [0.5, 12],
        ] as const)
        const P = I * V
        return build(
          `An electric bulb draws a current of ${I} A when connected to a ${V} V supply. What is its power rating?`,
          [
            { text: `${P} W`, ok: true },
            { text: `${Number((V / I).toFixed(2))} W`, trap: 'power_formula_slip' },
            { text: `${V + I} W`, trap: 'dimension_slip' },
            { text: `${P / 10} W`, trap: 'dimension_slip' },
          ],
          `P = VI = ${V} V × ${I} A = ${P} W. One watt is one volt-ampere, so a 220 V appliance drawing 0.5 A is a 110 W appliance.`,
          'power_formula_slip',
          ['P = VI'],
        )
      },
      (rng) => {
        const [P, t] = pick(rng, [
          [1000, 2],
          [2000, 3],
          [1500, 4],
          [500, 4],
          [100, 10],
        ] as const)
        const kWh = (P * t) / 1000
        return build(
          `A ${P} W appliance is used for ${t} hours a day. How much electrical energy does it consume in one day, in kWh (commercial units)?`,
          [
            { text: `${kWh} kWh`, ok: true },
            { text: `${P * t} kWh`, trap: 'power_formula_slip' },
            { text: `${kWh / 1000} kWh`, trap: 'dimension_slip' },
            { text: `${(P * t * 3.6).toExponential(2)} kWh`, trap: 'dimension_slip' },
          ],
          `Energy = Power × time = ${P} W × ${t} h = ${P * t} Wh = ${kWh} kWh. One unit (1 kWh) equals 3.6 × 10⁶ J.`,
          'power_formula_slip',
          ['energy = P × t', '1 kWh'],
        )
      },
    ],
    Medium: [
      (rng) => {
        const [P, V] = pick(rng, [
          [66, 220],
          [110, 220],
          [60, 240],
          [220, 220],
          [1100, 220],
          [1320, 220],
        ] as const)
        const I = P / V
        return build(
          `An electric bulb marked ${P} W is operated on a ${V} V supply. What current does it draw?`,
          [
            { text: `${I} A`, ok: true },
            { text: `${Number((V / P).toFixed(3))} A`, trap: 'power_formula_slip' },
            { text: `${P * V} A`, trap: 'dimension_slip' },
            { text: `${P + V} A`, trap: 'dimension_slip' },
          ],
          `From P = VI we get I = P/V = ${P} W ÷ ${V} V = ${I} A. Always check: W ÷ V = A.`,
          'power_formula_slip',
          ['P = VI'],
        )
      },
      (rng) => {
        const [V, R, P] = pick(rng, [
          [220, 44, 1100],
          [220, 110, 440],
          [220, 22, 2200],
          [110, 22, 550],
          [220, 55, 880],
        ] as const)
        return build(
          `An electric heater of resistance ${R} Ω is connected to a ${V} V mains supply. What power does it consume?`,
          [
            { text: `${P} W`, ok: true },
            { text: `${Number((V / R).toFixed(2))} W`, trap: 'power_formula_slip' },
            { text: `${V * R} W`, trap: 'dimension_slip' },
            { text: `${Number((V * V * R).toExponential(2))} W`, trap: 'dimension_slip' },
          ],
          `When the voltage and resistance are known, use P = V²/R = ${V}²/${R} = ${P} W. (Here I = V/R = ${Number((V / R).toFixed(2))} A, the current — not the power.)`,
          'power_formula_slip',
          ['P = V²/R'],
        )
      },
    ],
    Hard: [
      (rng) => {
        const [R, V, t] = pick(rng, [
          [22, 220, 1800],
          [44, 220, 600],
          [11, 220, 300],
          [55, 220, 1200],
        ] as const)
        const I = V / R
        const P = V * I
        const H = I * I * R * t
        return build(
          `An electric geyser coil of resistance ${R} Ω is connected to a ${V} V supply for ${t / 60} minutes. Calculate the heat produced in the coil.`,
          [
            { text: `${fmtSci(H)} J`, ok: true },
            { text: `${P} J`, trap: 'power_formula_slip' },
            { text: `${fmtSci(H / 60)} J`, trap: 'dimension_slip' },
            { text: `${fmtSci(H * 10)} J`, trap: 'dimension_slip' },
          ],
          `I = V/R = ${V}/${R} = ${I} A. Then Joule's law, H = I²Rt = ${I}² × ${R} × ${t} s = ${fmtSci(H)} J (note t is in seconds). The power is P = VI = ${P} W; multiplying by time gives the energy.`,
          'power_formula_slip',
          ['Joule heating'],
        )
      },
      (rng) => {
        const [Pa, Pb] = pick(rng, [
          [100, 60],
          [100, 40],
          [60, 40],
        ] as const)
        const Ra = Math.round(48400 / Pa)
        const Rb = Math.round(48400 / Pb)
        const brighter = Pb < Pa ? 'the lower-wattage bulb' : 'the higher-wattage bulb'
        return build(
          `A ${Pa} W, 220 V bulb and a ${Pb} W, 220 V bulb are connected in series across a 220 V mains supply. Which bulb glows brighter and why?`,
          [
            { text: `The ${Pb} W bulb, because it has the higher resistance (${Rb} Ω) and P = I²R in a series circuit`, ok: true },
            { text: `The ${Pa} W bulb, because it carries the greater power rating of ${Pa} W`, trap: 'rated_wattage_series' },
            { text: `The ${Pa} W bulb, because it draws the greater current`, trap: 'current_consumption' },
            { text: 'Both glow equally, since the same current flows through them', trap: 'rated_wattage_series' },
          ],
          `At the rated voltage R = V²/P: R₁ = 48400/${Pa} = ${Ra} Ω and R₂ = 48400/${Pb} = ${Rb} Ω. In series the current is the same, so P = I²R means ${brighter} (larger R) glows brighter. In parallel the same bulbs would behave oppositely, because then P = V²/R.`,
          'rated_wattage_series',
          ['series', 'P = I²R'],
        )
      },
    ],
  },

  /* ================================== OPTICS ================================== */
  reflection_laws: {
    Easy: [
      (rng) => {
        const a = pick(rng, [30, 20, 40, 25, 35])
        const i = 90 - a
        return build(
          `A ray of light makes an angle of ${a}° with the surface of a plane mirror. What is the angle of reflection?`,
          [
            { text: `${i}°`, ok: true },
            { text: `${a}°`, trap: 'angle_from_surface' },
            { text: `${i * 2}°`, trap: 'dimension_slip' },
            { text: '90°', trap: 'angle_from_surface' },
          ],
          `Angles are measured from the normal: i = 90° − ${a}° = ${i}°. By the second law of reflection ∠r = ∠i = ${i}°.`,
          'angle_from_surface',
          ['∠i = ∠r'],
        )
      },
      (rng) => {
        const between = pick(rng, [80, 60, 100, 70])
        const i = between / 2
        return build(
          `The angle between the incident ray and the reflected ray is ${between}°. What is the angle of incidence?`,
          [
            { text: `${i}°`, ok: true },
            { text: `${180 - between}°`, trap: 'dimension_slip' },
            { text: `${90 - i}°`, trap: 'angle_from_surface' },
            { text: `${between}°`, trap: 'angle_from_surface' },
          ],
          `The normal bisects the angle between the incident and reflected rays when ∠i = ∠r, so i = ${between}°/2 = ${i}°.`,
          'angle_from_surface',
          ['∠i = ∠r'],
        )
      },
    ],
    Medium: [
      () =>
        build(
          'A ray of light falls normally (along the normal) on a plane mirror. What is the angle of reflection?',
          [
            { text: '0°', ok: true },
            { text: '90°', trap: 'angle_from_surface' },
            { text: '45°', trap: 'dimension_slip' },
            { text: '180°', trap: 'dimension_slip' },
          ],
          'At normal incidence the angle of incidence is 0°, so ∠r = ∠i = 0°: the ray retraces its own path straight back.',
          'angle_from_surface',
          ['normal incidence'],
        ),
      () =>
        build(
          'Which statement about the image formed by a plane mirror is correct?',
          [
            { text: 'It is virtual, erect, laterally inverted and as far behind the mirror as the object is in front', ok: true },
            { text: 'It is real and can be caught on a screen placed behind the mirror', trap: 'real_virtual_confusion' },
            { text: 'It is virtual and inverted', trap: 'real_virtual_confusion' },
            { text: 'It is smaller in size than the object', trap: 'dimension_slip' },
          ],
          'A plane mirror forms a virtual, erect image of the same size, laterally inverted, located behind the mirror at the same distance as the object. Being virtual, it can never be obtained on a screen.',
          'real_virtual_confusion',
          ['plane mirror image'],
        ),
    ],
    Hard: [
      () =>
        build(
          'A ray of light is incident on a plane mirror. If the mirror is rotated through 10° about the point of incidence, the reflected ray turns through',
          [
            { text: '20°', ok: true },
            { text: '10°', trap: 'angle_from_surface' },
            { text: '5°', trap: 'dimension_slip' },
            { text: '40°', trap: 'dimension_slip' },
          ],
          'Rotating the mirror by θ turns the normal by θ, so the angle of incidence changes by θ. Since ∠r = ∠i, the reflected ray turns by 2θ = 20°.',
          'angle_from_surface',
          ['rotating mirror'],
        ),
      () =>
        build(
          'A clock hanging on a wall shows the time 9:15. What time does its image show in a plane mirror?',
          [
            { text: '2:45', ok: true },
            { text: '9:45', trap: 'real_virtual_confusion' },
            { text: '2:15', trap: 'real_virtual_confusion' },
            { text: '6:45', trap: 'real_virtual_confusion' },
          ],
          'A plane mirror image is laterally inverted, so left and right are interchanged. 9:15 becomes 2:45 (in general, mirror time = 11:60 − given time, e.g. 11:60 − 9:15 = 2:45).',
          'real_virtual_confusion',
          ['lateral inversion'],
        ),
    ],
  },

  spherical_mirrors: {
    Easy: [
      (rng) => {
        const f = pick(rng, [15, 10, 20, 18, 12])
        return build(
          `The focal length of a concave mirror is ${f} cm. What is its radius of curvature?`,
          [
            { text: `${2 * f} cm`, ok: true },
            { text: `${f} cm`, trap: 'focal_length_half' },
            { text: `${f / 2} cm`, trap: 'focal_length_half' },
            { text: `${4 * f} cm`, trap: 'dimension_slip' },
          ],
          `R = 2f = 2 × ${f} cm = ${2 * f} cm. The focus is midway between the pole P and the centre of curvature C.`,
          'focal_length_half',
          ['f = R/2'],
        )
      },
      () =>
        build(
          'Which mirror is used as a rear-view mirror in vehicles, and why?',
          [
            { text: 'A convex mirror, because it always gives an erect, diminished image and a wider field of view', ok: true },
            { text: 'A concave mirror, because it always forms a real image', trap: 'concave_always_real' },
            { text: 'A plane mirror, because its image is of exactly the same size', trap: 'dimension_slip' },
            { text: 'A concave mirror, because it magnifies the traffic behind', trap: 'concave_always_real' },
          ],
          'A convex mirror always produces a virtual, erect and diminished image and its field of view is much wider, so it shows more traffic. Concave mirrors magnify, which would distort the view.',
          'concave_always_real',
          ['uses of mirrors'],
        ),
    ],
    Medium: [
      () =>
        build(
          'An object is placed at the centre of curvature of a concave mirror. The image formed is',
          [
            { text: 'At the centre of curvature itself — real, inverted and of the same size as the object', ok: true },
            { text: 'At the principal focus — real, inverted and enlarged', trap: 'dimension_slip' },
            { text: 'At infinity — highly enlarged', trap: 'dimension_slip' },
            { text: 'Behind the mirror — virtual and erect', trap: 'real_virtual_confusion' },
          ],
          'Place the object at C (u = R = 2f). The mirror formula gives v = 2f = R, so the image forms at C itself: real, inverted and of the same size (m = −1).',
          'real_virtual_confusion',
          ['image formation'],
        ),
      () =>
        build(
          'A concave mirror has a radius of curvature of 30 cm and an object is placed 40 cm in front of it. Using the New Cartesian sign convention, the values of u and f are',
          [
            { text: 'u = −40 cm, f = −15 cm', ok: true },
            { text: 'u = −40 cm, f = +15 cm', trap: 'mirror_sign_convention' },
            { text: 'u = +40 cm, f = −15 cm', trap: 'mirror_sign_convention' },
            { text: 'u = +40 cm, f = +15 cm', trap: 'mirror_sign_convention' },
          ],
          'The object always lies on the incident-light side, so u is negative. For a concave mirror the focus is also on that side, so f = R/2 = −15 cm. Hence u = −40 cm, f = −15 cm.',
          'mirror_sign_convention',
          ['sign convention'],
        ),
    ],
    Hard: [
      () =>
        build(
          'An object is placed between the pole and the principal focus of a concave mirror. The image formed is',
          [
            { text: 'Virtual, erect and enlarged, formed behind the mirror', ok: true },
            { text: 'Real, inverted and enlarged, formed in front of the mirror', trap: 'concave_always_real' },
            { text: 'Real, inverted and diminished', trap: 'concave_always_real' },
            { text: 'Virtual, inverted and diminished', trap: 'real_virtual_confusion' },
          ],
          'For |u| < |f| the mirror formula gives v positive: the image lies behind the mirror, so it is virtual and erect, and m = −v/u > 1 makes it enlarged. This is why a concave mirror works as a shaving or dentist’s mirror.',
          'concave_always_real',
          ['image formation'],
        ),
      () =>
        build(
          'Which statement about a convex mirror is correct?',
          [
            { text: 'It always forms a virtual, erect and diminished image lying between its pole and focus', ok: true },
            { text: 'It can form a real image when the object is very far away', trap: 'real_virtual_confusion' },
            { text: 'Its focal length is negative, so its image is always inverted', trap: 'mirror_sign_convention' },
            { text: 'It is used as a shaving mirror because it magnifies the face', trap: 'concave_always_real' },
          ],
          'A convex mirror diverges the reflected rays; the image is always virtual, erect, diminished and located between P and F (v has the same sign as f, which is positive for a convex mirror).',
          'real_virtual_confusion',
          ['convex mirror'],
        ),
    ],
  },

  mirror_formula: {
    Easy: [
      (rng) => {
        const f = pick(rng, [10, 15, 20])
        const u = 2 * f
        return build(
          `An object is placed ${u} cm in front of a concave mirror of focal length ${f} cm. Where is the image formed?`,
          [
            { text: `${u} cm in front of the mirror`, ok: true },
            { text: `${u} cm behind the mirror`, trap: 'mirror_sign_convention' },
            { text: `${f} cm in front of the mirror`, trap: 'dimension_slip' },
            { text: 'At infinity', trap: 'dimension_slip' },
          ],
          `u = −${u} cm (2f, i.e. the object is at C) and f = −${f} cm. Then 1/v = 1/f − 1/u = −1/${f} + 1/${u} ⇒ v = −${u} cm, so the image is at the centre of curvature, ${u} cm in front of the mirror, real and inverted.`,
          'mirror_sign_convention',
          ['1/v + 1/u = 1/f'],
        )
      },
      () =>
        build(
          'A mirror produces a magnification of −2. The image is',
          [
            { text: 'Real, inverted and twice as large as the object', ok: true },
            { text: 'Virtual, erect and twice as large', trap: 'magnification_sign' },
            { text: 'Virtual, inverted and half the size', trap: 'magnification_sign' },
            { text: 'Real, erect and half the size', trap: 'magnification_sign' },
          ],
          'm = h′/h = −v/u. The magnitude 2 gives the size ratio (enlarged ×2) and the negative sign gives the nature: a negative m means a real and inverted image.',
          'magnification_sign',
          ['m = −v/u'],
        ),
    ],
    Medium: [
      (rng) => {
        const [u, f] = pick(rng, [
          [30, 20],
          [40, 24],
          [15, 10],
          [60, 30],
        ] as const)
        const v = -(u * f) / (u - f)
        return build(
          `An object is placed ${u} cm in front of a concave mirror of focal length ${f} cm. Find the position of the image.`,
          [
            { text: `${Math.abs(v)} cm in front of the mirror`, ok: true },
            { text: `${Math.abs(v)} cm behind the mirror`, trap: 'mirror_sign_convention' },
            { text: `${f} cm in front of the mirror`, trap: 'dimension_slip' },
            { text: `${Number((Math.abs(v) / 2).toFixed(1))} cm in front of the mirror`, trap: 'dimension_slip' },
          ],
          `u = −${u} cm, f = −${f} cm ⇒ 1/v = 1/f − 1/u = −1/${f} + 1/${u}, giving v = −${Math.abs(v)} cm. A negative v means the image is real, inverted and formed ${Math.abs(v)} cm in front of the mirror. Magnification m = −v/u = ${Number((Math.abs(v) / u).toFixed(2))}.`,
          'mirror_sign_convention',
          ['1/v + 1/u = 1/f'],
        )
      },
      (rng) => {
        const [u, f] = pick(rng, [
          [30, 15],
          [40, 20],
          [20, 10],
          [60, 20],
        ] as const)
        const v = (u * f) / (u + f)
        return build(
          `A convex mirror of focal length ${f} cm forms the image of an object placed ${u} cm in front of it. Where is the image formed?`,
          [
            { text: `${v} cm behind the mirror`, ok: true },
            { text: `${v} cm in front of the mirror`, trap: 'mirror_sign_convention' },
            { text: `${u} cm behind the mirror`, trap: 'dimension_slip' },
            { text: `${Number((v / 2).toFixed(1))} cm behind the mirror`, trap: 'dimension_slip' },
          ],
          `For a convex mirror f = +${f} cm and u = −${u} cm, so 1/v = 1/f − 1/u = 1/${f} + 1/${u} ⇒ v = +${v} cm. v > 0 means the image is virtual, erect and diminished, ${v} cm behind the mirror.`,
          'mirror_sign_convention',
          ['convex mirror', '1/v + 1/u = 1/f'],
        )
      },
    ],
    Hard: [
      () =>
        build(
          'An object is placed 10 cm in front of a concave mirror of focal length 15 cm. The image formed is',
          [
            { text: 'Virtual, erect and three times enlarged, 30 cm behind the mirror', ok: true },
            { text: 'Real, inverted and three times enlarged, 30 cm in front of the mirror', trap: 'concave_always_real' },
            { text: 'Real, inverted and diminished, 6 cm in front of the mirror', trap: 'concave_always_real' },
            { text: 'Virtual, erect and three times diminished, 30 cm behind the mirror', trap: 'magnification_sign' },
          ],
          `u = −10 cm and f = −15 cm (object between P and F). 1/v = 1/f − 1/u = −1/15 + 1/10 = 1/30 ⇒ v = +30 cm. Positive v means a virtual image 30 cm behind the mirror, and m = −v/u = +3 ⇒ erect, three times enlarged.`,
          'concave_always_real',
          ['1/v + 1/u = 1/f', 'virtual image'],
        ),
      () =>
        build(
          'A concave mirror gives a real image three times the size of an object placed 10 cm in front of it. Where is the image formed?',
          [
            { text: '30 cm in front of the mirror', ok: true },
            { text: '30 cm behind the mirror', trap: 'magnification_sign' },
            { text: '10 cm in front of the mirror', trap: 'dimension_slip' },
            { text: '3.3 cm in front of the mirror', trap: 'magnification_sign' },
          ],
          `A real image is inverted, so m = −3. From m = −v/u: −3 = −v/(−10) ⇒ v = −30 cm, i.e. the image is 30 cm in front of the mirror (same side as the object).`,
          'magnification_sign',
          ['m = −v/u', 'real image'],
        ),
    ],
  },

  refraction_snell: {
    Easy: [
      (rng) => {
        const n = pick(rng, [1.5, 1.33, 2.42])
        const v = 3e8 / n
        return build(
          `The refractive index of a medium is ${n} and the speed of light in vacuum is 3 × 10⁸ m/s. What is the speed of light in that medium?`,
          [
            { text: `${fmtSci(v)} m/s`, ok: true },
            { text: `${fmtSci(3e8 * n)} m/s`, trap: 'dimension_slip' },
            { text: '3 × 10⁸ m/s', trap: 'frequency_change' },
            { text: `${fmtSci(3e8 / (n * n))} m/s`, trap: 'dimension_slip' },
          ],
          `n = c/v ⇒ v = c/n = (3 × 10⁸)/${n} = ${fmtSci(v)} m/s. Light always travels slower in a material medium than in vacuum.`,
          'frequency_change',
          ['n = c/v'],
        )
      },
      () =>
        build(
          'The refractive index of water is 1.33 and that of glass is 1.5. In which medium does light travel faster?',
          [
            { text: 'In water, because n = c/v, so a smaller refractive index means a higher speed', ok: true },
            { text: 'In glass, because it has the larger refractive index', trap: 'dimension_slip' },
            { text: 'In both equally, because refraction does not change the speed of light', trap: 'no_bending' },
            { text: 'In glass, because light bends more there', trap: 'no_bending' },
          ],
          'v = c/n, so the smaller the refractive index the faster light travels: v_water = c/1.33 > v_glass = c/1.5.',
          'no_bending',
          ['n = c/v'],
        ),
    ],
    Medium: [
      (rng) => {
        const [i, n] = pick(rng, [
          [30, 1.5],
          [30, 1.33],
          [45, 1.5],
          [60, 1.33],
          [30, 2.42],
        ] as const)
        const sinI = Math.sin((i * Math.PI) / 180)
        const r = (Math.asin(sinI / n) * 180) / Math.PI
        const rInv = (Math.asin(Math.min(1, sinI * n)) * 180) / Math.PI
        return build(
          `A ray of light passes from air into a medium of refractive index ${n}. If the angle of incidence is ${i}°, find the angle of refraction.`,
          [
            { text: `${r.toFixed(1)}°`, ok: true },
            { text: `${rInv.toFixed(1)}°`, trap: 'inverted_snell' },
            { text: `${i}°`, trap: 'no_bending' },
            { text: `${(90 - r).toFixed(1)}°`, trap: 'angle_from_surface' },
          ],
          `Snell's law: n = sin i / sin r ⇒ sin r = sin ${i}°/${n} = ${Number((sinI / n).toFixed(4))} ⇒ r = ${r.toFixed(1)}°. The angle in the denser medium is smaller, so the ray bends towards the normal.`,
          'inverted_snell',
          ['Snell’s law'],
        )
      },
      () =>
        build(
          'Which quantity of light does NOT change when it passes from one transparent medium to another?',
          [
            { text: 'Frequency (and therefore its colour)', ok: true },
            { text: 'Wavelength', trap: 'frequency_change' },
            { text: 'Speed', trap: 'frequency_change' },
            { text: 'Direction of propagation', trap: 'no_bending' },
          ],
          'The frequency of light is fixed by the source. As v = νλ and v changes to c/n, the wavelength changes by the same factor, which is why the ray bends. Frequency (and colour) stays constant.',
          'frequency_change',
          ['v = νλ'],
        ),
    ],
    Hard: [
      (rng) => {
        const [lam, n] = pick(rng, [
          [600, 1.5],
          [750, 1.5],
          [900, 1.5],
          [800, 1.6],
          [680, 1.7],
        ] as const)
        const lamM = lam / n
        return build(
          `Light of wavelength ${lam} nm in air enters a medium of refractive index ${n}. Its wavelength inside the medium is`,
          [
            { text: `${Number(lamM.toFixed(1))} nm`, ok: true },
            { text: `${lam * n} nm`, trap: 'dimension_slip' },
            { text: `${lam} nm`, trap: 'frequency_change' },
            { text: `${Number((lamM / 2).toFixed(1))} nm`, trap: 'dimension_slip' },
          ],
          `Frequency stays constant, so n = λ_air/λ_medium ⇒ λ_medium = ${lam}/${n} = ${Number(lamM.toFixed(1))} nm. The waves become shorter but it is still light of the same colour.`,
          'frequency_change',
          ['v = νλ', 'n = c/v'],
        )
      },
      () =>
        build(
          'A ray of light travelling in glass (n = 1.5) enters water (n = 1.33). The ray will',
          [
            { text: 'Bend away from the normal, because it is moving into an optically rarer medium', ok: true },
            { text: 'Bend towards the normal, because water is optically denser than glass', trap: 'no_bending' },
            { text: 'Continue in the same direction with no change in speed', trap: 'no_bending' },
            { text: 'Be totally internally reflected for every angle of incidence', trap: 'dimension_slip' },
          ],
          'Denser → rarer (1.5 → 1.33) means the light speeds up, so it bends away from the normal (r > i). Total internal reflection is possible only beyond the critical angle, not for every angle of incidence.',
          'no_bending',
          ['denser to rarer'],
        ),
    ],
  },
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

let counter = 0

function materialise(
  conceptId: ConceptId,
  difficulty: Difficulty,
  source: QuestionSource,
  generated: Generated,
  rng: Rng,
): Question {
  const shuffled = shuffle(rng, generated.choices)
  const options = shuffled.map((c) => c.text)
  const correctIndex = shuffled.findIndex((c) => c.ok)
  const trapOptions: Record<number, string> = {}
  shuffled.forEach((choice, index) => {
    if (!choice.ok && choice.trap) trapOptions[index] = choice.trap
  })
  counter += 1
  return {
    id: `q_${conceptId}_${difficulty}_${counter}`,
    conceptId,
    difficulty,
    source,
    stem: generated.stem,
    options,
    correctIndex: correctIndex < 0 ? 0 : correctIndex,
    explanation: generated.explanation,
    trapOptions,
    primaryMisconception: generated.primaryMisconception,
    tags: generated.tags,
  }
}

/** Deterministic, offline-capable Class 10 Physics question generator. */
export function generateQuestion(
  conceptId: ConceptId,
  difficulty: Difficulty,
  rng: Rng,
  source: QuestionSource = 'PrepPilots Bank',
): Question {
  const templates = BANK[conceptId][difficulty]
  const template = pick(rng, templates)
  return materialise(conceptId, difficulty, source, template(rng), rng)
}

/** Calibrated difficulty from the current mastery of a node. */
export function calibrateDifficulty(mastery: number): Difficulty {
  if (mastery < 0.45) return 'Easy'
  if (mastery <= 0.75) return 'Medium'
  return 'Hard'
}

export function calibrationReason(mastery: number, difficulty: Difficulty): string {
  const pct = Math.round(mastery * 100)
  if (difficulty === 'Easy') return `${pct}% mastery (< 45%) → rebuilding fundamentals with Easy questions`
  if (difficulty === 'Medium') return `${pct}% mastery (45–75%) → applying formulas with Medium questions`
  return `${pct}% mastery (> 75%) → board-level stretch with Hard questions`
}

/** 6-question Pre-Flight Calibration covering the foundational nodes. */
export function generateDiagnosticSet(rng: Rng): Question[] {
  return DIAGNOSTIC_CONCEPTS.map((conceptId) =>
    generateQuestion(conceptId, 'Easy', rng, 'Diagnostic'),
  )
}

export function conceptTitle(conceptId: ConceptId): string {
  return CONCEPT_MAP[conceptId].name
}
