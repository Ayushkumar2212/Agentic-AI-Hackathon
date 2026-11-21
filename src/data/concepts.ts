import type { Concept, ConceptId } from '../types'

/**
 * The PrepPilots Concept Dependency Graph.
 *
 * Two authentic CBSE Class 10 Physics lanes:
 *  Electricity : Charge & Current -> Ohm's Law -> Factors of Resistance
 *                -> Series & Parallel Circuits -> Electric Power & Heating
 *  Optics      : Laws of Reflection -> Spherical Mirrors
 *                -> Mirror Formula & Magnification -> Refraction & Snell's Law
 */
export const CONCEPTS: Concept[] = [
  {
    id: 'charge_current',
    name: 'Electric Charge & Current',
    shortName: 'Charge & Current',
    formula: 'I = Q / t',
    track: 'Electricity',
    chapter: 'NCERT Ch. 12 - Electricity',
    summary:
      'Electric current is the rate of flow of charge through a conductor. One ampere is one coulomb of charge crossing a cross-section per second.',
    keyIdeas: [
      'I = Q/t  =>  Q = It, and 1 A = 1 C s⁻¹',
      'Q = n·e, where e = 1.6 × 10⁻¹⁹ C (charge on one electron)',
      'Conventional current flows opposite to the direction of electron drift',
      'An ammeter is always connected in series and should have very low resistance',
    ],
    prerequisites: [],
    examWeight: 0.08,
    x: 110,
    y: 130,
  },
  {
    id: 'ohms_law',
    name: "Ohm's Law",
    shortName: "Ohm's Law",
    formula: 'V = I R',
    track: 'Electricity',
    chapter: 'NCERT Ch. 12 - Electricity',
    summary:
      'At constant temperature, the current through a metallic conductor is directly proportional to the potential difference across its ends.',
    keyIdeas: [
      'V ∝ I at constant temperature  =>  V = IR, so R = V/I',
      'The slope of a V–I graph gives resistance R (1 Ω = 1 V A⁻¹)',
      'Resistance is a property of the conductor (length, area, material, temperature) — not of V or I',
      'Non-ohmic conductors (semiconductor diode, filament lamp) give a curved V–I graph',
    ],
    prerequisites: ['charge_current'],
    examWeight: 0.14,
    x: 310,
    y: 130,
  },
  {
    id: 'resistance_factors',
    name: 'Factors Affecting Resistance',
    shortName: 'Factors of Resistance',
    formula: 'R = ρ l / A',
    track: 'Electricity',
    chapter: 'NCERT Ch. 12 - Electricity',
    summary:
      'Resistance of a uniform conductor is directly proportional to its length, inversely proportional to its area of cross-section, and depends on the material.',
    keyIdeas: [
      'R = ρl/A, resistivity ρ has the unit Ω m',
      'Stretching a wire to n times its length at constant volume makes R = n²R',
      'ρ increases with temperature for metals; alloys such as nichrome have high ρ',
      'Cutting a wire into n equal parts and joining them in parallel gives R/n²  (e.g. 10 Ω into 5 parts -> 0.4 Ω)',
    ],
    prerequisites: ['ohms_law'],
    examWeight: 0.11,
    x: 510,
    y: 130,
  },
  {
    id: 'series_parallel',
    name: 'Series & Parallel Circuits',
    shortName: 'Series & Parallel',
    formula: 'Rₛ = ΣR,  1/Rₚ = Σ(1/R)',
    track: 'Electricity',
    chapter: 'NCERT Ch. 12 - Electricity',
    summary:
      'In series the same current flows through every component and the p.d. divides; in parallel every component has the same p.d. and the current divides.',
    keyIdeas: [
      'Series: Rₛ = R₁ + R₂ + R₃, same I, and V ∝ R',
      'Parallel: 1/Rₚ = 1/R₁ + 1/R₂, same V, and I ∝ 1/R',
      'Rₚ is always less than the smallest branch resistance; n equal resistors R give Rₚ = R/n',
      'Domestic wiring is parallel so every appliance gets the full 220 V and can be switched independently',
    ],
    prerequisites: ['resistance_factors'],
    examWeight: 0.14,
    x: 710,
    y: 130,
  },
  {
    id: 'electric_power',
    name: 'Electric Power & Heating Effect',
    shortName: 'Electric Power',
    formula: 'P = VI = I²R = V²/R',
    track: 'Electricity',
    chapter: 'NCERT Ch. 12 - Electricity',
    summary:
      'Electric power is the rate of consumption of electrical energy; the heating effect follows Joule’s law of heating.',
    keyIdeas: [
      'P = VI = I²R = V²/R, unit watt (1 W = 1 V × 1 A)',
      "Joule's law: H = I²Rt, so heat ∝ I² and heat ∝ R",
      'Electrical energy = P × t; 1 kWh = 3.6 × 10⁶ J (one commercial "unit")',
      "In series, P = I²R so the larger resistance glows brighter; in parallel, P = V²/R so the smaller resistance glows brighter",
    ],
    prerequisites: ['series_parallel'],
    examWeight: 0.13,
    x: 910,
    y: 130,
  },
  {
    id: 'reflection_laws',
    name: 'Laws of Reflection',
    shortName: 'Laws of Reflection',
    formula: '∠i = ∠r',
    track: 'Optics',
    chapter: 'NCERT Ch. 10 - Light: Reflection and Refraction',
    summary:
      'The angle of incidence equals the angle of reflection, both measured from the normal; the incident ray, normal and reflected ray lie in one plane.',
    keyIdeas: [
      '∠i = ∠r, always measured from the normal (not from the mirror surface)',
      'Incident ray, reflected ray and the normal lie in the same plane',
      'A plane mirror forms a virtual, erect, laterally inverted image of the same size behind the mirror',
      'If the mirror turns by θ, the reflected ray turns by 2θ',
    ],
    prerequisites: [],
    examWeight: 0.08,
    x: 200,
    y: 440,
  },
  {
    id: 'spherical_mirrors',
    name: 'Spherical Mirrors',
    shortName: 'Spherical Mirrors',
    formula: 'f = R / 2',
    track: 'Optics',
    chapter: 'NCERT Ch. 10 - Light: Reflection and Refraction',
    summary:
      'Concave and convex mirrors have a pole, principal axis, centre of curvature and principal focus, with the focal length equal to half the radius of curvature.',
    keyIdeas: [
      'f = R/2; concave mirror focuses parallel rays at the focus, convex mirror diverges them',
      'Concave mirror: real, inverted images for objects beyond F; virtual, erect, enlarged image when the object is between P and F',
      'Convex mirror: always virtual, erect, diminished — hence used as a rear-view mirror',
      'Concave mirrors are used in torches, vehicle headlights, shaving mirrors and dentists’ mirrors',
    ],
    prerequisites: ['reflection_laws'],
    examWeight: 0.11,
    x: 430,
    y: 440,
  },
  {
    id: 'mirror_formula',
    name: 'Mirror Formula & Magnification',
    shortName: 'Mirror Formula',
    formula: '1/v + 1/u = 1/f,  m = −v/u',
    track: 'Optics',
    chapter: 'NCERT Ch. 10 - Light: Reflection and Refraction',
    summary:
      'The mirror formula links object distance, image distance and focal length under the Cartesian sign convention; magnification compares image and object heights.',
    keyIdeas: [
      'Mirror formula: 1/v + 1/u = 1/f (Cartesian convention, pole as origin)',
      'Object distances u are negative; f is negative for a concave mirror and positive for a convex mirror',
      'Magnification m = h′/h = −v/u; m > 0 means a virtual, erect image and m < 0 a real, inverted image',
      'Concave mirror with u = −10 cm, f = −15 cm gives v = +30 cm and m = +3 (virtual, erect, 3× enlarged)',
    ],
    prerequisites: ['spherical_mirrors'],
    examWeight: 0.11,
    x: 660,
    y: 440,
  },
  {
    id: 'refraction_snell',
    name: "Refraction & Snell's Law",
    shortName: 'Refraction',
    formula: 'n₂₁ = sin i / sin r = v₁/v₂',
    track: 'Optics',
    chapter: 'NCERT Ch. 10 - Light: Reflection and Refraction',
    summary:
      'Light bends when it travels from one transparent medium to another because its speed changes; the refractive index compares the speed of light in two media.',
    keyIdeas: [
      "Snell's law: n₂₁ = sin i / sin r (angle in the rarer medium stays in the numerator)",
      'Absolute refractive index n = c/v; it has no unit (water 1.33, glass 1.5, diamond 2.42)',
      'Frequency of light does not change on refraction; speed and wavelength change (v = νλ, λ_medium = λ_air/n)',
      'Entering a denser medium the ray bends towards the normal; at i = 0° it passes undeviated but its speed still changes',
    ],
    prerequisites: ['mirror_formula'],
    examWeight: 0.1,
    x: 890,
    y: 440,
  },
]

export const CONCEPT_MAP: Record<ConceptId, Concept> = CONCEPTS.reduce(
  (acc, concept) => {
    acc[concept.id] = concept
    return acc
  },
  {} as Record<ConceptId, Concept>,
)

export const CONCEPT_IDS = CONCEPTS.map((c) => c.id)

export const TRACKS: { track: 'Electricity' | 'Optics'; label: string; formula: string }[] = [
  { track: 'Electricity', label: 'Circuits Lane', formula: 'Charge → Power' },
  { track: 'Optics', label: 'Ray Optics Lane', formula: 'Reflection → Refraction' },
]

/** Diagnostic calibration covers the 6 foundational nodes of the graph. */
export const DIAGNOSTIC_CONCEPTS: ConceptId[] = [
  'charge_current',
  'ohms_law',
  'series_parallel',
  'electric_power',
  'reflection_laws',
  'spherical_mirrors',
]

export function dependentsOf(id: ConceptId): ConceptId[] {
  return CONCEPTS.filter((c) => c.prerequisites.includes(id)).map((c) => c.id)
}

export function trackOf(id: ConceptId): 'Electricity' | 'Optics' {
  return CONCEPT_MAP[id].track
}
