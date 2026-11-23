import type { ReportSignatories } from '../../../data/reportTemplates';
import type { COPCRecord } from '../../../types/accreditation';
import { formatPrintTimestamp } from '../../../utils/print';
import { ReportHeader, ReportMeta, SignatoryBlock } from './PrintControls';

const COPC_SUMMARY_CSS = `
.copc-summary .pr-table { table-layout: fixed; }
.copc-summary .copc-group-heading { break-after: avoid; page-break-after: avoid; }
.copc-summary .copc-group-heading th { background: #f3f6fa; }
.copc-summary .copc-degree-heading { font-style: italic; font-weight: normal; }
`;

const statusLabels: Record<COPCRecord['copcStatus'], string> = {
  Compliant: '✓ With COPC',
  'Pending Review': 'Pending Review',
  'Non-Compliant': 'Without COPC',
  'Not Applicable (Under 5 years)': 'Not Applicable (Under 5 years)'
};

function ProgramRows({ records }: { records: COPCRecord[] }) {
  return (
    <>
      {records.map((record, index) => (
        <tr key={record.id}>
          <td className="pr-c">{index + 1}</td>
          <td>{record.programName}</td>
          <td className="pr-c">{statusLabels[record.copcStatus] || record.copcStatus}</td>
        </tr>
      ))}
    </>
  );
}

interface COPCSummaryDocumentProps {
  records: COPCRecord[];
  scopeLabel: string;
  generatedAt: Date;
  signatories: ReportSignatories;
  printedAt?: Date;
}

export function COPCSummaryDocument({ records, scopeLabel, generatedAt, signatories, printedAt }: COPCSummaryDocumentProps) {
  const byCampus = new Map<COPCRecord['campusId'], COPCRecord[]>();
  for (const record of records) {
    const group = byCampus.get(record.campusId);
    if (group) group.push(record);
    else byCampus.set(record.campusId, [record]);
  }

  return (
    <article className="pr-doc copc-summary">
      <style>{COPC_SUMMARY_CSS}</style>
      <ReportHeader title="COPC Summary Report" subtitle="Certificate of Program Compliance (COPC)" centerLogo />
      <ReportMeta items={[
        { label: 'Scope', value: scopeLabel },
        { label: 'Report generated', value: formatPrintTimestamp(generatedAt) },
        { label: 'Printed', value: printedAt ? formatPrintTimestamp(printedAt) : 'Stamped automatically at print time' }
      ]} />
      <table className="pr-table pr-section">
        <colgroup>
          <col style={{ width: '7%' }} />
          <col style={{ width: '68%' }} />
          <col style={{ width: '25%' }} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className="pr-c">No.</th>
            <th scope="col">Academic Programs</th>
            <th scope="col" className="pr-c">COPC Status</th>
          </tr>
        </thead>
        {records.length === 0 && (
          <tbody>
            <tr><td className="pr-empty" colSpan={3}>No COPC records for this campus.</td></tr>
          </tbody>
        )}
        {Array.from(byCampus, ([campusId, campusRecords]) => {
          const undergraduate = campusRecords.filter((record) => record.degreeLevel !== 'Graduate');
          const graduate = campusRecords.filter((record) => record.degreeLevel === 'Graduate');
          return (
            <tbody key={campusId}>
              <tr className="copc-group-heading">
                <th scope="rowgroup" colSpan={3}>{campusRecords[0].campusName}</th>
              </tr>
              <ProgramRows records={undergraduate} />
              {graduate.length > 0 && (
                <>
                  <tr className="copc-group-heading">
                    <th className="copc-degree-heading" colSpan={3}>Graduate School</th>
                  </tr>
                  <ProgramRows records={graduate} />
                </>
              )}
            </tbody>
          );
        })}
      </table>
      <SignatoryBlock signatories={signatories} printedAt={printedAt} />
    </article>
  );
}
