import {
  Campus,
  CampusIAStatus,
  CampusPQAStatus,
  COPCRecord,
  ISOSurveillanceRecord,
  ProgramAccreditation,
  IARequirementItem,
  COPCRequirementItem,
  ProgramRequirementItem
} from '../types/accreditation';
import { programAccreditationRecords } from './programAccreditationRecords';
import { copcCertificateManifest } from './copcCertificateManifest';

export const campuses: Campus[] = [
  {
    id: 'tandag',
    name: 'Tandag Campus (Main)',
    shortName: 'Tandag',
    location: 'Rosario, Tandag City, Surigao del Sur',
    isMain: true,
    director: 'Dr. Maria L. Santos',
    email: 'campusdirector.tandag@nemsu.edu.ph',
    phone: '(086) 211-3050',
    establishedYear: 1982
  },
  {
    id: 'cantilan',
    name: 'Cantilan Campus',
    shortName: 'Cantilan',
    location: 'Pag-antayan, Cantilan, Surigao del Sur',
    isMain: false,
    director: 'Dr. Teresita A. Gonzaga',
    email: 'campusdirector.cantilan@nemsu.edu.ph',
    phone: '(086) 212-5120',
    establishedYear: 1983
  },
  {
    id: 'cagwait',
    name: 'Cagwait Campus',
    shortName: 'Cagwait',
    location: 'Poblacion, Cagwait, Surigao del Sur',
    isMain: false,
    director: 'Dr. Arnel B. Lupian',
    email: 'campusdirector.cagwait@nemsu.edu.ph',
    phone: '(086) 214-2015',
    establishedYear: 1998
  },
  {
    id: 'san-miguel',
    name: 'San Miguel Campus',
    shortName: 'San Miguel',
    location: 'Carromata, San Miguel, Surigao del Sur',
    isMain: false,
    director: 'Dr. Helen P. Mercado',
    email: 'campusdirector.sanmiguel@nemsu.edu.ph',
    phone: '(086) 215-8821',
    establishedYear: 1998
  },
  {
    id: 'lianga',
    name: 'Lianga Campus',
    shortName: 'Lianga',
    location: 'Purok 5, Lianga, Surigao del Sur',
    isMain: false,
    director: 'Dr. Gemma R. Plaza',
    email: 'campusdirector.lianga@nemsu.edu.ph',
    phone: '(086) 213-4011',
    establishedYear: 1975
  },
  {
    id: 'tagbina',
    name: 'Tagbina Campus',
    shortName: 'Tagbina',
    location: 'Poblacion, Tagbina, Surigao del Sur',
    isMain: false,
    director: 'Engr. Ramon D. Villanueva',
    email: 'campusdirector.tagbina@nemsu.edu.ph',
    phone: '(086) 216-1234',
    establishedYear: 1998
  },
  {
    id: 'bislig',
    name: 'Bislig Campus',
    shortName: 'Bislig',
    location: 'Maharlika Highway, Bislig, Surigao del Sur',
    isMain: false,
    director: 'Prof. Liza M. Cabrera',
    email: 'campusdirector.bislig@nemsu.edu.ph',
    phone: '(086) 853-2041',
    establishedYear: 1997
  }
];

export const standardIARequirements: Omit<IARequirementItem, 'id'>[] = [
  {
    areaCode: 'AREA-I',
    areaName: 'Governance and Management',
    title: 'Approved Campus Development Plan, Administrative Manual & Organizational Structure',
    description: 'Updated Board-approved campus organizational chart, administrative manuals, Transparency Seal compliance, and 5-year strategic plan.',
    isSubmitted: false,
    status: 'Pending'
  },
  {
    areaCode: 'AREA-II',
    areaName: 'Teaching, Learning, and Evaluation',
    title: 'Outcomes-Based Education (OBE) Implementation Matrix & Curricular Review',
    description: 'Syllabi compliance with CHED CMO policies, assessment rubrics, teaching portfolios, and retention/graduation metrics.',
    isSubmitted: false,
    status: 'Pending'
  },
  {
    areaCode: 'AREA-III',
    areaName: 'Faculty and Staff',
    title: 'Faculty Plantilla, Academic Qualifications & Staff Development Portfolio',
    description: 'Verification of Masteral/Doctoral degrees in specialization, PRC licenses, NBC 461/QCE performance ratings, and staff development programs.',
    isSubmitted: false,
    status: 'Pending'
  },
  {
    areaCode: 'AREA-IV',
    areaName: 'Research',
    title: 'Institutional Research Agenda, Peer-Reviewed Publications & IP Disclosures',
    description: 'Approved 2023–2028 research agenda, SCOPUS/WoS/CHED-recognized journal publications, intellectual property registrations, and funded R&D projects.',
    isSubmitted: false,
    status: 'Pending'
  },
  {
    areaCode: 'AREA-V',
    areaName: 'Extension, Consultancy, and Linkages',
    title: 'Institutional Extension Master Plan, MOUs & Community Impact Assessment',
    description: 'Active extension programs with adopted communities, industry MOUs, technology transfer/commercialization initiatives, and documented impact studies.',
    isSubmitted: false,
    status: 'Pending'
  },
  {
    areaCode: 'AREA-VI',
    areaName: 'Support to Students',
    title: 'Student Affairs and Services (SAS) Operations Manual & Welfare Records',
    description: 'Comprehensive student welfare, admission/registrar guidelines, medical/dental clinic services, scholarship assistance, and student council records.',
    isSubmitted: false,
    status: 'Pending'
  },
  {
    areaCode: 'AREA-VII',
    areaName: 'Library',
    title: 'Library Holdings Inventory, Electronic Databases & OPAC Portal System',
    description: 'Print and electronic collection holdings, ScienceDirect/Scopus database subscriptions, remote access portal, and licensed librarian plantilla.',
    isSubmitted: false,
    status: 'Pending'
  },
  {
    areaCode: 'AREA-VIII',
    areaName: 'Infrastructure and Other Learning Resources',
    title: 'Physical Plant Facilities, Laboratory Safety & IT Network Infrastructure',
    description: 'Building safety certifications, laboratory equipment calibration reports, high-speed campus bandwidth, PWD accessibility, and disaster risk resilience.',
    isSubmitted: false,
    status: 'Pending'
  },
  {
    areaCode: 'AREA-IX',
    areaName: 'Quality Assurance Culture',
    title: 'University Quality Assurance Manual, ISO 9001:2015 QMS & Internal Audit Reports',
    description: 'Institutional QA manual, ISO 9001:2015 surveillance audit conformances, Internal Quality Audit (IQA) resolutions, and risk-opportunity registers.',
    isSubmitted: false,
    status: 'Pending'
  }
];

function blankIARequirements(campusSlug: string): IARequirementItem[] {
  return standardIARequirements.map((r, i) => ({ ...r, id: `ia-req-${campusSlug}-${i + 1}` }));
}

