import type { Square } from '../types/shared';

export type ManualMoveStart = {
  from: Square;
  to: Square;
  ts: number;
  token: number;
  kind: 'tap' | 'drag';
};

let lastManualMoveStart: ManualMoveStart | null = null;

export const recordManualMoveStart = (data: ManualMoveStart) => {
  lastManualMoveStart = data;
};

export const readManualMoveStart = () => lastManualMoveStart;
