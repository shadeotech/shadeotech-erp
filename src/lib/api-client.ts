import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = typeof window !== 'undefined' 
          ? localStorage.getItem('token') 
          : null;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async register(data: { email: string; password: string; firstName: string; lastName: string }) {
    const response = await this.client.post('/auth/register', data);
    return response.data;
  }

  // Customers
  async getCustomers(params?: Record<string, any>) {
    const response = await this.client.get('/customers', { params });
    return response.data;
  }

  async getCustomer(id: string) {
    const response = await this.client.get(`/customers/${id}`);
    return response.data;
  }

  async createCustomer(data: any) {
    const response = await this.client.post('/customers', data);
    return response.data;
  }

  async updateCustomer(id: string, data: any) {
    const response = await this.client.put(`/customers/${id}`, data);
    return response.data;
  }

  async deleteCustomer(id: string) {
    const response = await this.client.delete(`/customers/${id}`);
    return response.data;
  }

  // Events
  async getEvents(params?: Record<string, any>) {
    const response = await this.client.get('/events', { params });
    return response.data;
  }

  async createEvent(data: any) {
    const response = await this.client.post('/events', data);
    return response.data;
  }

  async updateEvent(id: string, data: any) {
    const response = await this.client.put(`/events/${id}`, data);
    return response.data;
  }

  async deleteEvent(id: string) {
    const response = await this.client.delete(`/events/${id}`);
    return response.data;
  }

  // Quotes
  async getQuotes(params?: Record<string, any>) {
    const response = await this.client.get('/quotes', { params });
    return response.data;
  }

  async getQuote(id: string) {
    const response = await this.client.get(`/quotes/${id}`);
    return response.data;
  }

  async createQuote(data: any) {
    const response = await this.client.post('/quotes', data);
    return response.data;
  }

  async updateQuote(id: string, data: any) {
    const response = await this.client.put(`/quotes/${id}`, data);
    return response.data;
  }

  async sendQuote(id: string) {
    const response = await this.client.post(`/quotes/${id}/send`);
    return response.data;
  }

  // Invoices
  async getInvoices(params?: Record<string, any>) {
    const response = await this.client.get('/invoices', { params });
    return response.data;
  }

  async getInvoice(id: string) {
    const response = await this.client.get(`/invoices/${id}`);
    return response.data;
  }

  async createInvoice(data: any) {
    const response = await this.client.post('/invoices', data);
    return response.data;
  }

  // Payments
  async getPayments(params?: Record<string, any>) {
    const response = await this.client.get('/payments', { params });
    return response.data;
  }

  async createPayment(data: any) {
    const response = await this.client.post('/payments', data);
    return response.data;
  }

  // Dashboard
  async getDashboardStats() {
    const response = await this.client.get('/dashboard/stats');
    return response.data;
  }

  async getAnnouncements() {
    const response = await this.client.get('/dashboard/announcements');
    return response.data;
  }
}

export const apiClient = new ApiClient();

// Helper functions for direct use
export const getCustomers = (params?: Record<string, any>) => apiClient.getCustomers(params);
export const getCustomer = (id: string) => apiClient.getCustomer(id);
export const createCustomer = (data: any) => apiClient.createCustomer(data);
export const updateCustomer = (id: string, data: any) => apiClient.updateCustomer(id, data);
export const deleteCustomer = (id: string) => apiClient.deleteCustomer(id);