export const initialCampusIA: CampusIAStatus[] = [
  {
    campusId: 'tandag',
    status: 'Level III Re-accredited',
    validityStart: '2023-01-01',
    validityEnd: '2027-12-31',
    certificationFile: 'AACCUP_Institutional_Accreditation_Tandag.pdf',
    certificateUrl: 'https://drive.google.com/file/d/1xsNkKL7GoKyB47CFHPqu0lkF-CmuwH9p/view',
    surveyBody: 'AACCUP Institutional Accreditation Survey Commission',
    lastEvaluationDate: '2023-01-15',
    nextScheduledEvaluation: '2027-10-15',
    remarks: 'Compliant with all 9 institutional accreditation areas; designated as University Center of Excellence in Teacher Education.',
    requirements: blankIARequirements('tandag')
  },
  {
    campusId: 'cantilan',
    status: 'Level II Re-accredited',
    validityStart: '2023-09-01',
    validityEnd: '2026-08-31',
    certificationFile: 'AACCUP_IA_Cantilan_Level2.pdf',
    certificateUrl: 'https://drive.google.com/file/d/1xsNkKL7GoKyB47CFHPqu0lkF-CmuwH9p/view',
    surveyBody: 'AACCUP Institutional Survey Board',
    lastEvaluationDate: '2023-08-20',
    nextScheduledEvaluation: '2026-05-15',
    remarks: 'Strong industrial technology and education facilities. Recommended for Level III survey in 2026.',
    requirements: blankIARequirements('cantilan')
  },
  {
    campusId: 'lianga',
    status: 'Level II Re-accredited',
    validityStart: '2022-10-01',
    validityEnd: '2025-09-30',
    certificationFile: 'AACCUP_IA_Lianga_Level2.pdf',
    certificateUrl: 'https://drive.google.com/file/d/1xsNkKL7GoKyB47CFHPqu0lkF-CmuwH9p/view',
    surveyBody: 'AACCUP Institutional Survey Board',
    lastEvaluationDate: '2022-09-18',
    nextScheduledEvaluation: '2025-09-30',
    remarks: 'Lead campus in Fisheries and Marine Biology; scheduled for Level III accreditation evaluation on Sep-30-2025.',
    requirements: blankIARequirements('lianga')
  },
  {
    campusId: 'bislig',
    status: 'Level II Re-accredited',
    validityStart: '2021-10-16',
    validityEnd: '2025-10-15',
    certificationFile: 'Certification-across campuses-2023.pdf',
    certificateUrl: 'https://drive.google.com/file/d/1xsNkKL7GoKyB47CFHPqu0lkF-CmuwH9p/view',
    surveyBody: 'AACCUP Institutional Survey Board',
    lastEvaluationDate: '2021-10-10',
    nextScheduledEvaluation: '2025-10-15',
    remarks: 'Engineering and forestry hub. Re-accreditation visit scheduled for Oct-15-2025.',
    requirements: blankIARequirements('bislig')
  },
  {
    campusId: 'tagbina',
    status: 'Level I Accredited',
    validityStart: '2022-08-16',
    validityEnd: '2025-08-15',
    certificationFile: 'AACCUP Certification 2022.pdf',
    certificateUrl: 'https://drive.google.com/file/d/1xsNkKL7GoKyB47CFHPqu0lkF-CmuwH9p/view',
    surveyBody: 'AACCUP Institutional Survey Board',
    lastEvaluationDate: '2022-08-10',
    nextScheduledEvaluation: '2025-08-15',
    remarks: 'Agriculture and hospitality hub. Scheduled for Level II evaluation visit on Aug-15-2025.',
    requirements: blankIARequirements('tagbina')
  },
  {
    campusId: 'san-miguel',
    status: 'Level I Accredited',
    validityStart: '2021-10-01',
    validityEnd: '2025-09-30',
    certificationFile: 'Certification-across campuses-2023.pdf',
    certificateUrl: 'https://drive.google.com/file/d/1xsNkKL7GoKyB47CFHPqu0lkF-CmuwH9p/view',
    surveyBody: 'AACCUP Institutional Survey Board',
    lastEvaluationDate: '2021-09-25',
    nextScheduledEvaluation: '2025-09-30',
    remarks: 'Agronomy and Forestry campus; scheduled for survey evaluation on Sep-30-2025.',
    requirements: blankIARequirements('san-miguel')
  },
  {
    campusId: 'cagwait',
    status: 'Level I Accredited',
    validityStart: '2022-08-16',
    validityEnd: '2026-08-15',
    certificationFile: 'AACCUP Certification 2022.pdf',
    certificateUrl: 'https://drive.google.com/file/d/1xsNkKL7GoKyB47CFHPqu0lkF-CmuwH9p/view',
    surveyBody: 'AACCUP Institutional Survey Board',
    lastEvaluationDate: '2022-08-01',
    nextScheduledEvaluation: '2026-06-01',
    remarks: 'Candidate status for institutional survey. Preparation ongoing for full Level 1 institutional visit.',
    requirements: blankIARequirements('cagwait')
  }
];

