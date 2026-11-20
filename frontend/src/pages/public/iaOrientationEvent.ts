/**
 * Landing-page-only record for the NEMSU Institutional Accreditation
 * Orientation and Workshop (22–23 October 2026).
 * Not connected to portal repositories or authenticated dashboards.
 */

export type EventPhoto = {
  src: string;
  alt: string;
  caption: string;
};

export const IA_ORIENTATION_SOURCE_URL = 'https://www.facebook.com/share/p/1E8XksBac8/';

export const IA_ACCREDITATION_AREAS = [
  'Governance and Management',
  'Teaching, Learning, and Evaluation',
  'Faculty and Staff',
  'Research',
  'Extension, Consultancy, and Linkages',
  'Support to Students',
  'Library',
  'Infrastructure and Other Learning Resources',
  'Quality Assurance Culture'
] as const;

export const IA_ORIENTATION_EVENT = {
  title: 'NEMSU Ramps Up Preparations for Institutional Accreditation',
  type: 'Institutional Accreditation Orientation and Workshop',
  category: 'Institutional Accreditation',
  status: 'Completed' as const,
  dateLabel: 'October 22–23, 2026',
  location: 'Pacific View Convention Hall, Cagwait, Surigao del Sur',
  organizer: 'North Eastern Mindanao State University — Office of Quality Assurance',
  officeHead: 'Engr. Lea G. Gurimbao',
  universityRepresentative: 'Dr. Maria Lady Sol A. Suazo — Vice President for Academic Affairs',
  speakers: [
    'Dr. Milabel E. Ho — AACCUP Executive Director',
    'Mr. Dominic T. Martinez — AACCUP IT Officer III'
  ],
  shortDescription:
    'A two-day orientation and workshop focused on institutional accreditation preparations, with AACCUP resource speakers.',
  fullDescription: [
    'North Eastern Mindanao State University, through its Office of Quality Assurance headed by Engr. Lea G. Gurimbao, conducted a two-day Orientation on Institutional Accreditation on October 22–23, 2026, at Pacific View Convention Hall in Cagwait, Surigao del Sur.',
    'The activity featured resource speakers from the Accrediting Agency of Chartered Colleges and Universities in the Philippines (AACCUP), Inc., including Executive Director Dr. Milabel E. Ho and IT Officer III Mr. Dominic T. Martinez.',
    'The orientation focused on institutional identity, accreditation portfolio preparation, documentation, performance assessment, and the digitization of accreditation evidence.',
    'Participants also conducted workshops evaluating NEMSU’s institutional performance across nine accreditation areas.',
    'The activity strengthened NEMSU’s preparation for institutional accreditation through coordinated documentation, institutional assessment, and quality assurance efforts.'
  ],
  highlights: [
    'AACCUP-led sessions on institutional identity and portfolio preparation',
    'Workshops assessing NEMSU performance across nine accreditation areas',
    'Guidance on documentation, evidence digitization, and quality assurance alignment',
    'Institutional commitment remarks from university academic leadership'
  ],
  sourceLabel: 'NEMSU Official Facebook Page',
  sourceUrl: IA_ORIENTATION_SOURCE_URL,
  photos: [
    {
      src: '/activities/ia-orientation-2026/inspirational-message.jpg',
      alt: 'University representative delivering an inspirational message during the NEMSU Institutional Accreditation Orientation',
      caption: 'Inspirational message'
    },
    {
      src: '/activities/ia-orientation-2026/orientation-workshop.jpg',
      alt: 'Speaker addressing participants during the institutional accreditation orientation program',
      caption: 'Orientation program'
    },
    {
      src: '/activities/ia-orientation-2026/group-photo.jpg',
      alt: 'Participants assembled in Pacific View Convention Hall during the institutional accreditation orientation',
      caption: 'Participants in assembly'
    },
    {
      src: '/activities/ia-orientation-2026/workshop-proceedings.jpg',
      alt: 'Workshop proceedings with area tables inside Pacific View Convention Hall',
      caption: 'Workshop proceedings'
    }
  ] satisfies EventPhoto[]
} as const;
