export type SuggestionMove = {
  from: string;
  to: string;
  promotion?: string;
};

export type SuggestionResult = {
  arrows: [string, string][];
  bestMove?: SuggestionMove;
  eval?: number | string;
};

export interface ChessSuggestionAdapter {
  getSuggestions(fen: string): Promise<SuggestionResult>;
}
