import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem("refresh_token");
      if (refresh) {
        try {
          const { data } = await axios.post("/api/auth/refresh", {}, {
            headers: { Authorization: `Bearer ${refresh}` },
          });
          localStorage.setItem("access_token", data.access_token);
          original.headers.Authorization = `Bearer ${data.access_token}`;
          return api(original);
        } catch {
          localStorage.clear();
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Auth ──────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (email, password) => api.post("/auth/login", { email, password }),
  register: (data) => api.post("/auth/register", data),
  me: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
  changePassword: (current_password, new_password) =>
    api.post("/auth/change-password", { current_password, new_password }),
};

// ── Campaigns ─────────────────────────────────────────────────────────────
export const campaignsAPI = {
  list: (status) => api.get("/campaigns/", { params: { status } }),
  create: (data) => api.post("/campaigns/", data),
  get: (id) => api.get(`/campaigns/${id}`),
  update: (id, data) => api.put(`/campaigns/${id}`, data),
  delete: (id) => api.delete(`/campaigns/${id}`),
  activate: (id) => api.post(`/campaigns/${id}/activate`),
  pause: (id) => api.post(`/campaigns/${id}/pause`),
  complete: (id) => api.post(`/campaigns/${id}/complete`),
  assignUsers: (id, data) => api.post(`/campaigns/${id}/assign`, data),
  approveEmail: (cid, eid, notes) =>
    api.post(`/campaigns/${cid}/emails/${eid}/approve`, { admin_notes: notes }),
  editEmail: (cid, eid, data) => api.put(`/campaigns/${cid}/emails/${eid}`, data),
};

// ── AI Generator ──────────────────────────────────────────────────────────
export const aiAPI = {
  generate: (campaign_id, variations = 3) =>
    api.post(`/ai/generate/${campaign_id}`, { variations }),
  getEmails: (campaign_id) => api.get(`/ai/emails/${campaign_id}`),
  deleteEmail: (email_id) => api.delete(`/ai/emails/${email_id}`),
  getPromptLogs: (campaign_id) => api.get(`/ai/prompt-logs/${campaign_id}`),
};

// ── Analytics ──────────────────────────────────────────────────────────────
export const analyticsAPI = {
  overview: () => api.get("/analytics/overview"),
  campaignStats: (id) => api.get(`/analytics/campaigns/${id}/stats`),
  riskHeatmap: () => api.get("/analytics/risk-heatmap"),
  scoreTrend: (params) => api.get("/analytics/score-trend", { params }),
  topAtRisk: (limit = 10) => api.get("/analytics/top-at-risk", { params: { limit } }),
  myStats: () => api.get("/analytics/my-stats"),
};

// ── Users ─────────────────────────────────────────────────────────────────
export const usersAPI = {
  list: (params) => api.get("/users/", { params }),
  create: (data) => api.post("/users/", data),
  get: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  deactivate: (id) => api.delete(`/users/${id}`),
  departments: () => api.get("/users/departments"),
};

// ── Gamification ──────────────────────────────────────────────────────────
export const gamificationAPI = {
  leaderboard: (limit = 20) => api.get("/gamification/leaderboard", { params: { limit } }),
  allBadges: () => api.get("/gamification/badges"),
  myBadges: () => api.get("/gamification/my-badges"),
};

// ── Reports ───────────────────────────────────────────────────────────────
export const reportsAPI = {
  campaignReport: (id, department) =>
    api.get(`/reports/campaign/${id}`, { params: { department } }),
  exportCSV: (id) => `/api/reports/campaign/${id}/export/csv`,
  riskSummary: () => api.get("/reports/users/risk-summary"),
};

// ── Tracking (no auth) ────────────────────────────────────────────────────
export const trackingAPI = {
  getLandingData: (token) => axios.get(`/api/track/landing/${token}`),
  submitFakeCredentials: (token) => axios.post(`/api/track/submit/${token}`, {}),
  reportPhishing: (token) => axios.post(`/api/track/report/${token}`, {}),
};
