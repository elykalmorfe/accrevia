export type JobStatus = 'Running' | 'Queued' | 'Failed' | 'Completed';

export interface ProcessingStage {
  key: string;
  label: string;
  description: string;
}

export interface ProcessingJob {
  id: string;
  fileName: string;
  stage: number;
  status: JobStatus;
  startedAt: string;
  ocr: boolean;
  pages: number;
  note?: string;
}