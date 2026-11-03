import { ReactNode } from 'react';
import { ProgramAccreditation } from '../../../types/accreditation';
import { REPORT_INSTITUTION, ReportSignatories } from '../../../data/reportTemplates';
import { formatPrintTimestamp } from '../../../utils/print';
import {
  accreditedCount,
  compareYears,
  describeDaysRemaining,
  formatLevel,
  formatReportDate,
  formatValidity,
  getExpiryInfo,
  getLevelHistory,
  getRenewalAction,
  getResultRows,
  levelAsOf,
  levelDistribution,
  levelRank,
  parseAccreditationDate,
  yearRange
} from '../../../utils/programAccreditation';

export interface DocumentChrome {
  generatedAt: Date;
  printedAt: Date | null;
  signatories: ReportSignatories;
  copyIndex?: number;
  copyCount?: number;
}

function printedLabel(printedAt: Date | null): string {
  return printedAt ? formatPrintTimestamp(printedAt) : 'Stamped automatically at print time';
}

function ReportHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <>
      <div className="pr-header">
        <img className="pr-logo" src={REPORT_INSTITUTION.logoPath} alt="" />
        <div className="pr-header-text">
          <div className="pr-republic">{REPORT_INSTITUTION.republic}</div>
          <div className="pr-univ">{REPORT_INSTITUTION.university}</div>
          <div className="pr-office">{REPORT_INSTITUTION.office}</div>
          <div className="pr-address">{REPORT_INSTITUTION.address}</div>
        </div>
        <div className="pr-header-spacer" />
      </div>
      <h1 className="pr-title">{title}</h1>
      {subtitle && <p className="pr-subtitle">{subtitle}</p>}
    </>
  );
}

function ReportMeta({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <div className="pr-meta">
      {items.map((item) => (
        <span key={item.label}>
          {item.label}: <b>{item.value}</b>
        </span>
      ))}
    </div>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="pr-section">
      <h2 className="pr-section-title">{title}</h2>
      {children}
      {note && <p className="pr-note">{note}</p>}
    </section>
  );
}

function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) {
  return (
    <tr>
      <td className="pr-empty" colSpan={colSpan}>
        {text}
      </td>
    </tr>
  );
}

function SignatoryBlock({ signatories, printedAt }: { signatories: ReportSignatories; printedAt: Date | null }) {
  const blocks = [
    { label: 'Prepared by:', person: signatories.preparedBy },
    { label: 'Checked by:', person: signatories.checkedBy }
  ];
  const dateText = printedAt ? printedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  return (
    <div className="pr-signatories">
      {blocks.map(({ label, person }) => (
        <div key={label}>
          <div className="pr-sign-label">{label}</div>
          <div className="pr-sign-line">
            <div className="pr-sign-name">{person.name || '\u00a0'}</div>
            <div className="pr-sign-role">{person.designation || 'Name and Designation'}</div>
          </div>
          <div className="pr-sign-date">Date: {dateText}</div>
        </div>
      ))}
    </div>
  );
}

function ReportFooter({ chrome, documentCode }: { chrome: DocumentChrome; documentCode: string }) {
  const copy = chrome.copyCount && chrome.copyCount > 1 ? ` · Copy ${chrome.copyIndex} of ${chrome.copyCount}` : '';
  return (
    <div className="pr-footer">
      <span>
        {documentCode} · Generated {formatPrintTimestamp(chrome.generatedAt)}
      </span>
      <span>
        Printed {printedLabel(chrome.printedAt)}
        {copy}
      </span>
    </div>
  );
}

function ResultCell({ result }: { result: string }) {
  const cls = result === 'Passed' ? 'pr-pass' : result === 'Failed' ? 'pr-fail' : 'pr-pending';
  return <span className={cls}>{result}</span>;
}

