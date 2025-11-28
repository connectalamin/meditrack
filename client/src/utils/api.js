const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get stored tokens
const getTokens = () => {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  const deviceToken = localStorage.getItem('deviceToken');
  return { accessToken, refreshToken, deviceToken };
};

// Set tokens
const setTokens = (accessToken, refreshToken, deviceToken) => {
  if (accessToken) localStorage.setItem('accessToken', accessToken);
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  if (deviceToken) localStorage.setItem('deviceToken', deviceToken);
};

// Clear tokens
const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('deviceToken');
};

// Make API request
const apiRequest = async (endpoint, options = {}) => {
  const { accessToken, deviceToken } = getTokens();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  if (deviceToken) {
    headers['x-device-token'] = deviceToken;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle token refresh on 401
    if (response.status === 401 && accessToken) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // Retry request with new token
        headers['Authorization'] = `Bearer ${localStorage.getItem('accessToken')}`;
        const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
        });
        if (!retryResponse.ok) {
          clearTokens();
          throw new Error('Authentication failed');
        }
        return retryResponse.json();
      } else {
        clearTokens();
        throw new Error('Session expired');
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  } catch (error) {
    if (error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to server');
    }
    throw error;
  }
};

// Refresh access token
const refreshAccessToken = async () => {
  const { refreshToken } = getTokens();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      setTokens(data.accessToken, data.refreshToken, null);
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

// Auth API
export const authAPI = {
  register: async (email, password, displayName) => {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
    if (response.accessToken) {
      setTokens(response.accessToken, response.refreshToken, response.deviceToken);
    }
    return response;
  },

  login: async (email, password) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (response.accessToken) {
      setTokens(response.accessToken, response.refreshToken, response.deviceToken);
    }
    return response;
  },

  googleLogin: async (idToken) => {
    const response = await apiRequest('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
    if (response.accessToken) {
      setTokens(response.accessToken, response.refreshToken, response.deviceToken);
    }
    return response;
  },

  clearData: async () => {
    const response = await apiRequest('/auth/data', {
      method: 'DELETE',
    });
    return response;
  },

  getMe: async () => {
    return apiRequest('/auth/me');
  },

  getLinkedAccounts: async () => {
    return apiRequest('/auth/linked-accounts');
  },

  removeLinkedAccount: async (accountId) => {
    return apiRequest('/auth/remove-linked-account', {
      method: 'POST',
      body: JSON.stringify({ accountId }),
    });
  },

  logout: async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      clearTokens();
    }
  },

  getDevices: async () => {
    return apiRequest('/auth/devices');
  },

  joinFamily: async (referralId) => {
    const response = await apiRequest('/auth/join-family', {
      method: 'POST',
      body: JSON.stringify({ referralId }),
    });
    return response;
  },
};

// Appointments API
export const appointmentsAPI = {
  getAll: async () => {
    const response = await apiRequest('/appointments');
    return response.appointments || [];
  },

  create: async (appointment) => {
    const response = await apiRequest('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointment),
    });
    return response.appointment;
  },

  update: async (id, updates) => {
    const response = await apiRequest(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.appointment;
  },

  delete: async (id) => {
    await apiRequest(`/appointments/${id}`, { method: 'DELETE' });
  },
};