const rawCampusPQA: Omit<CampusPQAStatus, 'evaluatingBody'>[] = [
  {
    campusId: 'tandag',
    recognitionLevel: 'Level 3: Mastery in Quality Management',
    cycle: '2025 Cycle',
    overallScore: 685,
    evaluationStatus: 'Awarded',
    lastAssessmentDate: '2024-11-12',
    nextAssessmentCycle: '2026 PQA Application',
    feedbackSummary: 'Exemplary leadership governance and robust strategic measurement systems. Strong outcomes in graduate licensure performance.',
    categories: [
      { categoryId: 'pqa-1', categoryNumber: 1, categoryName: 'Leadership', maxScore: 120, awardedScore: 98, status: 'Met', evidenceSubmittedCount: 14, evidenceRequiredCount: 14, narrativeSummary: 'Visionary leadership and senior executive communication deployed across university units.' },
      { categoryId: 'pqa-2', categoryNumber: 2, categoryName: 'Strategy', maxScore: 85, awardedScore: 72, status: 'Met', evidenceSubmittedCount: 10, evidenceRequiredCount: 10, narrativeSummary: 'Strategic development aligned with CHED and regional socio-economic agendas.' },
      { categoryId: 'pqa-3', categoryNumber: 3, categoryName: 'Customers & Students', maxScore: 85, awardedScore: 70, status: 'Met', evidenceSubmittedCount: 12, evidenceRequiredCount: 12, narrativeSummary: 'Systematic stakeholder feedback mechanisms and student satisfaction ratings consistently above 92%.' },
      { categoryId: 'pqa-4', categoryNumber: 4, categoryName: 'Measurement & Knowledge Mgmt', maxScore: 90, awardedScore: 74, status: 'Met', evidenceSubmittedCount: 9, evidenceRequiredCount: 9, narrativeSummary: 'Centralized Accrevia institutional data repository and analytical dashboards.' },
      { categoryId: 'pqa-5', categoryNumber: 5, categoryName: 'Workforce', maxScore: 85, awardedScore: 68, status: 'Met', evidenceSubmittedCount: 11, evidenceRequiredCount: 11, narrativeSummary: 'Faculty scholarship programs and professional career progression framework.' },
      { categoryId: 'pqa-6', categoryNumber: 6, categoryName: 'Operations', maxScore: 85, awardedScore: 71, status: 'Met', evidenceSubmittedCount: 10, evidenceRequiredCount: 10, narrativeSummary: 'Streamlined academic delivery and automated student enrollment processes.' },
      { categoryId: 'pqa-7', categoryNumber: 7, categoryName: 'Results', maxScore: 450, awardedScore: 232, status: 'Partially Met', evidenceSubmittedCount: 22, evidenceRequiredCount: 25, narrativeSummary: 'Strong licensure results; continuing efforts on international research citations and technology commercialization.' }
    ]
  },
  {
    campusId: 'cantilan',
    recognitionLevel: 'Level 2: Proficiency in Quality Management',
    cycle: '2025 Cycle',
    overallScore: 540,
    evaluationStatus: 'Awarded',
    lastAssessmentDate: '2024-09-18',
    nextAssessmentCycle: '2026 PQA Application',
    feedbackSummary: 'Demonstrated proficiency in vocational and tech-teacher education with strong community linkage.',
    categories: [
      { categoryId: 'pqa-1', categoryNumber: 1, categoryName: 'Leadership', maxScore: 120, awardedScore: 82, status: 'Met', evidenceSubmittedCount: 12, evidenceRequiredCount: 14, narrativeSummary: 'Active campus executive council and faculty consultation meetings.' },
      { categoryId: 'pqa-2', categoryNumber: 2, categoryName: 'Strategy', maxScore: 85, awardedScore: 58, status: 'Met', evidenceSubmittedCount: 8, evidenceRequiredCount: 10, narrativeSummary: 'Campus operational plan aligned with university strategic directions.' },
      { categoryId: 'pqa-3', categoryNumber: 3, categoryName: 'Customers & Students', maxScore: 85, awardedScore: 60, status: 'Met', evidenceSubmittedCount: 10, evidenceRequiredCount: 12, narrativeSummary: 'Strong industry partner relations and high employer satisfaction with tech graduates.' },
      { categoryId: 'pqa-4', categoryNumber: 4, categoryName: 'Measurement & Knowledge Mgmt', maxScore: 90, awardedScore: 55, status: 'Partially Met', evidenceSubmittedCount: 7, evidenceRequiredCount: 9, narrativeSummary: 'Ongoing migration to digital student and inventory tracking.' },
      { categoryId: 'pqa-5', categoryNumber: 5, categoryName: 'Workforce', maxScore: 85, awardedScore: 58, status: 'Met', evidenceSubmittedCount: 9, evidenceRequiredCount: 11, narrativeSummary: 'Technical skills enhancement seminars and national TESDA NC-III certifications for faculty.' },
      { categoryId: 'pqa-6', categoryNumber: 6, categoryName: 'Operations', maxScore: 85, awardedScore: 60, status: 'Met', evidenceSubmittedCount: 8, evidenceRequiredCount: 10, narrativeSummary: 'Well-maintained technical workshops and laboratory safety protocols.' },
      { categoryId: 'pqa-7', categoryNumber: 7, categoryName: 'Results', maxScore: 450, awardedScore: 167, status: 'Partially Met', evidenceSubmittedCount: 16, evidenceRequiredCount: 25, narrativeSummary: 'High technician job placement rates; research outputs currently scaling up.' }
    ]
  },
  {
    campusId: 'lianga',
    recognitionLevel: 'Level 2: Proficiency in Quality Management',
    cycle: '2025 Cycle',
    overallScore: 525,
    evaluationStatus: 'Awarded',
    lastAssessmentDate: '2024-08-14',
    nextAssessmentCycle: '2026 PQA Application',
    feedbackSummary: 'Recognized for marine and fisheries quality management and sustainable coastal resource stewardship.',
    categories: [
      { categoryId: 'pqa-1', categoryNumber: 1, categoryName: 'Leadership', maxScore: 120, awardedScore: 78, status: 'Met', evidenceSubmittedCount: 11, evidenceRequiredCount: 14, narrativeSummary: 'Leadership focused on environmental governance and maritime academic compliance.' },
      { categoryId: 'pqa-2', categoryNumber: 2, categoryName: 'Strategy', maxScore: 85, awardedScore: 56, status: 'Met', evidenceSubmittedCount: 8, evidenceRequiredCount: 10, narrativeSummary: 'Marine conservation research integrated into campus 5-year plan.' },
      { categoryId: 'pqa-3', categoryNumber: 3, categoryName: 'Customers & Students', maxScore: 85, awardedScore: 58, status: 'Met', evidenceSubmittedCount: 9, evidenceRequiredCount: 12, narrativeSummary: 'Fisheries sector partnerships and coastal community extension beneficiaries.' },
      { categoryId: 'pqa-4', categoryNumber: 4, categoryName: 'Measurement & Knowledge Mgmt', maxScore: 90, awardedScore: 54, status: 'Partially Met', evidenceSubmittedCount: 6, evidenceRequiredCount: 9, narrativeSummary: 'Biodiversity database and research knowledge depository in place.' },
      { categoryId: 'pqa-5', categoryNumber: 5, categoryName: 'Workforce', maxScore: 85, awardedScore: 55, status: 'Met', evidenceSubmittedCount: 8, evidenceRequiredCount: 11, narrativeSummary: 'Specialist faculty in aquaculture, marine biology, and ecological science.' },
      { categoryId: 'pqa-6', categoryNumber: 6, categoryName: 'Operations', maxScore: 85, awardedScore: 57, status: 'Met', evidenceSubmittedCount: 8, evidenceRequiredCount: 10, narrativeSummary: 'Fish hatchery operations and coastal field laboratories.' },
      { categoryId: 'pqa-7', categoryNumber: 7, categoryName: 'Results', maxScore: 450, awardedScore: 167, status: 'Partially Met', evidenceSubmittedCount: 15, evidenceRequiredCount: 25, narrativeSummary: 'Licensure examination passing rates in Fisheries above national average.' }
    ]
  },
  {
    campusId: 'bislig',
    recognitionLevel: 'Level 2: Proficiency in Quality Management',
    cycle: '2025 Cycle',
    overallScore: 510,
    evaluationStatus: 'Awarded',
    lastAssessmentDate: '2024-07-22',
    nextAssessmentCycle: '2026 PQA Application',
    feedbackSummary: 'Strong engineering laboratory processes and faculty engineering research activities.',
    categories: [
      { categoryId: 'pqa-1', categoryNumber: 1, categoryName: 'Leadership', maxScore: 120, awardedScore: 76, status: 'Met', evidenceSubmittedCount: 10, evidenceRequiredCount: 14, narrativeSummary: 'Engineering quality policy and regular management review meetings.' },
      { categoryId: 'pqa-2', categoryNumber: 2, categoryName: 'Strategy', maxScore: 85, awardedScore: 54, status: 'Met', evidenceSubmittedCount: 7, evidenceRequiredCount: 10, narrativeSummary: 'Engineering accreditation roadmap strictly implemented.' },
      { categoryId: 'pqa-3', categoryNumber: 3, categoryName: 'Customers & Students', maxScore: 85, awardedScore: 56, status: 'Met', evidenceSubmittedCount: 8, evidenceRequiredCount: 12, narrativeSummary: 'Industrial training linkages with paper and energy industrial plants.' },
      { categoryId: 'pqa-4', categoryNumber: 4, categoryName: 'Measurement & Knowledge Mgmt', maxScore: 90, awardedScore: 52, status: 'Partially Met', evidenceSubmittedCount: 6, evidenceRequiredCount: 9, narrativeSummary: 'Equipment maintenance and lab inventory monitoring systems.' },
      { categoryId: 'pqa-5', categoryNumber: 5, categoryName: 'Workforce', maxScore: 85, awardedScore: 54, status: 'Met', evidenceSubmittedCount: 8, evidenceRequiredCount: 11, narrativeSummary: 'Registered master engineers and ASEAN engineers on faculty.' },
      { categoryId: 'pqa-6', categoryNumber: 6, categoryName: 'Operations', maxScore: 85, awardedScore: 55, status: 'Met', evidenceSubmittedCount: 7, evidenceRequiredCount: 10, narrativeSummary: 'Occupational safety and health management in machine shops.' },
      { categoryId: 'pqa-7', categoryNumber: 7, categoryName: 'Results', maxScore: 450, awardedScore: 163, status: 'Partially Met', evidenceSubmittedCount: 14, evidenceRequiredCount: 25, narrativeSummary: 'Consistent passing rates in Civil, Electrical, and Mechanical board exams.' }
    ]
  },
  {
    campusId: 'tagbina',
    recognitionLevel: 'Level 1: Commitment to Quality Management',
    cycle: '2025 Cycle',
    overallScore: 420,
    evaluationStatus: 'Awarded',
    lastAssessmentDate: '2024-05-18',
    nextAssessmentCycle: '2026 PQA Application',
    feedbackSummary: 'Committed to systematic agricultural and education quality benchmarks with growing community adoption.',
    categories: [
      { categoryId: 'pqa-1', categoryNumber: 1, categoryName: 'Leadership', maxScore: 120, awardedScore: 65, status: 'Met', evidenceSubmittedCount: 8, evidenceRequiredCount: 14, narrativeSummary: 'Management commitment to rural agricultural excellence and quality goals.' },
      { categoryId: 'pqa-2', categoryNumber: 2, categoryName: 'Strategy', maxScore: 85, awardedScore: 45, status: 'Partially Met', evidenceSubmittedCount: 6, evidenceRequiredCount: 10, narrativeSummary: 'Agro-forestry community development framework.' },
      { categoryId: 'pqa-3', categoryNumber: 3, categoryName: 'Customers & Students', maxScore: 85, awardedScore: 48, status: 'Partially Met', evidenceSubmittedCount: 7, evidenceRequiredCount: 12, narrativeSummary: 'Feedback from local farmer associations and internship employers.' },
      { categoryId: 'pqa-4', categoryNumber: 4, categoryName: 'Measurement & Knowledge Mgmt', maxScore: 90, awardedScore: 42, status: 'Partially Met', evidenceSubmittedCount: 5, evidenceRequiredCount: 9, narrativeSummary: 'Agricultural production records and crop yield analytics.' },
      { categoryId: 'pqa-5', categoryNumber: 5, categoryName: 'Workforce', maxScore: 85, awardedScore: 45, status: 'Partially Met', evidenceSubmittedCount: 6, evidenceRequiredCount: 11, narrativeSummary: 'Faculty training in organic farming and smart agriculture.' },
      { categoryId: 'pqa-6', categoryNumber: 6, categoryName: 'Operations', maxScore: 85, awardedScore: 46, status: 'Partially Met', evidenceSubmittedCount: 6, evidenceRequiredCount: 10, narrativeSummary: 'Demonstration farm operations and laboratory seedling centers.' },
      { categoryId: 'pqa-7', categoryNumber: 7, categoryName: 'Results', maxScore: 450, awardedScore: 129, status: 'Partially Met', evidenceSubmittedCount: 11, evidenceRequiredCount: 25, narrativeSummary: 'Board examination performance in Agriculture and Teacher Education showing steady progress.' }
    ]
  },
  {
    campusId: 'san-miguel',
    recognitionLevel: 'Level 1: Commitment to Quality Management',
    cycle: '2025 Cycle',
    overallScore: 395,
    evaluationStatus: 'Awarded',
    lastAssessmentDate: '2024-04-10',
    nextAssessmentCycle: '2026 PQA Application',
    feedbackSummary: 'Formulated solid foundations for quality management in agricultural technology and teacher training.',
    categories: [
      { categoryId: 'pqa-1', categoryNumber: 1, categoryName: 'Leadership', maxScore: 120, awardedScore: 60, status: 'Met', evidenceSubmittedCount: 7, evidenceRequiredCount: 14, narrativeSummary: 'Campus leadership engaging municipal partners and agrarian beneficiaries.' },
      { categoryId: 'pqa-2', categoryNumber: 2, categoryName: 'Strategy', maxScore: 85, awardedScore: 42, status: 'Partially Met', evidenceSubmittedCount: 5, evidenceRequiredCount: 10, narrativeSummary: 'Strategic emphasis on indigenous knowledge systems and crop sciences.' },
      { categoryId: 'pqa-3', categoryNumber: 3, categoryName: 'Customers & Students', maxScore: 85, awardedScore: 44, status: 'Partially Met', evidenceSubmittedCount: 6, evidenceRequiredCount: 12, narrativeSummary: 'Student welfare programs supporting rural scholarship recipients.' },
      { categoryId: 'pqa-4', categoryNumber: 4, categoryName: 'Measurement & Knowledge Mgmt', maxScore: 90, awardedScore: 40, status: 'Partially Met', evidenceSubmittedCount: 4, evidenceRequiredCount: 9, narrativeSummary: 'Basic electronic repository of campus records.' },
      { categoryId: 'pqa-5', categoryNumber: 5, categoryName: 'Workforce', maxScore: 85, awardedScore: 42, status: 'Partially Met', evidenceSubmittedCount: 5, evidenceRequiredCount: 11, narrativeSummary: 'Faculty enrollment in postgraduate agricultural studies.' },
      { categoryId: 'pqa-6', categoryNumber: 6, categoryName: 'Operations', maxScore: 85, awardedScore: 44, status: 'Partially Met', evidenceSubmittedCount: 5, evidenceRequiredCount: 10, narrativeSummary: 'Research crop plots and agricultural machinery upkeep.' },
      { categoryId: 'pqa-7', categoryNumber: 7, categoryName: 'Results', maxScore: 450, awardedScore: 123, status: 'Partially Met', evidenceSubmittedCount: 9, evidenceRequiredCount: 25, narrativeSummary: 'Baseline student completion and board pass rates documented.' }
    ]
  },
  {
    campusId: 'cagwait',
    recognitionLevel: 'Candidate',
    cycle: '2025 Cycle',
    overallScore: 310,
    evaluationStatus: 'Preparing Application',
    lastAssessmentDate: '2024-02-15',
    nextAssessmentCycle: '2026 PQA Application',
    feedbackSummary: 'Self-assessment ongoing; establishing standardized quality procedures across vocational and IT programs.',
    categories: [
      { categoryId: 'pqa-1', categoryNumber: 1, categoryName: 'Leadership', maxScore: 120, awardedScore: 50, status: 'Partially Met', evidenceSubmittedCount: 5, evidenceRequiredCount: 14, narrativeSummary: 'Campus administrative meetings aligning with university quality objectives.' },
      { categoryId: 'pqa-2', categoryNumber: 2, categoryName: 'Strategy', maxScore: 85, awardedScore: 35, status: 'Partially Met', evidenceSubmittedCount: 4, evidenceRequiredCount: 10, narrativeSummary: 'Drafting campus quality roadmap for 2025–2030.' },
      { categoryId: 'pqa-3', categoryNumber: 3, categoryName: 'Customers & Students', maxScore: 85, awardedScore: 36, status: 'Partially Met', evidenceSubmittedCount: 5, evidenceRequiredCount: 12, narrativeSummary: 'Student council consultations and parent-teacher assemblies.' },
      { categoryId: 'pqa-4', categoryNumber: 4, categoryName: 'Measurement & Knowledge Mgmt', maxScore: 90, awardedScore: 30, status: 'Deficient', evidenceSubmittedCount: 3, evidenceRequiredCount: 9, narrativeSummary: 'Requires comprehensive data analytics framework.' },
      { categoryId: 'pqa-5', categoryNumber: 5, categoryName: 'Workforce', maxScore: 85, awardedScore: 34, status: 'Partially Met', evidenceSubmittedCount: 4, evidenceRequiredCount: 11, narrativeSummary: 'Staff development sessions organized.' },
      { categoryId: 'pqa-6', categoryNumber: 6, categoryName: 'Operations', maxScore: 85, awardedScore: 35, status: 'Partially Met', evidenceSubmittedCount: 4, evidenceRequiredCount: 10, narrativeSummary: 'Hospitality laboratory and culinary kitchen operational.' },
      { categoryId: 'pqa-7', categoryNumber: 7, categoryName: 'Results', maxScore: 450, awardedScore: 90, status: 'Deficient', evidenceSubmittedCount: 6, evidenceRequiredCount: 25, narrativeSummary: 'Collecting long-term trend data for graduate employability.' }
    ]
  }
];

