import type { ChessSuggestionAdapter, SuggestionResult } from './types';

type LichessPv = {
  moves?: string;
  cp?: number;
  mate?: number;
};

type LichessCloudEval = {
  pvs?: LichessPv[];
};

const parseMoves = (pvs: LichessPv[] | undefined) => {
  return (pvs || [])
    .map((pv) => pv?.moves?.split(' ')?.[0])
    .filter((uci): uci is string => Boolean(uci))
    .map((uci: string) => ({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci.length >= 5 ? uci.slice(4, 5) : undefined,
    }))
    .filter((m) => m.from.length === 2 && m.to.length === 2);
};

export type LichessAdapterOptions = {
  multiPv?: number;
};

export const createLichessCloudAdapter = (
  options: LichessAdapterOptions = {}
): ChessSuggestionAdapter => {
  const { multiPv = 3 } = options;

  return {
    async getSuggestions(fen: string): Promise<SuggestionResult> {
      const url = `https://lichess.org/api/cloud-eval?fen=${encodeURIComponent(
        fen
      )}&multiPv=${multiPv}`;
      const res = await fetch(url);
      if (res.status === 429) {
        throw new Error('lichess rate limit (429)');
      }
      if (!res.ok) {
        throw new Error(`lichess error (${res.status})`);
      }
      const data = (await res.json()) as LichessCloudEval;
      const moves = parseMoves(data.pvs);
      const arrows = moves.map((m) => [m.from, m.to] as [string, string]);
      const bestMove = moves[0];
      const evalValue =
        data.pvs && data.pvs[0]
          ? data.pvs[0].mate ?? data.pvs[0].cp
          : undefined;

      return { arrows, bestMove, eval: evalValue };
    },
  };
};
