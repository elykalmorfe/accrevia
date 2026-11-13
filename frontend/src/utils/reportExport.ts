import { AccessLogEntry } from '../types/sharing';
import { Campus, CampusIAStatus, ISOSurveillanceRecord, ProgramAccreditation } from '../types/accreditation';
import { Criterion, EvidenceDocument, Framework, Indicator } from '../types/evidence';
import { CsvCell } from './csv';
import { coverageLabels, coverageLevel, countForCriterion } from './coverage';
import { formatLevel, formatReportDate, statusLabel } from './programAccreditation';
import {
  activeDocuments,
  buildAttentionItems,
  describeDays,
  describeDeadline,
  getProgramReadiness,
  reviewState
} from './reportMetrics';

export type ReportTab = 'summary' | 'readiness' | 'accreditation' | 'coverage' | 'documents' | 'usage';

export interface ReportExportData {
  campuses: Campus[];
  programs: ProgramAccreditation[];
  documents: EvidenceDocument[];
  iaRecords: CampusIAStatus[];
  isoRecords: ISOSurveillanceRecord[];
  frameworks: Framework[];
  criteria: Criterion[];
  indicators: Indicator[];
  accessLog: AccessLogEntry[];
  allDocuments: EvidenceDocument[];
}

export interface ReportExport {
  title: string;
  headers: string[];
  rows: CsvCell[][];
}

export function buildReportExport(tab: ReportTab, data: ReportExportData): ReportExport {
  const campusName = (id?: string) => data.campuses.find((c) => c.id === id)?.shortName ?? id ?? '';
  const frameworkName = (id: string) => data.frameworks.find((f) => f.id === id)?.shortName ?? id;

  switch (tab) {
    case 'summary':
      return {
        title: 'What needs attention',
        headers: ['Priority', 'Item', 'Details', 'Next step'],
        rows: buildAttentionItems({
          programs: data.programs,
          iaRecords: data.iaRecords,
          campuses: data.campuses,
          documents: data.documents,
          isoRecords: data.isoRecords
        }).map((i) => [i.health === 'danger' ? 'Action needed now' : 'Needs attention soon', i.title, i.detail, i.action])
      };

    case 'readiness':
      return {
        title: 'Survey readiness',
        headers: ['Program', 'Campus', 'Current level', 'Requirements submitted', 'Total requirements', 'Verified', 'Submitted (%)', 'Status', 'Next deadline', 'When'],
        rows: data.programs.map((p) => {
          const r = getProgramReadiness(p);
          return [
            p.programName,
            campusName(p.campusId),
            formatLevel(p.status),
            r.submitted,
            r.total,
            r.verified,
            r.percent,
            r.level,
            r.deadline ? describeDeadline(r.deadline) : 'No date set',
            r.deadline ? describeDays(r.deadline.daysRemaining) : ''
          ];
        })
      };

    case 'accreditation':
      return {
        title: 'Program accreditation status',
        headers: ['Program', 'Campus', 'Degree level', 'First offered', 'Accreditation level', 'Valid from', 'Valid to', 'COPC', 'Next survey', 'Remarks'],
        rows: data.programs.map((p) => [
          p.programName,
          campusName(p.campusId),
          p.degreeLevel,
          p.yearOfInitialOperation,
          statusLabel(p.status),
          formatReportDate(p.validityStart),
          formatReportDate(p.validityEnd),
          p.copcStatus,
          p.scheduleForAccreditation,
          p.remarks
        ])
      };

    case 'coverage':
      return {
        title: 'Evidence coverage',
        headers: ['Criterion', 'Name', 'Framework', 'Requirements', 'Documents', 'Evidence'],
        rows: data.criteria.map((c) => {
          const count = countForCriterion(data.documents, c.id);
          return [c.code, c.name, frameworkName(c.frameworkId), data.indicators.filter((i) => i.criterionId === c.id).length, count, coverageLabels[coverageLevel(count)]];
        })
      };

    case 'documents':
      return {
        title: 'Documents',
        headers: ['Title', 'Framework', 'Criterion', 'Campus', 'Academic year', 'Review status', 'Processing status', 'Date added', 'Valid until', 'Uploaded by'],
        rows: activeDocuments(data.documents).map((d) => [
          d.title,
          frameworkName(d.frameworkId),
          data.criteria.find((c) => c.id === d.criterionId)?.code ?? '',
          d.campus,
          d.academicYear,
          reviewState(d),
          d.status,
          formatReportDate(d.dateAdded.slice(0, 10)),
          d.validUntil ? formatReportDate(d.validUntil) : '',
          d.uploadedBy
        ])
      };

    case 'usage': {
      const scope = new Set(data.documents.map((d) => d.id));
      return {
        title: 'Document activity',
        headers: ['Date and time', 'Person', 'Role', 'Action', 'Document', 'Details'],
        rows: data.accessLog
          .filter((e) => scope.has(e.documentId))
          .map((e) => [
            new Date(e.at).toLocaleString('en-US'),
            e.actor,
            e.actorRole,
            e.action,
            data.allDocuments.find((d) => d.id === e.documentId)?.title ?? e.documentId,
            e.detail
          ])
      };
    }
  }
}
