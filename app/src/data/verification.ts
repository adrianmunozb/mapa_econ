import verification from './verification.json';

/** Output of `python -m wem verify` (see docs/verificacion.md). */
export interface VerificationReport {
  generatedAt: string;
  issues: number;
  sample: string[];
  sections: { title: string; notes: string[]; columns: string[]; rows: string[][] }[];
}

export const VERIFICATION = verification as VerificationReport;

export const verificationDate = (report: VerificationReport = VERIFICATION) =>
  new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${report.generatedAt}T00:00:00Z`));
