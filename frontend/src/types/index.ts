export interface Tournament {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  match_time_window: string | null;
  format: string;
  created_by: number | null;
}

export interface Player {
  id: number;
  name: string;
}

export interface Team {
  id: number;
  name: string;
  tournament_id: number;
  player1: Player;
  player2: Player | null;
}

export type RoundEnum =
  | 'play_in'
  | 'round_of_32'
  | 'round_of_16'
  | 'quarter_final'
  | 'semi_final'
  | 'upper_final'
  | 'losers_match'
  | 'qualification_final'
  | 'grand_final';

export type MatchStatus = 'upcoming' | 'live' | 'completed';

export interface SetScore {
  id: number;
  set_number: number;
  teamA_score: number;
  teamB_score: number;
}

export interface Match {
  id: number;
  tournament_id: number;
  round: RoundEnum;
  match_label: string | null;
  teamA_id: number | null;
  teamB_id: number | null;
  winner_id: number | null;
  loser_id: number | null;
  next_match_id: number | null;
  loser_next_match_id: number | null;
  status: MatchStatus;
  match_order: number;
  match_date: string | null;
  match_time: string | null;
  match_place: string | null;
  match_umpire: string | null;
  teamA: Team | null;
  teamB: Team | null;
  set_scores: SetScore[];
}