// Family API
export const familyAPI = {
  getAll: async () => {
    const response = await apiRequest('/family');
    return response.familyMembers || [];
  },

  create: async (member) => {
    const response = await apiRequest('/family', {
      method: 'POST',
      body: JSON.stringify(member),
    });
    return response.familyMember;
  },

  update: async (id, updates) => {
    const response = await apiRequest(`/family/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.familyMember;
  },

  delete: async (id) => {
    await apiRequest(`/family/${id}`, { method: 'DELETE' });
  },
};

// Medications API
export const medicationsAPI = {
  getAll: async () => {
    const response = await apiRequest('/medications');
    return response.medications || [];
  },

  create: async (medication) => {
    const response = await apiRequest('/medications', {
      method: 'POST',
      body: JSON.stringify(medication),
    });
    return response.medication;
  },

  update: async (id, updates) => {
    const response = await apiRequest(`/medications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.medication;
  },

  delete: async (id) => {
    await apiRequest(`/medications/${id}`, { method: 'DELETE' });
  },
};

// Reports API
export const reportsAPI = {
  getAll: async () => {
    const response = await apiRequest('/reports');
    return response.reports || [];
  },

  create: async (report, file = null) => {
    const { accessToken } = getTokens();
    const formData = new FormData();
    
    // Add file if provided
    if (file) {
      formData.append('file', file);
    }
    
    // Add other fields
    Object.keys(report).forEach(key => {
      if (report[key] !== null && report[key] !== undefined) {
        formData.append(key, report[key]);
      }
    });

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
    };

    const response = await fetch(`${API_BASE_URL}/reports`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json().then(data => data.report);
  },

  update: async (id, updates, file = null) => {
    const { accessToken } = getTokens();
    const formData = new FormData();
    
    // Add file if provided
    if (file) {
      formData.append('file', file);
    }
    
    // Add other fields
    Object.keys(updates).forEach(key => {
      if (updates[key] !== null && updates[key] !== undefined) {
        formData.append(key, updates[key]);
      }
    });

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
    };

    const response = await fetch(`${API_BASE_URL}/reports/${id}`, {
      method: 'PUT',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json().then(data => data.report);
  },

  delete: async (id) => {
    await apiRequest(`/reports/${id}`, { method: 'DELETE' });
  },
};

// OCR API
export const ocrAPI = {
  process: async (imageFile) => {
    const { accessToken } = getTokens();
    
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`${API_BASE_URL}/ocr/process`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'OCR processing failed' }));
      throw new Error(error.message || 'OCR processing failed');
    }

    return response.json();
  },
};

// Health Data API
export const healthDataAPI = {
  getByMember: async (familyMemberId) => {
    const response = await apiRequest(`/health-data/${familyMemberId}`);
    return response.healthData || [];
  },

  create: async (familyMemberId, data) => {
    const response = await apiRequest(`/health-data/${familyMemberId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.healthData;
  },

  update: async (familyMemberId, id, updates) => {
    const response = await apiRequest(`/health-data/${familyMemberId}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.healthData;
  },

  delete: async (familyMemberId, id) => {
    await apiRequest(`/health-data/${familyMemberId}/${id}`, { method: 'DELETE' });
  },
};

// Plans API
export const plansAPI = {
  getByMember: async (familyMemberId) => {
    const response = await apiRequest(`/plans/${familyMemberId}`);
    return response.plans || [];
  },

  create: async (familyMemberId, plan) => {
    const response = await apiRequest(`/plans/${familyMemberId}`, {
      method: 'POST',
      body: JSON.stringify(plan),
    });
    return response.plan;
  },

  update: async (familyMemberId, id, updates) => {
    const response = await apiRequest(`/plans/${familyMemberId}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.plan;
  },

  delete: async (familyMemberId, id) => {
    await apiRequest(`/plans/${familyMemberId}/${id}`, { method: 'DELETE' });
  },
};

// Analytics API
export const analyticsAPI = {
  getAIAnalytics: async () => {
    const response = await apiRequest('/analytics/ai');
    return response.data;
  },
};

// Purchase List API
export const purchaseListAPI = {
  getAll: async () => {
    const response = await apiRequest('/purchase-list');
    return response.purchaseListItems || [];
  },

  create: async (item) => {
    const response = await apiRequest('/purchase-list', {
      method: 'POST',
      body: JSON.stringify(item),
    });
    return response.purchaseListItem;
  },

  update: async (id, updates) => {
    const response = await apiRequest(`/purchase-list/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.purchaseListItem;
  },

  delete: async (id) => {
    await apiRequest(`/purchase-list/${id}`, { method: 'DELETE' });
  },
};

