export interface DuplicateSample {
  primaryCase: string;
  suspected: string;
  similarity: string;
  risk: string;
  rationale: string;
  status: string;
}

// Sample duplicate-detection dataset used by the Duplicates page when the AI API is offline.
export const DUPLICATE_SAMPLES: DuplicateSample[] = [
  {
    primaryCase: '#2341 - Flood, Kandyyva',
    suspected: '#2187 - Flood (Kandy)',
    similarity: '74%',
    risk: 'Medium',
    rationale:
      'High semantic and geographical overlap with #2187. Both cases request food and shelter aid within Kandy flood operational sector.',
    status: 'Flagged for Review (Non-destructive)',
  },
  {
    primaryCase: '#2348 - River Overbank, Rivagama',
    suspected: '#2344 - Rivagama Bridge Flooding',
    similarity: '88%',
    risk: 'High',
    rationale:
      'Identical caller contact coordinates and duplicate meal requests submitted 14 minutes apart.',
    status: 'Awaiting Coordinator Merge',
  },
];