export const initialCampusPQA: CampusPQAStatus[] = rawCampusPQA.map((p) => ({
  ...p,
  evaluatingBody: 'DAP (Development Academy of the Philippines)'
}));

export const standardProgramSurveyAreas = [
  'Area I: Vision, Mission, Goals and Objectives',
  'Area II: Faculty',
  'Area III: Curriculum and Instruction',
  'Area IV: Support to Students',
  'Area V: Research',
  'Area VI: Extension and Community Involvement',
  'Area VII: Library',
  'Area VIII: Physical Plant and Facilities',
  'Area IX: Laboratories',
  'Area X: Administration'
];

function makeProgramRequirements(programId: string): ProgramRequirementItem[] {
  return standardProgramSurveyAreas.map((area, idx) => ({
    id: `req-${programId}-${idx + 1}`,
    areaCode: `AREA-${idx + 1}`,
    areaName: area,
    title: `Compliance Portfolio for ${area}`,
    isSubmitted: false,
    verified: false
  }));
}

export const initialProgramAccreditations: ProgramAccreditation[] = programAccreditationRecords.map((p) => ({
  ...p,
  requirements: makeProgramRequirements(p.id)
}));

export const standardCOPCRequirements: Omit<COPCRequirementItem, 'id'>[] = [
  {
    category: 'Curriculum',
    code: 'COPC-CURR',
    requirementName: 'CHED Policies, Standards and Guidelines (PSG) Curriculum Alignment',
    isSubmitted: false,
    status: 'Pending'
  },
  {
    category: 'Faculty',
    code: 'COPC-FAC',
    requirementName: 'Faculty Qualifications Profile (100% relevant Master’s / Ph.D.)',
    isSubmitted: false,
    status: 'Pending'
  },
  {
    category: 'Laboratories',
    code: 'COPC-LAB',
    requirementName: 'Specialized Laboratories and Calibrated Equipment Inventory',
    isSubmitted: false,
    status: 'Pending'
  },
  {
    category: 'Library',
    code: 'COPC-LIB',
    requirementName: 'Library Holdings, Subscriptions, and E-Resources Certification',
    isSubmitted: false,
    status: 'Pending'
  },
  {
    category: 'Practicum',
    code: 'COPC-OJT',
    requirementName: 'On-the-Job Training (OJT) / Internship MOAs with Partner Industries',
    isSubmitted: false,
    status: 'Pending'
  }
];

