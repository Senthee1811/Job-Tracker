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
    
    const res = await fetch(`${BASE_URL}/users/upload-cv`, {
      method: "POST",
      headers: headers,
      body: formData,
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
