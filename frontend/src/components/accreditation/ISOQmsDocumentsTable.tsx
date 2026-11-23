import workbookRows from '../../data/isoQmsDocuments.json';

type WorkbookCell = string | { text: string; href: string } | null;
const rows: { sourceRow: number; cells: WorkbookCell[] }[] = workbookRows;

const procedureColumns = [
  { label: 'Responsible Office', width: '12%' },
  { label: 'Document Name', width: '17%' },
  { label: 'Document No.', width: '8%' },
  { label: 'Revision No.', width: '5%' },
  { label: 'Date Effective', width: '8%' }
];
const formColumns = [
  { label: 'Document Name', width: '20%' },
  { label: 'Document No.', width: '8%' },
  { label: 'Revision No.', width: '5%' },
  { label: 'Date Effective', width: '8%' }
];
const columns = [...procedureColumns, ...formColumns];
const cellClass = 'border-b border-r border-line px-3 py-2 align-top';

function CellValue({ cell }: { cell: WorkbookCell }) {
  if (!cell || typeof cell === 'string') return cell;
  return (
    <a href={cell.href} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-700 underline underline-offset-2 hover:text-brand-900">
      {cell.text}
    </a>
  );
}

export function ISOQmsDocumentsTable() {
  return (
    <section className="panel mb-6 overflow-hidden" aria-labelledby="iso-qms-documents-title">
      <div className="border-b border-line px-4 py-3.5 text-center sm:px-5">
        <h2 id="iso-qms-documents-title" className="text-base font-bold text-ink">
          Updated List of Procedure Manuals and Controlled Forms
        </h2>
      </div>
      <div className="max-h-[34rem] overflow-auto" role="region" aria-labelledby="iso-qms-documents-title" tabIndex={0}>
        <table className="w-full min-w-[80rem] table-fixed border-separate border-spacing-0 text-left text-xs leading-relaxed">
          {[procedureColumns, formColumns, [{ label: 'Unit Manual', width: '9%' }]].map((group, index) => (
            <colgroup key={index}>
              {group.map((column) => <col key={column.label} style={{ width: column.width }} />)}
            </colgroup>
          ))}
          <thead className="sticky top-0 z-10">
            <tr className="bg-brand-50 text-center font-bold text-brand-800">
              <th scope="colgroup" colSpan={procedureColumns.length} className={cellClass}>Procedural Manuals</th>
              <th scope="colgroup" colSpan={formColumns.length} className={cellClass}>Controlled Forms</th>
              <th scope="col" rowSpan={2} className="border-b border-line px-3 py-2 align-middle">Unit Manual</th>
            </tr>
            <tr className="bg-canvas text-ink">
              {columns.map((column, index) => (
                <th scope="col" className={cellClass} key={index}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ sourceRow, cells }) => (
              <tr key={sourceRow} className="bg-surface-raised text-ink even:bg-canvas/50">
                {cells.map((cell, index) => index === 0 && cell ? (
                  <th key={index} scope="row" className={`${cellClass} font-semibold`}><CellValue cell={cell} /></th>
                ) : (
                  <td key={index} className={`${cellClass} whitespace-pre-line last:border-r-0`}><CellValue cell={cell} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