interface ProgramCOPCDetails {
  code: string;
  cmo: string;
  certNo: string;
  dateIssued: string;
  borRes: string;
}

function getProgramCOPCDetails(programName: string, degreeLevel: string, idx: number): ProgramCOPCDetails {
  const lower = programName.toLowerCase();
  let code = 'PROG';
  let cmo = 'CMO No. 46, Series of 2012';

  if (lower.includes('computer science')) {
    code = 'BSCS';
    cmo = 'CMO No. 25, Series of 2015';
  } else if (lower.includes('information technology')) {
    code = 'BSIT';
    cmo = 'CMO No. 25, Series of 2015';
  } else if (lower.includes('information system')) {
    code = 'BSIS';
    cmo = 'CMO No. 25, Series of 2015';
  } else if (lower.includes('civil engineering')) {
    code = 'BSCE';
    cmo = 'CMO No. 92, Series of 2017';
  } else if (lower.includes('mechanical engineering')) {
    code = 'BSME';
    cmo = 'CMO No. 97, Series of 2017';
  } else if (lower.includes('electrical engineering')) {
    code = 'BSEE';
    cmo = 'CMO No. 88, Series of 2017';
  } else if (lower.includes('elementary education')) {
    code = 'BEED';
    cmo = 'CMO No. 74, Series of 2017';
  } else if (lower.includes('secondary education')) {
    code = 'BSED';
    cmo = 'CMO No. 75, Series of 2017';
  } else if (lower.includes('physical education')) {
    code = 'BPED';
    cmo = 'CMO No. 80, Series of 2017';
  } else if (lower.includes('early childhood')) {
    code = 'BECEd';
    cmo = 'CMO No. 76, Series of 2017';
  } else if (lower.includes('special needs')) {
    code = 'BSNEd';
    cmo = 'CMO No. 77, Series of 2017';
  } else if (lower.includes('accountancy')) {
    code = 'BSA';
    cmo = 'CMO No. 27, Series of 2017';
  } else if (lower.includes('business administration')) {
    code = 'BSBA';
    cmo = 'CMO No. 17, Series of 2017';
  } else if (lower.includes('hospitality') || lower.includes('hotel')) {
    code = 'BSHM';
    cmo = 'CMO No. 62, Series of 2017';
  } else if (lower.includes('tourism')) {
    code = 'BSTM';
    cmo = 'CMO No. 62, Series of 2017';
  } else if (lower.includes('agriculture')) {
    code = 'BSAgr';
    cmo = 'CMO No. 14, Series of 2019';
  } else if (lower.includes('fisheries') || lower.includes('marine biology')) {
    code = 'BSFi';
    cmo = 'CMO No. 43, Series of 2019';
  } else if (lower.includes('forestry')) {
    code = 'BSFor';
    cmo = 'CMO No. 44, Series of 2019';
  } else if (lower.includes('environmental')) {
    code = 'BSES';
    cmo = 'CMO No. 35, Series of 2017';
  } else if (lower.includes('biology')) {
    code = 'BSBio';
    cmo = 'CMO No. 49, Series of 2017';
  } else if (lower.includes('criminology')) {
    code = 'BSCrim';
    cmo = 'CMO No. 05, Series of 2018';
  } else if (lower.includes('nursing')) {
    code = 'BSN';
    cmo = 'CMO No. 15, Series of 2017';
  } else if (lower.includes('psychology') || lower.includes('pyschology')) {
    code = 'BSPsych';
    cmo = 'CMO No. 34, Series of 2017';
  } else if (lower.includes('technical') || lower.includes('btvted') || lower.includes('industrial')) {
    code = 'BTVTEd';
    cmo = 'CMO No. 79, Series of 2017';
  } else if (lower.includes('filipino')) {
    code = 'BA-Fil';
    cmo = 'CMO No. 04, Series of 2018';
  } else if (lower.includes('english')) {
    code = 'BA-ELS';
    cmo = 'CMO No. 24, Series of 2017';
  } else if (lower.includes('mathematics')) {
    code = 'BSMath';
    cmo = 'CMO No. 19, Series of 2007';
  } else if (degreeLevel === 'Graduate' || lower.includes('master') || lower.includes('doctor')) {
    code = 'GRAD';
    cmo = 'CMO No. 15, Series of 2019';
  }

  const yearSeq = 2021 + (idx % 3);
  const certSeq = String(101 + idx).padStart(4, '0');
  const certNo = `CHED-RO13-COPC-No. ${yearSeq}-${certSeq}`;
  const month = String(1 + (idx % 12)).padStart(2, '0');
  const day = String(10 + (idx % 18)).padStart(2, '0');
  const dateIssued = `${yearSeq}-${month}-${day}`;
  const borRes = `BOR Res. No. ${12 + (idx % 58)}, Series of ${yearSeq}`;

  return { code, cmo, certNo, dateIssued, borRes };
}

