import { Confidentiality, DocumentType } from '../types/evidence';
import { UserRole } from '../types/user';

export const documentTypes: DocumentType[] = [
'Report',
'Certificate',
'Policy',
'Manual',
'Memorandum',
'Meeting Minutes',
'Faculty Record',
'Student Record',
'Statistical Report',
'Accomplishment Report',
'Plan',
'Photo / Documentation',
'Other'];


export const academicYears = ['2025–2026', '2024–2025', '2023–2024', '2022–2023', '2021–2022'];

export const accreditationCycles = [
'2025 Institutional Accreditation',
'2024 Program Accreditation (Level III)',
'2025 COPC Evaluation',
'2025 PQA Application',
'2025 ISO Surveillance Audit'];


export const campuses = ['Main Campus (Tandag City)', 'Bislig Campus', 'Cantilan Campus', 'Cagwait Campus', 'Lianga Campus', 'San Miguel Campus', 'Tagbina Campus'];

export const colleges = [
'University-wide',
'College of Information Technology Education',
'College of Teacher Education',
'College of Engineering',
'College of Arts and Sciences',
'College of Business and Management'];


export const departments = [
'—',
'Department of Information Technology',
'Department of Computer Science',
'Department of Secondary Education',
'Department of Elementary Education',
'Department of Civil Engineering',
'Department of Biology'];


export const programs = [
'Institution-wide',
'BS Information Technology',
'BS Computer Science',
'Bachelor of Secondary Education',
'Bachelor of Elementary Education',
'BS Civil Engineering',
'BS Electrical Engineering',
'BS Biology',
'BS Business Administration'];


export const offices = [
'Quality Assurance Office',
'Human Resource Management Office',
'Research and Development Office',
'Extension Services Office',
'Office of Student Affairs and Services',
'University Library',
'Planning and Development Office',
'Office of the University Secretary',
'Office of the VP for Academic Affairs',
'Physical Plant and Facilities Office',
'Office of the President',
'Management Information Systems Office',
'College of Information Technology Education',
'College of Teacher Education',
'College of Engineering',
'College of Arts and Sciences'];


export const confidentialityLevels: Confidentiality[] = ['Public', 'Internal', 'Confidential'];

export const userRoles: UserRole[] = ['Administrator', 'QA Personnel', 'Faculty', 'Staff', 'Accreditor'];

export const searchSuggestions = [
'faculty development activities',
'documents showing evidence of faculty professional development',
'Criterion 2.1',
'ISO internal audit',
'faculty development evidence for institutional accreditation 2025'];