function YearComparisonTable({ programs, years }: { programs: ProgramAccreditation[]; years: number[] }) {
  const distributions = years.map((y) => levelDistribution(programs, y));
  const improvedVsPrevious = years.map((y, i) => (i === 0 ? null : compareYears(programs, years[i - 1], y).improved.length));
  const rows: { label: string; key: 'Level 4' | 'Level 3' | 'Level 2' | 'Level 1' | 'Candidate' | 'none' }[] = [
    { label: 'Level IV', key: 'Level 4' },
    { label: 'Level III', key: 'Level 3' },
    { label: 'Level II', key: 'Level 2' },
    { label: 'Level I', key: 'Level 1' },
    { label: 'Candidate', key: 'Candidate' },
    { label: 'No recorded level', key: 'none' }
  ];

  return (
    <table className="pr-table">
      <thead>
        <tr>
          <th>Accreditation Level (as of 31 Dec)</th>
          {years.map((y) => (
            <th key={y} className="pr-c">
              {y}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key}>
            <td>{row.label}</td>
            {distributions.map((d, i) => (
              <td key={years[i]} className="pr-c">
                {d[row.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td>Accredited (Level I–IV)</td>
          {distributions.map((d, i) => (
            <td key={years[i]} className="pr-c">
              {accreditedCount(d)}
            </td>
          ))}
        </tr>
        <tr>
          <td>Programs that moved up a level vs previous year</td>
          {improvedVsPrevious.map((n, i) => (
            <td key={years[i]} className="pr-c">
              {n === null ? '—' : n}
            </td>
          ))}
        </tr>
      </tfoot>
    </table>
  );
}

function ExpiryTable({ rows, now }: { rows: ProgramAccreditation[]; now: Date }) {
  return (
    <table className="pr-table">
      <thead>
        <tr>
          <th className="pr-c">#</th>
          <th>Program</th>
          <th>Campus</th>
          <th>Level</th>
          <th>Validity Period</th>
          <th>Time Remaining</th>
          <th>Recommended Action</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <EmptyRow colSpan={7} text="No programs in this category." />
        ) : (
          rows.map((p, i) => {
            const info = getExpiryInfo(p, now);
            return (
              <tr key={p.id}>
                <td className="pr-c">{i + 1}</td>
                <td>{p.programName}</td>
                <td>{p.campusName.replace(' Campus', '')}</td>
                <td>{formatLevel(p.status)}</td>
                <td>{formatValidity(p)}</td>
                <td className={info.state === 'expired' ? 'pr-expired' : 'pr-expiring'}>{describeDaysRemaining(info)}</td>
                <td>{getRenewalAction(p)}</td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}

function sortByEnd(a: ProgramAccreditation, b: ProgramAccreditation): number {
  const ea = parseAccreditationDate(a.validityEnd)?.getTime() ?? 0;
  const eb = parseAccreditationDate(b.validityEnd)?.getTime() ?? 0;
  return ea - eb;
}

// ================= Accreditation Summary Report =================

export interface SummaryReportProps {
  programs: ProgramAccreditation[];
  scopeLabel: string;
  fromYear: number;
  toYear: number;
  targetYear: number;
  now: Date;
  chrome: DocumentChrome;
}

export function SummaryReportDocument({ programs, scopeLabel, fromYear, toYear, targetYear, now, chrome }: SummaryReportProps) {
  const years = yearRange(fromYear, Math.max(toYear, targetYear));
  const comparison = compareYears(programs, fromYear, toYear);
  const results = getResultRows(programs, years);
  const passed = results.filter((r) => r.entry.result === 'Passed').length;
  const failed = results.filter((r) => r.entry.result === 'Failed').length;

  const expiring = programs.filter((p) => getExpiryInfo(p, now).state === 'expiring').sort(sortByEnd);
  const expired = programs.filter((p) => getExpiryInfo(p, now).state === 'expired').sort(sortByEnd);
  const accreditedNow = programs.filter((p) => (levelRank(p.status) ?? 0) >= 1).length;

  const accreditedInToYear = results.filter((r) => r.entry.year === toYear && r.entry.result === 'Passed');
  const targetCutoff = new Date(targetYear, 11, 31);
  const targetDist = levelDistribution(programs, targetYear);

  const stats = [
    { label: 'Programs monitored', value: programs.length },
    { label: 'Currently accredited (Level I–IV)', value: accreditedNow },
    { label: `Increased level (${fromYear} → ${toYear})`, value: comparison.improved.length },
    { label: 'Expiring within 12 months', value: expiring.length },
    { label: `Survey results passed (${years[0]}–${years[years.length - 1]})`, value: passed },
    { label: `Survey results failed (${years[0]}–${years[years.length - 1]})`, value: failed },
    { label: 'Expired – renewal overdue', value: expired.length },
    { label: `Accredited by end of ${targetYear}`, value: accreditedCount(targetDist) }
  ];

  return (
    <div className="pr-doc">
      <ReportHeader title="Program Accreditation Summary Report" subtitle="AACCUP Program Accreditation Progress, Results and Validity Monitoring" />
      <ReportMeta
        items={[
          { label: 'Scope', value: scopeLabel },
          { label: 'Comparison', value: `${fromYear} vs ${toYear}` },
          { label: 'Target year', value: targetYear },
          { label: 'Report generated', value: formatPrintTimestamp(chrome.generatedAt) },
          { label: 'Printed', value: printedLabel(chrome.printedAt) }
        ]}
      />

      <Section title="I. Executive Summary">
        <div className="pr-stats">
          {stats.map((s) => (
            <div key={s.label} className="pr-stat">
              <span className="pr-stat-value">{s.value}</span>
              <span className="pr-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="II. Year-Based Accreditation Comparison"
        note="Counts reflect the highest passed level recorded in each program's accreditation history on or before 31 December of each year."
      >
        <YearComparisonTable programs={programs} years={years} />
      </Section>

      <Section title={`III. Programs That Achieved a Higher Accreditation Level (${fromYear} → ${toYear})`}>
        <table className="pr-table">
          <thead>
            <tr>
              <th className="pr-c">#</th>
              <th>Program</th>
              <th>Campus</th>
              <th>Previous Level ({fromYear})</th>
              <th>Current Level ({toYear})</th>
              <th className="pr-c">Year Achieved</th>
              <th className="pr-c">Result</th>
            </tr>
          </thead>
          <tbody>
            {comparison.improved.length === 0 ? (
              <EmptyRow colSpan={7} text={`No program moved to a higher level between ${fromYear} and ${toYear}.`} />
            ) : (
              comparison.improved.map((row, i) => (
                <tr key={row.program.id}>
                  <td className="pr-c">{i + 1}</td>
                  <td>{row.program.programName}</td>
                  <td>{row.program.campusName.replace(' Campus', '')}</td>
                  <td>{formatLevel(row.fromLevel)}</td>
                  <td className="pr-up">{formatLevel(row.toLevel)}</td>
                  <td className="pr-c">{row.yearAchieved}</td>
                  <td className="pr-c">
                    <ResultCell result="Passed" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <p className="pr-note">
          Total programs that increased their accreditation level: <b>{comparison.improved.length}</b>
          {comparison.firstRecorded.length > 0 &&
            ` · ${comparison.firstRecorded.length} program(s) recorded their first accreditation level during this period`}
          {comparison.declined.length > 0 && ` · ${comparison.declined.length} program(s) recorded a lower level`}
        </p>
      </Section>

      <Section title={`IV. Accreditation Results (${years[0]}–${years[years.length - 1]})`}>
        <table className="pr-table">
          <thead>
            <tr>
              <th className="pr-c">#</th>
              <th>Program</th>
              <th>Campus</th>
              <th className="pr-c">Year</th>
              <th>Previous Level</th>
              <th>Level Applied / Awarded</th>
              <th className="pr-c">Result</th>
              <th>Board Action</th>
            </tr>
          </thead>
          <tbody>
            {results.length === 0 ? (
              <EmptyRow colSpan={8} text="No accreditation results recorded for these years." />
            ) : (
              results.map((row, i) => (
                <tr key={row.entry.id}>
                  <td className="pr-c">{i + 1}</td>
                  <td>{row.program.programName}</td>
                  <td>{row.program.campusName.replace(' Campus', '')}</td>
                  <td className="pr-c">{row.entry.year}</td>
                  <td>{row.previousLevel ? formatLevel(row.previousLevel) : '—'}</td>
                  <td className={row.direction === 'up' ? 'pr-up' : undefined}>{formatLevel(row.entry.level)}</td>
                  <td className="pr-c">
                    <ResultCell result={row.entry.result} />
                  </td>
                  <td>{row.entry.boardAction || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Section>

      <Section
        title="V. Programs Approaching Expiration (Expiring Soon – within 12 months)"
        note={`Validity ending between ${formatReportDate(now)} and ${formatReportDate(new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()))}. Prepare renewal, appeal or proposal documents ahead of the expiry date.`}
      >
        <ExpiryTable rows={expiring} now={now} />
      </Section>

      <Section title="VI. Expired Accreditation – Renewal or Appeal Overdue">
        <ExpiryTable rows={expired} now={now} />
      </Section>

      <Section title={`VII. Programs Accredited in ${toYear} – Outlook to ${targetYear}`}>
        <table className="pr-table">
          <thead>
            <tr>
              <th className="pr-c">#</th>
              <th>Program</th>
              <th>Campus</th>
              <th>Level Awarded</th>
              <th>Validity Period</th>
              <th>Expected Status by end of {targetYear}</th>
            </tr>
          </thead>
          <tbody>
            {accreditedInToYear.length === 0 ? (
              <EmptyRow colSpan={6} text={`No passed accreditation results recorded in ${toYear}.`} />
            ) : (
              accreditedInToYear.map((row, i) => {
                const end = parseAccreditationDate(row.entry.validityEnd || row.program.validityEnd);
                const valid = end && end > targetCutoff;
                return (
                  <tr key={row.entry.id}>
                    <td className="pr-c">{i + 1}</td>
                    <td>{row.program.programName}</td>
                    <td>{row.program.campusName.replace(' Campus', '')}</td>
                    <td>{formatLevel(row.entry.level)}</td>
                    <td>
                      {formatValidity({
                        validityStart: row.entry.validityStart || row.program.validityStart,
                        validityEnd: row.entry.validityEnd || row.program.validityEnd
                      })}
                    </td>
                    <td className={valid ? 'pr-pass' : 'pr-expiring'}>
                      {end ? (valid ? `Valid through ${targetYear}` : `Due for renewal by ${formatReportDate(end)}`) : 'No validity date'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <p className="pr-note">
          Recorded levels by end of {targetYear}: Level IV {targetDist['Level 4']} · Level III {targetDist['Level 3']} · Level II{' '}
          {targetDist['Level 2']} · Level I {targetDist['Level 1']} · Candidate {targetDist.Candidate}
        </p>
      </Section>

      <SignatoryBlock signatories={chrome.signatories} printedAt={chrome.printedAt} />
      <ReportFooter chrome={chrome} documentCode="QA-PA Summary Report" />
    </div>
  );
}

// ================= Higher Level Accreditation Tracking Report =================

export interface LevelTrackingReportProps {
  programs: ProgramAccreditation[];
  scopeLabel: string;
  fromYear: number;
  targetYear: number;
  now: Date;
  chrome: DocumentChrome;
}

export function LevelTrackingReportDocument({ programs, scopeLabel, fromYear, targetYear, now, chrome }: LevelTrackingReportProps) {
  const years = yearRange(fromYear, targetYear);
  const comparison = compareYears(programs, fromYear, targetYear);
  const improvedIds = new Set(comparison.improved.map((c) => c.program.id));

  const rows = programs
    .map((p) => ({ program: p, from: levelAsOf(p, fromYear), target: levelAsOf(p, targetYear) }))
    .sort(
      (a, b) =>
        (levelRank(b.target) ?? -1) - (levelRank(a.target) ?? -1) || a.program.programName.localeCompare(b.program.programName)
    );

  return (
    <div className="pr-doc">
      <ReportHeader title="Higher Level Accreditation Tracking Report" subtitle={`Accreditation levels achieved by academic programs up to ${targetYear}`} />
      <ReportMeta
        items={[
          { label: 'Scope', value: scopeLabel },
          { label: 'Baseline year', value: fromYear },
          { label: 'Target year', value: targetYear },
          { label: 'Report generated', value: formatPrintTimestamp(chrome.generatedAt) },
          { label: 'Printed', value: printedLabel(chrome.printedAt) }
        ]}
      />

      <Section title="I. Accreditation Levels by Year">
        <YearComparisonTable programs={programs} years={years} />
        <p className="pr-note">
          Programs that moved to a higher level between {fromYear} and {targetYear}: <b>{comparison.improved.length}</b>
        </p>
      </Section>

      <Section title={`II. Program Accreditation Levels as of ${targetYear}`}>
        <table className="pr-table">
          <thead>
            <tr>
              <th className="pr-c">#</th>
              <th>Program</th>
              <th>Campus</th>
              <th>Current Status</th>
              <th>Level ({fromYear})</th>
              <th>Level ({targetYear})</th>
              <th className="pr-c">Change</th>
              <th>Validity Period</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <EmptyRow colSpan={8} text="No programs in scope." />
            ) : (
              rows.map(({ program, from, target }, i) => {
                const info = getExpiryInfo(program, now);
                return (
                  <tr key={program.id}>
                    <td className="pr-c">{i + 1}</td>
                    <td>{program.programName}</td>
                    <td>{program.campusName.replace(' Campus', '')}</td>
                    <td>{formatLevel(program.status)}</td>
                    <td>{from ? formatLevel(from) : '—'}</td>
                    <td className={improvedIds.has(program.id) ? 'pr-up' : undefined}>{target ? formatLevel(target) : '—'}</td>
                    <td className="pr-c">
                      {improvedIds.has(program.id) ? <span className="pr-up">▲ Higher</span> : from && target ? 'No change' : '—'}
                    </td>
                    <td>
                      {formatValidity(program)}
                      {info.state === 'expiring' && <div className="pr-expiring">Expiring Soon</div>}
                      {info.state === 'expired' && <div className="pr-expired">Expired</div>}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Section>

      <SignatoryBlock signatories={chrome.signatories} printedAt={chrome.printedAt} />
      <ReportFooter chrome={chrome} documentCode="QA-PA Level Tracking Report" />
    </div>
  );
}

// ================= Summary of Findings & Recommendation =================

export function FindingsDocument({ program, chrome }: { program: ProgramAccreditation; chrome: DocumentChrome }) {
  const history = getLevelHistory(program);
  const latest = history[history.length - 1];
  const details: { label: string; value: ReactNode }[] = [
    { label: 'Program', value: program.programName },
    { label: 'Campus', value: program.campusName },
    { label: 'Degree Level', value: program.degreeLevel },
    { label: 'Accreditation Status', value: formatLevel(program.status) },
    { label: 'Validity Period', value: formatValidity(program) },
    { label: 'Survey Schedule', value: program.scheduleForAccreditation ? formatReportDate(program.scheduleForAccreditation) : '—' },
    { label: 'Latest Result', value: latest ? `${formatLevel(latest.level)} (${latest.year}) – ${latest.result}` : '—' },
    { label: 'Board Action', value: program.boardAction || '—' }
  ];

  return (
    <div className="pr-doc">
      <ReportHeader title="Summary of Findings and Recommendations" subtitle="AACCUP Program Accreditation Survey" />
      <ReportMeta
        items={[
          { label: 'Document generated', value: formatPrintTimestamp(chrome.generatedAt) },
          { label: 'Date and time printed', value: printedLabel(chrome.printedAt) }
        ]}
      />

      <Section title="Program Information">
        <table className="pr-kv">
          <tbody>
            {details.map((d) => (
              <tr key={d.label}>
                <th>{d.label}</th>
                <td>{d.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="I. Summary of Findings">
        <div className={`pr-text${program.findingsSummary ? '' : ' pr-text-empty'}`}>
          {program.findingsSummary || 'No findings have been recorded for this program.'}
        </div>
      </Section>

      <Section title="II. Recommendations">
        <div className={`pr-text${program.recommendations ? '' : ' pr-text-empty'}`}>
          {program.recommendations || 'No recommendations have been recorded for this program.'}
        </div>
      </Section>

      {(program.findingsLink || program.technicalReviewLink) && (
        <Section title="Reference Documents">
          <table className="pr-kv">
            <tbody>
              {program.findingsLink && (
                <tr>
                  <th>Summary of Findings (file)</th>
                  <td>{program.findingsLink}</td>
                </tr>
              )}
              {program.technicalReviewLink && (
                <tr>
                  <th>AACCUP Technical Review</th>
                  <td>{program.technicalReviewLink}</td>
                </tr>
              )}
            </tbody>
          </table>
        </Section>
      )}

      <SignatoryBlock signatories={chrome.signatories} printedAt={chrome.printedAt} />
      <ReportFooter chrome={chrome} documentCode="QA-PA Summary of Findings & Recommendation" />
    </div>
  );
}
