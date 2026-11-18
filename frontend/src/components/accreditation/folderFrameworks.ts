import { FrameworkCategory } from '../../types/evidence';
import { IAAreaTemplate } from '../../settings/portalSettings';

export interface FolderFramework {
  /** Stored as `frameworkId` on every folder and document this manager creates. */
  id: string;
  label: string;
  fullName: string;
  category: FrameworkCategory;
  /** Singular noun shown before an area number, e.g. "Area 3" or "Category 3". */
  areaNoun: string;
  areaNounPlural: string;
  areasTabLabel: string;
  areasHeading: string;
  title: string;
  description?: string;
  cycle: string;
  /** Shows the Custom Folders tab and the "move custom folder into an area" upload mode. */
  customFolders: boolean;
  areas: IAAreaTemplate[];
  criterionFor: (area: IAAreaTemplate) => { criterionId: string; indicatorId: string };
  formatAreaLabel?: (area: IAAreaTemplate) => string;
  areaRangeLabel?: string;
}

export function iaFolderFramework(areas: IAAreaTemplate[]): FolderFramework {
  return {
    id: 'ia',
    label: 'IA',
    fullName: 'Institutional Accreditation',
    category: 'Accreditation',
    areaNoun: 'Area',
    areaNounPlural: 'Areas',
    areasTabLabel: 'IA Areas',
    areasHeading: 'Official AACCUP Institutional Accreditation Areas',
    title: 'IA Document & Folder Management',
    description: '',
    cycle: '2025 Institutional Accreditation',
    customFolders: true,
    areas,
    criterionFor: () => ({ criterionId: 'c-ia-1', indicatorId: 'i-1-1' })
  };
}

export const PQA_CATEGORY_AREAS: IAAreaTemplate[] = [
  { code: 'PQA-1', number: 1, name: 'Leadership', shortDesc: 'Senior leadership, governance, and societal responsibilities' },
  { code: 'PQA-2', number: 2, name: 'Strategy', shortDesc: 'Strategy development, strategic objectives, and action plans' },
  { code: 'PQA-3', number: 3, name: 'Customers & Students', shortDesc: 'Voice of the customer, stakeholder engagement, and satisfaction' },
  { code: 'PQA-4', number: 4, name: 'Measurement & Knowledge Mgmt', shortDesc: 'Performance measurement, analysis, and knowledge management' },
  { code: 'PQA-5', number: 5, name: 'Workforce', shortDesc: 'Workforce environment, engagement, and development' },
  { code: 'PQA-6', number: 6, name: 'Operations', shortDesc: 'Work processes, operational effectiveness, and supply network' },
  { code: 'PQA-7', number: 7, name: 'Results', shortDesc: 'Product, customer, workforce, leadership, and financial results' }
];

export const PQA_FOLDER_FRAMEWORK: FolderFramework = {
  id: 'pqa',
  label: 'PQA',
  fullName: 'Philippine Quality Award',
  category: 'Quality Excellence',
  areaNoun: 'Category',
  areaNounPlural: 'Categories',
  areasTabLabel: 'PQA Categories',
  areasHeading: 'PQA Criteria for Performance Excellence (7 Categories)',
  title: 'PQA Document & Folder Management',
  cycle: 'PQA Application Cycle',
  customFolders: false,
  areas: PQA_CATEGORY_AREAS,
  criterionFor: (area) => ({ criterionId: `c-pqa-${area.number}`, indicatorId: `i-pqa${area.number}-1` })
};

export const ISO_CLAUSE_AREAS: IAAreaTemplate[] = [
  {
    code: 'ISO-QM',
    number: 1,
    name: 'Quality Manual & Mandated Procedures',
    shortDesc: 'Documented ISO 9001:2015 quality manual, quality policy, and core institutional standard operating procedures.'
  },
  {
    code: 'ISO-C4',
    number: 4,
    name: 'Clause 4: Context of the Organization',
    shortDesc: 'Internal & external issues, stakeholder requirements, and institutional QMS scope boundaries.'
  },
  {
    code: 'ISO-C5',
    number: 5,
    name: 'Clause 5: Leadership & Governance',
    shortDesc: 'Management commitment, quality policy, university organizational roles, and responsibilities.'
  },
  {
    code: 'ISO-C6',
    number: 6,
    name: 'Clause 6: Planning & Risk Management',
    shortDesc: 'Campus risk and opportunity registers, institutional quality objectives, and plans to achieve them.'
  },
  {
    code: 'ISO-C7',
    number: 7,
    name: 'Clause 7: Support & Resources',
    shortDesc: 'Personnel competence, training records, infrastructure, monitoring resources, and documented information.'
  },
  {
    code: 'ISO-C8',
    number: 8,
    name: 'Clause 8: Operation & Service Delivery',
    shortDesc: 'Operational planning, curriculum delivery, student admission, research, and extension.'
  },
  {
    code: 'ISO-C9',
    number: 9,
    name: 'Clause 9: Performance Evaluation & IQA',
    shortDesc: 'Customer satisfaction surveys, Internal Quality Audit (IQA) reports, and Management Review minutes.'
  },
  {
    code: 'ISO-C10',
    number: 10,
    name: 'Clause 10: Continual Improvement',
    shortDesc: 'Nonconformity handling, corrective action implementation, and continual improvement initiatives.'
  }
];

export const ISO_FOLDER_FRAMEWORK: FolderFramework = {
  id: 'iso',
  label: 'ISO',
  fullName: 'ISO 9001:2015 Quality Management Framework',
  category: 'Quality Management',
  areaNoun: 'Clause',
  areaNounPlural: 'Clauses',
  areasTabLabel: 'ISO Clauses',
  areasHeading: 'ISO 9001:2015 Clauses & Mandated Quality Portfolios',
  title: 'ISO Document & Folder Management',
  description: 'Official ISO 9001:2015 surveillance evidence and quality portfolios — organize clause folders, upload files or entire directories, and track audit review.',
  cycle: '2024 Surveillance Audit',
  customFolders: false,
  areas: ISO_CLAUSE_AREAS,
  formatAreaLabel: (area) => (area.code === 'ISO-QM' ? 'Quality Manual' : `Clause ${area.number}`),
  areaRangeLabel: 'Clauses 4–10 & Quality Manual',
  criterionFor: (area) => ({ criterionId: `c-iso-${area.number}`, indicatorId: `i-iso${area.number}-1` })
};