const PENDING_COPC_CONFIG: Record<string, { pendingCodes: string[]; notes: Record<string, string> }> = {
  'pa-tan-21': {
    pendingCodes: ['COPC-OJT'],
    notes: {
      'COPC-OJT': 'Pending final signed MOA from partner audit firm for accountancy internship.'
    }
  },
  'pa-tan-22': {
    pendingCodes: ['COPC-LAB', 'COPC-LIB'],
    notes: {
      'COPC-LAB': 'Social science observation lab equipment inventory awaiting validation.',
      'COPC-LIB': 'Social studies reference books cataloging in progress.'
    }
  },
  'pa-tan-23': {
    pendingCodes: ['COPC-LAB'],
    notes: {
      'COPC-LAB': 'Psychological testing laboratory tools calibration pending CHED validation.'
    }
  },
  'pa-tan-g06': {
    pendingCodes: ['COPC-FAC', 'COPC-LIB'],
    notes: {
      'COPC-FAC': 'Awaiting faculty doctoral credentials endorsement from CHED.',
      'COPC-LIB': 'IEEE / ACM digital library subscription renewal in process.'
    }
  },
  'pa-can-14': {
    pendingCodes: ['COPC-OJT'],
    notes: {
      'COPC-OJT': 'Industry immersion partnership agreement awaiting regional consortium signature.'
    }
  },
  'pa-bis-07': {
    pendingCodes: ['COPC-LAB'],
    notes: {
      'COPC-LAB': 'Automotive diagnostics dynamometer inspection checklist scheduled for upload.'
    }
  }
};

export const initialCOPCRecords: COPCRecord[] = initialProgramAccreditations.map((p, idx) => {
  const isPending = p.copcStatus === 'Pending' || Boolean(PENDING_COPC_CONFIG[p.id]);
  const details = getProgramCOPCDetails(p.programName, p.degreeLevel, idx);
  const pendingConfig = PENDING_COPC_CONFIG[p.id];

  const requirements: COPCRequirementItem[] = standardCOPCRequirements.map((base, rIdx) => {
    const isThisReqPending = isPending && pendingConfig?.pendingCodes?.includes(base.code);

    if (isThisReqPending) {
      return {
        ...base,
        id: `copc-req-${p.id}-${rIdx + 1}`,
        isSubmitted: false,
        status: 'Pending',
        documentName: undefined,
        documentUrl: undefined,
        deficiencyNote: pendingConfig?.notes?.[base.code] || 'Evidence document awaiting department submission.'
      };
    }

    // Fully approved requirement (5 of 5 for compliant programs, 3 or 4 of 5 for pending programs)
    let docSuffix = 'Compliance_Document.pdf';
    if (base.code === 'COPC-CURR') docSuffix = 'CMO_Curriculum_Compliance_Matrix.pdf';
    else if (base.code === 'COPC-FAC') docSuffix = 'Faculty_Roster_Credentials.pdf';
    else if (base.code === 'COPC-LAB') docSuffix = 'Specialized_Laboratory_Inventory.pdf';
    else if (base.code === 'COPC-LIB') docSuffix = 'Library_Holdings_Certification.pdf';
    else if (base.code === 'COPC-OJT') docSuffix = 'Industry_OJT_Partnership_MOA.pdf';

    return {
      ...base,
      id: `copc-req-${p.id}-${rIdx + 1}`,
      isSubmitted: true,
      status: 'Approved',
      documentName: `${details.code}_${docSuffix}`,
      documentUrl: `https://drive.google.com/file/d/accrevia-copc-${p.id}-${base.code.toLowerCase()}/view`,
      deficiencyNote: undefined
    };
  });

  return {
    id: `copc-${p.id}`,
    programId: p.id,
    campusId: p.campusId,
    campusName: p.campusName,
    programName: p.programName,
    degreeLevel: p.degreeLevel,
    copcStatus: isPending ? 'Pending Review' : 'Compliant',
    certificateNumber: isPending ? undefined : (p.copcCertificateNumber || details.certNo),
    dateIssued: isPending ? undefined : details.dateIssued,
    cmoNo: details.cmo,
    borRes: isPending ? 'BOR Res. No. 08, S. 2024 (Endorsed)' : (p.borRes || details.borRes),
    documentLink: (() => {
      const cert = (copcCertificateManifest as Record<string, { path?: string; driveUrl?: string }>)[p.id];
      if (cert?.path) return cert.path;
      if (cert?.driveUrl) return cert.driveUrl;
      if (isPending) return undefined;
      return `https://drive.google.com/file/d/accrevia-copc-certificate-${details.code.toLowerCase()}-${p.id}/view`;
    })(),
    remarks: isPending
      ? 'CHED Regional Office validation visit pending.'
      : (p.remarks || 'Full COPC compliance issued by CHED Regional Office XIII.'),
    requirements
  };
});

export const standardISOClauses = [
  { clauseNumber: 'Clause 4', clauseTitle: 'Context of the Organization', defaultStatus: 'Conforming' as const, desc: 'Internal and external issues, needs and expectations of interested parties, and QMS scope.' },
  { clauseNumber: 'Clause 5', clauseTitle: 'Leadership & Commitment', defaultStatus: 'Conforming' as const, desc: 'Top management leadership, quality policy, and organizational roles, responsibilities and authorities.' },
  { clauseNumber: 'Clause 6', clauseTitle: 'Planning for QMS', defaultStatus: 'Conforming' as const, desc: 'Actions to address risks and opportunities, quality objectives and planning to achieve them.' },
  { clauseNumber: 'Clause 7', clauseTitle: 'Support & Resource Management', defaultStatus: 'Conforming' as const, desc: 'Infrastructure, work environment, monitoring/measuring resources, competence, and documented information.' },
  { clauseNumber: 'Clause 8', clauseTitle: 'Operation & Service Delivery', defaultStatus: 'Conforming' as const, desc: 'Operational planning, student admission, curriculum delivery, examination administration, and post-delivery.' },
  { clauseNumber: 'Clause 9', clauseTitle: 'Performance Evaluation', defaultStatus: 'Conforming' as const, desc: 'Customer satisfaction monitoring, internal quality audits, and management review proceedings.' },
  { clauseNumber: 'Clause 10', clauseTitle: 'Improvement & Corrective Actions', defaultStatus: 'Conforming' as const, desc: 'Nonconformity and corrective action management, continual QMS improvement programs.' }
];

