/**
 * Temporary SAMPLE photograph map for the landing activities gallery.
 *
 * Replace file paths under `/activities/sample/` with authentic NEMSU QA
 * documentation photographs when available. Keep keys tied to activity titles
 * so verified institutional records stay separate from placeholder media.
 */
export type ActivityImageAsset = {
  /** Public path to the photograph (easy to swap later). */
  src: string;
  /** Accessible description. Sample photos are labeled as such. */
  alt: string;
  /** True while using temporary non-NEMSU development photographs. */
  isSample: boolean;
};

export const ACTIVITY_SAMPLE_IMAGES: Record<string, ActivityImageAsset> = {
  'Accreditation Survey Visit': {
    src: '/activities/sample/survey-visit.jpg',
    alt: 'Sample photograph: professionals collaborating during an accreditation evaluation meeting',
    isSample: true
  },
  'Internal Quality Assurance Audit': {
    src: '/activities/sample/qa-audit.jpg',
    alt: 'Sample photograph: quality assurance review of documents during an internal audit',
    isSample: true
  },
  'Program Accreditation Preparation': {
    src: '/activities/sample/program-prep.jpg',
    alt: 'Sample photograph: university personnel preparing accreditation materials in a workshop',
    isSample: true
  },
  'ISO Quality Management Training': {
    src: '/activities/sample/iso-training.jpg',
    alt: 'Sample photograph: training workshop focused on quality management and documentation',
    isSample: true
  }
};

export function getActivityImage(title: string): ActivityImageAsset {
  return (
    ACTIVITY_SAMPLE_IMAGES[title] ?? {
      src: '',
      alt: `Placeholder image for ${title}`,
      isSample: true
    }
  );
}
