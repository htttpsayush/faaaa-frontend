/**
 * PulseAI API Client
 * Centralized fetch client attaching JWT, handling base URL,
 * and managing unauthorized (401) session redirects.
 */

// Single source of truth for the backend URL (or override via window.PULSEAI_API_URL)
const API_BASE_URL = window.PULSEAI_API_URL || 'https://faaa-backend.onrender.com/api/v1';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  getToken() {
    return localStorage.getItem('pulseai_token');
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('pulseai_token', token);
    } else {
      localStorage.removeItem('pulseai_token');
    }
  }

  getUser() {
    const raw = localStorage.getItem('pulseai_user');
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  setUser(user) {
    if (user) {
      localStorage.setItem('pulseai_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('pulseai_user');
    }
  }

  logout() {
    this.setToken(null);
    this.setUser(null);
    window.location.href = 'login.html';
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        const isAuthPage = window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('signup.html');
        if (!isAuthPage) {
          this.setToken(null);
          this.setUser(null);
          window.location.href = 'login.html';
        }
      }

      if (response.status === 204) {
        return null;
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message = data?.detail || `Request failed with status ${response.status}`;
        throw new Error(message);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  patch(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Auth shortcuts
  async signup(userData) {
    const res = await this.post('/auth/signup', userData);
    this.setToken(res.access_token);
    this.setUser(res.user);
    return res;
  }

  async login(email, password) {
    const res = await this.post('/auth/login', { email, password });
    this.setToken(res.access_token);
    this.setUser(res.user);
    return res;
  }
}

window.api = new ApiClient();

