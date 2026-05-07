import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (username: string, password: string) => {
  const form = new URLSearchParams();
  form.append('username', username);
  form.append('password', password);
  return api.post('/auth/login', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
};

// Tournaments
export const getTournaments = () => api.get('/tournaments');
export const getTournament = (id: number) => api.get(`/tournaments/${id}`);
export const createTournament = (data: object) => api.post('/tournaments', data);
export const updateTournament = (id: number, data: object) => api.put(`/tournaments/${id}`, data);
export const deleteTournament = (id: number) => api.delete(`/tournaments/${id}`);

// Teams
export const getTeams = (tournamentId: number) => api.get(`/tournaments/${tournamentId}/teams`);
export const addTeam = (tournamentId: number, data: object) =>
  api.post(`/tournaments/${tournamentId}/teams`, data);
export const addTeamsBulk = (
  tournamentId: number,
  teams: { name: string; player1_name: string; player2_name?: string }[]
) => api.post(`/tournaments/${tournamentId}/teams/bulk`, { teams });
export const deleteTeam = (tournamentId: number, teamId: number) =>
  api.delete(`/tournaments/${tournamentId}/teams/${teamId}`);

// Fixtures
export const generateFixtures = (tournamentId: number) =>
  api.post(`/tournaments/${tournamentId}/generate-fixtures`);
export const randomizeSeeds = (tournamentId: number) =>
  api.post(`/tournaments/${tournamentId}/randomize-seeds`);
export const getMatches = (tournamentId: number) =>
  api.get(`/tournaments/${tournamentId}/matches`);

// Matches
export const updateScore = (matchId: number, data: object) =>
  api.put(`/matches/${matchId}/score`, data);
export const updateStatus = (matchId: number, status: string) =>
  api.put(`/matches/${matchId}/status`, { status });
export const updateLabel = (matchId: number, match_label: string) =>
  api.put(`/matches/${matchId}/label`, { match_label });
