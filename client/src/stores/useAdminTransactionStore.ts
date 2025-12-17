import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:1337/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface Transaction {
  id: string;
  userId: {
    name: string;
    email: string;
    suiteNumber: string;
  };
  type: string;
  status: string;
  amount: {
    value: number;
    currency: string;
  };
  description: string;
  createdAt: Date;
  completedAt: Date | null;
}

interface AdminTransactionState {
  transactions: Transaction[];
  selectedTransaction: Transaction | null;
  statistics: any | null;
  loading: boolean;
  error: string | null;

  fetchTransactions: (filters?: any) => Promise<void>;
  fetchTransactionById: (id: string) => Promise<void>;
  fetchStatistics: () => Promise<void>;
  processRefund: (id: string, amount: number, reason: string) => Promise<void>;
  updateStatus: (id: string, status: string) => Promise<void>;
}

export const useAdminTransactionStore = create<AdminTransactionState>()(
  devtools((set) => ({
    transactions: [],
    selectedTransaction: null,
    statistics: null,
    loading: false,
    error: null,

    fetchTransactions: async (filters = {}) => {
      set({ loading: true, error: null });
      try {
        const response = await api.get('/admin/transactions', {
          params: filters,
        });
        set({ transactions: response.data.data.transactions, loading: false });
      } catch (error: any) {
        set({
          error: error.response?.data?.error || 'Failed to fetch transactions',
          loading: false,
        });
      }
    },

    fetchTransactionById: async (id: string) => {
      set({ loading: true, error: null });
      try {
        const response = await api.get(`/admin/transactions/${id}`);
        set({
          selectedTransaction: response.data.data.transaction,
          loading: false,
        });
      } catch (error: any) {
        set({
          error: error.response?.data?.error || 'Failed to fetch transaction',
          loading: false,
        });
      }
    },

    fetchStatistics: async () => {
      set({ loading: true, error: null });
      try {
        const response = await api.get('/admin/transactions/statistics');
        set({ statistics: response.data.data.statistics, loading: false });
      } catch (error: any) {
        set({
          error: error.response?.data?.error || 'Failed to fetch statistics',
          loading: false,
        });
      }
    },

    processRefund: async (id: string, amount: number, reason: string) => {
      set({ loading: true, error: null });
      try {
        const response = await api.post(`/admin/transactions/${id}/refund`, {
          amount,
          reason,
        });
        set({
          selectedTransaction: response.data.data.transaction,
          loading: false,
        });
      } catch (error: any) {
        set({
          error: error.response?.data?.error || 'Failed to process refund',
          loading: false,
        });
        throw error;
      }
    },

    updateStatus: async (id: string, status: string) => {
      set({ loading: true, error: null });
      try {
        const response = await api.put(`/admin/transactions/${id}/status`, {
          status,
        });
        set({
          selectedTransaction: response.data.data.transaction,
          loading: false,
        });
      } catch (error: any) {
        set({
          error: error.response?.data?.error || 'Failed to update status',
          loading: false,
        });
        throw error;
      }
    },
  }))
);
