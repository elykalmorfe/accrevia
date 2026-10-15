import { CampusId } from '../types/accreditation';

export function isCampusMatch(docCampus?: string, targetCampus?: CampusId | 'all'): boolean {
  if (!targetCampus || targetCampus === 'all') return true;
  if (!docCampus) return false;

  const dc = docCampus.toLowerCase().trim();

  // University-wide, institution-wide, or central documents apply across all campuses
  if (
    dc.includes('university-wide') ||
    dc.includes('institution-wide') ||
    dc.includes('all campus') ||
    dc.includes('central')
  ) {
    return true;
  }

  switch (targetCampus) {
    case 'tandag':
      return dc.includes('tandag') || dc.includes('main');
    case 'cantilan':
      return dc.includes('cantilan');
    case 'cagwait':
      return dc.includes('cagwait');
    case 'san-miguel':
      return dc.includes('san miguel') || dc.includes('san-miguel');
    case 'lianga':
      return dc.includes('lianga');
    case 'tagbina':
      return dc.includes('tagbina');
    case 'bislig':
      return dc.includes('bislig');
    default:
      return false;
  }
}

export interface CampusHistoricalRatio {
  year: string;
  inst: number;
  prog: number;
}

export const campusHistoricalRatios: Record<CampusId | 'all', CampusHistoricalRatio[]> = {
  all: [
    { year: '2021', inst: 74, prog: 62 },
    { year: '2022', inst: 78, prog: 69 },
    { year: '2023', inst: 81, prog: 74 },
    { year: '2024', inst: 85, prog: 80 },
    { year: '2025', inst: 90, prog: 86 },
    { year: '2026', inst: 94, prog: 92 }
  ],
  tandag: [
    { year: '2021', inst: 88, prog: 72 },
    { year: '2022', inst: 90, prog: 80 },
    { year: '2023', inst: 92, prog: 85 },
    { year: '2024', inst: 95, prog: 89 },
    { year: '2025', inst: 98, prog: 95 },
    { year: '2026', inst: 100, prog: 100 }
  ],
  cantilan: [
    { year: '2021', inst: 68, prog: 58 },
    { year: '2022', inst: 72, prog: 65 },
    { year: '2023', inst: 76, prog: 72 },
    { year: '2024', inst: 82, prog: 80 },
    { year: '2025', inst: 86, prog: 84 },
    { year: '2026', inst: 91, prog: 91 }
  ],
  lianga: [
    { year: '2021', inst: 62, prog: 52 },
    { year: '2022', inst: 68, prog: 60 },
    { year: '2023', inst: 72, prog: 68 },
    { year: '2024', inst: 76, prog: 75 },
    { year: '2025', inst: 82, prog: 80 },
    { year: '2026', inst: 88, prog: 89 }
  ],
  tagbina: [
    { year: '2021', inst: 58, prog: 48 },
    { year: '2022', inst: 62, prog: 55 },
    { year: '2023', inst: 68, prog: 62 },
    { year: '2024', inst: 72, prog: 70 },
    { year: '2025', inst: 78, prog: 76 },
    { year: '2026', inst: 82, prog: 82 }
  ],
  'san-miguel': [
    { year: '2021', inst: 48, prog: 40 },
    { year: '2022', inst: 52, prog: 46 },
    { year: '2023', inst: 58, prog: 52 },
    { year: '2024', inst: 64, prog: 58 },
    { year: '2025', inst: 70, prog: 65 },
    { year: '2026', inst: 75, prog: 72 }
  ],
  bislig: [
    { year: '2021', inst: 65, prog: 56 },
    { year: '2022', inst: 70, prog: 64 },
    { year: '2023', inst: 75, prog: 70 },
    { year: '2024', inst: 80, prog: 78 },
    { year: '2025', inst: 85, prog: 83 },
    { year: '2026', inst: 90, prog: 88 }
  ],
  cagwait: [
    { year: '2021', inst: 40, prog: 32 },
    { year: '2022', inst: 45, prog: 38 },
    { year: '2023', inst: 50, prog: 45 },
    { year: '2024', inst: 56, prog: 50 },
    { year: '2025', inst: 62, prog: 56 },
    { year: '2026', inst: 68, prog: 64 }
  ]
};

export interface LinePoint {
  x: number;
  y: number;
  val: string;
}

export function getCampusLineCoordinates(campus: CampusId | 'all'): {
  target: LinePoint[];
  actual: LinePoint[];
} {
  const ratios = campusHistoricalRatios[campus] || campusHistoricalRatios.all;
  const xCoords = [30, 110, 190, 270, 350, 430];

  const target: LinePoint[] = ratios.map((r, idx) => {
    // Target moves progressively from 70% to 100%
    const targetPct = 70 + idx * 6;
    const y = Math.round(100 - targetPct * 0.9);
    return {
      x: xCoords[idx],
      y,
      val: `${targetPct}%`
    };
  });

  const actual: LinePoint[] = ratios.map((r, idx) => {
    const attainedPct = Math.round((r.inst + r.prog) / 2);
    // map 0..100 into svg y: 100 is bottom (y=95), 0 is top (y=5)
    const y = Math.max(8, Math.min(92, Math.round(100 - attainedPct * 0.9)));
    return {
      x: xCoords[idx],
      y,
      val: `${attainedPct}%`
    };
  });

  return { target, actual };
}
