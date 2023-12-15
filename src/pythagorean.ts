import {Fraction} from 'xen-dev-utils';
import {TimeMonzo} from './monzo';

const ZERO = new Fraction(0);

type Degree = {
  negative: boolean;
  base: number;
  octaves: number;
};

export type Pythagorean = {
  type: 'Pythagorean';
  quality: string;
  imperfect: boolean;
  degree: Degree;
};

export type AbsolutePitch = {
  type: 'AbsolutePitch';
  nominal:
    | 'a'
    | 'A'
    | 'B'
    | 'C'
    | 'D'
    | 'E'
    | 'F'
    | 'G'
    | 'α'
    | 'β'
    | 'γ'
    | 'δ'
    | 'ε'
    | 'ζ'
    | 'η';
  accidentals: string[];
  octave: bigint;
};

// Exponents for perfect and imperfect intervals.
const PYTH_VECTORS: number[][] = [
  [0, 0],
  [2.5, -1.5],
  [-0.5, 0.5],
  [2, -1],
  [-1, 1],
  [1.5, -0.5],
  [-1.5, 1.5],
];

// Exponents for "neutral" interordinal intervals related to Pythagoras by a semioctave.
// Splits the whole tone in half precisely in the middle.
// Implicitly define semiquartal intervals.
const TONESPLITTER_VECTORS: number[][] = [
  [-1.5, 1],
  [-4.5, 3],
  [3.5, -2],
  [0.5, 0],
  [-2.5, 2],
  [5.5, -3],
  [2.5, -1],
];

const NOMINAL_VECTORS = new Map([
  ['F', [2, -1]],
  ['C', [0, 0]],
  ['G', [-1, 1]],
  ['D', [-3, 2]],
  ['a', [-4, 3]],
  ['A', [-4, 3]],
  ['E', [-6, 4]],
  ['B', [-7, 5]],

  ['beta', [2.5, -1]],
  ['β', [2.5, -1]],

  ['zeta', [0.5, 0]],
  ['ζ', [0.5, 0]],

  ['gamma', [-1.5, 1]],
  ['γ', [-1.5, 1]],

  ['eta', [-2.5, 2]],
  ['η', [-2.5, 2]],

  ['delta', [-4.5, 3]],
  ['δ', [-4.5, 3]],

  ['alpha', [-5.5, 4]],
  ['α', [-5.5, 4]],

  ['epsilon', [-7.5, 5]],
  ['ε', [-7.5, 5]],
]);

const ACCIDENTAL_VECTORS = new Map([
  ['♮', [0, 0]],
  ['=', [0, 0]],

  ['♯', [-11, 7]],
  ['#', [-11, 7]],

  ['♭', [11, -7]],
  ['b', [11, -7]],

  ['𝄪', [-22, 14]],
  ['x', [-22, 14]],

  ['𝄫', [22, -14]],

  ['𝄲', [-5.5, 3.5]],
  ['‡', [-5.5, 3.5]],
  ['t', [-5.5, 3.5]],

  ['𝄳', [5.5, -3.5]],
  ['d', [5.5, -3.5]],
]);

for (const accidental of '♯#♭b') {
  for (const semi of '½s') {
    const vector = [...ACCIDENTAL_VECTORS.get(accidental)!];
    vector[0] *= 0.5;
    vector[1] *= 0.5;
    ACCIDENTAL_VECTORS.set(semi + accidental, vector);
  }
  for (const demisemi of '¼q') {
    const vector = [...ACCIDENTAL_VECTORS.get(accidental)!];
    vector[0] *= 0.25;
    vector[1] *= 0.25;
    ACCIDENTAL_VECTORS.set(demisemi + accidental, vector);
  }
  for (const sesqui of '¾Q') {
    const vector = [...ACCIDENTAL_VECTORS.get(accidental)!];
    vector[0] *= 0.75;
    vector[1] *= 0.75;
    ACCIDENTAL_VECTORS.set(sesqui + accidental, vector);
  }
}

