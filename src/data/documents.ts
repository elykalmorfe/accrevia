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
  docType: 'Report', isoStage: 'For Surveillance', academicYear: '2025–2026', office: 'Quality Assurance Office', cycle: '2025 ISO Surveillance Audit',
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
  docType: 'Plan', isoStage: '2nd Surveillance', academicYear: '2024–2025', office: 'Quality Assurance Office', cycle: '2025 ISO Surveillance Audit',
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
  docType: 'Faculty Record', isoStage: 'Recertification', academicYear: '2025–2026', office: 'Human Resource Management Office', cycle: '2025 ISO Surveillance Audit',
  documentDate: '2025-05-05', dateAdded: '2026-08-10', pages: 28, sizeMb: 1.8, fileType: 'XLSX',
  passages: [
  'The competence matrix maps required competencies for 128 positions against training completed by incumbents.',
  'Gaps identified in the matrix feed into the annual training needs analysis and faculty development plan.']

},
{
  ...base,
  id: 'd-017',
  campus: 'Cantilan Campus',
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
  campus: 'Cantilan Campus',
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
  campus: 'Cantilan Campus',
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
},
{
  ...base,
  id: 'd-030',
  title: 'ISO 9001:2015 Management Review Minutes & Audit Evidence',
  description: 'Executive committee minutes reviewing university-wide QMS surveillance audit results, risk assessments, and non-conformance status.',
  keywords: ['ISO', 'surveillance', 'management review', 'quality management', 'audit evidence'],
  frameworkId: 'iso', areaId: 'qa', criterionId: 'c-iso-9', indicatorId: 'i-iso9-1', requirementId: 'r-iso9-1-a',
  docType: 'Meeting Minutes', isoStage: 'For Surveillance', academicYear: '2025–2026', office: 'Quality Assurance Office', cycle: '2025 ISO Surveillance Audit',
  documentDate: '2025-08-14', dateAdded: '2026-09-15', pages: 22, sizeMb: 1.4,
  passages: [
    'The University Executive Committee conducted the annual Management Review in conformance with ISO 9001:2015 Clause 9.3.',
    'Status of actions from previous management reviews and opportunities for continual improvement were reviewed and confirmed.'
  ]
},
{
  ...base,
  id: 'd-031',
  title: 'ISO 9001:2015 Recertification Audit Attestation & QMS Register',
  description: 'Official ISO 9001:2015 recertification audit scope attestation, clause verification records, and certifying body validation.',
  keywords: ['ISO', 'recertification', 'QMS', 'certificate', 'audit attestation'],
  frameworkId: 'iso', areaId: 'qa', criterionId: 'c-iso-9', indicatorId: 'i-iso9-1', requirementId: 'r-iso9-1-a',
  docType: 'Certificate', isoStage: 'Recertification', academicYear: '2024–2025', office: 'Quality Assurance Office', cycle: '2025 ISO Surveillance Audit',
  documentDate: '2025-03-20', dateAdded: '2026-06-10', pages: 18, sizeMb: 2.7,
  passages: [
    'NEMSU successfully satisfied all requirements for ISO 9001:2015 Recertification across all 7 operational campuses.',
    'The scope covers the provision of Tertiary and Advanced Higher Education, Research, and Extension Services.'
  ]
},
{
  ...base,
  id: 'd-032',
  title: 'ISO 9001:2015 2nd Surveillance Audit Conformance Dossier',
  description: 'Compiled audit evidence, risk registry monitoring, and operational compliance reports for 2nd Surveillance audit verification.',
  keywords: ['ISO', '2nd surveillance', 'audit dossier', 'quality monitoring', 'conformance'],
  frameworkId: 'iso', areaId: 'qa', criterionId: 'c-iso-9', indicatorId: 'i-iso9-1', requirementId: 'r-iso9-1-a',
  docType: 'Report', isoStage: '2nd Surveillance', academicYear: '2024–2025', office: 'Quality Assurance Office', cycle: '2025 ISO Surveillance Audit',
  documentDate: '2025-06-11', dateAdded: '2026-07-04', pages: 35, sizeMb: 3.1,
  passages: [
    'Second surveillance audit evidence confirms ongoing suitability, adequacy, and effectiveness of the university quality management system.',
    'Clause 8 operational planning and service provision verified across all academic departments.'
  ]
},
{
  ...base,
  id: 'd-033',
  campus: 'Lianga Campus',
  title: 'Lianga Marine Biology & Coastal Resource Management Research Portfolio',
  description: 'Comprehensive research outputs on coral reef conservation and marine protected areas conducted by faculty and students of Lianga Campus.',
  keywords: ['marine biology', 'fisheries', 'coastal resources', 'research outputs', 'Lianga'],
  frameworkId: 'pa', areaId: 'research', criterionId: 'c-pa-7', indicatorId: 'i-pa7-1', requirementId: 'r-pa7-1-a',
  docType: 'Accomplishment Report', academicYear: '2024–2025', program: 'BS Marine Biology',
  college: 'College of Fisheries and Marine Sciences', office: 'Research and Development Unit - Lianga', cycle: '2024 Program Accreditation (Level II)',
  documentDate: '2025-04-12', dateAdded: '2026-07-15', pages: 52, sizeMb: 5.4,
  passages: [
    'Lianga Campus marine researchers completed 8 coastal ecosystem monitoring projects in partnership with BFAR and municipal LGUs.',
    'Findings support sustainable fisheries management and local mangrove reforestation programs.'
  ]
},
{
  ...base,
  id: 'd-034',
  campus: 'Tagbina Campus',
  title: 'Tagbina Agriculture Demonstration Farm & Crop Science Practicum Audit',
  description: 'Assessment of agricultural field laboratory facilities, organic farming trial plots, and student farm practicum records.',
  keywords: ['agriculture', 'crop science', 'field laboratory', 'practicum', 'Tagbina'],
  frameworkId: 'pa', areaId: 'curriculum', criterionId: 'c-pa-3', indicatorId: 'i-pa3-1', requirementId: 'r-pa3-1-a',
  docType: 'Report', academicYear: '2024–2025', program: 'BS Agriculture',
  college: 'College of Agriculture', office: 'Demonstration Farm Management', cycle: '2024 Program Accreditation (Level I)',
  documentDate: '2025-05-18', dateAdded: '2026-08-02', pages: 40, sizeMb: 3.8,
  passages: [
    'The 15-hectare agricultural demonstration farm in Tagbina satisfies CHED CMO standards for diversified crop production and agro-processing.',
    'Over 140 BS Agriculture students completed required experiential field modules with accredited farm cooperators.'
  ]
},
{
  ...base,
  id: 'd-035',
  campus: 'Bislig Campus',
  title: 'Bislig Campus Forestry Ecology Field Station Documentation',
  description: 'Inventory and ecological assessment documentation for the Bislig Campus forest research reserve and silviculture laboratories.',
  keywords: ['forestry', 'ecology', 'silviculture', 'Bislig', 'forest reserve'],
  frameworkId: 'pa', areaId: 'facilities', criterionId: 'c-pa-8', indicatorId: 'i-pa8-1', requirementId: 'r-pa8-1-a',
  docType: 'Statistical Report', academicYear: '2024–2025', program: 'BS Forestry',
  college: 'College of Forestry and Environmental Science', office: 'Forest Station Operations', cycle: '2024 Program Accreditation (Level II)',
  documentDate: '2025-06-25', dateAdded: '2026-08-14', pages: 34, sizeMb: 4.1,
  passages: [
    'The Bislig Campus forest station features state-of-the-art dendrology specimen collections and GPS survey instruments.',
    'A cooperative agreement with DENR guarantees university access to 250 hectares of protected watershed for field instruction.'
  ]
},
{
  ...base,
  id: 'd-036',
  campus: 'San Miguel Campus',
  title: 'San Miguel Sustainable Agri-Business Community Extension Dossier',
  description: 'Community livelihood training documentation, farmer field school records, and cooperative extension impact assessment in San Miguel.',
  keywords: ['community extension', 'agribusiness', 'livelihood', 'farmers', 'San Miguel'],
  frameworkId: 'ia', areaId: 'extension', criterionId: 'c-ia-5', indicatorId: 'i-5-1', requirementId: 'r-5-1-a',
  docType: 'Accomplishment Report', academicYear: '2024–2025', office: 'Extension Services Unit - San Miguel', cycle: '2025 Institutional Accreditation',
  documentDate: '2025-03-15', dateAdded: '2026-06-22', pages: 48, sizeMb: 4.9,
  passages: [
    'San Miguel Campus deployed agricultural extension faculty across 12 upland barangays, training 620 farmers in post-harvest processing.',
    'Post-training survey indicated a 94.6% community satisfaction rate with university extension initiatives.'
  ]
},
{
  ...base,
  id: 'd-037',
  campus: 'Cagwait Campus',
  title: 'Cagwait Criminology Crime Scene Simulation & Forensics Laboratory Manual',
  description: 'Standard operating procedures, forensics equipment inventory, and crime scene simulation guidelines for Cagwait Campus.',
  keywords: ['criminology', 'forensics', 'laboratory manual', 'crime scene', 'Cagwait'],
  frameworkId: 'pa', areaId: 'curriculum', criterionId: 'c-pa-3', indicatorId: 'i-pa3-1', requirementId: 'r-pa3-1-a',
  docType: 'Manual', academicYear: '2025–2026', program: 'BS Criminology',
  college: 'College of Criminal Justice Education', office: 'Forensic Science Laboratory', cycle: '2025 Candidate Evaluation',
  documentDate: '2025-08-20', dateAdded: '2026-09-18', pages: 62, sizeMb: 6.2,
  passages: [
    'The forensics laboratory is equipped with ballistic comparison microscopes, fingerprint processing kits, and moot courtroom facilities.',
    'All equipment undergoes calibrated testing quarterly in compliance with PNP and CHED CCJE guidelines.'
  ]
},
// =========================================================================
// Official Common Accreditation Documents (IA & Program Accreditation)
// Accessible: Instruments, PPP, Findings & Recommendations, BOR Resolutions
// Confidential: Technical Review, COPC, Memorandums, Endorsement Letters
// =========================================================================
{
  ...base,
  id: 'd-101',
  campus: 'Main Campus (Tandag City)',
  title: 'AACCUP Accreditation Instrument — BS Information Technology (Level IV)',
  description: 'Official AACCUP accreditation self-survey instrument and rating matrix for BS Information Technology program evaluation across Areas I to X.',
  keywords: ['accreditation instrument', 'AACCUP', 'BSIT', 'Level IV', 'survey instrument', 'Tandag'],
  frameworkId: 'pa', areaId: 'curriculum', criterionId: 'c-pa-3', indicatorId: 'i-pa3-1', requirementId: 'r-pa3-1-a',
  docType: 'Manual', academicYear: '2024–2025', program: 'BS Information Technology',
  college: 'College of Information Technology Education', office: 'Quality Assurance Office', cycle: '2024 Program Accreditation (Level III)',
  confidentiality: 'Internal', commonDocType: 'Accreditation Instrument per Program',
  documentUrl: 'https://nemsu.edu.ph/qa/instruments/AACCUP_BSIT_Level_IV_Instrument.pdf',
  documentDate: '2024-11-15', dateAdded: '2025-01-10', pages: 84, sizeMb: 5.6,
  passages: [
    'The survey instrument evaluates 10 criteria including VMGO, Faculty, Curriculum and Instruction, Support to Students, and Research.',
    'Mean parameter benchmark requirement for Level IV accreditation status is 4.50 with no area lower than 4.0.'
  ]
},
{
  ...base,
  id: 'd-102',
  campus: 'Cantilan Campus',
  title: 'AACCUP Accreditation Instrument — Bachelor of Secondary Education (Level III)',
  description: 'Accreditation instrument and rubric benchmark for the Bachelor of Secondary Education program Level III survey visit at Cantilan Campus.',
  keywords: ['accreditation instrument', 'BSED', 'Cantilan', 'Level III', 'AACCUP instrument'],
  frameworkId: 'pa', areaId: 'curriculum', criterionId: 'c-pa-3', indicatorId: 'i-pa3-1', requirementId: 'r-pa3-1-a',
  docType: 'Manual', academicYear: '2024–2025', program: 'Bachelor of Secondary Education',
  college: 'College of Teacher Education', office: 'Quality Assurance Unit - Cantilan', cycle: '2024 Program Accreditation (Level III)',
  confidentiality: 'Internal', commonDocType: 'Accreditation Instrument per Program',
  documentUrl: 'https://nemsu.edu.ph/qa/instruments/AACCUP_BSED_Cantilan_Instrument.pdf',
  documentDate: '2024-10-20', dateAdded: '2025-01-12', pages: 76, sizeMb: 4.8,
  passages: [
    'Teacher education outcomes-based evaluation matrix aligning Philippine Professional Standards for Teachers (PPST) with curriculum rubrics.',
    'Criterion Area III requires at least 85% of faculty to possess aligned master degrees in education.'
  ]
},
{
  ...base,
  id: 'd-103',
  campus: 'Main Campus (Tandag City)',
  title: 'AACCUP Technical Review Evaluation Report — BS Information Technology',
  description: 'Confidential technical review evaluation conducted by the AACCUP Technical Committee on program metrics, faculty ratio, and laboratory compliance.',
  keywords: ['technical review', 'AACCUP review', 'confidential', 'BSIT', 'evaluation report'],
  frameworkId: 'pa', areaId: 'faculty', criterionId: 'c-pa-2', indicatorId: 'i-pa2-1', requirementId: 'r-pa2-1-a',
  docType: 'Report', academicYear: '2024–2025', program: 'BS Information Technology',
  college: 'College of Information Technology Education', office: 'Office of the President', cycle: '2024 Program Accreditation (Level III)',
  confidentiality: 'Confidential', commonDocType: 'AACCUP Technical Review',
  documentUrl: 'https://nemsu.edu.ph/qa/confidential/AACCUP_Technical_Review_BSIT_2024.pdf',
  documentDate: '2025-02-18', dateAdded: '2025-03-01', pages: 42, sizeMb: 3.4,
  passages: [
    'Technical Review Panel verified faculty-to-student ratio of 1:24, well within CHED CMO 25 Series 2015 threshold.',
    'Recommendation: Accelerate patent applications for student capstone deliverables and expand industry internship partnerships.'
  ]
},
{
  ...base,
  id: 'd-104',
  campus: 'Bislig Campus',
  title: 'AACCUP Technical Review Dossier — BS Business Administration',
  description: 'Confidential technical survey review dossier documenting compliance benchmarks, financial sustainability, and curriculum alignment for BSBA Bislig.',
  keywords: ['technical review', 'BSBA', 'Bislig', 'confidential review', 'AACCUP dossier'],
  frameworkId: 'pa', areaId: 'curriculum', criterionId: 'c-pa-3', indicatorId: 'i-pa3-1', requirementId: 'r-pa3-1-a',
  docType: 'Report', academicYear: '2024–2025', program: 'BS Business Administration',
  college: 'College of Business and Management', office: 'Office of the President', cycle: '2024 Program Accreditation (Level II)',
  confidentiality: 'Confidential', commonDocType: 'AACCUP Technical Review',
  documentUrl: 'https://nemsu.edu.ph/qa/confidential/AACCUP_Technical_Review_BSBA_Bislig.pdf',
  documentDate: '2025-01-25', dateAdded: '2025-02-15', pages: 38, sizeMb: 3.1,
  passages: [
    'Technical review team notes commendable CPA licensing pass rate of 68.4% compared to national passing average of 31.2%.',
    'Action Required: Upgrade multimedia business simulation software licenses for accounting laboratory.'
  ]
},
{
  ...base,
  id: 'd-105',
  campus: 'Main Campus (Tandag City)',
  title: 'Program Performance Profile (PPP) — BS Information Technology AY 2024–2025',
  description: 'Comprehensive Program Performance Profile summarizing enrollment trends, graduation rates, faculty credentials, board examination yields, and tracer studies.',
  keywords: ['PPP', 'program performance profile', 'BSIT', 'enrollment', 'faculty credentials', 'tracer study'],
  frameworkId: 'pa', areaId: 'support', criterionId: 'c-pa-4', indicatorId: 'i-pa4-1', requirementId: 'r-pa4-1-a',
  docType: 'Accomplishment Report', academicYear: '2024–2025', program: 'BS Information Technology',
  college: 'College of Information Technology Education', office: 'Quality Assurance Office', cycle: '2024 Program Accreditation (Level III)',
  confidentiality: 'Internal', commonDocType: 'Program Performance Profile (PPP)',
  documentUrl: 'https://nemsu.edu.ph/qa/ppp/PPP_BSIT_Tandag_2024_2025.pdf',
  documentDate: '2025-01-30', dateAdded: '2025-02-05', pages: 114, sizeMb: 12.4,
  passages: [
    'Enrollment in BSIT increased by 14.2% over the last 3 academic years, maintaining an average graduation retention rate of 88.5%.',
    'Graduate tracer study demonstrates 91.8% employment within six months of graduation, with 74% placed in software development and IT infrastructure roles.'
  ]
},
{
  ...base,
  id: 'd-106',
  campus: 'Bislig Campus',
  title: 'Program Performance Profile (PPP) — BS Forestry AY 2024–2025',
  description: 'Program Performance Profile detailing academic achievements, research publications, licensure examination success, and forestry field station operations.',
  keywords: ['PPP', 'program performance profile', 'BS Forestry', 'Bislig', 'licensure exam'],
  frameworkId: 'pa', areaId: 'research', criterionId: 'c-pa-5', indicatorId: 'i-pa5-1', requirementId: 'r-pa5-1-a',
  docType: 'Accomplishment Report', academicYear: '2024–2025', program: 'BS Forestry',
  college: 'College of Forestry and Environmental Science', office: 'Quality Assurance Unit - Bislig', cycle: '2024 Program Accreditation (Level II)',
  confidentiality: 'Internal', commonDocType: 'Program Performance Profile (PPP)',
  documentUrl: 'https://nemsu.edu.ph/qa/ppp/PPP_BS_Forestry_Bislig_2024_2025.pdf',
  documentDate: '2025-02-12', dateAdded: '2025-02-28', pages: 98, sizeMb: 9.8,
  passages: [
    'Forester Licensure Examination yield of 82.5% achieved in October 2024, placing NEMSU Bislig among the top 5 forestry schools in Mindanao.',
    'Faculty published 8 peer-reviewed SCOPUS articles focused on mangrove preservation and tropical rainforest silviculture.'
  ]
},
{
  ...base,
  id: 'd-107',
  campus: 'Main Campus (Tandag City)',
  title: 'CHED Certificate of Program Compliance (COPC) — BS Information Technology',
  description: 'Official CHED Regional Office XIII Certificate of Program Compliance (COPC No. 2024-089) certifying full compliance with CMO 25 Series of 2015.',
  keywords: ['COPC', 'certificate of program compliance', 'CHED', 'confidential', 'BSIT', 'Tandag'],
  frameworkId: 'copc', areaId: 'governance', criterionId: 'c-copc-1', indicatorId: 'i-copc-1', requirementId: 'r-copc-1-a',
  docType: 'Certificate', academicYear: '2024–2025', program: 'BS Information Technology',
  college: 'College of Information Technology Education', office: 'Office of the VP for Academic Affairs', cycle: '2025 COPC Evaluation',
  confidentiality: 'Confidential', commonDocType: 'Certificate of Program Compliance (COPC)',
  documentUrl: 'https://nemsu.edu.ph/qa/copc/COPC_CHED_RO13_BSIT_Tandag_2024.pdf',
  documentDate: '2024-09-14', validUntil: '2029-09-14', dateAdded: '2024-10-01', pages: 8, sizeMb: 1.8,
  passages: [
    'CHED Regional Office XIII hereby certifies that North Eastern Mindanao State University - Main Campus has complied with all policies, standards, and guidelines for BSIT.',
    'COPC Number: COPC-2024-RO13-089 signed by CHED Regional Director Dr. George M. Colorado.'
  ]
},
{
  ...base,
  id: 'd-108',
  campus: 'Cantilan Campus',
  title: 'CHED Certificate of Program Compliance (COPC) — Bachelor of Secondary Education',
  description: 'CHED Caraga Certificate of Program Compliance verifying standard compliance with CMO 75 Series 2017 for teacher education in Cantilan Campus.',
  keywords: ['COPC', 'CHED certificate', 'BSED', 'Cantilan', 'compliance certificate'],
  frameworkId: 'copc', areaId: 'governance', criterionId: 'c-copc-1', indicatorId: 'i-copc-1', requirementId: 'r-copc-1-a',
  docType: 'Certificate', academicYear: '2024–2025', program: 'Bachelor of Secondary Education',
  college: 'College of Teacher Education', office: 'Office of the VP for Academic Affairs', cycle: '2025 COPC Evaluation',
  confidentiality: 'Confidential', commonDocType: 'Certificate of Program Compliance (COPC)',
  documentUrl: 'https://nemsu.edu.ph/qa/copc/COPC_CHED_RO13_BSED_Cantilan_2024.pdf',
  documentDate: '2024-08-28', validUntil: '2029-08-28', dateAdded: '2024-09-15', pages: 6, sizeMb: 1.5,
  passages: [
    'Certificate of Program Compliance (COPC No. 2024-RO13-062) granted to NEMSU Cantilan for Bachelor of Secondary Education majors in Mathematics and Science.',
    'Verified compliance in laboratory schools, library book collection per major, and teacher training facilities.'
  ]
},
{
  ...base,
  id: 'd-109',
  campus: 'Main Campus (Tandag City)',
  title: 'University Memorandum No. 2025-142: Mobilization for Institutional & Program Surveys',
  description: 'Confidential University Memorandum directing all Vice Presidents, Deans, Campus Directors, and QA Coordinators to finalize evidence repositories.',
  keywords: ['memorandum', 'memo', 'institutional survey', 'accreditation memo', 'confidential directive'],
  frameworkId: 'ia', areaId: 'governance', criterionId: 'c-ia-1', indicatorId: 'i-1-1', requirementId: 'r-1-1-a',
  docType: 'Memorandum', academicYear: '2025–2026',
  office: 'Office of the President', cycle: '2025 Institutional Accreditation',
  confidentiality: 'Confidential', commonDocType: 'Memorandum (Memo)',
  documentUrl: 'https://nemsu.edu.ph/qa/confidential/Univ_Memo_2025_142_Accreditation_Mobilization.pdf',
  documentDate: '2025-05-10', dateAdded: '2025-05-12', pages: 4, sizeMb: 0.9,
  passages: [
    'All Campus Directors and Area Task Forces are instructed to upload complete and verified evidence documents into the Accrevia Portal by October 30.',
    'Budget allocation of PHP 4.5M is authorized under Fiduciary Quality Assurance fund to support external surveying team logistics.'
  ]
},
{
  ...base,
  id: 'd-110',
  campus: 'Main Campus (Tandag City)',
  title: 'VPAA Memorandum No. 2025-088: Pre-Accreditation Internal Mock Audits & Benchmark Verification',
  description: 'Confidential VPAA instructional memo setting guidelines, schedules, and evaluation teams for internal QA mock audits across all 7 campuses.',
  keywords: ['memorandum', 'VPAA memo', 'mock audit', 'confidential', 'pre-accreditation'],
  frameworkId: 'ia', areaId: 'qa', criterionId: 'c-ia-9', indicatorId: 'i-9-1', requirementId: 'r-9-1-a',
  docType: 'Memorandum', academicYear: '2025–2026',
  office: 'Office of the VP for Academic Affairs', cycle: '2025 Institutional Accreditation',
  confidentiality: 'Confidential', commonDocType: 'Memorandum (Memo)',
  documentUrl: 'https://nemsu.edu.ph/qa/confidential/VPAA_Memo_2025_088_Internal_Mock_Audit.pdf',
  documentDate: '2025-04-18', dateAdded: '2025-04-20', pages: 6, sizeMb: 1.1,
  passages: [
    'Internal Quality Assurance Audit Team is authorized to examine all departmental documents, faculty syllabi, and student rating evaluations.',
    'Non-compliant parameters shall be issued Corrective Action Requests (CAR) returnable within 15 working days.'
  ]
},
{
  ...base,
  id: 'd-111',
  campus: 'Main Campus (Tandag City)',
  title: 'Official President Endorsement Letter to AACCUP Secretariat — 2025 Surveys',
  description: 'Confidential transmittal and endorsement letter signed by University President Dr. Nemesio G. Loayon submitting official application for survey visit.',
  keywords: ['endorsement letter', 'transmittal', 'AACCUP Secretariat', 'president endorsement', 'confidential'],
  frameworkId: 'ia', areaId: 'governance', criterionId: 'c-ia-1', indicatorId: 'i-1-1', requirementId: 'r-1-1-a',
  docType: 'Report', academicYear: '2025–2026',
  office: 'Office of the President', cycle: '2025 Institutional Accreditation',
  confidentiality: 'Confidential', commonDocType: 'Endorsement Letter',
  documentUrl: 'https://nemsu.edu.ph/qa/confidential/President_Endorsement_Letter_AACCUP_2025.pdf',
  documentDate: '2025-06-02', dateAdded: '2025-06-05', pages: 3, sizeMb: 0.8,
  passages: [
    'The University formally endorses the Institutional Accreditation and Program Accreditation applications for 24 academic offerings across NEMSU campuses.',
    'The university commits to facilitating on-site evaluation, remote digital document verification, and stakeholder interview sessions.'
  ]
},
{
  ...base,
  id: 'd-112',
  campus: 'Cantilan Campus',
  title: 'Campus Director Endorsement Letter for Level III Survey Visit — Cantilan Programs',
  description: 'Confidential endorsement letter from Cantilan Campus Director endorsing BSED, BSIT, and BSBA for Level III 2nd Survey.',
  keywords: ['endorsement letter', 'Cantilan', 'campus director', 'Level III survey', 'endorsement'],
  frameworkId: 'pa', areaId: 'governance', criterionId: 'c-pa-1', indicatorId: 'i-pa1-1', requirementId: 'r-pa1-1-a',
  docType: 'Report', academicYear: '2024–2025', program: 'Bachelor of Secondary Education',
  office: 'Campus Director Office - Cantilan', cycle: '2024 Program Accreditation (Level III)',
  confidentiality: 'Confidential', commonDocType: 'Endorsement Letter',
  documentUrl: 'https://nemsu.edu.ph/qa/confidential/Endorsement_Letter_Cantilan_Level_III.pdf',
  documentDate: '2024-09-08', dateAdded: '2024-09-12', pages: 3, sizeMb: 0.7,
  passages: [
    'Cantilan Campus certifies that required institutional improvements and faculty credentials have met Level III standards.',
    'Submitted together with comprehensive Program Performance Profiles and compliance matrices.'
  ]
},
{
  ...base,
  id: 'd-113',
  campus: 'Main Campus (Tandag City)',
  title: 'AACCUP Summary of Findings and Recommendations — Tandag Campus Programs',
  description: 'Consolidated official summary of survey findings, strength commendations, and quality improvement recommendations delivered by the AACCUP Accreditor Team.',
  keywords: ['summary of findings', 'recommendations', 'AACCUP findings', 'survey results', 'Tandag'],
  frameworkId: 'pa', areaId: 'qa', criterionId: 'c-pa-9', indicatorId: 'i-pa9-1', requirementId: 'r-pa9-1-a',
  docType: 'Report', academicYear: '2024–2025', program: 'Institution-wide',
  office: 'Quality Assurance Office', cycle: '2024 Program Accreditation (Level III)',
  confidentiality: 'Internal', commonDocType: 'Summary of Findings and Recommendations',
  documentUrl: 'https://nemsu.edu.ph/qa/reports/AACCUP_Summary_Findings_Tandag_2024.pdf',
  documentDate: '2024-12-05', dateAdded: '2024-12-18', pages: 58, sizeMb: 6.2,
  passages: [
    'Commended for modern smart classrooms, high graduate employment rate in BSIT, and strong research culture among permanent faculty.',
    'Key Recommendation: Increase budget for international research journal publication subsidies and student exchange partnerships.'
  ]
},
{
  ...base,
  id: 'd-114',
  campus: 'Cantilan Campus',
  title: 'AACCUP Summary of Findings and Recommendations — Cantilan Campus Survey Visit',
  description: 'Official survey findings report from AACCUP peer accreditors evaluating Teacher Education, Industrial Technology, and Computing offerings in Cantilan.',
  keywords: ['summary of findings', 'recommendations', 'Cantilan', 'AACCUP survey', 'findings report'],
  frameworkId: 'pa', areaId: 'qa', criterionId: 'c-pa-9', indicatorId: 'i-pa9-1', requirementId: 'r-pa9-1-a',
  docType: 'Report', academicYear: '2024–2025', program: 'Institution-wide',
  office: 'Quality Assurance Unit - Cantilan', cycle: '2024 Program Accreditation (Level III)',
  confidentiality: 'Internal', commonDocType: 'Summary of Findings and Recommendations',
  documentUrl: 'https://nemsu.edu.ph/qa/reports/AACCUP_Summary_Findings_Cantilan_2024.pdf',
  documentDate: '2024-11-28', dateAdded: '2024-12-10', pages: 52, sizeMb: 5.4,
  passages: [
    'High ratings awarded in Community Linkages (Area V) and Physical Plant facilities (Area VIII).',
    'Recommendation: Pursue Level IV accreditation eligibility for Teacher Education by increasing doctoral degree holder ratio among faculty.'
  ]
},
{
  ...base,
  id: 'd-115',
  campus: 'Main Campus (Tandag City)',
  title: 'BOR Resolution No. 45, Series of 2024: Approval of Enhanced Outcomes-Based Curricula',
  description: 'Board of Regents resolution formally approving revised curricula, syllabi, and educational policies aligned with AACCUP Level IV and CHED PSG guidelines.',
  keywords: ['BOR resolution', 'board of regents', 'curriculum approval', 'OBE', 'Tandag', 'university resolution'],
  frameworkId: 'ia', areaId: 'governance', criterionId: 'c-ia-1', indicatorId: 'i-1-1', requirementId: 'r-1-1-a',
  docType: 'Policy', academicYear: '2024–2025', program: 'Institution-wide',
  office: 'Office of the University Secretary', cycle: '2025 Institutional Accreditation',
  confidentiality: 'Public', commonDocType: 'Board of Regents (BOR) Resolution',
  documentUrl: 'https://nemsu.edu.ph/qa/bor/BOR_Resolution_No_45_Series_2024.pdf',
  documentDate: '2024-06-25', dateAdded: '2024-07-02', pages: 12, sizeMb: 2.1,
  passages: [
    'RESOLVED, AS IT IS HEREBY RESOLVED, that the Board of Regents of North Eastern Mindanao State University approves the revised OBE curricula for all undergraduate programs.',
    'Passed and approved during the 84th Regular Meeting of the Board of Regents held at CHED Central Office, Diliman, Quezon City.'
  ]
},
{
  ...base,
  id: 'd-116',
  campus: 'Main Campus (Tandag City)',
  title: 'BOR Resolution No. 88, Series of 2023: Establishment of the University Quality Assurance Center',
  description: 'Official Board of Regents resolution institutionalizing the University Quality Assurance Center (UQAC) and establishing QA units across all 7 campuses.',
  keywords: ['BOR resolution', 'board of regents', 'quality assurance center', 'UQAC', 'governance'],
  frameworkId: 'ia', areaId: 'governance', criterionId: 'c-ia-1', indicatorId: 'i-1-1', requirementId: 'r-1-1-a',
  docType: 'Policy', academicYear: '2023–2024', program: 'Institution-wide',
  office: 'Office of the University Secretary', cycle: '2025 Institutional Accreditation',
  confidentiality: 'Public', commonDocType: 'Board of Regents (BOR) Resolution',
  documentUrl: 'https://nemsu.edu.ph/qa/bor/BOR_Resolution_No_88_Series_2023.pdf',
  documentDate: '2023-11-14', dateAdded: '2023-11-20', pages: 8, sizeMb: 1.4,
  passages: [
    'RESOLVED, to establish the University Quality Assurance Center with permanent personnel items to oversee institutional accreditation, COPC, and ISO certifications.',
    'Approving the University Quality Policy and assigning Campus Quality Assurance Coordinators for each of the 7 satellite campuses.'
  ]
}];