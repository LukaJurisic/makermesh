import type {SourceEvidence} from '@/domain/types';

// Seeded example sources carry build-time names ("X fixture evidence 2", *.invalid domains).
// Show them to buyers as plainly labelled examples instead.
export function sourceTitle(source: Pick<SourceEvidence, 'title'>): string {
  return source.title.replace(/\s+fixture evidence\s+(\d+)$/i, ' — example source $1');
}

export function sourceDomain(source: Pick<SourceEvidence, 'domain'>): string {
  return source.domain.endsWith('.invalid') ? 'Example record' : source.domain;
}