export const initialISORecords: ISOSurveillanceRecord[] = [
  {
    id: 'iso-rec-tandag',
    campusId: 'tandag',
    campusName: 'Tandag Campus (Main)',
    standardVersion: 'ISO 9001:2015',
    auditDate: '2024-09-24',
    cycle: '2024 Surveillance Audit 2',
    auditType: '2nd Surveillance',
    leadAuditor: 'Engr. Nelson V. Carandang (TUV / External)',
    auditorRole: 'Lead ISO Quality Auditor',
    scope: 'Provision of Higher and Advanced Education, Research, Extension and Administrative Support Services',
    complianceStatus: 'Certified',
    summary: 'Tandag Campus demonstrated high compliance across all ISO 9001:2015 standard clauses. Zero major non-conformances identified.',
    isHistorical: false,
    findingsCount: { conformances: 18, ofi: 3, minorNC: 1, majorNC: 0 },
    validationDate: '2024-09-26',
    validatedBy: 'Engr. Nelson V. Carandang',
    clausesEvaluated: standardISOClauses.map((c, i) => ({
      clauseNumber: c.clauseNumber,
      clauseTitle: c.clauseTitle,
      status: i === 3 ? 'Opportunity for Improvement' : (i === 6 ? 'Minor Non-Conformance' : 'Conforming'),
      notes: i === 6 ? 'Minor delay noted in closing CAR-2023-04 regarding laboratory calibration tracking.' : 'Full conformance verified against operational procedures.',
      evidenceChecked: 'SOP Manual, Internal Audit Reports, Risk Registers, Management Review Minutes',
      auditor: 'Engr. Nelson V. Carandang'
    })),
    correctiveActions: [
      {
        id: 'car-tan-01',
        carNumber: 'CAR-2024-TAN-01',
        clauseRef: 'Clause 7.1.5',
        deficiencyDescription: 'Chemical laboratory analytical balances in Science building lacked updated calibration validation stickers.',
        rootCause: 'Calibration supplier scheduling delay during semester break transition.',
        correction: 'Engaged certified DOST-RSTL metrology calibration team on 2024-10-02.',
        correctiveAction: 'Established automated annual maintenance reminder in Accrevia asset module.',
        responsiblePerson: 'Laboratory Custodian & College Dean',
        targetDate: '2024-10-15',
        status: 'Closed / Verified',
        verificationDate: '2024-10-12',
        verifiedBy: 'Dr. Maria L. Santos'
      }
    ]
  },
  {
    id: 'iso-rec-tandag-hist-2023',
    campusId: 'tandag',
    campusName: 'Tandag Campus (Main)',
    standardVersion: 'ISO 9001:2015',
    auditDate: '2023-10-18',
    cycle: '2023 Surveillance Audit 1',
    auditType: 'For Surveillance',
    leadAuditor: 'Engr. Nelson V. Carandang (TUV / External)',
    auditorRole: 'Lead ISO Quality Auditor',
    scope: 'Higher and Advanced Education, Research, Extension and General Administrative Operations',
    complianceStatus: 'Certified',
    summary: 'Initial surveillance audit under ISO 9001:2015 3-year certification cycle. All clauses evaluated with verified conformance.',
    isHistorical: true,
    findingsCount: { conformances: 16, ofi: 4, minorNC: 2, majorNC: 0 },
    validationDate: '2023-10-20',
    validatedBy: 'Engr. Nelson V. Carandang',
    clausesEvaluated: standardISOClauses.map((c) => ({
      clauseNumber: c.clauseNumber,
      clauseTitle: c.clauseTitle,
      status: 'Conforming',
      notes: 'Preserved historical audit evaluation record. Operational compliance validated.',
      evidenceChecked: '2023 Internal Audit Files, QMS Procedure Manuals, Risk Register',
      auditor: 'Engr. Nelson V. Carandang'
    })),
    correctiveActions: [
      {
        id: 'car-tan-hist-01',
        carNumber: 'CAR-2023-TAN-01',
        clauseRef: 'Clause 9.2',
        deficiencyDescription: 'Internal audit schedule for 2nd semester delayed by 2 weeks.',
        rootCause: 'Conflict with regional sports festival hosting.',
        correction: 'Rescheduled and completed within 14 days.',
        correctiveAction: 'Integrated university academic calendar directly into QA audit programme.',
        responsiblePerson: 'Internal Quality Audit Chair',
        targetDate: '2023-11-15',
        status: 'Closed / Verified',
        verificationDate: '2023-11-12',
        verifiedBy: 'Dr. Maria L. Santos'
      }
    ]
  },
  {
    id: 'iso-rec-tandag-hist-2008',
    campusId: 'tandag',
    campusName: 'Tandag Campus (Main)',
    standardVersion: 'ISO 9001:2008',
    auditDate: '2021-08-14',
    cycle: '2021 Recertification Audit (Previous Standard)',
    auditType: 'Recertification',
    leadAuditor: 'TUV Rheinland External Certification Board',
    auditorRole: 'Accredited Certification Auditor',
    scope: 'Institutional Quality Management under ISO 9001:2008 Standard Guidelines',
    complianceStatus: 'Certified',
    summary: 'Preserved historical standard record: NEMSU previous ISO 9001:2008 recertification audit and baseline quality procedures retained for regulatory and accreditation historical reference.',
    isHistorical: true,
    findingsCount: { conformances: 14, ofi: 2, minorNC: 0, majorNC: 0 },
    validationDate: '2021-08-16',
    validatedBy: 'TUV Rheinland Audit Lead',
    clausesEvaluated: standardISOClauses.map((c) => ({
      clauseNumber: c.clauseNumber,
      clauseTitle: c.clauseTitle,
      status: 'Conforming',
      notes: 'Preserved historical standard conformance archive (ISO 9001:2008).',
      evidenceChecked: '2021 Quality Manual, Document Control Register, Executive Minutes',
      auditor: 'TUV Rheinland External Lead'
    })),
    correctiveActions: []
  },
  {
    id: 'iso-rec-cantilan',
    campusId: 'cantilan',
    campusName: 'Cantilan Campus',
    auditDate: '2024-09-15',
    cycle: '2024 Surveillance Audit 2',
    auditType: 'Surveillance Audit 2',
    leadAuditor: 'Dr. Evelyn P. Miranda',
    auditorRole: 'ISO Certified Internal Lead Auditor',
    scope: 'Academic Instruction, Vocational Teacher Education, and Technical Facilities Management',
    complianceStatus: 'Compliant',
    summary: 'Effective execution of instructional processes and workshop safety. Minor improvements suggested for document change request logging.',
    findingsCount: { conformances: 16, ofi: 2, minorNC: 1, majorNC: 0 },
    validationDate: '2024-09-17',
    validatedBy: 'Dr. Evelyn P. Miranda',
    clausesEvaluated: standardISOClauses.map((c, i) => ({
      clauseNumber: c.clauseNumber,
      clauseTitle: c.clauseTitle,
      status: i === 4 ? 'Opportunity for Improvement' : 'Conforming',
      notes: 'Operational quality manual and workshop logs conform to standard specifications.',
      evidenceChecked: 'Workshop safety inspections, enrollment workflows, faculty evaluation records',
      auditor: 'Dr. Evelyn P. Miranda'
    })),
    correctiveActions: [
      {
        id: 'car-can-01',
        carNumber: 'CAR-2024-CAN-01',
        clauseRef: 'Clause 7.5.3',
        deficiencyDescription: 'Three superseded course syllabus templates were found on local faculty drive workstations.',
        rootCause: 'Lack of automatic document version notification upon new syllabus template issuance.',
        correction: 'Retrieved and deleted superseded files; reissued official controlled copy from Accrevia.',
        correctiveAction: 'Mandated downloading syllabus templates directly from the authenticated central repository.',
        responsiblePerson: 'Campus Document Controller',
        targetDate: '2024-10-05',
        status: 'Closed / Verified',
        verificationDate: '2024-10-04',
        verifiedBy: 'Dr. Teresita A. Gonzaga'
      }
    ]
  },
  {
    id: 'iso-rec-lianga',
    campusId: 'lianga',
    campusName: 'Lianga Campus',
    auditDate: '2024-08-20',
    cycle: '2024 Surveillance Audit 2',
    auditType: 'Surveillance Audit 2',
    leadAuditor: 'Dr. Evelyn P. Miranda',
    auditorRole: 'ISO Certified Internal Lead Auditor',
    scope: 'Fisheries, Marine Biology, Teacher Education, and Research Stations',
    complianceStatus: 'Compliant',
    summary: 'Lianga Campus conforms with ISO 9001:2015. Hatchery and research station procedures are exemplary.',
    findingsCount: { conformances: 15, ofi: 2, minorNC: 0, majorNC: 0 },
    validationDate: '2024-08-22',
    validatedBy: 'Dr. Evelyn P. Miranda',
    clausesEvaluated: standardISOClauses.map((c) => ({
      clauseNumber: c.clauseNumber,
      clauseTitle: c.clauseTitle,
      status: 'Conforming',
      notes: 'Hatchery operations and marine laboratory logbooks verified in full compliance.',
      evidenceChecked: 'Marine research station logs, water quality records, student evaluations',
      auditor: 'Dr. Evelyn P. Miranda'
    })),
    correctiveActions: []
  },
  {
    id: 'iso-rec-bislig',
    campusId: 'bislig',
    campusName: 'Bislig Campus',
    auditDate: '2024-07-30',
    cycle: '2024 Surveillance Audit 2',
    auditType: 'Surveillance Audit 2',
    leadAuditor: 'Engr. Nelson V. Carandang (External)',
    auditorRole: 'Lead ISO Quality Auditor',
    scope: 'Engineering Laboratories, Technical Education, and Forestry Field Facilities',
    complianceStatus: 'Compliant',
    summary: 'Bislig Campus meets compliance requirements. Workshop safety protocols were found well maintained.',
    findingsCount: { conformances: 14, ofi: 3, minorNC: 1, majorNC: 0 },
    validationDate: '2024-08-01',
    validatedBy: 'Engr. Nelson V. Carandang',
    clausesEvaluated: standardISOClauses.map((c, i) => ({
      clauseNumber: c.clauseNumber,
      clauseTitle: c.clauseTitle,
      status: i === 3 ? 'Minor Non-Conformance' : 'Conforming',
      notes: i === 3 ? 'Material Safety Data Sheets (MSDS) in Mechanical Engineering stockroom required updating.' : 'Conforming.',
      evidenceChecked: 'Machine safety procedures, waste disposal logs, student training records',
      auditor: 'Engr. Nelson V. Carandang'
    })),
    correctiveActions: [
      {
        id: 'car-bis-01',
        carNumber: 'CAR-2024-BIS-01',
        clauseRef: 'Clause 7.1.4',
        deficiencyDescription: 'Outdated Material Safety Data Sheets (MSDS) displayed in the mechanical welding shop.',
        rootCause: 'New batch of industrial cutting coolants delivered without revised MSDS filing.',
        correction: 'Posted 2024 revised MSDS in all workshop bays.',
        correctiveAction: 'Added mandatory safety sheet verification step to supply receipt checklist.',
        responsiblePerson: 'Engineering Workshop Safety Officer',
        targetDate: '2024-08-25',
        status: 'Closed / Verified',
        verificationDate: '2024-08-20',
        verifiedBy: 'Prof. Liza M. Cabrera'
      }
    ]
  },
  {
    id: 'iso-rec-tagbina',
    campusId: 'tagbina',
    campusName: 'Tagbina Campus',
    auditDate: '2024-06-18',
    cycle: '2024 Surveillance Audit 1',
    auditType: 'Surveillance Audit 1',
    leadAuditor: 'Prof. Liza M. Cabrera',
    auditorRole: 'QA Surveillance Auditor',
    scope: 'Agriculture Demonstration Farms, Hospitality Instruction, and Student Services',
    complianceStatus: 'Minor Deficiencies',
    summary: 'General processes conforming, with minor deficiencies in farm equipment preventive maintenance logs.',
    findingsCount: { conformances: 12, ofi: 4, minorNC: 2, majorNC: 0 },
    validationDate: '2024-06-20',
    validatedBy: 'Prof. Liza M. Cabrera',
    clausesEvaluated: standardISOClauses.map((c, i) => ({
      clauseNumber: c.clauseNumber,
      clauseTitle: c.clauseTitle,
      status: i === 3 ? 'Minor Non-Conformance' : (i === 5 ? 'Minor Non-Conformance' : 'Conforming'),
      notes: i === 3 ? 'Preventive maintenance schedule for farm tractor machinery not consistently logged.' : 'Operational compliance verified.',
      evidenceChecked: 'Demonstration farm logs, hospitality kitchen sanitization logs, student records',
      auditor: 'Prof. Liza M. Cabrera'
    })),
    correctiveActions: [
      {
        id: 'car-tag-01',
        carNumber: 'CAR-2024-TAG-01',
        clauseRef: 'Clause 7.1.3',
        deficiencyDescription: 'Preventive maintenance logbooks for agricultural machinery were incomplete for Q2.',
        rootCause: 'Turnover of farm technician staff.',
        correction: 'Conducted full maintenance inspection and updated equipment logbooks.',
        correctiveAction: 'Assigned digital QR inspection checklist for farm equipment operators.',
        responsiblePerson: 'Farm Operations Superintendent',
        targetDate: '2024-07-15',
        status: 'Closed / Verified',
        verificationDate: '2024-07-10',
        verifiedBy: 'Engr. Ramon D. Villanueva'
      }
    ]
  },
  {
    id: 'iso-rec-san-miguel',
    campusId: 'san-miguel',
    campusName: 'San Miguel Campus',
    auditDate: '2024-05-22',
    cycle: '2024 Surveillance Audit 1',
    auditType: 'Surveillance Audit 1',
    leadAuditor: 'Prof. Liza M. Cabrera',
    auditorRole: 'QA Surveillance Auditor',
    scope: 'Agricultural Technology, Teacher Education, and Community Training Services',
    complianceStatus: 'Compliant',
    summary: 'San Miguel Campus successfully passed surveillance audit with zero non-conformances.',
    findingsCount: { conformances: 13, ofi: 3, minorNC: 0, majorNC: 0 },
    validationDate: '2024-05-24',
    validatedBy: 'Prof. Liza M. Cabrera',
    clausesEvaluated: standardISOClauses.map((c) => ({
      clauseNumber: c.clauseNumber,
      clauseTitle: c.clauseTitle,
      status: 'Conforming',
      notes: 'Records and operational delivery conform to university standards.',
      evidenceChecked: 'Crop science plots, classroom attendance, library accession logs',
      auditor: 'Prof. Liza M. Cabrera'
    })),
    correctiveActions: []
  },
  {
    id: 'iso-rec-cagwait',
    campusId: 'cagwait',
    campusName: 'Cagwait Campus',
    auditDate: '2024-04-12',
    cycle: '2024 Surveillance Audit 1',
    auditType: 'Surveillance Audit 1',
    leadAuditor: 'Prof. Liza M. Cabrera',
    auditorRole: 'QA Surveillance Auditor',
    scope: 'Vocational Training, Hospitality Suites, and Campus Administration',
    complianceStatus: 'Compliant',
    summary: 'Cagwait Campus demonstrates satisfactory compliance with standard requirements.',
    findingsCount: { conformances: 12, ofi: 3, minorNC: 1, majorNC: 0 },
    validationDate: '2024-04-15',
    validatedBy: 'Prof. Liza M. Cabrera',
    clausesEvaluated: standardISOClauses.map((c, i) => ({
      clauseNumber: c.clauseNumber,
      clauseTitle: c.clauseTitle,
      status: i === 4 ? 'Minor Non-Conformance' : 'Conforming',
      notes: i === 4 ? 'Culinary kitchen inventory audit needed clearer waste reconciliation log.' : 'Conforming.',
      evidenceChecked: 'Food service labs, IT computer rooms, student admissions',
      auditor: 'Prof. Liza M. Cabrera'
    })),
    correctiveActions: [
      {
        id: 'car-cag-01',
        carNumber: 'CAR-2024-CAG-01',
        clauseRef: 'Clause 8.5.1',
        deficiencyDescription: 'Hospitality culinary lab perishables inventory lacked end-of-week waste reconciliation sheet.',
        rootCause: 'Instructors recorded consumption on whiteboard rather than official logbook.',
        correction: 'Instituted official Food & Beverage consumable log sheet.',
        correctiveAction: 'Integrated culinary inventory log into semester lab clearance requirement.',
        responsiblePerson: 'Hospitality Program Chair',
        targetDate: '2024-05-01',
        status: 'Closed / Verified',
        verificationDate: '2024-04-28',
        verifiedBy: 'Dr. Arnel B. Lupian'
      }
    ]
  }
];
