/**
 * Landing-page-only sample QA Office content cards.
 * Not official NEMSU announcements — clearly marked as samples.
 */

export type SampleQaCard = {
  id: string;
  title: string;
  category: string;
  description: string;
  detailCopy: string[];
  image: {
    src: string;
    alt: string;
  };
};

export const QA_OFFICE_SAMPLE_CARDS: SampleQaCard[] = [
  {
    id: 'qa-initiatives',
    title: 'Quality Assurance Initiatives',
    category: 'Quality Assurance',
    description:
      'Initiatives focused on strengthening institutional quality standards, academic excellence, and continuous improvement.',
    detailCopy: [
      'This sample card illustrates the kinds of quality assurance initiatives the NEMSU Office of Quality Assurance may highlight on the ACCREVIA landing page.',
      'Content focuses on strengthening institutional quality standards, academic excellence, and continuous improvement across university units.',
      'This is illustrative sample content only and is not an official NEMSU event announcement.'
    ],
    image: {
      src: '/activities/sample/qa-audit.jpg',
      alt: 'Sample image of a professional university quality assurance meeting'
    }
  },
  {
    id: 'accreditation-readiness',
    title: 'Accreditation Readiness',
    category: 'Accreditation Preparation',
    description:
      'Activities supporting accreditation document organization, internal evaluation, compliance monitoring, and evidence preparation.',
    detailCopy: [
      'This sample card represents accreditation readiness workstreams such as document organization, internal evaluation, compliance monitoring, and evidence preparation.',
      'It is meant to show how ACCREVIA can surface Quality Assurance Office activities related to accreditation preparation.',
      'This is illustrative sample content only and is not an official NEMSU event announcement.'
    ],
    image: {
      src: '/activities/sample/program-prep.jpg',
      alt: 'Sample image of organized accreditation documents and a university administrative workspace'
    }
  },
  {
    id: 'qa-workshops',
    title: 'Quality Assurance Workshops',
    category: 'Capacity Building',
    description:
      'Professional development activities supporting faculty and staff understanding of accreditation standards and quality assurance practices.',
    detailCopy: [
      'This sample card represents capacity-building workshops that help faculty and staff understand accreditation standards and quality assurance practices.',
      'It demonstrates how seminar and training activities can appear alongside official QA Office updates on the landing page.',
      'This is illustrative sample content only and is not an official NEMSU event announcement.'
    ],
    image: {
      src: '/activities/sample/iso-training.jpg',
      alt: 'Sample image of a university seminar or professional training workshop'
    }
  }
];
