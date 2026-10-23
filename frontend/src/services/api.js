const BASE_URL = "http://localhost:8000/api";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }
  return data;
};

export const api = {
  // Auth & Profile
  register: async (userData) => {
    const res = await fetch(`${BASE_URL}/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    return handleResponse(res);
  },

  login: async (credentials) => {
    const res = await fetch(`${BASE_URL}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    return handleResponse(res);
  },

  getProfile: async () => {
    const res = await fetch(`${BASE_URL}/users/profile`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  updateProfile: async (profileData) => {
    const res = await fetch(`${BASE_URL}/users/profile`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(profileData),
    });
    return handleResponse(res);
  },

  uploadCV: async (file) => {
    const formData = new FormData();
    formData.append("cv", file);
    
    const token = localStorage.getItem("token");
    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    const res = await fetch(`${BASE_URL}/cv/upload`, {
      method: "POST",
      headers: headers,
      body: formData,
    });
    return handleResponse(res);
  },

  getCvHistory: async () => {
    const res = await fetch(`${BASE_URL}/cv/history`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getActiveCv: async () => {
    const res = await fetch(`${BASE_URL}/cv/active`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  deleteCvVersion: async (id) => {
    const res = await fetch(`${BASE_URL}/cv/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  tailorCv: async (jobId, customData = null, jobMeta = {}) => {
    const res = await fetch(`${BASE_URL}/cv/tailor`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ jobId, customData, ...jobMeta }),
    });
    return handleResponse(res);
  },

  getTailoredCv: async (jobId) => {
    const res = await fetch(`${BASE_URL}/cv/tailored/${jobId}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  applyAssisted: async (data) => {
    const res = await fetch(`${BASE_URL}/cv/apply-assisted`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // AI Recommendations
  getRecommendations: async (page = 1, limit = 10) => {
    const res = await fetch(`${BASE_URL}/recommendations?page=${page}&limit=${limit}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  recomputeRecommendations: async () => {
    const res = await fetch(`${BASE_URL}/recommendations/recompute`, {
      method: "POST",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Applications
  getApplications: async () => {
    const res = await fetch(`${BASE_URL}/applications/all`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  createApplication: async (appData) => {
    const res = await fetch(`${BASE_URL}/applications/create`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(appData),
    });
    return handleResponse(res);
  },

  modifyApplication: async (id, updateData) => {
    const res = await fetch(`${BASE_URL}/applications/modify/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(updateData),
    });
    return handleResponse(res);
  },

  deleteApplication: async (id) => {
    const res = await fetch(`${BASE_URL}/applications/delete/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Vacancy Scraper Endpoints
  getVacancies: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);
    if (params.role) query.append("role", params.role);
    if (params.location && params.location !== "all") query.append("location", params.location);
    if (params.source && params.source !== "all") query.append("source", params.source);
    if (params.jobType && params.jobType !== "all") query.append("jobType", params.jobType);

    const res = await fetch(`${BASE_URL}/jobs?${query.toString()}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  refreshVacancies: async () => {
    const res = await fetch(`${BASE_URL}/jobs/refresh`, {
      method: "POST",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getSourcesHealth: async () => {
    const res = await fetch(`${BASE_URL}/jobs/sources/health`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getLiveJobs: async (query, region) => {
    const q = encodeURIComponent(query || 'React');
    const r = encodeURIComponent(region || 'Sri Lanka');
    const res = await fetch(`${BASE_URL}/jobs/search?query=${q}&region=${r}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getReminders: async () => {
    const res = await fetch(`${BASE_URL}/reminders`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  createReminder: async (reminderData) => {
    const res = await fetch(`${BASE_URL}/reminders`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(reminderData),
    });
    return handleResponse(res);
  },

  deleteReminder: async (id) => {
    const res = await fetch(`${BASE_URL}/reminders/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
};
