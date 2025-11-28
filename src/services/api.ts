const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

class ApiService {
  private getAuthHeader(): Record<string, string> {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { headers = {}, ...restOptions } = options;

    const config: RequestInit = {
      ...restOptions,
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
        ...headers,
      },
    };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, config);

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: response.statusText,
        }));
        throw new Error(error.message || 'An error occurred');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Order endpoints
  async getOrders(params?: Record<string, string>) {
    const queryString = params
      ? '?' + new URLSearchParams(params).toString()
      : '';
    return this.request(`/orders${queryString}`);
  }

  async getOrderById(id: string) {
    return this.request(`/orders/${id}`);
  }

  async createOrder(data: any) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOrder(id: string, data: any) {
    return this.request(`/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updateOrderStatus(id: string, status: string, notes?: string) {
    return this.request(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  }

  async addPayment(id: string, payment: any) {
    return this.request(`/orders/${id}/payments`, {
      method: 'POST',
      body: JSON.stringify(payment),
    });
  }

  async updatePayment(orderId: string, paymentId: string, payment: any) {
    return this.request(`/orders/${orderId}/payments/${paymentId}`, {
      method: 'PATCH',
      body: JSON.stringify(payment),
    });
  }

  async deletePayment(orderId: string, paymentId: string) {
    return this.request(`/orders/${orderId}/payments/${paymentId}`, {
      method: 'DELETE',
    });
  }

  async updateOrderItem(orderId: string, itemId: string, data: any) {
    return this.request(`/orders/${orderId}/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteOrder(id: string) {
    return this.request(`/orders/${id}`, {
      method: 'DELETE',
    });
  }

  async getOrderChangeLogs(id: string) {
    return this.request(`/orders/${id}/change-logs`);
  }

  async searchGuests(query: string) {
    return this.request(`/orders/search/guests?query=${encodeURIComponent(query)}`);
  }

  // Guest Profile endpoints
  async getGuests(params?: Record<string, string>) {
    const queryString = params
      ? '?' + new URLSearchParams(params).toString()
      : '';
    return this.request(`/guests${queryString}`);
  }

  async getGuestById(id: string) {
    return this.request(`/guests/${id}`);
  }

  async getGuestOrders(id: string, params?: Record<string, string>) {
    const queryString = params
      ? '?' + new URLSearchParams(params).toString()
      : '';
    return this.request(`/guests/${id}/orders${queryString}`);
  }

  async createGuest(data: any) {
    return this.request('/guests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateGuest(id: string, data: any) {
    return this.request(`/guests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteGuest(id: string) {
    return this.request(`/guests/${id}`, {
      method: 'DELETE',
    });
  }

  async searchGuestProfiles(query: string) {
    return this.request(`/guests/search?q=${encodeURIComponent(query)}`);
  }

  // Menu Item endpoints
  async getMenuItems() {
    return this.request('/menu-items');
  }

  async getMenuItemById(id: string) {
    return this.request(`/menu-items/${id}`);
  }

  async createMenuItem(data: any) {
    return this.request('/menu-items', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMenuItem(id: string, data: any) {
    return this.request(`/menu-items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteMenuItem(id: string) {
    return this.request(`/menu-items/${id}`, {
      method: 'DELETE',
    });
  }

  // Analytics endpoints
  async getDashboardStats() {
    return this.request('/analytics/dashboard');
  }

  async getMonthlyCategoryBreakdown() {
    return this.request('/analytics/monthly-categories');
  }

  async getAnalytics(startDate: string, endDate: string) {
    return this.request(
      `/analytics?startDate=${startDate}&endDate=${endDate}`
    );
  }

  async exportOrders(startDate: string, endDate: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `${API_URL}/analytics/export?startDate=${startDate}&endDate=${endDate}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to export orders');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${startDate}-to-${endDate}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  async getItemsSoldByMonth(startDate: string, endDate: string) {
    return this.request(
      `/analytics/items-sold-by-month?startDate=${startDate}&endDate=${endDate}`
    );
  }

  async exportItemsReport(startDate: string, endDate: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `${API_URL}/analytics/export-items-report?startDate=${startDate}&endDate=${endDate}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to export items report');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `items-sold-report-${startDate}-to-${endDate}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  // User endpoints
  async getUsers() {
    return this.request('/users');
  }

  async createUser(data: any) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: string, data: any) {
    return this.request(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }
}

export default new ApiService();
