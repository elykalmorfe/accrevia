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
  description: string;
  cycle: string;
  /** Shows the Custom Folders tab and the "move custom folder into an area" upload mode. */
  customFolders: boolean;
  areas: IAAreaTemplate[];
  criterionFor: (area: IAAreaTemplate) => { criterionId: string; indicatorId: string };
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
    description: `Official institutional evidence portfolios for Areas 1–${areas.length} — organize folders, upload evidence, and track review progress.`,
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
  description: 'Evidence portfolios for PQA Categories 1–7 (Leadership to Results) — organize folders, upload evidence, and track review progress.',
  cycle: 'PQA Application Cycle',
  customFolders: false,
  areas: PQA_CATEGORY_AREAS,
  criterionFor: (area) => ({ criterionId: `c-pqa-${area.number}`, indicatorId: `i-pqa${area.number}-1` })
};
