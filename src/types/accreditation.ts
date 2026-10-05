export type CampusId = 'tandag' | 'cantilan' | 'cagwait' | 'san-miguel' | 'lianga' | 'tagbina' | 'bislig';

export interface Campus {
  id: CampusId;
  name: string;
  shortName: string;
  location: string;
  isMain: boolean;
  director: string;
  email: string;
  phone: string;
  establishedYear: number;
}

export type AccreditationLevel = 
  | 'Candidate'
  | 'Level 1'
  | 'Level 2'
  | 'Level 3'
  | 'Level 4'
  | 'Not Accreditable'
  | 'for accreditation'
  | 'waiting';

export type IALevel =
  | 'Candidate'
  | 'Level I Accredited'
  | 'Level II Re-accredited'
  | 'Level III Re-accredited'
  | 'Level IV Institutional Accreditation'
  | 'Under Evaluation';

export type PQARecognitionLevel =
  | 'Candidate'
  | 'Level 1: Commitment to Quality Management'
  | 'Level 2: Proficiency in Quality Management'
  | 'Level 3: Mastery in Quality Management'
  | 'Level 4: Philippine Quality Award for Performance Excellence';

export type RequirementVerificationStatus = 'Approved' | 'Under Review' | 'Deficient' | 'Pending';

export interface IARequirementItem {
  id: string;
  areaCode: string;
  areaName: string;
  title: string;
  description: string;
  isSubmitted: boolean;
  submissionDate?: string;
  documentName?: string;
  documentUrl?: string;
  status: RequirementVerificationStatus;
  reviewerNotes?: string;
  lastUpdated?: string;
}

export interface CampusIAStatus {
  campusId: CampusId;
  status: IALevel;
  validityStart: string;
  validityEnd: string;
  certificationFile?: string;
  certificateUrl?: string;
  surveyBody: string;
  lastEvaluationDate: string;
  nextScheduledEvaluation: string;
  remarks: string;
  requirements: IARequirementItem[];
}

export interface PQACategoryScore {
  categoryId: string;
  categoryNumber: number;
  categoryName: string;
  maxScore: number;
  awardedScore: number;
  status: 'Met' | 'Partially Met' | 'Deficient';
  evidenceSubmittedCount: number;
  evidenceRequiredCount: number;
  narrativeSummary: string;
}

export interface CampusPQAStatus {
  campusId: CampusId;
  recognitionLevel: PQARecognitionLevel;
  cycle: string;
  overallScore: number;
  evaluationStatus: 'Awarded' | 'Under Assessment' | 'Preparing Application' | 'Eligible';
  lastAssessmentDate: string;
  nextAssessmentCycle: string;
  feedbackSummary: string;
  categories: PQACategoryScore[];
}

export interface ProgramRequirementItem {
  id: string;
  areaCode: string;
  areaName: string;
  title: string;
  isSubmitted: boolean;
  submissionDate?: string;
  documentName?: string;
  documentUrl?: string;
  verified: boolean;
  remarks?: string;
}

export interface ProgramAccreditation {
  id: string;
  campusId: CampusId;
  campusName: string;
  programName: string;
  degreeLevel: 'Undergraduate' | 'Graduate';
  yearOfInitialOperation: string;
  status: AccreditationLevel;
  validityStart: string;
  validityEnd: string;
  certificationFile?: string;
  instrumentLink?: string;
  findingsLink?: string;
  technicalReviewLink?: string;
  copcStatus: 'Compliant' | 'Pending' | 'Not Applicable';
  copcCertificateNumber?: string;
  borRes?: string;
  cmoNo?: string;
  levelStatusForAccreditation?: string;
  scheduleForAccreditation?: string;
  remarks?: string;
  requirements?: ProgramRequirementItem[];
}

export interface COPCRequirementItem {
  id: string;
  requirementName: string;
  code: string;
  category: 'Curriculum' | 'Faculty' | 'Laboratories' | 'Library' | 'Administration' | 'Practicum';
  isSubmitted: boolean;
  documentName?: string;
  documentUrl?: string;
  status: RequirementVerificationStatus;
  deficiencyNote?: string;
}

export interface COPCRecord {
  id: string;
  programId: string;
  campusId: CampusId;
  campusName: string;
  programName: string;
  degreeLevel: 'Undergraduate' | 'Graduate';
  copcStatus: 'Compliant' | 'Pending Review' | 'Non-Compliant' | 'Not Applicable (Under 5 years)';
  certificateNumber?: string;
  dateIssued?: string;
  cmoNo?: string;
  borRes?: string;
  documentLink?: string;
  remarks?: string;
  requirements: COPCRequirementItem[];
}

export type ISOComplianceStatus = 'Compliant' | 'Minor Deficiencies' | 'Major Deficiencies Pending Action' | 'Certified';

export interface ISOClauseEvaluation {
  clauseNumber: string;
  clauseTitle: string;
  status: 'Conforming' | 'Opportunity for Improvement' | 'Minor Non-Conformance' | 'Major Non-Conformance';
  notes: string;
  evidenceChecked: string;
  auditor: string;
}

export interface ISOCorrectiveAction {
  id: string;
  carNumber: string;
  clauseRef: string;
  deficiencyDescription: string;
  rootCause: string;
  correction: string;
  correctiveAction: string;
  responsiblePerson: string;
  targetDate: string;
  status: 'Open' | 'In Progress' | 'Closed / Verified';
  verificationDate?: string;
  verifiedBy?: string;
}

export interface ISOSurveillanceRecord {
  id: string;
  campusId: CampusId;
  campusName: string;
  auditDate: string;
  cycle: string;
  auditType: 'Surveillance Audit 1' | 'Surveillance Audit 2' | 'Recertification Audit' | 'Internal Quality Audit';
  leadAuditor: string;
  auditorRole: string;
  scope: string;
  complianceStatus: ISOComplianceStatus;
  summary: string;
  findingsCount: {
    conformances: number;
    ofi: number;
    minorNC: number;
    majorNC: number;
  };
  clausesEvaluated: ISOClauseEvaluation[];
  correctiveActions: ISOCorrectiveAction[];
  validationDate?: string;
  validatedBy?: string;
}
