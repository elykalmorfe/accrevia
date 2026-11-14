import { campuses } from '../../data/accreditationData';

/** Display order matching the Accreditation Repository campus browser. */
const CAMPUS_ORDER = [
  'tandag',
  'bislig',
  'cagwait',
  'cantilan',
  'lianga',
  'san-miguel',
  'tagbina'
] as const;

export type CampusOption = { id: string; label: string };

export const accessRequestCampusOptions: CampusOption[] = CAMPUS_ORDER.map((id) => {
  const campus = campuses.find((c) => c.id === id);
  const short =
    id === 'tandag' ? 'Tandag' : id === 'san-miguel' ? 'San Miguel' : campus?.shortName ?? id;
  return { id, label: short };
});

/** Sample College / Academic Program labels for the demo form (not verified catalog data). */
const PROGRAMS_BY_CAMPUS: Record<string, string[]> = {
  tandag: [
    'College of Arts and Sciences · BS Computer Science',
    'College of Engineering · BS Civil Engineering',
    'College of Education · Bachelor of Secondary Education'
  ],
  bislig: [
    'College of Engineering · BS Civil Engineering',
    'College of Technology · BS Industrial Technology'
  ],
  cagwait: [
    'Hospitality programs · BS Hospitality Management',
    'Technology programs · BS Information Technology'
  ],
  cantilan: [
    'College of Computing · BS Information Technology',
    'College of Education · Bachelor of Secondary Education'
  ],
  lianga: [
    'College of Arts and Sciences · BS Environmental Science',
    'Business programs · BSBA Financial Management'
  ],
  'san-miguel': [
    'Agriculture-related programs · BS Agriculture',
    'Forestry programs · BS Forestry'
  ],
  tagbina: [
    'Teacher education · Bachelor of Elementary Education',
    'Business programs · BSBA Human Resource Management'
  ]
};

export function collegeProgramOptionsForCampus(campusId: string): string[] {
  return PROGRAMS_BY_CAMPUS[campusId] ?? [];
}
