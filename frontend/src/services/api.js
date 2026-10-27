const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const BASE_URL = API_URL.endsWith("/api") ? API_URL : `${API_URL.replace(/\/$/, "")}/api`;

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

  forgotPassword: async (email) => {
    const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return handleResponse(res);
  },

  resetPassword: async ({ token, newPassword }) => {
    const res = await fetch(`${BASE_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });
    return handleResponse(res);
  },

  changePassword: async ({ currentPassword, newPassword }) => {
    const res = await fetch(`${BASE_URL}/users/change-password`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return handleResponse(res);
  },

  deleteAccount: async ({ password, confirmText }) => {
    const res = await fetch(`${BASE_URL}/users/me`, {
      method: "DELETE",
      headers: getHeaders(),
      body: JSON.stringify({ password, confirmText }),
    });
    return handleResponse(res);
  },

  getPreferences: async () => {
    const res = await fetch(`${BASE_URL}/users/preferences`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  updatePreferences: async (preferences) => {
    const res = await fetch(`${BASE_URL}/users/preferences`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(preferences),
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

  parseCvSkills: async (saveToProfile = true) => {
    const res = await fetch(`${BASE_URL}/cv/parse-skills`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ saveToProfile }),
    });
    return handleResponse(res);
  },

  reparseCv: async (updatedDocumentModel = null) => {
    const res = await fetch(`${BASE_URL}/cv/reparse`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ updatedDocumentModel }),
    });
    return handleResponse(res);
  },

  tailorCv: async (jobId, customEdits = null, options = {}, jobMeta = {}) => {
    const isLegacyMeta = options && (options.jobTitle || options.jobCompany || options.jobRequirements || options.jobSkills);
    const meta = isLegacyMeta ? options : jobMeta;
    const opts = isLegacyMeta ? {} : options;

    const res = await fetch(`${BASE_URL}/cv/tailor`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        jobId,
        customEdits: customEdits || opts.customEdits || null,
        onlyReorderSkills: opts.onlyReorderSkills === true,
        ...meta,
      }),
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

  analyzeCv: async (cvId = null) => {
    const res = await fetch(`${BASE_URL}/cv/analyze`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ cvId }),
    });
    return handleResponse(res);
  },

  downloadCvAnalysisPdf: async (cvId = "active") => {
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${BASE_URL}/cv/analysis/${cvId}/report.pdf`, {
      method: "GET",
      headers,
    });
    if (!res.ok) {
      throw new Error("Failed to download analysis report");
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CV-Analysis-${new Date().toISOString().split("T")[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  getTailoredCvPdfBlob: async (id) => {
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${BASE_URL}/cv/tailored/${id}/pdf?inline=true`, {
      method: "GET",
      headers,
    });
    if (!res.ok) {
      throw new Error("Failed to load PDF preview");
    }
    const blob = await res.blob();
    return window.URL.createObjectURL(blob);
  },

  downloadTailoredCvPdf: async (id, customFilename = null) => {
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${BASE_URL}/cv/tailored/${id}/pdf`, {
      method: "GET",
      headers,
    });
    if (!res.ok) {
      throw new Error("Failed to download tailored PDF");
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = customFilename || `Tailored-Resume-${new Date().toISOString().split("T")[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  downloadTailoredCvDocx: async (id, customFilename = null) => {
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${BASE_URL}/cv/tailored/${id}/docx`, {
      method: "GET",
      headers,
    });
    if (!res.ok) {
      throw new Error("Failed to download tailored DOCX");
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = customFilename || `Tailored-Resume-${new Date().toISOString().split("T")[0]}.docx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  downloadTailoredCvTex: async (id, customFilename = null) => {
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${BASE_URL}/cv/tailored/${id}/tex`, {
      method: "GET",
      headers,
    });
    if (!res.ok) {
      throw new Error("Failed to download LaTeX source");
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = customFilename || `Tailored-Resume-${new Date().toISOString().split("T")[0]}.tex`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  downloadOriginalCv: async (id = "active", customFilename = null) => {
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${BASE_URL}/cv/download/${id}`, {
      method: "GET",
      headers,
    });
    if (!res.ok) {
      throw new Error("Failed to download CV file");
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = customFilename || "Resume.pdf";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  getOriginalCvPdfBlob: async (id = "active") => {
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${BASE_URL}/cv/download/${id}?inline=true`, {
      method: "GET",
      headers,
    });
    if (!res.ok) {
      throw new Error("Failed to load CV preview");
    }
    const blob = await res.blob();
    return window.URL.createObjectURL(blob);
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
