import { PendingDocument } from '../types/evidence';

export const pendingDocuments: PendingDocument[] = [
{
  id: 'p-01', fileName: 'Scan_FacultySeminar_Aug2025.pdf', extractedTitle: 'Seminar-Workshop on Outcomes-Based Teaching and Learning',
  fileType: 'PDF', pages: 6, sizeMb: 4.2, uploadedBy: 'Jun Carlo P. Esteban', uploadedAt: '2026-09-30T14:12:00', ocr: true,
  excerpt: 'This certifies that the faculty members listed below attended the three-day Seminar-Workshop on Outcomes-Based Teaching and Learning held on August 18–20, 2025.',
  suggestion: { frameworkId: 'ia', areaId: 'faculty', docType: 'Certificate', confidence: 0.87 }
},
{
  id: 'p-02', fileName: 'OSAS_Guidance_Report_2025.docx', extractedTitle: 'Guidance and Counseling Services Annual Report 2025',
  fileType: 'DOCX', pages: 24, sizeMb: 1.1, uploadedBy: 'Liza M. Cabrera', uploadedAt: '2026-09-30T10:40:00', ocr: false,
  excerpt: 'The Guidance and Counseling Unit served 3,412 students through individual counseling, career guidance, and mental health awareness sessions.',
  suggestion: { frameworkId: 'ia', areaId: 'students', docType: 'Report', confidence: 0.91 }
},
{
  id: 'p-03', fileName: 'Lab_Inventory_CITE.xlsx', extractedTitle: 'CITE Computer Laboratory Equipment Inventory',
  fileType: 'XLSX', pages: 4, sizeMb: 0.4, uploadedBy: 'Arnel B. Lupian', uploadedAt: '2026-09-29T16:05:00', ocr: false,
  excerpt: 'Inventory of 160 workstations, network equipment, and licensed software across four computer laboratories of the College of Information Technology Education.',
  suggestion: { frameworkId: 'copc', areaId: 'labs', docType: 'Statistical Report', confidence: 0.78 }
},
{
  id: 'p-04', fileName: 'IQA_Corrective_Actions.pdf', extractedTitle: 'Corrective Action Requests – Internal Quality Audit 2025',
  fileType: 'PDF', pages: 11, sizeMb: 0.9, uploadedBy: 'Liza M. Cabrera', uploadedAt: '2026-09-29T09:22:00', ocr: false,
  excerpt: 'Corrective Action Request No. 2025-03 addresses the nonconformity on document control in the Registrar’s Office.',
  suggestion: { frameworkId: 'iso', areaId: 'qa', docType: 'Report', confidence: 0.93 }
},
{
  id: 'p-05', fileName: 'Extension_MOA_Tandag.pdf', extractedTitle: 'Memorandum of Agreement – LGU Tandag Literacy Program',
  fileType: 'PDF', pages: 5, sizeMb: 2.7, uploadedBy: 'Jun Carlo P. Esteban', uploadedAt: '2026-09-28T15:48:00', ocr: true,
  excerpt: 'This Memorandum of Agreement is entered into by North Eastern Mindanao State University and the City Government of Tandag for the Community Literacy Program.',
  suggestion: { frameworkId: 'ia', areaId: 'extension', docType: 'Other', confidence: 0.64 }
},
{
  id: 'p-06', fileName: 'Research_Colloquium_Photos.jpg', extractedTitle: 'Research Colloquium 2025 Documentation',
  fileType: 'JPG', pages: 1, sizeMb: 3.4, uploadedBy: 'Gemma R. Plaza', uploadedAt: '2026-09-28T11:03:00', ocr: true,
  excerpt: 'Photo of faculty presenters during the 2025 University Research Colloquium, University Gymnasium.',
  suggestion: { frameworkId: 'ia', areaId: 'research', docType: 'Photo / Documentation', confidence: 0.58 }
},
{
  id: 'p-07', fileName: 'Memo_No_32_s2025.pdf', extractedTitle: 'Memorandum No. 32, s. 2025 – Accreditation Task Force',
  fileType: 'PDF', pages: 2, sizeMb: 0.2, uploadedBy: 'Liza M. Cabrera', uploadedAt: '2026-09-27T13:30:00', ocr: false,
  excerpt: 'Constitution of the Institutional Accreditation Task Force and designation of area chairs for the 2025 survey visit.',
  suggestion: { frameworkId: 'ia', areaId: 'qa', docType: 'Memorandum', confidence: 0.82 }
},
{
  id: 'p-08', fileName: 'BSEd_Practice_Teaching_Records.pdf', extractedTitle: 'BSEd Practice Teaching Records AY 2024–2025',
  fileType: 'PDF', pages: 38, sizeMb: 5.0, uploadedBy: 'Teresita A. Gonzaga', uploadedAt: '2026-09-26T08:55:00', ocr: false,
  excerpt: 'Practice teaching placements, cooperating schools, and performance ratings of 214 BSEd student teachers.',
  suggestion: { frameworkId: 'pa', areaId: 'curriculum', docType: 'Student Record', confidence: 0.71 }
}];