import { ProgramAccreditation } from '../types/accreditation';

/**
 * Generated from "D1 - ACCREVIA (AACCUP PROGRAM ACCREDITATION STATUS).xlsx":
 * current status from the 2026 sheet, level history from the Level Status sheet (2022–2026),
 * COPC status from the COPC Status sheet. Bump the version whenever this data is regenerated
 * so browsers replace their stored copy.
 */
export const PROGRAM_ACCREDITATION_DATA_VERSION = '2026-workbook-1';
export const COPC_DATA_VERSION = '2026-copc-local-certs-1';

export const programAccreditationRecords: Omit<ProgramAccreditation, 'requirements'>[] = [
  {
    id: 'pa-tan-01',
    campusId: 'tandag',
    campusName: 'Tandag Campus (Main)',
    programName: 'Bachelor of Physical Education',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '',
    status: 'Candidate',
    validityStart: '2024-09-01',
    validityEnd: '2026-08-31',
    certificationFile: 'https://drive.google.com/open?id=1HZq1msNZ5oR0sBr-no0i2NyxJWZaRrVD&usp=drive_fs',
    findingsLink: 'https://drive.google.com/file/d/1Qf_TZaOsKhFyNUXmhjEKzHjYNqqCO8qj/view?usp=sharing',
    technicalReviewLink: 'https://drive.google.com/open?id=16IyAIiWGqTlwwNEdlZ4Z3RCJzokmYPrx&usp=drive_fs',
    copcStatus: 'Compliant',
    levelHistory: [
      {
        id: 'lh-pa-tan-01-2024',
        year: 2024,
        level: 'Candidate',
        result: 'Passed',
        validityStart: '2024-09-01',
        validityEnd: '2026-08-31',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2024-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-tan-02',
    campusId: 'tandag',
    campusName: 'Tandag Campus (Main)',
    programName: 'Bachelor of Science in Environmental Science',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2008',
    status: 'Level 1',
    validityStart: '2024-09-01',
    validityEnd: '2027-08-31',
    certificationFile: 'https://drive.google.com/open?id=1iv_MeYpnpjLHYHizy-yQzKWU6YoFeH5I&usp=drive_fs',
    findingsLink: 'https://drive.google.com/file/d/1dAr6YbSm9d-ucxx2I2Y9qT5MIVRK0WW4/view',
    technicalReviewLink: 'https://drive.google.com/drive/folders/1c95n6ZIge4zvZZ11wN4y0IKDr_r2mYko?usp=sharing',
    copcStatus: 'Compliant',
    levelHistory: [
      {
        id: 'lh-pa-tan-02-2022',
        year: 2022,
        level: 'Candidate',
        result: 'Passed',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      },
      {
        id: 'lh-pa-tan-02-2024',
        year: 2024,
        level: 'Level 1',
        result: 'Passed',
        validityStart: '2024-09-01',
        validityEnd: '2027-08-31',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2024-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-tan-03',
    campusId: 'tandag',
    campusName: 'Tandag Campus (Main)',
    programName: 'Batsilyer sa Sining ng Filipino',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2009',
    status: 'Level 1',
    validityStart: '2023-09-01',
    validityEnd: '2026-08-31',
    certificationFile: 'https://drive.google.com/open?id=1cp_qOxxkhZNMKD3iQ4i7MlzdoBIl0-ph&usp=drive_fs',
    instrumentLink: 'https://drive.google.com/file/d/1QCQE-wK2aMDo4DgaIxzk2DUUCWvPyJni/view?usp=drive_link',
    findingsLink: 'https://drive.google.com/file/d/1BMg7ub_GBFR3vjPR7Gx61-0-lljjGH24/view',
    technicalReviewLink: 'https://drive.google.com/drive/folders/1x0V1KIM7SWtAh1S6Qc9_fZjwHd7bLSxA?usp=sharing',
    copcStatus: 'Compliant',
    levelHistory: [
      {
        id: 'lh-pa-tan-03-2022',
        year: 2022,
        level: 'Candidate',
        result: 'Passed',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      },
      {
        id: 'lh-pa-tan-03-2024',
        year: 2024,
        level: 'Level 1',
        result: 'Passed',
        validityStart: '2023-09-01',
        validityEnd: '2026-08-31',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2024-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-tan-04',
    campusId: 'tandag',
    campusName: 'Tandag Campus (Main)',
    programName: 'Bachelor of Science in Biology',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2006',
    status: 'Level 2',
    validityStart: '2022-08-16',
    validityEnd: '2026-08-15',
    certificationFile: 'https://drive.google.com/open?id=1KiPAsFvgF_EAQKKyEbRXBHyOopy56rEm&usp=drive_fs',
    findingsLink: 'https://drive.google.com/open?id=1eYbxRruUanekmYRGLESOpVxzfG73X-gm&usp=drive_fs',
    technicalReviewLink: 'https://drive.google.com/drive/folders/1fJbuvzM96s0-wTvH-81YKmzf6Cw2TkiF?usp=sharing',
    copcStatus: 'Compliant',
    levelHistory: [
      {
        id: 'lh-pa-tan-04-2022',
        year: 2022,
        level: 'Level 1',
        result: 'Passed',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      },
      {
        id: 'lh-pa-tan-04-2024',
        year: 2024,
        level: 'Level 2',
        result: 'Passed',
        validityStart: '2022-08-16',
        validityEnd: '2026-08-15',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2024-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-tan-05',
    campusId: 'tandag',
    campusName: 'Tandag Campus (Main)',
    programName: 'Bachelor of Early Childhood Education',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2013',
    status: 'Level 2',
    validityStart: '2022-08-16',
    validityEnd: '2026-08-15',
    certificationFile: 'https://drive.google.com/open?id=1xA0876dUbY5rKAqPLN2C-hI1P0VK1w0O&usp=drive_fs',
    findingsLink: 'https://drive.google.com/file/d/124rCmV29llzu_2gQUXQcrQ-VBFl0JvK9/view',
    technicalReviewLink: 'https://drive.google.com/drive/folders/1n3CjslqKarecQnx0J_FycZF6bHUFgVxJ?usp=sharing',
    copcStatus: 'Compliant',
    levelHistory: [
      {
        id: 'lh-pa-tan-05-2022',
        year: 2022,
        level: 'Level 2',
        result: 'Passed',
        validityStart: '2022-08-16',
        validityEnd: '2026-08-15',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-tan-06',
    campusId: 'tandag',
    campusName: 'Tandag Campus (Main)',
    programName: 'Bachelor of Science in Business Administration Major in Human Resource Management',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2007',
    status: 'Level 2',
    validityStart: '2025-10-01',
    validityEnd: '2026-09-30',
    certificationFile: 'https://drive.google.com/open?id=1ZEYmSfExK_vFRS_F4EkYx2tBGiSKGiRO&usp=drive_fs',
    findingsLink: 'https://drive.google.com/file/d/1XVXXsk_k7tZ1-0tNCzOwRvptuK-CG-Fo/view',
    technicalReviewLink: 'https://drive.google.com/open?id=1t5XqslXchC0BG3FmGQKIo8sIt3TIMeTy&usp=drive_fs',
    copcStatus: 'Compliant',
    scheduleForAccreditation: '2025-08-31',
    levelHistory: [
      {
        id: 'lh-pa-tan-06-2022',
        year: 2022,
        level: 'Level 2',
        result: 'Passed',
        validityStart: '2025-10-01',
        validityEnd: '2026-09-30',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-tan-07',
    campusId: 'tandag',
    campusName: 'Tandag Campus (Main)',
    programName: 'Bachelor of Science in Business Administration Major in Marketing Management',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2013',
    status: 'Level 3',
    validityStart: '2025-10-01',
    validityEnd: '2029-09-30',
    certificationFile: 'https://drive.google.com/open?id=1CeETI8pyT9IMd1AmWodWwx_l3eTfeOW9&usp=drive_fs',
    technicalReviewLink: 'https://drive.google.com/open?id=14JrJ7tObyhQQmb07PMvYYu9Jgq77Hxzy&usp=drive_fs',
    copcStatus: 'Compliant',
    scheduleForAccreditation: '2025-09-30',
    levelHistory: [
      {
        id: 'lh-pa-tan-07-2022',
        year: 2022,
        level: 'Level 1',
        result: 'Passed',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      },
      {
        id: 'lh-pa-tan-07-2024',
        year: 2024,
        level: 'Level 2',
        result: 'Passed',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2024-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      },
      {
        id: 'lh-pa-tan-07-2025',
        year: 2025,
        level: 'Level 3',
        result: 'Passed',
        validityStart: '2025-10-01',
        validityEnd: '2029-09-30',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2025-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-tan-08',
    campusId: 'tandag',
    campusName: 'Tandag Campus (Main)',
    programName: 'Bachelor of Arts in Economics',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2008',
    status: 'Level 3',
    validityStart: '2026-02-01',
    validityEnd: '2030-01-31',
    certificationFile: 'https://drive.google.com/open?id=1pCh_2N0dR96hfEeUpbMC4zKuJBCWDGTz&usp=drive_fs',
    findingsLink: 'https://drive.google.com/drive/folders/1BzkeWN11aQt-L3mJeuPRIBxWTZCF29Kp?usp=sharing',
    technicalReviewLink: 'https://drive.google.com/open?id=1BzkeWN11aQt-L3mJeuPRIBxWTZCF29Kp&usp=drive_fs',
    copcStatus: 'Compliant',
    levelHistory: [
      {
        id: 'lh-pa-tan-08-2022',
        year: 2022,
        level: 'Level 2',
        result: 'Passed',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      },
      {
        id: 'lh-pa-tan-08-2026',
        year: 2026,
        level: 'Level 3',
        result: 'Passed',
        validityStart: '2026-02-01',
        validityEnd: '2030-01-31',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2026-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-tan-09',
    campusId: 'tandag',
    campusName: 'Tandag Campus (Main)',
    programName: 'Bachelor of Science in Hospitality Management',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2003',
    status: 'Level 3',
    validityStart: '2026-02-01',
    validityEnd: '2030-01-31',
    certificationFile: 'https://drive.google.com/open?id=1MOP70Le_M-ENjx1hjrBGYBih55yfowQb&usp=drive_fs',
    findingsLink: 'https://drive.google.com/drive/folders/1nrMYHRS9C-6qmGsz-JzIFMBjzIx0Sbdo?usp=sharing',
    technicalReviewLink: 'https://drive.google.com/open?id=1nrMYHRS9C-6qmGsz-JzIFMBjzIx0Sbdo&usp=drive_fs',
    copcStatus: 'Compliant',
    levelHistory: [
      {
        id: 'lh-pa-tan-09-2022',
        year: 2022,
        level: 'Level 2',
        result: 'Passed',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      },
      {
        id: 'lh-pa-tan-09-2026',
        year: 2026,
        level: 'Level 3',
        result: 'Passed',
        validityStart: '2026-02-01',
        validityEnd: '2030-01-31',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2026-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-tan-10',
    campusId: 'tandag',
    campusName: 'Tandag Campus (Main)',
    programName: 'Bachelor of Arts in Political Science',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2008',
    status: 'Level 3',
    validityStart: '2023-09-16',
    validityEnd: '2027-09-15',
    certificationFile: 'https://drive.google.com/open?id=1RB2gLi6TxyozABXF3Uv-MwDxfb57HeYV&usp=drive_fs',
    findingsLink: 'https://drive.google.com/file/d/1vSl2HUpczdsMyaNSaCoZwzT5EOV3bYZp/view',
    technicalReviewLink: 'https://drive.google.com/open?id=18kbi-GbAHx61VgUfHeQqtJxt_tdjdQNI&usp=drive_fs',
    copcStatus: 'Compliant',
    levelHistory: [
      {
        id: 'lh-pa-tan-10-2022',
        year: 2022,
        level: 'Level 2',
        result: 'Passed',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      },
      {
        id: 'lh-pa-tan-10-2023',
        year: 2023,
        level: 'Level 3',
        result: 'Passed',
        validityStart: '2023-09-16',
        validityEnd: '2027-09-15',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2023-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-tan-11',
    campusId: 'tandag',
    campusName: 'Tandag Campus (Main)',
    programName: 'Bachelor of Science in Civil Engineering',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2000',
    status: 'Level 3',
    validityStart: '2024-09-16',
    validityEnd: '2026-09-15',
    certificationFile: 'https://drive.google.com/open?id=1iGFbMYCywpexoz23SPKhkSFZMaogeC22&usp=drive_fs',
    findingsLink: 'https://drive.google.com/file/d/1QdQoWkLONQnhLc9vnGABNeQEeIxlYLUe/view?usp=drive_link',
    technicalReviewLink: 'https://drive.google.com/open?id=1MedEq1yR4_1r3XNST4bKFZEd9GUjOUYS&usp=drive_fs',
    copcStatus: 'Compliant',
    levelHistory: [
      {
        id: 'lh-pa-tan-11-2022',
        year: 2022,
        level: 'Level 3',
        result: 'Passed',
        validityStart: '2024-09-16',
        validityEnd: '2026-09-15',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-tan-12',
    campusId: 'tandag',
    campusName: 'Tandag Campus (Main)',
    programName: 'Bachelor of Science in Business Administration Major in Financial Management',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2007',
    status: 'Level 3',
    validityStart: '2025-09-01',
    validityEnd: '2030-08-31',
    certificationFile: 'https://drive.google.com/open?id=1TA2x8YKUpO_W0NS6i-_ozgf87zjlLvL3&usp=drive_fs',
    findingsLink: 'https://drive.google.com/file/d/1M3nK6fGvksEoXyRReR2_x6FGzD15YSoO/view?usp=drive_link',
    technicalReviewLink: 'https://drive.google.com/open?id=1n7e4lBwisT2ybu-xq7AKXq892iBx0Ur9&usp=drive_fs',
    copcStatus: 'Compliant',
    scheduleForAccreditation: '2025-07-31',
    levelHistory: [
      {
        id: 'lh-pa-tan-12-2022',
        year: 2022,
        level: 'Level 3',
        result: 'Passed',
        validityStart: '2025-09-01',
        validityEnd: '2030-08-31',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-tan-13',
    campusId: 'tandag',
    campusName: 'Tandag Campus (Main)',
    programName: 'Bachelor of Science in Computer Science',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '1999',
    status: 'Level 4',
    validityStart: '2025-10-01',
    validityEnd: '2030-09-30',
    certificationFile: 'https://drive.google.com/open?id=10IX2aPboWnveDXvZ8OWaawuGeP59Zvb3&usp=drive_fs',
    instrumentLink: 'https://drive.google.com/file/d/1Cyjo7VSF8bTb46H3CmXWuIivzludE7Nn/view?usp=drive_link',
    findingsLink: 'https://drive.google.com/file/d/15X3ANMWUoS6ohPz6r5icmLpElpjvZO0w/view?usp=drive_link',
    technicalReviewLink: 'https://drive.google.com/open?id=1bepKSu5qUAX7Ok-0PPVsEBOqLY8AB1tg&usp=drive_fs',
    copcStatus: 'Compliant',
    scheduleForAccreditation: '2025-09-15',
    levelHistory: [
      {
        id: 'lh-pa-tan-13-2022',
        year: 2022,
        level: 'Level 3',
        result: 'Passed',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      },
      {
        id: 'lh-pa-tan-13-2025',
        year: 2025,
        level: 'Level 4',
        result: 'Passed',
        validityStart: '2025-10-01',
        validityEnd: '2030-09-30',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2025-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-tan-14',
    campusId: 'tandag',
    campusName: 'Tandag Campus (Main)',
    programName: 'Bachelor of Science in Mathematics',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2003',
    status: 'Level 4',
    validityStart: '2025-09-01',
    validityEnd: '2030-08-31',
    certificationFile: 'https://drive.google.com/open?id=19RtVKMALyouqPHf5TpAq8oM8WBswZ8Jl&usp=drive_fs',
    instrumentLink: 'https://drive.google.com/file/d/1iYmlrYWGkoPGpDhXV3n13m6jBPOrMBRV/view?usp=drive_link',
    findingsLink: 'https://drive.google.com/drive/folders/1RqBgkSHn-hy3F-pPmu7tkjbJBGbWKkUI?usp=drive_link',
    technicalReviewLink: 'https://drive.google.com/open?id=1tmfJeDGqfncaCPMe0_8ILLp93o3pWwpk&usp=drive_fs',
    copcStatus: 'Compliant',
    scheduleForAccreditation: '2025-07-31',
    levelHistory: [
      {
        id: 'lh-pa-tan-14-2022',
        year: 2022,
        level: 'Level 3',
        result: 'Passed',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      },
      {
        id: 'lh-pa-tan-14-2025',
        year: 2025,
        level: 'Level 4',
        result: 'Passed',
        validityStart: '2025-09-01',
        validityEnd: '2030-08-31',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2025-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-tan-15',
    campusId: 'tandag',
    campusName: 'Tandag Campus (Main)',
    programName: 'Bachelor of Elementary Education',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2008',
    status: 'Level 4',
    validityStart: '2025-10-01',
    validityEnd: '2030-09-30',
    certificationFile: 'https://drive.google.com/open?id=18wqrhk2LYAQP9hTGAR7bhKDJUr2hgRD8&usp=drive_fs',
    findingsLink: 'https://drive.google.com/file/d/1BjPiEt7fFkviGQF0c_b2tp6J_Yi17avX/view',
    technicalReviewLink: 'https://drive.google.com/open?id=1z6AMLcsvep3nRhXGVyV0ogu4huyVKgEj&usp=drive_fs',
    copcStatus: 'Compliant',
    scheduleForAccreditation: '2025-09-15',
    levelHistory: [
      {
        id: 'lh-pa-tan-15-2022',
        year: 2022,
        level: 'Level 3',
        result: 'Passed',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      },
      {
        id: 'lh-pa-tan-15-2025',
        year: 2025,
        level: 'Level 4',
        result: 'Passed',
        validityStart: '2025-10-01',
        validityEnd: '2030-09-30',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2025-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-tan-16',
    campusId: 'tandag',
    campusName: 'Tandag Campus (Main)',
    programName: 'Bachelor of Secondary Education Major in English, Filipino & Science',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2008',
    status: 'Level 4',
    validityStart: '2025-10-01',
    validityEnd: '2030-09-30',
    certificationFile: 'https://drive.google.com/open?id=1ZLDw7fqfq1NUP8GXVoyla53vAXu8gKHV&usp=drive_fs',
    findingsLink: 'https://drive.google.com/file/d/1lUN2EHcRG-eCOfYbIKL29axCxHi_vaey/view',
    technicalReviewLink: 'https://drive.google.com/open?id=17rC-7AIDlgWA-NvKAI4x2PzoZfh-xUzD&usp=drive_fs',
    copcStatus: 'Compliant',
    scheduleForAccreditation: '2025-09-15',
    levelHistory: [
      {
        id: 'lh-pa-tan-16-2022',
        year: 2022,
        level: 'Level 3',
        result: 'Passed',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      },
      {
        id: 'lh-pa-tan-16-2025',
        year: 2025,
        level: 'Level 4',
        result: 'Passed',
        validityStart: '2025-10-01',
        validityEnd: '2030-09-30',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2025-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-tan-17',
    campusId: 'tandag',
    campusName: 'Tandag Campus (Main)',
    programName: 'Bachelor of Arts in English Language',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2008',
    status: 'Level 4',
    validityStart: '2025-09-01',
    validityEnd: '2030-08-31',
    certificationFile: 'https://drive.google.com/open?id=1oReqQbXH1k7JCzZafsVt_8y2SLi8QF1r&usp=drive_fs',
    findingsLink: 'https://drive.google.com/file/d/1pXL9ffWMuWfgZ3gbHlF9jhlcvaGZERt8/view?usp=drive_link',
    technicalReviewLink: 'https://drive.google.com/open?id=1bizTQa74xhkA_UzZ5hRFaRKTMM-shHIr&usp=drive_fs',
    copcStatus: 'Compliant',
    scheduleForAccreditation: '2025-07-31',
    levelHistory: [
      {
        id: 'lh-pa-tan-17-2022',
        year: 2022,
        level: 'Level 3',
        result: 'Passed',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      },
      {
        id: 'lh-pa-tan-17-2025',
        year: 2025,
        level: 'Level 4',
        result: 'Passed',
        validityStart: '2025-09-01',
        validityEnd: '2030-08-31',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2025-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-tan-18',
    campusId: 'tandag',
    campusName: 'Tandag Campus (Main)',
    programName: 'Bachelor of Secondary Education Major in Mathematics',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2008',
    status: 'Level 4',
    validityStart: '2022-04-01',
    validityEnd: '2028-03-31',
    certificationFile: 'https://drive.google.com/open?id=1_AsImI-LrloCV60f1AUSf3FDKq58-YHi&usp=drive_fs',
    findingsLink: 'https://drive.google.com/drive/folders/1HkK9G0SMvGGphooWU0f1NUop16wBrbG9?usp=sharing',
    technicalReviewLink: 'https://drive.google.com/open?id=1HkK9G0SMvGGphooWU0f1NUop16wBrbG9&usp=drive_fs',
    copcStatus: 'Compliant',
    levelHistory: [
      {
        id: 'lh-pa-tan-18-2022',
        year: 2022,
        level: 'Level 3',
        result: 'Passed',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      },
      {
        id: 'lh-pa-tan-18-2023',
        year: 2023,
        level: 'Level 4',
        result: 'Passed',
        validityStart: '2022-04-01',
        validityEnd: '2028-03-31',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2023-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-tan-19',
    campusId: 'tandag',
    campusName: 'Tandag Campus (Main)',
    programName: 'Bachelor of Public Administration',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2008',
    status: 'Level 4',
    validityStart: '2022-04-01',
    validityEnd: '2028-03-31',
    certificationFile: 'https://drive.google.com/open?id=1ayZF_FCG-4xrEkVmwj2fqkhAzp6zl9YD&usp=drive_fs',
    findingsLink: 'https://drive.google.com/drive/folders/1-PHmMXhlgUyVtShxcHewBmFf63o2OKcP?usp=sharing',
    technicalReviewLink: 'https://drive.google.com/open?id=1-PHmMXhlgUyVtShxcHewBmFf63o2OKcP&usp=drive_fs',
    copcStatus: 'Compliant',
    levelHistory: [
      {
        id: 'lh-pa-tan-19-2022',
        year: 2022,
        level: 'Level 3',
        result: 'Passed',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      },
      {
        id: 'lh-pa-tan-19-2023',
        year: 2023,
        level: 'Level 4',
        result: 'Passed',
        validityStart: '2022-04-01',
        validityEnd: '2028-03-31',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2023-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-tan-20',
    campusId: 'tandag',
    campusName: 'Tandag Campus (Main)',
    programName: 'Bachelor of Science in Midwifery',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2021',
    status: 'Not Accreditable',
    validityStart: '',
    validityEnd: '',
    copcStatus: 'Compliant',
    remarks: 'The program has been offered for less than five (5) years and has not yet reached the required batch of graduates.',
    levelHistory: []
  },
  {
    id: 'pa-tan-21',
    campusId: 'tandag',
    campusName: 'Tandag Campus (Main)',
    programName: 'Bachelor of Science in Accountancy',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2026',
    status: 'Not Accreditable',
    validityStart: '',
    validityEnd: '',
    copcStatus: 'Pending',
    remarks: 'New program; not yet due for accreditation.',
    levelHistory: []
  },
  {
    id: 'pa-tan-22',
    campusId: 'tandag',
    campusName: 'Tandag Campus (Main)',
    programName: 'Bachelor of Secondary Education major in Social Studies',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2026',
    status: 'Not Accreditable',
    validityStart: '',
    validityEnd: '',
    copcStatus: 'Pending',
    remarks: 'New program; not yet due for accreditation.',
    levelHistory: []
  },
  {
    id: 'pa-tan-23',
    campusId: 'tandag',
    campusName: 'Tandag Campus (Main)',
    programName: 'Bachelor of Science in Pyschology',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2026',
    status: 'Not Accreditable',
    validityStart: '',
    validityEnd: '',
    copcStatus: 'Pending',
    remarks: 'New program; not yet due for accreditation.',
    levelHistory: []
  },
  {
    id: 'pa-tan-g01',
    campusId: 'tandag',
    campusName: 'Tandag Campus (Main)',
    programName: 'Doctor of Philosophy in Mathematics Education',
    degreeLevel: 'Graduate',
    yearOfInitialOperation: '2016',
    status: 'Level 1',
    validityStart: '2024-09-01',
    validityEnd: '2027-08-31',
    certificationFile: 'https://drive.google.com/open?id=1_QlUfZdbxW1D8B-_5PTDqfnWwcCAAseY&usp=drive_fs',
    instrumentLink: 'https://drive.google.com/file/d/1WAsQ_es7pvheYftjXqwYHFDLzEVOsbbG/view?usp=drive_link',
    findingsLink: 'https://drive.google.com/open?id=1f71v4Zp5N2xY72RYktNY17KyfNXJW4j6&usp=drive_fs',
    technicalReviewLink: 'https://drive.google.com/open?id=1f71v4Zp5N2xY72RYktNY17KyfNXJW4j6&usp=drive_fs',
    copcStatus: 'Compliant',
    levelHistory: [
      {
        id: 'lh-pa-tan-g01-2024',
        year: 2024,
        level: 'Level 1',
        result: 'Passed',
        validityStart: '2024-09-01',
        validityEnd: '2027-08-31',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2024-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-tan-g02',
    campusId: 'tandag',
    campusName: 'Tandag Campus (Main)',
    programName: 'Doctor of Education in Educational Management',
    degreeLevel: 'Graduate',
    yearOfInitialOperation: '',
    status: 'Level 2',
    validityStart: '2024-09-16',
    validityEnd: '2026-09-15',
    certificationFile: 'https://drive.google.com/open?id=1r1Ily8XmcrzEdFq8v6ZZCiT8C_XsNIno&usp=drive_fs',
    instrumentLink: 'https://drive.google.com/file/d/1WAsQ_es7pvheYftjXqwYHFDLzEVOsbbG/view?usp=drive_link',
    findingsLink: 'https://drive.google.com/file/d/12KYnaR3lwOrPFTP3XmJavKP9sc30gsDd/view',
    technicalReviewLink: 'https://drive.google.com/drive/folders/1UfXXBZYVkLtvoBxrpfES7nDenmK5wdxq?usp=sharing',
    copcStatus: 'Compliant',
    levelHistory: [
      {
        id: 'lh-pa-tan-g02-2022',
        year: 2022,
        level: 'Level 2',
        result: 'Passed',
        validityStart: '2024-09-16',
        validityEnd: '2026-09-15',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-tan-g03',
    campusId: 'tandag',
    campusName: 'Tandag Campus (Main)',
    programName: 'Doctor of Education in English Language Teaching',
    degreeLevel: 'Graduate',
    yearOfInitialOperation: '',
    status: 'Level 2',
    validityStart: '2021-08-16',
    validityEnd: '2026-08-15',
    certificationFile: 'https://drive.google.com/open?id=1bMRFZ5I9gT0eDAIEwx7SbG3baSUbm9IH&usp=drive_fs',
    instrumentLink: 'https://drive.google.com/file/d/1WAsQ_es7pvheYftjXqwYHFDLzEVOsbbG/view?usp=drive_link',
    findingsLink: 'https://drive.google.com/file/d/11w8og0Et0esy0EyKcdc221kaMDFI2Bju/view',
    technicalReviewLink: 'https://drive.google.com/drive/folders/1GlXoaUUPOKhC55CKGJ6xBkkn5uDDQ3Tw?usp=sharing',
    copcStatus: 'Compliant',
    levelHistory: [
      {
        id: 'lh-pa-tan-g03-2022',
        year: 2022,
        level: 'Level 2',
        result: 'Passed',
        validityStart: '2021-08-16',
        validityEnd: '2026-08-15',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-tan-g04',
    campusId: 'tandag',
    campusName: 'Tandag Campus (Main)',
    programName: 'Master in Business Administration',
    degreeLevel: 'Graduate',
    yearOfInitialOperation: '',
    status: 'Level 2',
    validityStart: '2025-10-31',
    validityEnd: '2026-09-30',
    certificationFile: 'https://drive.google.com/open?id=1_5Cy3ZDeI7SFh5VvyLVSBnJ6sdMxgo-6&usp=drive_fs',
    instrumentLink: 'https://drive.google.com/file/d/1m8Nk_9dayXbO9FFcrWg9ktH9GN66ifrb/view?usp=drive_link',
    findingsLink: 'https://drive.google.com/file/d/10-7LbbSOfBOVCOQh8Ml5yABAfXmiYgoF/view',
    technicalReviewLink: 'https://drive.google.com/open?id=117_aJLQh_nRYj5IPrvhPdKLPUQ0fhrs0&usp=drive_fs',
    copcStatus: 'Compliant',
    scheduleForAccreditation: '2025-09-15',
    remarks: 'Schedule of Accreditation: Must comply before the validity ends.',
    levelHistory: [
      {
        id: 'lh-pa-tan-g04-2022',
        year: 2022,
        level: 'Level 2',
        result: 'Passed',
        validityStart: '2025-10-31',
        validityEnd: '2026-09-30',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-tan-g05',
    campusId: 'tandag',
    campusName: 'Tandag Campus (Main)',
    programName: 'Doctor of Philosophy in Science Education',
    degreeLevel: 'Graduate',
    yearOfInitialOperation: '',
    status: 'Level 3',
    validityStart: '2025-10-01',
    validityEnd: '2029-09-30',
    certificationFile: 'https://drive.google.com/open?id=1FLFXENIAakoib0XE6BH1ehRDn_d1PDUb&usp=drive_fs',
    instrumentLink: 'https://drive.google.com/file/d/1WAsQ_es7pvheYftjXqwYHFDLzEVOsbbG/view?usp=drive_link',
    findingsLink: 'https://drive.google.com/file/d/1RnGh1u1KpchmsP5jvxQ2btI2wUEsyv99/view',
    technicalReviewLink: 'https://drive.google.com/open?id=1uaE8Dgz_x5G53lL9eRufXp2eZq4SQzOS&usp=drive_fs',
    copcStatus: 'Compliant',
    levelHistory: [
      {
        id: 'lh-pa-tan-g05-2022',
        year: 2022,
        level: 'Level 2',
        result: 'Passed',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      },
      {
        id: 'lh-pa-tan-g05-2026',
        year: 2026,
        level: 'Level 3',
        result: 'Passed',
        validityStart: '2025-10-01',
        validityEnd: '2029-09-30',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2026-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-tan-g06',
    campusId: 'tandag',
    campusName: 'Tandag Campus (Main)',
    programName: 'Master of Science in Computer Science',
    degreeLevel: 'Graduate',
    yearOfInitialOperation: '',
    status: 'Level 3',
    validityStart: '2025-10-31',
    validityEnd: '2029-09-30',
    certificationFile: 'https://drive.google.com/open?id=18i_K8u5my8tXFEg2-WORVXqjSe_wvccx&usp=drive_fs',
    instrumentLink: 'https://drive.google.com/file/d/1m8Nk_9dayXbO9FFcrWg9ktH9GN66ifrb/view?usp=drive_link',
    findingsLink: 'https://drive.google.com/file/d/1dR5abvVezLmrErw5239qQsf24Z76sjjZ/view',
    technicalReviewLink: 'https://drive.google.com/open?id=1LR1JO3ZavhbEQvLJvt2zCncMdh85HSsh&usp=drive_fs',
    copcStatus: 'Pending',
    scheduleForAccreditation: '2025-08-31',
    remarks: 'COPC: On Going Process.',
    levelHistory: [
      {
        id: 'lh-pa-tan-g06-2022',
        year: 2022,
        level: 'Level 2',
        result: 'Passed',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      },
      {
        id: 'lh-pa-tan-g06-2026',
        year: 2026,
        level: 'Level 3',
        result: 'Passed',
        validityStart: '2025-10-31',
        validityEnd: '2029-09-30',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2026-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-tan-g07',
    campusId: 'tandag',
    campusName: 'Tandag Campus (Main)',
    programName: 'Master of Arts in Education major in Educational Management',
    degreeLevel: 'Graduate',
    yearOfInitialOperation: '',
    status: 'Level 3',
    validityStart: '2023-11-01',
    validityEnd: '2028-10-31',
    certificationFile: 'https://drive.google.com/open?id=1T1WGFYZXcnAGfbNJTcyIZ8wwapDhUgfz&usp=drive_fs',
    instrumentLink: 'https://drive.google.com/file/d/1m8Nk_9dayXbO9FFcrWg9ktH9GN66ifrb/view?usp=drive_link',
    findingsLink: 'https://drive.google.com/file/d/1fXamILzuL4Im1pVkpC30HuFtebCm72UH/view',
    technicalReviewLink: 'https://drive.google.com/drive/folders/1y0ok0dKRThCagTQW9pkXEsMHfHe2uwN9?usp=sharing',
    copcStatus: 'Compliant',
    levelHistory: [
      {
        id: 'lh-pa-tan-g07-2022',
        year: 2022,
        level: 'Level 3',
        result: 'Passed',
        validityStart: '2023-11-01',
        validityEnd: '2028-10-31',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-tan-g08',
    campusId: 'tandag',
    campusName: 'Tandag Campus (Main)',
    programName: 'Master of Arts in English Language Teaching',
    degreeLevel: 'Graduate',
    yearOfInitialOperation: '',
    status: 'Level 3',
    validityStart: '2024-09-16',
    validityEnd: '2026-09-15',
    certificationFile: 'https://drive.google.com/open?id=1LQ1XJ3NWPfM6KCMPAk94SQEhNaBDrN8D&usp=drive_fs',
    instrumentLink: 'https://drive.google.com/file/d/1m8Nk_9dayXbO9FFcrWg9ktH9GN66ifrb/view?usp=drive_link',
    findingsLink: 'https://drive.google.com/file/d/1h7ycnGPNb_b5ENfEH-rytUpsIn1KrmRz/view',
    technicalReviewLink: 'https://drive.google.com/drive/folders/1BG-neJcRzo2hl7Ko8kfc8bybZ_CAi4SX?usp=sharing',
    copcStatus: 'Compliant',
    levelHistory: [
      {
        id: 'lh-pa-tan-g08-2022',
        year: 2022,
        level: 'Level 3',
        result: 'Passed',
        validityStart: '2024-09-16',
        validityEnd: '2026-09-15',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-tan-g09',
    campusId: 'tandag',
    campusName: 'Tandag Campus (Main)',
    programName: 'Master of Arts in Filipino Language Teaching',
    degreeLevel: 'Graduate',
    yearOfInitialOperation: '',
    status: 'Level 3',
    validityStart: '2023-11-01',
    validityEnd: '2028-10-31',
    certificationFile: 'https://drive.google.com/open?id=1Nh7uXh5pGO3KdJE_getfR9sAsNJLUZ96&usp=drive_fs',
    instrumentLink: 'https://drive.google.com/file/d/1m8Nk_9dayXbO9FFcrWg9ktH9GN66ifrb/view?usp=drive_link',
    findingsLink: 'https://drive.google.com/file/d/1B7C6IqD9XJKecflLAQbbtCkImpwnSZ5G/view',
    technicalReviewLink: 'https://drive.google.com/drive/folders/1ogeQDgoQtY4FLy5XulqhhcKkdAj1_jQN?usp=sharing',
    copcStatus: 'Compliant',
    levelHistory: [
      {
        id: 'lh-pa-tan-g09-2022',
        year: 2022,
        level: 'Level 3',
        result: 'Passed',
        validityStart: '2023-11-01',
        validityEnd: '2028-10-31',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-tan-g10',
    campusId: 'tandag',
    campusName: 'Tandag Campus (Main)',
    programName: 'Master of Arts in Home Economics Teaching',
    degreeLevel: 'Graduate',
    yearOfInitialOperation: '',
    status: 'Level 3',
    validityStart: '2024-09-16',
    validityEnd: '2025-09-15',
    certificationFile: 'https://drive.google.com/open?id=13Mo_nOdjJsia_FnAFWp10d_XwaTL2lYG&usp=drive_fs',
    instrumentLink: 'https://drive.google.com/file/d/1m8Nk_9dayXbO9FFcrWg9ktH9GN66ifrb/view?usp=drive_link',
    findingsLink: 'https://drive.google.com/file/d/1C2xua8BbgGbJct42SEwBJFMxOPPXWh00/view',
    technicalReviewLink: 'https://drive.google.com/drive/folders/1QVfUN4mFhmkT_U856XJMy_7RpILFt9q-?usp=sharing',
    copcStatus: 'Compliant',
    scheduleForAccreditation: '2025-09-15',
    remarks: 'Program marked dissolved. Schedule of Accreditation: Transfer to Cantilan Campus.',
    levelHistory: [
      {
        id: 'lh-pa-tan-g10-2022',
        year: 2022,
        level: 'Level 3',
        result: 'Passed',
        validityStart: '2024-09-16',
        validityEnd: '2025-09-15',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-tan-g11',
    campusId: 'tandag',
    campusName: 'Tandag Campus (Main)',
    programName: 'Master of Science in Teaching Mathematics',
    degreeLevel: 'Graduate',
    yearOfInitialOperation: '',
    status: 'Level 3',
    validityStart: '2023-11-01',
    validityEnd: '2028-10-31',
    certificationFile: 'https://drive.google.com/open?id=1jwb0sBTNO_hRcK3M4jYdR4U846G206Y_&usp=drive_fs',
    instrumentLink: 'https://drive.google.com/file/d/1m8Nk_9dayXbO9FFcrWg9ktH9GN66ifrb/view?usp=drive_link',
    findingsLink: 'https://drive.google.com/file/d/1HHCnzup253_E1z4NRBYQS8POYMnR8RpI/view',
    technicalReviewLink: 'https://drive.google.com/drive/folders/1V9zZuTAtI8KkPjcSVSK04STsSvo8JqDt?usp=sharing',
    copcStatus: 'Compliant',
    levelHistory: [
      {
        id: 'lh-pa-tan-g11-2022',
        year: 2022,
        level: 'Level 3',
        result: 'Passed',
        validityStart: '2023-11-01',
        validityEnd: '2028-10-31',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-tan-g12',
    campusId: 'tandag',
    campusName: 'Tandag Campus (Main)',
    programName: 'Master in Science in Teaching Science',
    degreeLevel: 'Graduate',
    yearOfInitialOperation: '',
    status: 'Level 3',
    validityStart: '2025-10-01',
    validityEnd: '2026-09-30',
    certificationFile: 'https://drive.google.com/open?id=1oqefXwkxO_hUVLg_RHXIYY_mT_CQeIDA&usp=drive_fs',
    instrumentLink: 'https://drive.google.com/file/d/1m8Nk_9dayXbO9FFcrWg9ktH9GN66ifrb/view?usp=drive_link',
    findingsLink: 'https://drive.google.com/file/d/1gjdsfAn8u-B-bZ8ZMdiPrQo8h9pqabg2/view',
    technicalReviewLink: 'https://drive.google.com/open?id=1UqyOHRLX1ou3pmutNQF3NPrapNg4_R-D&usp=drive_fs',
    copcStatus: 'Compliant',
    scheduleForAccreditation: '2025-09-15',
    remarks: 'Schedule of Accreditation: Must comply before the validity ends.',
    levelHistory: [
      {
        id: 'lh-pa-tan-g12-2022',
        year: 2022,
        level: 'Level 3',
        result: 'Passed',
        validityStart: '2025-10-01',
        validityEnd: '2026-09-30',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-tan-g13',
    campusId: 'tandag',
    campusName: 'Tandag Campus (Main)',
    programName: 'Master of Arts in Social Science Teaching',
    degreeLevel: 'Graduate',
    yearOfInitialOperation: '',
    status: 'Level 3',
    validityStart: '2024-09-16',
    validityEnd: '2026-09-15',
    certificationFile: 'https://drive.google.com/open?id=1XFIoWIx2qaQ6qAkvms1zAqE5qqKZZ4Ld&usp=drive_fs',
    instrumentLink: 'https://drive.google.com/file/d/1m8Nk_9dayXbO9FFcrWg9ktH9GN66ifrb/view?usp=drive_link',
    findingsLink: 'https://drive.google.com/file/d/1MmJBdY-vpT5l7xNWYuylQ3XYUO1hxd-h/view?usp=drive_link',
    technicalReviewLink: 'https://drive.google.com/open?id=1jnuwljiNPOKjuYz4wuPBEOPh6Ze6XiBQ&usp=drive_fs',
    copcStatus: 'Compliant',
    scheduleForAccreditation: '2025-09-15',
    levelHistory: [
      {
        id: 'lh-pa-tan-g13-2022',
        year: 2022,
        level: 'Level 3',
        result: 'Passed',
        validityStart: '2024-09-16',
        validityEnd: '2026-09-15',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-tan-g14',
    campusId: 'tandag',
    campusName: 'Tandag Campus (Main)',
    programName: 'Master of Public Administration',
    degreeLevel: 'Graduate',
    yearOfInitialOperation: '',
    status: 'Level 3',
    validityStart: '2023-11-01',
    validityEnd: '2028-10-31',
    certificationFile: 'https://drive.google.com/open?id=1aOwzkBCE6TdVWaTeZPLsXziZ1m8TxWlC&usp=drive_fs',
    instrumentLink: 'https://drive.google.com/file/d/1m8Nk_9dayXbO9FFcrWg9ktH9GN66ifrb/view?usp=drive_link',
    findingsLink: 'https://drive.google.com/file/d/1Cxsj5XaCMQz5i9ZAV5BoUxxYRuDfLjaD/view',
    technicalReviewLink: 'https://drive.google.com/drive/folders/1qCkbyS6R15ogxKwSrWncBiA1i6hjGKnv?usp=sharing',
    copcStatus: 'Compliant',
    levelHistory: [
      {
        id: 'lh-pa-tan-g14-2022',
        year: 2022,
        level: 'Level 3',
        result: 'Passed',
        validityStart: '2023-11-01',
        validityEnd: '2028-10-31',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-can-01',
    campusId: 'cantilan',
    campusName: 'Cantilan Campus',
    programName: 'Bachelor of Secondary Education Major in English',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2016',
    status: 'Level 1',
    validityStart: '2025-09-01',
    validityEnd: '2028-08-25',
    certificationFile: 'https://drive.google.com/open?id=18ixiUKKSWjdl_WKkI8NeGKtLoZzqxXEE&usp=drive_fs',
    technicalReviewLink: 'https://drive.google.com/open?id=1Z2ZHIo4TSAG-TPDDgac5eX8x6v2DoAG1&usp=drive_fs',
    copcStatus: 'Compliant',
    scheduleForAccreditation: '2025-08-31',
    levelHistory: [
      {
        id: 'lh-pa-can-01-2023',
        year: 2023,
        level: 'Candidate',
        result: 'Passed',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2023-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      },
      {
        id: 'lh-pa-can-01-2025',
        year: 2025,
        level: 'Level 1',
        result: 'Passed',
        validityStart: '2025-09-01',
        validityEnd: '2028-08-25',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2025-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-can-02',
    campusId: 'cantilan',
    campusName: 'Cantilan Campus',
    programName: 'Bachelor of Secondary Education Major in Filipino',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2016',
    status: 'Level 1',
    validityStart: '2025-09-01',
    validityEnd: '2028-08-25',
    certificationFile: 'https://drive.google.com/open?id=1V81EhdWiQRygMvvSQom6JMmjvs4_XZuV&usp=drive_fs',
    technicalReviewLink: 'https://drive.google.com/open?id=1CErwF_oYHz3I0soq5pGqjb-HH0rH1s_-&usp=drive_fs',
    copcStatus: 'Compliant',
    scheduleForAccreditation: '2025-08-31',
    levelHistory: [
      {
        id: 'lh-pa-can-02-2023',
        year: 2023,
        level: 'Candidate',
        result: 'Passed',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2023-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      },
      {
        id: 'lh-pa-can-02-2025',
        year: 2025,
        level: 'Level 1',
        result: 'Passed',
        validityStart: '2025-09-01',
        validityEnd: '2028-08-25',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2025-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-can-03',
    campusId: 'cantilan',
    campusName: 'Cantilan Campus',
    programName: 'Bachelor of Science in Computer Engineering',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2007-2008',
    status: 'Level 2',
    validityStart: '2025-10-01',
    validityEnd: '2027-09-30',
    certificationFile: 'https://drive.google.com/open?id=1lB3WteCQTwcsz3yA8m7FotLp3-2zY2Yy&usp=drive_fs',
    findingsLink: 'https://drive.google.com/file/d/19573cuImR6P_ZLDLFtt06ktNR_tk5wI7/view',
    technicalReviewLink: 'https://drive.google.com/open?id=1Ca75x8Yr_C6n3kfG5WRRDlseef3Cv0yQ&usp=drive_fs',
    copcStatus: 'Compliant',
    scheduleForAccreditation: '2025-09-30',
    levelHistory: [
      {
        id: 'lh-pa-can-03-2022',
        year: 2022,
        level: 'Level 2',
        result: 'Passed',
        validityStart: '2025-10-01',
        validityEnd: '2027-09-30',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-can-04',
    campusId: 'cantilan',
    campusName: 'Cantilan Campus',
    programName: 'Bachelor of Science in Business Administration Major in Humar Resource Management',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2007-2008',
    status: 'Level 3',
    validityStart: '2025-05-01',
    validityEnd: '2029-04-30',
    certificationFile: 'https://drive.google.com/open?id=1OnJhFZ_Ma0dOCKFtJbAZXRNTHYQdxR9p&usp=drive_fs',
    technicalReviewLink: 'https://drive.google.com/open?id=1Kl_QI2VTOXUvPAdVoZv7CNMQaA9yGHHK&usp=drive_fs',
    copcStatus: 'Compliant',
    levelHistory: [
      {
        id: 'lh-pa-can-04-2022',
        year: 2022,
        level: 'Level 3',
        result: 'Passed',
        validityStart: '2025-05-01',
        validityEnd: '2029-04-30',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-can-05',
    campusId: 'cantilan',
    campusName: 'Cantilan Campus',
    programName: 'Bachelor of Science in Business Administration Major in Financial Management',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2007-2008',
    status: 'Level 3',
    validityStart: '2025-05-01',
    validityEnd: '2029-04-30',
    certificationFile: 'https://drive.google.com/open?id=1r1s63q_dTEcGscTTI5KkCGg4B0ACpAlI&usp=drive_fs',
    findingsLink: 'https://drive.google.com/file/d/1LCdtA8SmaqRRvvwyu7ivEGe5_Q74C5b1/view',
    technicalReviewLink: 'https://drive.google.com/open?id=1fbwsU6bcONtBbSwWJXCaLgh5EOTr0ZCH&usp=drive_fs',
    copcStatus: 'Compliant',
    levelHistory: [
      {
        id: 'lh-pa-can-05-2022',
        year: 2022,
        level: 'Level 2',
        result: 'Passed',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      },
      {
        id: 'lh-pa-can-05-2025',
        year: 2025,
        level: 'Level 3',
        result: 'Passed',
        validityStart: '2025-05-01',
        validityEnd: '2029-04-30',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2025-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-can-06',
    campusId: 'cantilan',
    campusName: 'Cantilan Campus',
    programName: 'Bachelor of Science in Computer Science',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2001-2002',
    status: 'Level 3',
    validityStart: '2024-08-01',
    validityEnd: '2026-07-31',
    certificationFile: 'https://drive.google.com/open?id=1YCVaRSJamEu_BdkE9oPAzrldyKcYGnFK&usp=drive_fs',
    findingsLink: 'https://drive.google.com/drive/folders/1p76x_F5v4Bw05kEde12sVIxHQY8J-B3K?usp=drive_link',
    technicalReviewLink: 'https://drive.google.com/drive/folders/1oQfZr00wh98_9WMgjSEY4P3crdc7GPWg?usp=sharing',
    copcStatus: 'Compliant',
    levelHistory: [
      {
        id: 'lh-pa-can-06-2022',
        year: 2022,
        level: 'Level 3',
        result: 'Passed',
        validityStart: '2024-08-01',
        validityEnd: '2026-07-31',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-can-07',
    campusId: 'cantilan',
    campusName: 'Cantilan Campus',
    programName: 'Bachelor of Science in Industrial Technology Major in Auto.Tech.,Arch\'l Tech.,Civil Tech.,Comp.Tech.,Elect\'cs Tech.,Food Tech.,Mech\'l Tech.,Garments Tech.,Hotel & Rest.Serv.Tech.,WAF Tech.',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '1983',
    status: 'Level 3',
    validityStart: '2025-10-01',
    validityEnd: '2026-09-30',
    certificationFile: 'https://drive.google.com/open?id=10BGqU0vbGmxnMFpNQeIiyvwLcqXMx_I2&usp=drive_fs',
    findingsLink: 'https://drive.google.com/drive/folders/1p76x_F5v4Bw05kEde12sVIxHQY8J-B3K?usp=drive_link',
    technicalReviewLink: 'https://drive.google.com/drive/folders/1DSU1a1OKOJXlGwMelL4cA6CV4uC92LYH?usp=drive_link',
    copcStatus: 'Compliant',
    remarks: 'Schedule of Accreditation: Must comply before the validity ends.',
    levelHistory: [
      {
        id: 'lh-pa-can-07-2022',
        year: 2022,
        level: 'Level 3',
        result: 'Passed',
        validityStart: '2025-10-01',
        validityEnd: '2026-09-30',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-can-08',
    campusId: 'cantilan',
    campusName: 'Cantilan Campus',
    programName: 'Bachelor of Science in Information Technology',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2001-2002',
    status: 'Level 3',
    validityStart: '2024-08-01',
    validityEnd: '2026-07-31',
    certificationFile: 'https://drive.google.com/open?id=1L0nq0hyXsjAnw3NKFCoCOyB4X7nGV4e6&usp=drive_fs',
    findingsLink: 'https://drive.google.com/drive/folders/1LhynBLT8xLu6hy5TBpQ7xORuYu2yaDok?usp=drive_link',
    technicalReviewLink: 'https://drive.google.com/file/d/1aiVv094Fu2TdIMuTo5il_TJpmQtMevDe/view?usp=drive_link',
    copcStatus: 'Compliant',
    levelHistory: [
      {
        id: 'lh-pa-can-08-2022',
        year: 2022,
        level: 'Level 3',
        result: 'Passed',
        validityStart: '2024-08-01',
        validityEnd: '2026-07-31',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-can-09',
    campusId: 'cantilan',
    campusName: 'Cantilan Campus',
    programName: 'Bachelor of Secondary Education Major in Science',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2002-2003',
    status: 'Level 3',
    validityStart: '2025-10-01',
    validityEnd: '2026-09-30',
    certificationFile: 'https://drive.google.com/open?id=1DURmfzHqqvvG87PbnGQ9ugNZj_mu9xNt&usp=drive_fs',
    findingsLink: 'https://drive.google.com/file/d/1mhL4AaBwZGQIeFfq115PTYVWpO0NLhsa/view',
    technicalReviewLink: 'https://drive.google.com/open?id=1GDpTlsujzmuNMEkt-1n062xFcwgkgBPI&usp=drive_fs',
    copcStatus: 'Compliant',
    remarks: 'Schedule of Accreditation: Must comply before the validity ends.',
    levelHistory: [
      {
        id: 'lh-pa-can-09-2022',
        year: 2022,
        level: 'Level 3',
        result: 'Passed',
        validityStart: '2025-10-01',
        validityEnd: '2026-09-30',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-can-10',
    campusId: 'cantilan',
    campusName: 'Cantilan Campus',
    programName: 'Bachelor of Technology and Livelihood Education major in Industrial Arts & Home Economics',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2002-2003',
    status: 'Level 3',
    validityStart: '2024-09-16',
    validityEnd: '2026-09-15',
    certificationFile: 'https://drive.google.com/open?id=1s4mB0l5NXVDOCheQLOnLAEVdm6elXbSt&usp=drive_fs',
    instrumentLink: 'https://drive.google.com/file/d/19mjYV5AMOr3bcnaO8393aZQHozPHelbU/view?usp=sharing',
    findingsLink: 'https://drive.google.com/file/d/112DylF5449j8mrhlTUfNNwL6JbfFIxcq/view?usp=drive_link',
    technicalReviewLink: 'https://drive.google.com/open?id=1UzgT3WJxUoPAKwmqddytKC07je6XGW7_&usp=drive_fs',
    copcStatus: 'Compliant',
    levelHistory: [
      {
        id: 'lh-pa-can-10-2022',
        year: 2022,
        level: 'Level 3',
        result: 'Passed',
        validityStart: '2024-09-16',
        validityEnd: '2026-09-15',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-can-11',
    campusId: 'cantilan',
    campusName: 'Cantilan Campus',
    programName: 'Bachelor of Secondary Education Major in Mathematics',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2007',
    status: 'Level 3',
    validityStart: '2024-09-16',
    validityEnd: '2026-09-15',
    certificationFile: 'https://drive.google.com/open?id=17Rh59WrUk74zJA5zNCQEfywnxcAU4g06&usp=drive_fs',
    findingsLink: 'https://drive.google.com/file/d/1prTtqki4nVy9793q_76VCwkrj5FSy7vf/view',
    technicalReviewLink: 'https://drive.google.com/open?id=1bq8ZmkfW5WHFDnH_Tl3e_wx7aumzZlgQ&usp=drive_fs',
    copcStatus: 'Compliant',
    levelHistory: [
      {
        id: 'lh-pa-can-11-2022',
        year: 2022,
        level: 'Level 3',
        result: 'Passed',
        validityStart: '2024-09-16',
        validityEnd: '2026-09-15',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-can-12',
    campusId: 'cantilan',
    campusName: 'Cantilan Campus',
    programName: 'Bachelor of Technical Vocational Teacher Education Auto.Tech., Electrical Tech., Civil Tech., Comp.Tech., Elect\'cs Tech., Mech\'l Tech., Garments Fashion & design., Food & Serv.Tech.',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2005-2006',
    status: 'Level 3',
    validityStart: '2025-09-16',
    validityEnd: '2026-09-15',
    certificationFile: 'https://drive.google.com/open?id=1OxMF5ajx3YEmcKnAam0gAuD1pzv3feHA&usp=drive_fs',
    findingsLink: 'https://drive.google.com/file/d/1-hSY49dBMh99CcjT1IFP5PkwtRItTF_b/view',
    technicalReviewLink: 'https://drive.google.com/drive/folders/1RQ8BVe6tfZ8OykWI6I1Jij7Cao8U8qqX?usp=sharing',
    copcStatus: 'Compliant',
    levelHistory: [
      {
        id: 'lh-pa-can-12-2022',
        year: 2022,
        level: 'Level 3',
        result: 'Passed',
        validityStart: '2025-09-16',
        validityEnd: '2026-09-15',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-can-13',
    campusId: 'cantilan',
    campusName: 'Cantilan Campus',
    programName: 'Bachelor of Science in Hospitality Management',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2001-2002',
    status: 'Level 4',
    validityStart: '2025-05-01',
    validityEnd: '2030-04-30',
    certificationFile: 'https://drive.google.com/open?id=17X70sieIS9RcxwTPEPnfrLk4odvDpiJq&usp=drive_fs',
    findingsLink: 'https://drive.google.com/file/d/1UD3Uk8uww5tidiqa3Nb8MasigocP-F2c/view',
    technicalReviewLink: 'https://drive.google.com/open?id=1VgTnHDjlrIEZ4BX4cx3m_wA8o_AltHN7&usp=drive_fs',
    copcStatus: 'Compliant',
    levelHistory: [
      {
        id: 'lh-pa-can-13-2022',
        year: 2022,
        level: 'Level 3',
        result: 'Passed',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      },
      {
        id: 'lh-pa-can-13-2025',
        year: 2025,
        level: 'Level 4',
        result: 'Passed',
        validityStart: '2025-05-01',
        validityEnd: '2030-04-30',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2025-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-can-14',
    campusId: 'cantilan',
    campusName: 'Cantilan Campus',
    programName: 'Master in Technical Teacher Education',
    degreeLevel: 'Graduate',
    yearOfInitialOperation: '',
    status: 'Level 1',
    validityStart: '2022-09-01',
    validityEnd: '2026-08-01',
    certificationFile: 'https://drive.google.com/open?id=11B-603w0gxESQq13-dSh8jWr8Xm57Ajq&usp=drive_fs',
    technicalReviewLink: 'https://drive.google.com/open?id=1I9apeoOq8ZC2PzbtzsKNlSwfbG3zK20D&usp=drive_fs',
    copcStatus: 'Pending',
    remarks: 'COPC: Waiting for the issuance of COPC from CHED.',
    levelHistory: [
      {
        id: 'lh-pa-can-14-2022',
        year: 2022,
        level: 'Level 1',
        result: 'Passed',
        validityStart: '2022-09-01',
        validityEnd: '2026-08-01',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-can-15',
    campusId: 'cantilan',
    campusName: 'Cantilan Campus',
    programName: 'Bachelor of Science in Criminilogy',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2020-2021',
    status: 'Not Accreditable',
    validityStart: '',
    validityEnd: '',
    copcStatus: 'Compliant',
    levelHistory: []
  },
  {
    id: 'pa-can-16',
    campusId: 'cantilan',
    campusName: 'Cantilan Campus',
    programName: 'Bachelor of Science in Tourism Management',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2020-2021',
    status: 'Not Accreditable',
    validityStart: '',
    validityEnd: '',
    copcStatus: 'Compliant',
    levelHistory: []
  },
  {
    id: 'pa-cag-01',
    campusId: 'cagwait',
    campusName: 'Cagwait Campus',
    programName: 'Bachelor of Science in Hospitality Management',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '1998',
    status: 'Level 1',
    validityStart: '2022-08-16',
    validityEnd: '2026-08-15',
    certificationFile: 'https://drive.google.com/open?id=1OiGiNxermbsHVtujRBkI5z1tNYejp_6G&usp=drive_fs',
    findingsLink: 'https://drive.google.com/file/d/1AiW35Q61_5US-P4VB3A2geEvx5U4QTXa/view',
    technicalReviewLink: 'https://drive.google.com/drive/folders/1LsVUbuIWocpqapIdU7YT1uEc2CEWyOM-?usp=drive_link',
    copcStatus: 'Compliant',
    levelHistory: [
      {
        id: 'lh-pa-cag-01-2022',
        year: 2022,
        level: 'Level 1',
        result: 'Passed',
        validityStart: '2022-08-16',
        validityEnd: '2026-08-15',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-cag-02',
    campusId: 'cagwait',
    campusName: 'Cagwait Campus',
    programName: 'Bachelor of Industrial Technology Major in Auto.Tech.,Elect\'l Tech.,Culinary Tech.,Comp.Tech.',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '1998',
    status: 'Level 3',
    validityStart: '2024-08-01',
    validityEnd: '2028-07-15',
    certificationFile: 'https://drive.google.com/open?id=1uysIWX3eB0vE0Soh7ciox0IafbGUic6p&usp=drive_fs',
    findingsLink: 'https://drive.google.com/file/d/1syUy8KFBkicYLBu9f984roGM3wynDFsq/view?usp=drive_link',
    technicalReviewLink: 'https://drive.google.com/drive/folders/1xw8NbVD1kEFIstd59f24Jnau3otRKSeH?usp=drive_link',
    copcStatus: 'Compliant',
    levelHistory: [
      {
        id: 'lh-pa-cag-02-2022',
        year: 2022,
        level: 'Level 2',
        result: 'Passed',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      },
      {
        id: 'lh-pa-cag-02-2025',
        year: 2025,
        level: 'Level 3',
        result: 'Passed',
        validityStart: '2024-08-01',
        validityEnd: '2028-07-15',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2025-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-cag-03',
    campusId: 'cagwait',
    campusName: 'Cagwait Campus',
    programName: 'Bachelor of Science in Information Technology',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2019',
    status: 'Candidate',
    validityStart: '2024-09-01',
    validityEnd: '2026-08-31',
    certificationFile: 'https://drive.google.com/open?id=1JD7UiYJscjoUroqL4q2asBZw4mlTONcP&usp=drive_fs',
    technicalReviewLink: 'https://drive.google.com/drive/folders/1xFarEXEsuJ90jyyKDaM5AsZiXmsWSt2-?usp=drive_link',
    copcStatus: 'Compliant',
    levelHistory: [
      {
        id: 'lh-pa-cag-03-2024',
        year: 2024,
        level: 'Candidate',
        result: 'Passed',
        validityStart: '2024-09-01',
        validityEnd: '2026-08-31',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2024-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-sm-01',
    campusId: 'san-miguel',
    campusName: 'San Miguel Campus',
    programName: 'Bachelor of Technology in Livelihood Education',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '1998',
    status: 'Candidate',
    validityStart: '2025-09-01',
    validityEnd: '2028-08-31',
    certificationFile: 'https://drive.google.com/open?id=12M1Ztiv8RhxdJSFnpT7AcnwS0wb5DlJE&usp=drive_fs',
    technicalReviewLink: 'https://drive.google.com/open?id=1j425QPyzuEppbtPoDAwewpaZSeE5xsq7&usp=drive_fs',
    copcStatus: 'Compliant',
    scheduleForAccreditation: '2025-08-31',
    levelHistory: [
      {
        id: 'lh-pa-sm-01-2022',
        year: 2022,
        level: 'Candidate',
        result: 'Passed',
        validityStart: '2025-09-01',
        validityEnd: '2028-08-31',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-sm-02',
    campusId: 'san-miguel',
    campusName: 'San Miguel Campus',
    programName: 'Bachelor of Science in Agriculture major in Crop Science',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '1998',
    status: 'Level 2',
    validityStart: '2025-10-01',
    validityEnd: '2026-09-30',
    certificationFile: 'https://drive.google.com/open?id=1nDBPvWdvT-j9xJ5v2DN_cW-urvCV9Ar8&usp=drive_fs',
    findingsLink: 'https://drive.google.com/file/d/1k3hkhjC_oEUZNu4TfTpuJUuQa0ZcpROy/view',
    technicalReviewLink: 'https://drive.google.com/open?id=1RN65JSpKIVwWhIc-vG_f54W3OW4POh-V&usp=drive_fs',
    copcStatus: 'Compliant',
    scheduleForAccreditation: '2025-09-30',
    remarks: 'Schedule of Accreditation: Must comply before the validity ends.',
    levelHistory: [
      {
        id: 'lh-pa-sm-02-2022',
        year: 2022,
        level: 'Level 2',
        result: 'Passed',
        validityStart: '2025-10-01',
        validityEnd: '2026-09-30',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-sm-03',
    campusId: 'san-miguel',
    campusName: 'San Miguel Campus',
    programName: 'Bachelor of Science in Forestry',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '1998',
    status: 'Level 2',
    validityStart: '2025-10-01',
    validityEnd: '2027-09-30',
    certificationFile: 'https://drive.google.com/open?id=1x8at_l1k91BR82VxEuoV9m8qtAHm9PoN&usp=drive_fs',
    findingsLink: 'https://drive.google.com/file/d/1hJmfWms0gTtAwK5ILKQ5vATf5JDqEO6_/view',
    technicalReviewLink: 'https://drive.google.com/open?id=1y6mZGNx94V6EgLcR583Qkc0YwGnYT9EV&usp=drive_fs',
    copcStatus: 'Compliant',
    scheduleForAccreditation: '2025-09-30',
    levelHistory: [
      {
        id: 'lh-pa-sm-03-2022',
        year: 2022,
        level: 'Level 2',
        result: 'Passed',
        validityStart: '2025-10-01',
        validityEnd: '2027-09-30',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-lia-01',
    campusId: 'lianga',
    campusName: 'Lianga Campus',
    programName: 'Bachelor of Science in Computer Science',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2007',
    status: 'Level 2',
    validityStart: '2025-10-01',
    validityEnd: '2026-09-30',
    certificationFile: 'https://drive.google.com/open?id=1sEhhNfn71HdI_L1W1T10aOKCHkeiOr1G&usp=drive_fs',
    findingsLink: 'https://drive.google.com/open?id=1g9lF6p-3cswxQXKrH6J0M3803ee4L5oY&usp=drive_fs',
    technicalReviewLink: 'https://drive.google.com/open?id=1XEnMkS3AGZb20TFZNYW_sabIl_7eD2oU&usp=drive_fs',
    copcStatus: 'Compliant',
    scheduleForAccreditation: '2025-09-30',
    remarks: 'Schedule of Accreditation: Must comply before the validity ends.',
    levelHistory: [
      {
        id: 'lh-pa-lia-01-2022',
        year: 2022,
        level: 'Level 2',
        result: 'Passed',
        validityStart: '2025-10-01',
        validityEnd: '2026-09-30',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-lia-02',
    campusId: 'lianga',
    campusName: 'Lianga Campus',
    programName: 'Bachelor of Science in Business Administration Major Business Economics',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2007',
    status: 'Level 3',
    validityStart: '2025-09-01',
    validityEnd: '2029-08-31',
    certificationFile: 'https://drive.google.com/open?id=18Ld0Nki7oJLavGLWLexTY-KyFfceXYxw&usp=drive_fs',
    findingsLink: 'https://drive.google.com/file/d/1q1EEqPbSF78zM4TX4MOUyNrL1tIfjnG4/view?usp=drive_link',
    technicalReviewLink: 'https://drive.google.com/open?id=1TLu6-xCcpeMTCvF3-FJcSlEOf9j8xRhM&usp=drive_fs',
    copcStatus: 'Compliant',
    levelHistory: [
      {
        id: 'lh-pa-lia-02-2022',
        year: 2022,
        level: 'Level 2',
        result: 'Passed',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      },
      {
        id: 'lh-pa-lia-02-2025',
        year: 2025,
        level: 'Level 3',
        result: 'Passed',
        validityStart: '2025-09-01',
        validityEnd: '2029-08-31',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2025-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-lia-03',
    campusId: 'lianga',
    campusName: 'Lianga Campus',
    programName: 'Bachelor of Science in Business Administration Major Financial Management',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2007',
    status: 'Level 3',
    validityStart: '2025-09-01',
    validityEnd: '2029-08-31',
    certificationFile: 'https://drive.google.com/open?id=13RF41MPIeLh6A1EcFbMV5PybUZks4FTY&usp=drive_fs',
    findingsLink: 'https://drive.google.com/file/d/1vMV19UvMBo9k8pisIyh7VZiI1afc9N-h/view?usp=drive_link',
    technicalReviewLink: 'https://drive.google.com/open?id=1pXSvyid1EBwDgB3rVczzu0SaTau5zr91&usp=drive_fs',
    copcStatus: 'Compliant',
    levelHistory: [
      {
        id: 'lh-pa-lia-03-2022',
        year: 2022,
        level: 'Level 2',
        result: 'Passed',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      },
      {
        id: 'lh-pa-lia-03-2025',
        year: 2025,
        level: 'Level 3',
        result: 'Passed',
        validityStart: '2025-09-01',
        validityEnd: '2029-08-31',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2025-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-lia-04',
    campusId: 'lianga',
    campusName: 'Lianga Campus',
    programName: 'Bachelor of Science in Hospitality Management',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2007',
    status: 'Level 3',
    validityStart: '2026-02-01',
    validityEnd: '2030-01-31',
    certificationFile: 'https://drive.google.com/open?id=1Jnx04mXV6SryNpkvLnaY8A943myvHNA5&usp=drive_fs',
    findingsLink: 'https://drive.google.com/drive/folders/1kENsEuU3WQLeYSgS8gNe6fAJrSn5nuaf?usp=sharing',
    technicalReviewLink: 'https://drive.google.com/open?id=1kENsEuU3WQLeYSgS8gNe6fAJrSn5nuaf&usp=drive_fs',
    copcStatus: 'Compliant',
    levelHistory: [
      {
        id: 'lh-pa-lia-04-2022',
        year: 2022,
        level: 'Level 2',
        result: 'Passed',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      },
      {
        id: 'lh-pa-lia-04-2026',
        year: 2026,
        level: 'Level 3',
        result: 'Passed',
        validityStart: '2026-02-01',
        validityEnd: '2030-01-31',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2026-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-lia-05',
    campusId: 'lianga',
    campusName: 'Lianga Campus',
    programName: 'Bachelor of Elementary Education',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '1991',
    status: 'Level 4',
    validityStart: '2025-09-16',
    validityEnd: '2030-09-15',
    certificationFile: 'https://drive.google.com/open?id=1tkHyjDSdf-5VQilMOvDx9MvgjvnHLZjG&usp=drive_fs',
    findingsLink: 'https://drive.google.com/drive/folders/1gaNf2YGUeArd-3Bb0c-qJDUwbVPZ3gEM?usp=sharing',
    technicalReviewLink: 'https://drive.google.com/open?id=1gaNf2YGUeArd-3Bb0c-qJDUwbVPZ3gEM&usp=drive_fs',
    copcStatus: 'Compliant',
    scheduleForAccreditation: '2025-09-30',
    levelHistory: [
      {
        id: 'lh-pa-lia-05-2022',
        year: 2022,
        level: 'Level 3',
        result: 'Passed',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      },
      {
        id: 'lh-pa-lia-05-2026',
        year: 2026,
        level: 'Level 4',
        result: 'Passed',
        validityStart: '2025-09-16',
        validityEnd: '2030-09-15',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2026-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-lia-06',
    campusId: 'lianga',
    campusName: 'Lianga Campus',
    programName: 'Bachelor of Secondary Education Major in Science',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '1991',
    status: 'Level 3',
    validityStart: '2025-10-01',
    validityEnd: '2027-09-30',
    certificationFile: 'https://drive.google.com/open?id=1Jrsn4BuQzCZpCR4C4d-vkxejkZIAXmUi&usp=drive_fs',
    findingsLink: 'https://drive.google.com/drive/folders/1ppUjtVI3MWSgjEmyTKFtnmYTdVzppY2i?usp=sharing',
    technicalReviewLink: 'https://drive.google.com/open?id=1ppUjtVI3MWSgjEmyTKFtnmYTdVzppY2i&usp=drive_fs',
    copcStatus: 'Compliant',
    scheduleForAccreditation: '2025-09-30',
    levelHistory: [
      {
        id: 'lh-pa-lia-06-2022',
        year: 2022,
        level: 'Level 3',
        result: 'Passed',
        validityStart: '2025-10-01',
        validityEnd: '2027-09-30',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-lia-07',
    campusId: 'lianga',
    campusName: 'Lianga Campus',
    programName: 'Bachelor of Science in Fisheries',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '1975',
    status: 'Level 3',
    validityStart: '2025-10-01',
    validityEnd: '2027-09-30',
    certificationFile: 'https://drive.google.com/open?id=1KxON_RbYku3KBBDF0_eIqkCg8RCVb3xp&usp=drive_fs',
    findingsLink: 'https://drive.google.com/drive/folders/1VC4YJra6r5DGU2mfrTKWPMWaiovRuHB2?usp=sharing',
    technicalReviewLink: 'https://drive.google.com/open?id=1VC4YJra6r5DGU2mfrTKWPMWaiovRuHB2&usp=drive_fs',
    copcStatus: 'Compliant',
    scheduleForAccreditation: '2025-09-30',
    levelHistory: [
      {
        id: 'lh-pa-lia-07-2022',
        year: 2022,
        level: 'Level 3',
        result: 'Passed',
        validityStart: '2025-10-01',
        validityEnd: '2027-09-30',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-lia-08',
    campusId: 'lianga',
    campusName: 'Lianga Campus',
    programName: 'Bachelor of Science in Marine Biology',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2005',
    status: 'Level 4',
    validityStart: '2024-07-16',
    validityEnd: '2029-07-15',
    certificationFile: 'https://drive.google.com/open?id=1c6uk2Qq6PSLPVd69v2sEaIR3YnMqrx7R&usp=drive_fs',
    findingsLink: 'https://drive.google.com/drive/folders/17s6TLcJemdDqe1xfaL7ZprZbjrPHkpcz?usp=sharing',
    technicalReviewLink: 'https://drive.google.com/open?id=17s6TLcJemdDqe1xfaL7ZprZbjrPHkpcz&usp=drive_fs',
    copcStatus: 'Compliant',
    levelHistory: [
      {
        id: 'lh-pa-lia-08-2022',
        year: 2022,
        level: 'Level 3',
        result: 'Passed',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      },
      {
        id: 'lh-pa-lia-08-2024',
        year: 2024,
        level: 'Level 4',
        result: 'Passed',
        validityStart: '2024-07-16',
        validityEnd: '2029-07-15',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2024-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-lia-09',
    campusId: 'lianga',
    campusName: 'Lianga Campus',
    programName: 'Bachelor of Science in Environmental Science',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2019',
    status: 'Candidate',
    validityStart: '2024-09-01',
    validityEnd: '2026-08-31',
    certificationFile: 'https://drive.google.com/open?id=1_9xx_hXoQ1ev2Dp4KO4hruKEINgsxWMa&usp=drive_fs',
    findingsLink: 'https://drive.google.com/file/d/1V6Fe9r5Rt4KEtUFtTmkIRicNyouYxMpF/view?usp=sharing',
    technicalReviewLink: 'https://drive.google.com/open?id=1i2ajIWfWiITXRPjnB_2JBv59TL6bZO7p&usp=drive_fs',
    copcStatus: 'Compliant',
    levelHistory: [
      {
        id: 'lh-pa-lia-09-2024',
        year: 2024,
        level: 'Candidate',
        result: 'Passed',
        validityStart: '2024-09-01',
        validityEnd: '2026-08-31',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2024-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-tag-01',
    campusId: 'tagbina',
    campusName: 'Tagbina Campus',
    programName: 'Bachelor of Science in Hospitality Management',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2008',
    status: 'Level 1',
    validityStart: '2025-09-01',
    validityEnd: '2028-08-31',
    certificationFile: 'https://drive.google.com/open?id=13nrN4ze-9Z4uL1gEq8z7hzTaQB7v3E2O&usp=drive_fs',
    findingsLink: 'https://drive.google.com/file/d/13RGs8XiNApgBMYrOdP3ZAKtQ-hQVf9qN/view?usp=drive_link',
    technicalReviewLink: 'https://drive.google.com/open?id=1-yLwIpNiQr4zAPtAMX-6SLiqS0_31QW9&usp=drive_fs',
    copcStatus: 'Compliant',
    scheduleForAccreditation: '2025-08-15',
    levelHistory: [
      {
        id: 'lh-pa-tag-01-2022',
        year: 2022,
        level: 'Level 1',
        result: 'Passed',
        validityStart: '2025-09-01',
        validityEnd: '2028-08-31',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-tag-02',
    campusId: 'tagbina',
    campusName: 'Tagbina Campus',
    programName: 'Bachelor of Agricultural Technology',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '1998',
    status: 'Level 2',
    validityStart: '2023-10-01',
    validityEnd: '2025-09-30',
    certificationFile: 'https://drive.google.com/open?id=1Bx4MHOPWlPNYJFfVYIZtigNdI_ilNxFK&usp=drive_fs',
    findingsLink: 'https://drive.google.com/file/d/15GWo2SNqqmj5JpD0EalZq8FgdKIt3A2u/view?usp=drive_link',
    technicalReviewLink: 'https://drive.google.com/open?id=1xkL6-i0zjyJVievBynpmir8K1XwiB5DP&usp=drive_fs',
    copcStatus: 'Compliant',
    scheduleForAccreditation: '2025-09-30',
    levelHistory: [
      {
        id: 'lh-pa-tag-02-2022',
        year: 2022,
        level: 'Level 2',
        result: 'Passed',
        validityStart: '2023-10-01',
        validityEnd: '2025-09-30',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-tag-03',
    campusId: 'tagbina',
    campusName: 'Tagbina Campus',
    programName: 'Bachelor of Elementary Education',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2003',
    status: 'Level 3',
    validityStart: '2025-09-01',
    validityEnd: '2029-08-31',
    certificationFile: 'https://drive.google.com/open?id=1TE5-V_PS4KyBPnaFVxlUzzzqlmxb4Pw3&usp=drive_fs',
    technicalReviewLink: 'https://drive.google.com/open?id=10A2I4q9j5jxmJ5Hsye3jO4hD96y0hSXF&usp=drive_fs',
    copcStatus: 'Compliant',
    levelHistory: [
      {
        id: 'lh-pa-tag-03-2022',
        year: 2022,
        level: 'Level 2',
        result: 'Passed',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      },
      {
        id: 'lh-pa-tag-03-2025',
        year: 2025,
        level: 'Level 3',
        result: 'Passed',
        validityStart: '2025-09-01',
        validityEnd: '2029-08-31',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2025-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-tag-04',
    campusId: 'tagbina',
    campusName: 'Tagbina Campus',
    programName: 'Bachelor of Secondary Education Major in Science',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2019',
    status: 'Level 3',
    validityStart: '2025-09-01',
    validityEnd: '2029-08-31',
    certificationFile: 'https://drive.google.com/open?id=1fzfpsL0Fka05IAdkRshaowopwpS4e91K&usp=drive_fs',
    technicalReviewLink: 'https://drive.google.com/open?id=19RsBEH23BxgboxIQXy2G8h2zD-9JIph3&usp=drive_fs',
    copcStatus: 'Compliant',
    levelHistory: [
      {
        id: 'lh-pa-tag-04-2022',
        year: 2022,
        level: 'Level 2',
        result: 'Passed',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      },
      {
        id: 'lh-pa-tag-04-2025',
        year: 2025,
        level: 'Level 3',
        result: 'Passed',
        validityStart: '2025-09-01',
        validityEnd: '2029-08-31',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2025-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-tag-05',
    campusId: 'tagbina',
    campusName: 'Tagbina Campus',
    programName: 'Bachelor of Science in Business Administration Major in Financial Management',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2001',
    status: 'Level 3',
    validityStart: '2025-05-01',
    validityEnd: '2029-04-30',
    certificationFile: 'https://drive.google.com/open?id=1mBZXonyDG9StX9F97mU3pUr1yVbhO3wx&usp=drive_fs',
    technicalReviewLink: 'https://drive.google.com/open?id=14I_B-5ThbV61jH3aZqbZXmNmkodKDdSz&usp=drive_fs',
    copcStatus: 'Compliant',
    scheduleForAccreditation: '2025-04-30',
    levelHistory: [
      {
        id: 'lh-pa-tag-05-2022',
        year: 2022,
        level: 'Level 2',
        result: 'Passed',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      },
      {
        id: 'lh-pa-tag-05-2025',
        year: 2025,
        level: 'Level 3',
        result: 'Passed',
        validityStart: '2025-05-01',
        validityEnd: '2029-04-30',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2025-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-tag-06',
    campusId: 'tagbina',
    campusName: 'Tagbina Campus',
    programName: 'Bachelor of Science in Computer Science',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2001',
    status: 'Level 3',
    validityStart: '2025-05-01',
    validityEnd: '2029-04-30',
    certificationFile: 'https://drive.google.com/open?id=1XW0pAaFl61M__gJ5hnHldxg6HuCbJqAM&usp=drive_fs',
    technicalReviewLink: 'https://drive.google.com/open?id=1iaG122skBaeGaE22O02V12aC17xR_CXz&usp=drive_fs',
    copcStatus: 'Compliant',
    scheduleForAccreditation: '2025-04-30',
    levelHistory: [
      {
        id: 'lh-pa-tag-06-2022',
        year: 2022,
        level: 'Level 2',
        result: 'Passed',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      },
      {
        id: 'lh-pa-tag-06-2025',
        year: 2025,
        level: 'Level 3',
        result: 'Passed',
        validityStart: '2025-05-01',
        validityEnd: '2029-04-30',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2025-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-tag-07',
    campusId: 'tagbina',
    campusName: 'Tagbina Campus',
    programName: 'Bachelor of Science in Business Administration Major in Human Resource Management',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2019',
    status: 'Level 3',
    validityStart: '2022-04-01',
    validityEnd: '2026-03-31',
    certificationFile: 'https://drive.google.com/open?id=1V6OrOqqDImJzc0NIX1wI8-msPq7y9Yna&usp=drive_fs',
    findingsLink: 'https://drive.google.com/file/d/1ORaK1Iyk8Rqv5QkYmShvy5RGrmd-pNnY/view?usp=drive_link',
    technicalReviewLink: 'https://drive.google.com/open?id=1rUzYPdJOvRAugDfduSuvtlpQfraQMKmZ&usp=drive_fs',
    copcStatus: 'Compliant',
    levelHistory: [
      {
        id: 'lh-pa-tag-07-2022',
        year: 2022,
        level: 'Level 3',
        result: 'Passed',
        validityStart: '2022-04-01',
        validityEnd: '2026-03-31',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-bis-01',
    campusId: 'bislig',
    campusName: 'Bislig Campus',
    programName: 'Bachelor of Technical Vocational Teacher Education Major in Electrical Technology',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2018',
    status: 'Level 1',
    validityStart: '2024-09-01',
    validityEnd: '2027-08-31',
    certificationFile: 'https://drive.google.com/open?id=1tcB1HbYdrEABEydfgd7kPrZ6B5Hmbp_3&usp=drive_fs',
    technicalReviewLink: 'https://drive.google.com/open?id=1kHzXANXM1HCKLSIyYzOcUzaHsRzq3uu8&usp=drive_fs',
    copcStatus: 'Compliant',
    levelHistory: [
      {
        id: 'lh-pa-bis-01-2022',
        year: 2022,
        level: 'Candidate',
        result: 'Passed',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      },
      {
        id: 'lh-pa-bis-01-2024',
        year: 2024,
        level: 'Level 1',
        result: 'Passed',
        validityStart: '2024-09-01',
        validityEnd: '2027-08-31',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2024-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-bis-02',
    campusId: 'bislig',
    campusName: 'Bislig Campus',
    programName: 'Bachelor of Science in Civil Engineering',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '1997',
    status: 'Level 2',
    validityStart: '2025-10-01',
    validityEnd: '2027-09-30',
    certificationFile: 'https://drive.google.com/open?id=11X1KrFfFeEXiKlnjQ2hvqC8rMN5vOPo4&usp=drive_fs',
    instrumentLink: 'https://drive.google.com/file/d/1AjdnkO7-nYYxCTqEvzdKUULmt3bs8xR_/view?usp=sharing',
    findingsLink: 'https://drive.google.com/file/d/1fvEG3Au4zliOKVrYW0HRVyhO3Bb-4s1R/view',
    technicalReviewLink: 'https://drive.google.com/open?id=1f-hxXTbvkWfFj5uGFzXrW3so8RfN-Fuc&usp=drive_fs',
    copcStatus: 'Compliant',
    scheduleForAccreditation: '2025-10-15',
    levelHistory: [
      {
        id: 'lh-pa-bis-02-2022',
        year: 2022,
        level: 'Level 2',
        result: 'Passed',
        validityStart: '2025-10-01',
        validityEnd: '2027-09-30',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-bis-03',
    campusId: 'bislig',
    campusName: 'Bislig Campus',
    programName: 'Bachelor of Science in Electrical Engineering (BSEE)',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '1997',
    status: 'Level 2',
    validityStart: '2025-10-01',
    validityEnd: '2027-09-30',
    certificationFile: 'https://drive.google.com/open?id=1ENhfY2KFvC60pZgxTWMDA328arGxXs73&usp=drive_fs',
    instrumentLink: 'https://drive.google.com/file/d/1mJOmeASv99DKCkg4xOnoF8O1PEVlkf4e/view?usp=sharing',
    findingsLink: 'https://drive.google.com/file/d/1Ebg9q13lJTIKdGB4uvBUy11skABDaDLv/view',
    technicalReviewLink: 'https://drive.google.com/open?id=1JyAwKFjeUz-nNi9aNERqLeqis1SPWX4t&usp=drive_fs',
    copcStatus: 'Compliant',
    scheduleForAccreditation: '2025-10-15',
    levelHistory: [
      {
        id: 'lh-pa-bis-03-2022',
        year: 2022,
        level: 'Level 2',
        result: 'Passed',
        validityStart: '2025-10-01',
        validityEnd: '2027-09-30',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-bis-04',
    campusId: 'bislig',
    campusName: 'Bislig Campus',
    programName: 'Bachelor of Science in Mechanical Engineering (BSME)',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '1997',
    status: 'Level 2',
    validityStart: '2025-10-01',
    validityEnd: '2027-09-30',
    certificationFile: 'https://drive.google.com/open?id=1C87rsGpftwJOao52tfe-x-s8jYDm-zmh&usp=drive_fs',
    instrumentLink: 'https://drive.google.com/file/d/1x9rZwkLF5WIznROHxka0dDrRk1W9rkob/view?usp=sharing',
    findingsLink: 'https://drive.google.com/file/d/1Wqg00KbIWQ3R47ouJBKu7GepYDTVsX_F/view',
    technicalReviewLink: 'https://drive.google.com/open?id=1w0qDprt9o2zkTMqt8VZT9nmTfuODslVs&usp=drive_fs',
    copcStatus: 'Compliant',
    scheduleForAccreditation: '2025-10-15',
    levelHistory: [
      {
        id: 'lh-pa-bis-04-2022',
        year: 2022,
        level: 'Level 2',
        result: 'Passed',
        validityStart: '2025-10-01',
        validityEnd: '2027-09-30',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-bis-05',
    campusId: 'bislig',
    campusName: 'Bislig Campus',
    programName: 'Bachelor of Secondary Education Major in English',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2008',
    status: 'Level 3',
    validityStart: '2025-09-16',
    validityEnd: '2029-09-15',
    certificationFile: 'https://drive.google.com/open?id=1m_2yDPJKJHgB2nzAC2QzjggU2FLUCU45&usp=drive_fs',
    instrumentLink: 'https://drive.google.com/file/d/1-DAUSPxi38I69nBa9VUP0xXWsOFRK7Ak/view?usp=sharing',
    findingsLink: 'https://drive.google.com/file/d/1XKtjHX1uwsoHS3LzvvY2RGPi5i5ZT9jg/view',
    technicalReviewLink: 'https://drive.google.com/open?id=1iXp5QY0P-chqXFgvG80ckfFtqdvZGgne&usp=drive_fs',
    copcStatus: 'Compliant',
    scheduleForAccreditation: '2025-10-15',
    levelHistory: [
      {
        id: 'lh-pa-bis-05-2022',
        year: 2022,
        level: 'Level 2',
        result: 'Passed',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      },
      {
        id: 'lh-pa-bis-05-2025',
        year: 2025,
        level: 'Level 3',
        result: 'Passed',
        validityStart: '2025-09-16',
        validityEnd: '2029-09-15',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2025-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-bis-06',
    campusId: 'bislig',
    campusName: 'Bislig Campus',
    programName: 'Bachelor of Science in Forestry',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '1997',
    status: 'Level 2',
    validityStart: '2022-11-16',
    validityEnd: '2026-11-15',
    certificationFile: 'https://drive.google.com/open?id=1u0SvKge5Dm2llHfz72N4JsPwpmvk991P&usp=drive_fs',
    instrumentLink: 'https://drive.google.com/file/d/1AB8jp6MaPVZOGeHzxkRZ00Y9zl-up3aS/view?usp=sharing',
    findingsLink: 'https://drive.google.com/file/d/1yD8HElbvb3TYobMkx9TKdcmVKQWNGdQO/view',
    technicalReviewLink: 'https://drive.google.com/open?id=1z0XhU5HD9eAVovYdHGvgD9TusA41ZO1A&usp=drive_fs',
    copcStatus: 'Compliant',
    levelHistory: [
      {
        id: 'lh-pa-bis-06-2022',
        year: 2022,
        level: 'Level 2',
        result: 'Passed',
        validityStart: '2022-11-16',
        validityEnd: '2026-11-15',
        remarks: 'AACCUP Level Status record',
        recordedAt: '2022-12-31T00:00:00.000Z',
        recordedBy: 'Accreditation Office'
      }
    ]
  },
  {
    id: 'pa-bis-07',
    campusId: 'bislig',
    campusName: 'Bislig Campus',
    programName: 'Bachelor of Technical Vocational Teacher Education Major in Automotive',
    degreeLevel: 'Undergraduate',
    yearOfInitialOperation: '2020-2021',
    status: 'Not Accreditable',
    validityStart: '',
    validityEnd: '',
    instrumentLink: 'https://drive.google.com/file/d/1BtNltwItCl6_IfUmGTuwH25B50XxXJZO/view?usp=drive_link',
    copcStatus: 'Pending',
    remarks: 'Not yet due for accreditation. The program has been offered for less than five (5) years and has not yet reached the required batch of graduates. COPC: Waiting for the issuance of COPC from CHED.',
    levelHistory: []
  }
];
