/**
 * @deprecated Sample activity image map removed.
 * Use `iaOrientationEvent.ts` for the verified NEMSU Institutional Accreditation
 * Orientation and Workshop photographs.
 */

export type ActivityImageAsset = {
  src: string;
  alt: string;
  isSample: boolean;
};

export function getActivityImage(title: string): ActivityImageAsset {
  return {
    src: '',
    alt: `No mapped image for ${title}`,
    isSample: false
  };
}