export function pythagoreanMonzo(node: Pythagorean): TimeMonzo {
  let vector: number[];
  if (node.degree.base % 1) {
    vector = [...TONESPLITTER_VECTORS[node.degree.base - 1.5]];
  } else {
    vector = [...PYTH_VECTORS[node.degree.base - 1]];
  }

  let quality = node.quality;

  // Non-perfect intervals need an extra half-augmented widening
  if (node.imperfect) {
    const last = quality[quality.length - 1];
    if (last === 'A') {
      vector[0] -= 5.5;
      vector[1] += 3.5;
    } else if (last === 'd') {
      vector[0] += 5.5;
      vector[1] -= 3.5;
    }
  }

  vector[0] += node.degree.octaves;

  // Quarter-augmented
  if (quality.startsWith('qA') || quality.startsWith('¼A')) {
    quality = quality.slice(2);
    vector[0] -= 2.75;
    vector[1] += 1.75;
  }
  if (quality.startsWith('qd') || quality.startsWith('¼d')) {
    quality = quality.slice(2);
    vector[0] += 2.75;
    vector[1] -= 1.75;
  }
  if (quality.startsWith('QA') || quality.startsWith('¾A')) {
    quality = quality.slice(2);
    vector[0] -= 8.25;
    vector[1] += 5.25;
  }
  if (quality.startsWith('Qd') || quality.startsWith('¾d')) {
    quality = quality.slice(2);
    vector[0] += 8.25;
    vector[1] -= 5.25;
  }

  // Semi-augmented
  if (quality.startsWith('sA') || quality.startsWith('½A')) {
    quality = quality.slice(2);
    vector[0] -= 5.5;
    vector[1] += 3.5;
  }
  if (quality.startsWith('sd') || quality.startsWith('½d')) {
    quality = quality.slice(2);
    vector[0] += 5.5;
    vector[1] -= 3.5;
  }

  // (Fully) augmented
  while (quality.startsWith('A')) {
    quality = quality.slice(1);
    vector[0] -= 11;
    vector[1] += 7;
  }
  while (quality.startsWith('d')) {
    quality = quality.slice(1);
    vector[0] += 11;
    vector[1] -= 7;
  }

  // Major = semi-augmented
  if (quality === 'M') {
    vector[0] -= 5.5;
    vector[1] += 3.5;
  }
  // Minor = semi-diminished
  if (quality === 'm') {
    vector[0] += 5.5;
    vector[1] -= 3.5;
  }
  // Semimajor = quarter-augmented
  if (quality === 'sM' || quality === '½M') {
    vector[0] -= 2.75;
    vector[1] += 1.75;
  }
  // Semiminor = quarter-diminished
  if (quality === 'sm' || quality === '½m') {
    vector[0] += 2.75;
    vector[1] -= 1.75;
  }

  // (Perfect, neutral and "empty" intervals need no further modifications.)

  const result = new TimeMonzo(
    ZERO,
    vector.map(c => new Fraction(c))
  );
  if (node.degree.negative) {
    return result.inverse();
  }
  return result;
}

export function absoluteMonzo(node: AbsolutePitch) {
  if (!NOMINAL_VECTORS.has(node.nominal)) {
    throw new Error(`Unrecognized nominal '${node.nominal}'`);
  }
  const vector = [...NOMINAL_VECTORS.get(node.nominal)!];
  for (const accidental of node.accidentals) {
    if (!ACCIDENTAL_VECTORS.has(accidental)) {
      throw new Error(`Unrecognized accidental '${accidental}'`);
    }
    const modification = ACCIDENTAL_VECTORS.get(accidental)!;
    vector[0] += modification[0];
    vector[1] += modification[1];
  }
  vector[0] += Number(node.octave) - 4;
  // These will be dressed up as frequencies later.
  return new TimeMonzo(
    ZERO,
    vector.map(c => new Fraction(c))
  );
}