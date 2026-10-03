import { EvidenceDocument } from '../types/evidence';

const base = {
  campus: 'Main Campus (Tandag City)',
  college: 'University-wide',
  department: '—',
  program: 'Institution-wide',
  confidentiality: 'Internal' as const,
  status: 'Indexed' as const,
  fileType: 'PDF' as const,
  uploadedBy: 'Liza M. Cabrera',
  cycle: '2025 Institutional Accreditation'
};

export const documents: EvidenceDocument[] = [
{
  ...base,
  id: 'd-001',
  title: 'Faculty Development Program Report 2025',
  description: 'Consolidated report of faculty development activities — trainings, seminars, graduate scholarships, and research capability workshops — conducted in AY 2025–2026.',
  keywords: ['faculty development', 'professional development', 'training', 'seminar', 'scholarship'],
  frameworkId: 'ia', areaId: 'faculty', criterionId: 'c-ia-2', indicatorId: 'i-2-2', requirementId: 'r-2-2-a',
  docType: 'Report', academicYear: '2025–2026', office: 'Human Resource Management Office',
  documentDate: '2025-09-10', validUntil: '2028-09-10', dateAdded: '2026-09-28', pages: 48, sizeMb: 3.2,
  passages: [
  'During AY 2025–2026, 214 faculty members participated in 37 faculty development activities, including outcomes-based education seminars, research capability workshops, and digital pedagogy trainings.',
  'The university supported 28 faculty members pursuing graduate degrees through the Faculty Development Scholarship Program, with 9 completing their master’s or doctoral studies within the year.',
  'Post-training evaluations show that 92% of participants applied the competencies acquired to course design and instructional delivery.']

},
{
  ...base,
  id: 'd-002',
  title: 'Faculty Profile and Credentials Compendium AY 2025–2026',
  description: 'Profiles of full-time faculty with academic degrees, PRC licenses, specializations, and years of service.',
  keywords: ['faculty qualification', 'faculty profile', 'credentials', 'academic rank', 'PRC license'],
  frameworkId: 'ia', areaId: 'faculty', criterionId: 'c-ia-2', indicatorId: 'i-2-1', requirementId: 'r-2-1-a',
  docType: 'Faculty Record', academicYear: '2025–2026', office: 'Human Resource Management Office',
  confidentiality: 'Confidential', documentDate: '2025-08-20', dateAdded: '2026-09-25', pages: 312, sizeMb: 18.4,
  passages: [
  'Of 486 full-time faculty, 61% hold master’s degrees and 22% hold doctoral degrees aligned with their teaching assignments.',
  'Each faculty profile includes the transcript of records, diploma, PRC license where applicable, and certificates of relevant trainings.']

},
{
  ...base,
  id: 'd-003',
  title: 'Faculty Training and Seminar Attendance Certificates',
  description: 'Compiled certificates of attendance and completion for faculty trainings and seminars attended in 2025.',
  keywords: ['certificate', 'training', 'seminar', 'faculty development', 'attendance'],
  frameworkId: 'ia', areaId: 'faculty', criterionId: 'c-ia-2', indicatorId: 'i-2-2', requirementId: 'r-2-2-a',
  docType: 'Certificate', academicYear: '2025–2026', office: 'Human Resource Management Office',
  documentDate: '2025-07-30', dateAdded: '2026-09-20', pages: 96, sizeMb: 22.1,
  passages: [
  'Certificates of attendance for the Regional Seminar-Workshop on Outcomes-Based Teaching and Learning, Butuan City, 14–16 May 2025.',
  'Certificate of completion, Research Capability Building Training for Faculty Researchers, conducted by the Research and Development Office.']

},
{
  ...base,
  id: 'd-004',
  title: 'Faculty Performance Evaluation Summary, 2nd Semester AY 2024–2025',
  description: 'Summary of faculty performance ratings under the Qualitative Contribution Evaluation, with follow-up actions.',
  keywords: ['faculty performance', 'evaluation', 'QCE', 'student evaluation of teachers'],
  frameworkId: 'ia', areaId: 'faculty', criterionId: 'c-ia-2', indicatorId: 'i-2-3', requirementId: 'r-2-3-a',
  docType: 'Statistical Report', academicYear: '2024–2025', office: 'Office of the VP for Academic Affairs',
  documentDate: '2025-06-15', dateAdded: '2026-08-30', pages: 22, sizeMb: 1.4, fileType: 'XLSX',
  passages: [
  'The mean faculty performance rating under the Qualitative Contribution Evaluation (QCE) was 4.52, interpreted as Very Satisfactory.',
  'Faculty with ratings below 3.50 were endorsed to their deans for mentoring and individualized development plans.']

},
{
  ...base,
  id: 'd-005',
  title: 'Research Accomplishment Report 2024',
  description: 'Annual accomplishment report on completed research projects, publications, and paper presentations of faculty researchers.',
  keywords: ['research accomplishment', 'research productivity', 'publications', 'research outputs', 'presentations'],
  frameworkId: 'ia', areaId: 'research', criterionId: 'c-ia-4', indicatorId: 'i-4-2', requirementId: 'r-4-2-a',
  docType: 'Accomplishment Report', academicYear: '2024–2025', office: 'Research and Development Office',
  documentDate: '2025-01-31', dateAdded: '2026-09-27', pages: 64, sizeMb: 5.6,
  passages: [
  'In 2024, faculty researchers completed 46 research projects, published 31 articles in peer-reviewed journals, and presented 58 papers in national and international conferences.',
  'Research productivity increased by 18% over 2023, with 12 publications indexed in Scopus or Web of Science.']

},
{
  ...base,
  id: 'd-006',
  title: 'University Research Agenda 2023–2028',
  description: 'Approved research agenda defining priority research areas and the research budget allocation policy.',
  keywords: ['research agenda', 'research priorities', 'research funding', 'budget'],
  frameworkId: 'ia', areaId: 'research', criterionId: 'c-ia-4', indicatorId: 'i-4-1', requirementId: 'r-4-1-a',
  docType: 'Plan', academicYear: '2023–2024', office: 'Research and Development Office', confidentiality: 'Public',
  documentDate: '2023-06-12', validUntil: '2028-06-12', dateAdded: '2026-07-14', pages: 36, sizeMb: 2.3,
  passages: [
  'The research agenda prioritizes climate resilience, coastal resource management, indigenous knowledge systems, and education innovation in the Caraga Region.',
  'At least 5% of the university’s annual budget is allocated to research, in line with CHED and DBM guidelines.']

},
{
  ...base,
  id: 'd-007',
  title: 'Extension Services Accomplishment Report CY 2024',
  description: 'Annual report of extension programs, beneficiaries served, and community partner feedback.',
  keywords: ['extension', 'community engagement', 'outreach', 'beneficiaries', 'accomplishment report'],
  frameworkId: 'ia', areaId: 'extension', criterionId: 'c-ia-5', indicatorId: 'i-5-1', requirementId: 'r-5-1-a',
  docType: 'Accomplishment Report', academicYear: '2024–2025', office: 'Extension Services Office',
  documentDate: '2025-02-14', dateAdded: '2026-09-16', pages: 58, sizeMb: 7.9,
  passages: [
  'The university implemented 64 extension programs reaching 12,480 beneficiaries across 38 barangays in Surigao del Sur.',
  'Partner communities rated the relevance of extension services at 4.71 on a five-point scale.']

},
{
  ...base,
  id: 'd-008',
  title: 'Student Services Program Manual',
  description: 'Manual defining the scope, procedures, and evaluation of student welfare and support services.',
  keywords: ['student services', 'student welfare', 'guidance', 'scholarship', 'student affairs'],
  frameworkId: 'ia', areaId: 'students', criterionId: 'c-ia-6', indicatorId: 'i-6-1', requirementId: 'r-6-1-a',
  docType: 'Manual', academicYear: '2025–2026', office: 'Office of Student Affairs and Services', confidentiality: 'Public',
  documentDate: '2025-06-01', dateAdded: '2026-09-05', pages: 84, sizeMb: 4.1, fileType: 'DOCX',
  passages: [
  'The manual defines the delivery of guidance and counseling, health services, scholarships and financial assistance, and student housing.',
  'All student services are reviewed annually through client satisfaction surveys administered by the Office of Student Affairs and Services.']

},
{
  ...base,
  id: 'd-009',
  title: 'Library Holdings Inventory Report 2025',
  description: 'Inventory of print and electronic library holdings by subject area and year of publication.',
  keywords: ['library holdings', 'collection', 'e-resources', 'inventory', 'books'],
  frameworkId: 'ia', areaId: 'library', criterionId: 'c-ia-7', indicatorId: 'i-7-1', requirementId: 'r-7-1-a',
  docType: 'Statistical Report', academicYear: '2025–2026', office: 'University Library',
  documentDate: '2025-08-01', dateAdded: '2026-09-02', pages: 40, sizeMb: 2.8,
  passages: [
  'The University Library holds 48,236 volumes, 6,120 e-book titles, and subscriptions to 14 online journal databases.',
  'Holdings published within the last five years account for 34% of the general collection.']

},
{
  ...base,
  id: 'd-010',
  title: 'Quality Assurance Manual, 3rd Edition',
  description: 'Manual describing the Internal Quality Assurance System, its processes, roles, and review cycles.',
  keywords: ['quality assurance', 'QA manual', 'internal quality assurance', 'procedures', 'PDCA'],
  frameworkId: 'ia', areaId: 'qa', criterionId: 'c-ia-9', indicatorId: 'i-9-1', requirementId: 'r-9-1-a',
  docType: 'Manual', academicYear: '2025–2026', office: 'Quality Assurance Office', confidentiality: 'Public',
  documentDate: '2025-03-20', dateAdded: '2026-08-21', pages: 120, sizeMb: 6.2,
  passages: [
  'The Internal Quality Assurance System follows a Plan–Do–Check–Act cycle covering instruction, research, extension, and administrative services.',
  'The Quality Assurance Office coordinates internal assessments before every external accreditation visit.']

},
{
  ...base,
  id: 'd-011',
  title: 'NEMSU Strategic Development Plan 2023–2028',
  description: 'Five-year strategic plan with goals, measurable targets, and a monitoring and evaluation framework.',
  keywords: ['strategic plan', 'development plan', 'institutional planning', 'targets', 'monitoring'],
  frameworkId: 'ia', areaId: 'planning', criterionId: 'c-ia-10', indicatorId: 'i-10-1', requirementId: 'r-10-1-a',
  docType: 'Plan', academicYear: '2023–2024', office: 'Planning and Development Office', confidentiality: 'Public',
  documentDate: '2023-04-18', validUntil: '2028-12-31', dateAdded: '2026-06-30', pages: 96, sizeMb: 5.1,
  passages: [
  'The plan sets 42 measurable targets across five strategic goals aligned with the university’s vision of becoming a globally competitive state university.',
  'Progress is monitored semi-annually through the Strategic Plan Monitoring and Evaluation Report.']

},
{
  ...base,
  id: 'd-012',
  title: 'Board of Regents Resolutions on Governance Policies 2025',
  description: 'Compilation of BOR resolutions approving governance, organizational, and quality assurance policies.',
  keywords: ['board of regents', 'resolutions', 'governance', 'policies', 'BOR'],
  frameworkId: 'ia', areaId: 'governance', criterionId: 'c-ia-1', indicatorId: 'i-1-1', requirementId: 'r-1-1-a',
  docType: 'Policy', academicYear: '2025–2026', office: 'Office of the University Secretary',
  documentDate: '2025-08-28', dateAdded: '2026-09-11', pages: 44, sizeMb: 3.0,
  passages: [
  'BOR Resolution No. 45, s. 2025 approves the revised University Code governing administrative organization and delegation of authority.',
  'Resolution No. 52, s. 2025 adopts the policy on the institutionalization of quality assurance across all campuses.']

},
{
  ...base,
  id: 'd-013',
  title: 'Administrative Council Meeting Minutes – Q2 2025',
  description: 'Minutes of the Administrative Council meetings held in the second quarter of 2025.',
  keywords: ['administrative council', 'minutes', 'meeting', 'management'],
  frameworkId: 'ia', areaId: 'governance', criterionId: 'c-ia-1', indicatorId: 'i-1-2', requirementId: 'r-1-2-a',
  docType: 'Meeting Minutes', academicYear: '2024–2025', office: 'Office of the President',
  documentDate: '2025-06-30', dateAdded: '2026-07-08', pages: 18, sizeMb: 0.9, fileType: 'DOCX',
  passages: [
  'The Council reviewed preparations for the institutional accreditation visit and assigned area coordinators to each criterion.',
  'Deans were directed to submit updated faculty development plans before the end of the second quarter.']

},
{
  ...base,
  id: 'd-014',
  title: 'Internal Quality Audit Report – 1st Cycle 2025',
  description: 'Results of the first ISO internal quality audit cycle, including findings and corrective actions.',
  keywords: ['ISO', 'internal audit', 'nonconformity', 'corrective action', 'audit findings'],
  frameworkId: 'iso', areaId: 'qa', criterionId: 'c-iso-9', indicatorId: 'i-iso9-1', requirementId: 'r-iso9-1-a',
  docType: 'Report', academicYear: '2025–2026', office: 'Quality Assurance Office', cycle: '2025 ISO Surveillance Audit',
  documentDate: '2025-07-18', dateAdded: '2026-09-24', pages: 32, sizeMb: 2.2,
  passages: [
  'The first internal quality audit cycle covered 24 processes and identified 3 minor nonconformities and 11 opportunities for improvement.',
  'All nonconformities were closed through corrective action requests verified by lead auditors within 30 days.']

},
{
  ...base,
  id: 'd-015',
  title: 'ISO Internal Audit Plan and Schedule 2025',
  description: 'Internal audit programme listing audit cycles, processes covered, and assigned auditors.',
  keywords: ['ISO', 'internal audit plan', 'audit schedule', 'auditors'],
  frameworkId: 'iso', areaId: 'qa', criterionId: 'c-iso-9', indicatorId: 'i-iso9-1', requirementId: 'r-iso9-1-a',
  docType: 'Plan', academicYear: '2024–2025', office: 'Quality Assurance Office', cycle: '2025 ISO Surveillance Audit',
  documentDate: '2025-01-15', dateAdded: '2026-04-12', pages: 12, sizeMb: 0.6, fileType: 'XLSX',
  passages: [
  'The audit programme schedules two internal audit cycles per year, covering all core and support processes of the QMS.',
  'Trained internal auditors are assigned to processes outside their own units to ensure objectivity.']

},
{
  ...base,
  id: 'd-016',
  title: 'Personnel Training Records and Competence Matrix',
  description: 'Competence requirements per position mapped against trainings completed by personnel.',
  keywords: ['competence', 'training records', 'competence matrix', 'personnel'],
  frameworkId: 'iso', areaId: 'faculty', criterionId: 'c-iso-7', indicatorId: 'i-iso7-1', requirementId: 'r-iso7-1-a',
  docType: 'Faculty Record', academicYear: '2025–2026', office: 'Human Resource Management Office', cycle: '2025 ISO Surveillance Audit',
  documentDate: '2025-05-05', dateAdded: '2026-08-10', pages: 28, sizeMb: 1.8, fileType: 'XLSX',
  passages: [
  'The competence matrix maps required competencies for 128 positions against training completed by incumbents.',
  'Gaps identified in the matrix feed into the annual training needs analysis and faculty development plan.']

},
{
  ...base,
  id: 'd-017',
  title: 'BSIT Faculty Qualification Matrix',
  description: 'Matrix of BSIT faculty degrees, specializations, and teaching loads against CMO requirements.',
  keywords: ['faculty qualification', 'COPC', 'BSIT', 'CMO 25', 'faculty matrix'],
  frameworkId: 'copc', areaId: 'faculty', criterionId: 'c-copc-1', indicatorId: 'i-copc1-1', requirementId: 'r-copc1-1-a',
  docType: 'Faculty Record', academicYear: '2025–2026', program: 'BS Information Technology',
  college: 'College of Information Technology Education', department: 'Department of Information Technology',
  office: 'College of Information Technology Education', cycle: '2025 COPC Evaluation',
  documentDate: '2025-08-12', dateAdded: '2026-09-19', pages: 14, sizeMb: 0.8, fileType: 'XLSX',
  passages: [
  'All 18 faculty teaching professional courses in BSIT hold at least a master’s degree in IT or an allied field, as required under CMO No. 25, s. 2015.',
  'The matrix lists each faculty member’s degree, specialization, teaching load, and industry certifications.']

},
{
  ...base,
  id: 'd-018',
  title: 'BSIT Library Holdings Compliance Report',
  description: 'Report of library titles and online resources supporting BSIT professional courses.',
  keywords: ['library holdings', 'COPC', 'BSIT', 'compliance'],
  frameworkId: 'copc', areaId: 'library', criterionId: 'c-copc-2', indicatorId: 'i-copc2-1', requirementId: 'r-copc2-1-a',
  docType: 'Report', academicYear: '2025–2026', program: 'BS Information Technology',
  college: 'College of Information Technology Education', office: 'University Library', cycle: '2025 COPC Evaluation',
  documentDate: '2025-08-05', dateAdded: '2026-09-09', pages: 26, sizeMb: 1.5,
  passages: [
  'The library maintains 1,240 titles relevant to BSIT, exceeding the minimum of five titles per professional course.',
  'Online subscriptions include IEEE Xplore and the ACM Digital Library for faculty and student use.']

},
{
  ...base,
  id: 'd-019',
  title: 'Computer Laboratory Compliance Checklist – BSIT',
  description: 'Checklist of computer laboratory equipment and software against COPC requirements.',
  keywords: ['laboratory', 'COPC', 'computer laboratory', 'equipment'],
  frameworkId: 'copc', areaId: 'labs', criterionId: 'c-copc-3', indicatorId: 'i-copc3-1', requirementId: 'r-copc3-1-a',
  docType: 'Report', academicYear: '2025–2026', program: 'BS Information Technology',
  college: 'College of Information Technology Education', office: 'College of Information Technology Education', cycle: '2025 COPC Evaluation',
  status: 'Processing', documentDate: '2025-09-02', dateAdded: '2026-09-30', pages: 10, sizeMb: 0.7,
  passages: ['Each of the four computer laboratories has 40 workstations meeting the minimum specifications for programming courses.']
},
{
  ...base,
  id: 'd-020',
  title: 'BSEd Faculty Profiles – Area II',
  description: 'Profiles and credentials of faculty handling Bachelor of Secondary Education major courses.',
  keywords: ['faculty profile', 'faculty qualification', 'BSEd', 'program accreditation', 'Area II'],
  frameworkId: 'pa', areaId: 'faculty', criterionId: 'c-pa-2', indicatorId: 'i-pa2-1', requirementId: 'r-pa2-1-a',
  docType: 'Faculty Record', academicYear: '2024–2025', program: 'Bachelor of Secondary Education',
  college: 'College of Teacher Education', department: 'Department of Secondary Education',
  office: 'College of Teacher Education', cycle: '2024 Program Accreditation (Level III)', confidentiality: 'Confidential',
  documentDate: '2024-11-10', dateAdded: '2026-05-22', pages: 88, sizeMb: 9.4,
  passages: [
  'Faculty handling major courses in BSEd hold licenses as professional teachers and master’s degrees in their field of specialization.',
  'Seven faculty members completed doctoral degrees under the faculty development program between 2021 and 2024.']

},
{
  ...base,
  id: 'd-021',
  title: 'BSEd Curriculum Review and CMO Alignment',
  description: 'Curriculum review of the BSEd program against CHED CMO and professional teaching standards.',
  keywords: ['curriculum review', 'CMO alignment', 'BSEd', 'outcomes-based education', 'program of study'],
  frameworkId: 'pa', areaId: 'curriculum', criterionId: 'c-pa-3', indicatorId: 'i-pa3-1', requirementId: 'r-pa3-1-a',
  docType: 'Report', academicYear: '2024–2025', program: 'Bachelor of Secondary Education',
  college: 'College of Teacher Education', office: 'College of Teacher Education', cycle: '2024 Program Accreditation (Level III)',
  documentDate: '2024-10-02', dateAdded: '2026-05-30', pages: 54, sizeMb: 3.7, fileType: 'DOCX',
  passages: [
  'The curriculum was reviewed against CMO No. 75, s. 2017 and aligned with the Philippine Professional Standards for Teachers.',
  'Program outcomes are mapped to course outcomes and assessment tasks in each syllabus.']

},
{
  ...base,
  id: 'd-022',
  title: 'College of Engineering Research Outputs 2023–2025',
  description: 'Compilation of completed faculty and student research in the College of Engineering.',
  keywords: ['research outputs', 'engineering research', 'publications', 'student research'],
  frameworkId: 'pa', areaId: 'research', criterionId: 'c-pa-7', indicatorId: 'i-pa7-1', requirementId: 'r-pa7-1-a',
  docType: 'Accomplishment Report', academicYear: '2024–2025', program: 'BS Civil Engineering',
  college: 'College of Engineering', office: 'College of Engineering', cycle: '2024 Program Accreditation (Level III)',
  documentDate: '2025-03-28', dateAdded: '2026-06-18', pages: 72, sizeMb: 6.8,
  passages: [
  'Faculty and students of the College of Engineering produced 22 completed studies, including 6 funded by DOST-PCIEERD.',
  'Four student theses received recognition at the Regional Research Congress in 2024.']

},
{
  ...base,
  id: 'd-023',
  title: 'PQA Leadership System Documentation',
  description: 'Description of how senior leaders set direction, communicate, and review organizational performance.',
  keywords: ['PQA', 'leadership', 'senior leaders', 'governance', 'performance excellence'],
  frameworkId: 'pqa', areaId: 'governance', criterionId: 'c-pqa-1', indicatorId: 'i-pqa1-1', requirementId: 'r-pqa1-1-a',
  docType: 'Manual', academicYear: '2025–2026', office: 'Office of the President', cycle: '2025 PQA Application',
  documentDate: '2025-05-22', dateAdded: '2026-08-04', pages: 38, sizeMb: 2.6, fileType: 'DOCX',
  passages: [
  'Senior leaders set direction through an annual leadership cascade that links strategic objectives to college and office scorecards.',
  'Leadership performance is reviewed through quarterly management review meetings chaired by the University President.']

},
{
  ...base,
  id: 'd-024',
  title: 'Core Process Management Documentation',
  description: 'Documentation of key work processes in instruction, research, and extension with performance measures.',
  keywords: ['PQA', 'process management', 'work processes', 'operations'],
  frameworkId: 'pqa', areaId: 'qa', criterionId: 'c-pqa-6', indicatorId: 'i-pqa6-1', requirementId: 'r-pqa6-1-a',
  docType: 'Manual', academicYear: '2025–2026', office: 'Quality Assurance Office', cycle: '2025 PQA Application',
  documentDate: '2025-06-09', dateAdded: '2026-07-27', pages: 46, sizeMb: 3.1,
  passages: [
  'Key work processes in instruction, research, and extension are documented with process owners, requirements, and performance indicators.',
  'Process improvements are prioritized using customer feedback and in-process measures reviewed each semester.']

},
{
  ...base,
  id: 'd-025',
  title: 'Campus Facility Inventory and Maintenance Log 2025',
  description: 'Inventory of buildings, classrooms, and laboratories with condition ratings and maintenance records.',
  keywords: ['facilities', 'physical plant', 'maintenance', 'inventory', 'classrooms'],
  frameworkId: 'ia', areaId: 'facilities', criterionId: 'c-ia-8', indicatorId: 'i-8-1', requirementId: 'r-8-1-a',
  docType: 'Statistical Report', academicYear: '2025–2026', office: 'Physical Plant and Facilities Office',
  documentDate: '2025-07-01', dateAdded: '2026-08-26', pages: 30, sizeMb: 2.0, fileType: 'XLSX',
  passages: [
  'The Main Campus has 142 classrooms, 26 laboratories, and 4 auditoriums, with 93% rated in good condition.',
  'Preventive maintenance was completed for all academic buildings in the first semester.']

},
{
  ...base,
  id: 'd-026',
  title: 'Curriculum Review Committee Memorandum No. 14, s. 2025',
  description: 'Memorandum directing colleges to convene curriculum review committees and submit revised curricula.',
  keywords: ['memorandum', 'curriculum review', 'committee'],
  frameworkId: 'ia', areaId: 'curriculum', criterionId: 'c-ia-3', indicatorId: 'i-3-1', requirementId: 'r-3-1-a',
  docType: 'Memorandum', academicYear: '2025–2026', office: 'Office of the VP for Academic Affairs', confidentiality: 'Public',
  documentDate: '2025-08-18', dateAdded: '2026-09-13', pages: 3, sizeMb: 0.3,
  passages: [
  'All colleges are directed to convene their curriculum review committees and submit revised curricula for approval of the Academic Council.',
  'Reviews must incorporate feedback from industry partners, alumni, and accreditation recommendations.']

},
{
  ...base,
  id: 'd-027',
  title: 'Faculty Scholarship Grantees Documentation 2025',
  description: 'Photo documentation of faculty scholarship contract signing with captions identifying grantees.',
  keywords: ['faculty scholarship', 'photo documentation', 'faculty development', 'graduate studies'],
  frameworkId: 'ia', areaId: 'faculty', criterionId: 'c-ia-2', indicatorId: 'i-2-2', requirementId: 'r-2-2-a',
  docType: 'Photo / Documentation', academicYear: '2025–2026', office: 'Human Resource Management Office',
  documentDate: '2025-06-20', dateAdded: '2026-09-03', pages: 12, sizeMb: 14.6,
  passages: [
  'Photo documentation of the contract signing for 2025 faculty scholarship grantees, with captions identifying grantees and programs.',
  'Grantees are enrolled in partner universities, including Caraga State University and Mindanao State University.']

},
{
  ...base,
  id: 'd-028',
  title: 'Faculty Development Program Report 2019',
  description: 'Faculty development report for the 2019 institutional accreditation cycle.',
  keywords: ['faculty development', 'training', '2019'],
  frameworkId: 'ia', areaId: 'faculty', criterionId: 'c-ia-2', indicatorId: 'i-2-2', requirementId: 'r-2-2-a',
  docType: 'Report', academicYear: '2019–2020', office: 'Human Resource Management Office', cycle: '2019 Institutional Accreditation',
  status: 'Archived', documentDate: '2019-09-12', dateAdded: '2020-02-11', pages: 40, sizeMb: 2.9,
  passages: ['In AY 2019–2020, 162 faculty members attended 24 faculty development activities.']
},
{
  ...base,
  id: 'd-029',
  title: 'Quality Assurance Manual, 2nd Edition',
  description: 'Superseded edition of the Quality Assurance Manual.',
  keywords: ['quality assurance', 'QA manual'],
  frameworkId: 'ia', areaId: 'qa', criterionId: 'c-ia-9', indicatorId: 'i-9-1', requirementId: 'r-9-1-a',
  docType: 'Manual', academicYear: '2018–2019', office: 'Quality Assurance Office', cycle: '2019 Institutional Accreditation',
  status: 'Archived', documentDate: '2018-11-05', dateAdded: '2019-06-03', pages: 96, sizeMb: 4.8,
  passages: ['This edition is superseded by the 3rd Edition approved under BOR Resolution No. 18, s. 2025.']
}];