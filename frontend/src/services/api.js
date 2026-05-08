import axios from 'axios';

const rawApiUrl = process.env.REACT_APP_API_URL?.trim();

const resolveApiBaseUrl = () => {
  if (!rawApiUrl) {
    return '/api';
  }

  const trimmed = rawApiUrl.replace(/\/+$/, '');

  // If a full origin is provided without the '/api' prefix, add it.
  // This prevents accidental 404s like: http://127.0.0.1:8000/correction/check
  // when the backend routes are mounted under: /api/correction/check
  if (trimmed.endsWith('/api')) {
    return trimmed;
  }

  if (trimmed.endsWith('/api/')) {
    return trimmed.replace(/\/+$/, '');
  }

  return `${trimmed}/api`;
};

const API_BASE_URL = resolveApiBaseUrl();

const buildQueryString = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value));
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
};

const unwrapResponseData = (response, fallbackKey) => ({
  ...response,
  data: response.data?.[fallbackKey] ?? response.data,
});

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getCurrentUser: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getProgress: () => api.get('/users/progress'),
  getLeaderboard: (options = 10) => {
    const limit = typeof options === 'number' ? options : options?.limit ?? 10;
    const timeframe = typeof options === 'object' ? options?.timeframe : undefined;

    return api
      .get(`/users/leaderboard${buildQueryString({ limit, timeframe })}`)
      .then((response) => unwrapResponseData(response, 'leaderboard'));
  },
  getStatsSummary: () => api.get('/users/stats/summary'),
};

// Session API
export const sessionAPI = {
  startSession: (sessionData) => api.post('/sessions/start', sessionData),
  getActiveSession: () => api.get('/sessions/active'),
  endSession: (sessionId, notes) => api.post(`/sessions/${sessionId}/end`, { notes }),
  getSession: (sessionId) => api.get(`/sessions/${sessionId}`),
  getSessions: (limit = 10, offset = 0) => api.get(`/sessions?limit=${limit}&offset=${offset}`),
  recordAnswer: (sessionId, isCorrect) => api.post(`/sessions/${sessionId}/record-answer?is_correct=${isCorrect}`),
  getInteractions: (sessionId) => api.get(`/sessions/${sessionId}/interactions`),
};

// Correction API
export const correctionAPI = {
  checkSentence: (data) => api.post('/correction/check', data),
  quickCheck: (sentence, language = 'English') => 
    api.post(`/correction/quick-check?sentence=${encodeURIComponent(sentence)}&language=${language}`),
};

// Translation API
export const translationAPI = {
  translate: (data) => api.post('/translation/translate', data),
  getLanguages: () => api.get('/translation/languages'),
  detectLanguage: (text) => api.post(`/translation/detect?text=${encodeURIComponent(text)}`),
};

// Conversation API
export const conversationAPI = {
  sendMessage: (data) => api.post('/conversation/message', data),
  getScenarios: () => api.get('/conversation/scenarios'),
  startScenario: (scenario) => api.post(`/conversation/start-scenario?scenario=${scenario}`),
  getHistory: () => api.get('/conversation/history'),
  resetConversation: () => api.post('/conversation/reset'),
};

// Vocabulary API
export const vocabularyAPI = {
  getSessionWords: (languageOrOptions, level, count = 5) => {
    const options = typeof languageOrOptions === 'object' && languageOrOptions !== null
      ? languageOrOptions
      : { language: languageOrOptions, level, count };

    return api
      .get(`/vocabulary/session-words${buildQueryString({
        language: options.language,
        level: options.level,
        count: options.count,
      })}`)
      .then((response) => unwrapResponseData(response, 'words'));
  },
  checkAnswer: (answerOrPayload, correctAnswer) => {
    const payload = answerOrPayload && typeof answerOrPayload === 'object'
      ? answerOrPayload
      : { user_answer: answerOrPayload };
    const resolvedCorrectAnswer = correctAnswer ?? payload.correct_answer ?? payload.correctAnswer;

    return api.post(
      `/vocabulary/check-answer${buildQueryString({ correct_answer: resolvedCorrectAnswer })}`,
      payload
    );
  },
  getLearnedWords: () => api.get('/vocabulary/learned'),
  getStats: () => api.get('/vocabulary/stats'),
  getWordsByCategory: (language, level) => 
    api.get(`/vocabulary/words-by-category?language=${language}&level=${level}`),
};

// Badge API
export const badgeAPI = {
  getAllBadges: () => api.get('/badges/all'),
  getMyBadges: () => api.get('/badges/my-badges'),
  checkNewBadges: () => api.get('/badges/check-new'),
  getBadgeProgress: () => api.get('/badges/progress'),
  getBadgeDetails: (badgeId) => api.get(`/badges/${badgeId}`),
};

// Certificate API
export const certificateAPI = {
  checkEligibility: () => api.get('/certificates/eligibility'),
  generateCertificate: (level) => api.post(`/certificates/generate/${level}`),
  generate: (level) => api.post(`/certificates/generate/${level}`),
  getMyCertificates: () => api.get('/certificates/my-certificates'),
  downloadCertificate: (certificateId, options = {}) => {
    const regenerate = options?.regenerate ?? true;
    return api.get(`/certificates/download/${certificateId}?regenerate=${regenerate}`, { responseType: 'blob' });
  },
  download: (certificateId, options = {}) => {
    const regenerate = options?.regenerate ?? true;
    return api.get(`/certificates/download/${certificateId}?regenerate=${regenerate}`, { responseType: 'blob' });
  },
  verifyCertificate: (certificateId) => api.get(`/certificates/verify/${certificateId}`),
};

// Games API
export const gamesAPI = {
  completeGame: (gameType, score, xpEarned) => 
    api.post('/games/complete', { game_type: gameType, score, xp_earned: xpEarned }),
  getStats: () => api.get('/games/stats'),
};

// Missions API
export const missionsAPI = {
  completeMission: (missionData) => api.post('/missions/complete', missionData),
  getStats: () => api.get('/missions/stats'),
  getAvailable: () => api.get('/missions/available'),
};

export default api;
