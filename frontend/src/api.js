let rawUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
rawUrl = rawUrl.trim().replace(/\/$/, "");
if (!rawUrl.endsWith("/api")) {
  rawUrl += "/api";
}
const API_BASE_URL = rawUrl;

// Helper to get auth header from local storage
const getAuthHeaders = () => {
  try {
    const user = JSON.parse(localStorage.getItem("moi_loggedIn"));
    if (user && user.token) {
      return {
        "Authorization": `Bearer ${user.token}`,
        "Content-Type": "application/json"
      };
    }
  } catch (error) {
    console.error("Error loading session token:", error);
  }
  return { "Content-Type": "application/json" };
};

// Generic fetch request wrapper
const apiRequest = async (url, options = {}) => {
  const headers = getAuthHeaders();
  const config = {
    ...options,
    headers: {
      ...headers,
      ...options.headers
    }
  };

  const response = await fetch(`${API_BASE_URL}${url}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "அபிநயித்தல் தோல்வியடைந்தது!");
  }

  return data;
};

export const api = {
  // Auth API
  register: (name, email, password) => {
    return apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password })
    });
  },

  login: (email, password) => {
    return apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  },

  updateProfile: (name) => {
    return apiRequest("/auth/profile", {
      method: "PUT",
      body: JSON.stringify({ name })
    });
  },

  changePassword: (currentPassword, newPassword) => {
    return apiRequest("/auth/change-password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword })
    });
  },

  // Records API
  getRecords: () => {
    return apiRequest("/records", {
      method: "GET"
    });
  },

  createRecord: (recordData) => {
    return apiRequest("/records", {
      method: "POST",
      body: JSON.stringify(recordData)
    });
  },

  updateRecord: (id, recordData) => {
    return apiRequest(`/records/${id}`, {
      method: "PUT",
      body: JSON.stringify(recordData)
    });
  },

  deleteRecord: (id) => {
    return apiRequest(`/records/${id}`, {
      method: "DELETE"
    });
  }
};
