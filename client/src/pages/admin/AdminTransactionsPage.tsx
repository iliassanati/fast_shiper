// client/src/pages/admin/AdminTransactionsPage.tsx
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Search,
  TrendingUp,
  TrendingDown,
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { apiHelpers } from '@/lib/api';

interface Transaction {
  _id: string;
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
  paymentMethod: string;
  invoice?: {
    number: string;
    url: string;
  };
  createdAt: string;
  completedAt?: string;
}

interface Statistics {
  total: number;
  completedToday: number;
  completedThisMonth: number;
  byStatus: Record<string, number>;
  byType: Array<{ type: string; count: number; total: number }>;
  revenue: {
    total: number;
    today: number;
    thisMonth: number;
    average: number;
  };
  growth: {
    rate: string;
    direction: string;
  };
  alerts: {
    failedTransactions: number;
  };
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchTransactions();
    fetchStatistics();
  }, [page, statusFilter, typeFilter, searchTerm]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      if (searchTerm) params.search = searchTerm;

      const response = await apiHelpers.get('/admin/transactions', params);
      setTransactions(response.transactions);
      setTotalPages(response.pagination.pages);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await apiHelpers.get('/admin/transactions/statistics');
      setStatistics(response.statistics);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className='w-5 h-5 text-green-600' />;
      case 'failed':
        return <XCircle className='w-5 h-5 text-red-600' />;
      case 'pending':
      case 'processing':
        return <Clock className='w-5 h-5 text-yellow-600' />;
      default:
        return <DollarSign className='w-5 h-5 text-slate-600' />;
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      processing: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      refunded: 'bg-purple-100 text-purple-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      consolidation: 'text-blue-600',
      shipping: 'text-green-600',
      photo_request: 'text-purple-600',
      insurance: 'text-orange-600',
      storage_fee: 'text-red-600',
      refund: 'text-gray-600',
    };
    return colors[type] || 'text-slate-600';
  };

  if (loading && transactions.length === 0) {
    return (
      <AdminLayout>
        <div className='flex items-center justify-center h-96'>
          <div className='text-center'>
            <div className='w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
            <p className='text-slate-600 font-semibold'>
              Loading transactions...
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className='space-y-6'>
        {/* Header */}
        <div>
          <h1 className='text-3xl font-bold text-slate-900'>
            Transaction Management
          </h1>
          <p className='text-slate-600'>
            Monitor revenue, payments, and financial activity
          </p>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <>
            {/* Revenue Cards */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className='bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl p-6 shadow-lg text-white'
              >
                <div className='flex items-center justify-between mb-2'>
                  <p className='text-sm opacity-90'>Total Revenue</p>
                  <DollarSign className='w-6 h-6' />
                </div>
                <p className='text-3xl font-bold mb-1'>
                  {statistics.revenue.total.toLocaleString()} MAD
                </p>
                <div className='flex items-center gap-1 text-sm opacity-90'>
                  <TrendingUp className='w-4 h-4' />
                  <span>{statistics.growth.rate}% growth</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'
              >
                <div className='flex items-center justify-between mb-2'>
                  <p className='text-sm text-slate-600'>Today's Revenue</p>
                  <Calendar className='w-5 h-5 text-green-600' />
                </div>
                <p className='text-3xl font-bold text-slate-900'>
                  {statistics.revenue.today.toLocaleString()} MAD
                </p>
                <p className='text-sm text-slate-500 mt-1'>
                  {statistics.completedToday} transactions
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'
              >
                <div className='flex items-center justify-between mb-2'>
                  <p className='text-sm text-slate-600'>This Month</p>
                  <TrendingUp className='w-5 h-5 text-purple-600' />
                </div>
                <p className='text-3xl font-bold text-slate-900'>
                  {statistics.revenue.thisMonth.toLocaleString()} MAD
                </p>
                <p className='text-sm text-slate-500 mt-1'>
                  {statistics.completedThisMonth} transactions
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'
              >
                <div className='flex items-center justify-between mb-2'>
                  <p className='text-sm text-slate-600'>Avg Transaction</p>
                  <DollarSign className='w-5 h-5 text-orange-600' />
                </div>
                <p className='text-3xl font-bold text-slate-900'>
                  {Math.round(statistics.revenue.average).toLocaleString()} MAD
                </p>
                <p className='text-sm text-slate-500 mt-1'>
                  {statistics.total} total
                </p>
              </motion.div>
            </div>

            {/* Revenue by Type */}
            <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
              <h2 className='text-xl font-bold text-slate-900 mb-4'>
                Revenue by Type
              </h2>
              <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4'>
                {statistics.byType.map((item) => (
                  <div
                    key={item.type}
                    className='bg-slate-50 rounded-xl p-4 text-center'
                  >
                    <p className='text-xs text-slate-600 mb-1'>
                      {item.type.replace('_', ' ').toUpperCase()}
                    </p>
                    <p className='text-xl font-bold text-slate-900 mb-1'>
                      {item.total.toLocaleString()} MAD
                    </p>
                    <p className='text-xs text-slate-500'>
                      {item.count} transactions
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Filters */}
        <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400' />
              <input
                type='text'
                placeholder='Search description...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className='px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
            >
              <option value=''>All Statuses</option>
              <option value='pending'>Pending</option>
              <option value='processing'>Processing</option>
              <option value='completed'>Completed</option>
              <option value='failed'>Failed</option>
              <option value='refunded'>Refunded</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className='px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
            >
              <option value=''>All Types</option>
              <option value='consolidation'>Consolidation</option>
              <option value='shipping'>Shipping</option>
              <option value='photo_request'>Photo Request</option>
              <option value='insurance'>Insurance</option>
              <option value='storage_fee'>Storage Fee</option>
              <option value='refund'>Refund</option>
            </select>

            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setTypeFilter('');
                setPage(1);
              }}
              className='px-4 py-3 border-2 border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-colors'
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className='bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-slate-50 border-b border-slate-200'>
                <tr>
                  <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                    Client
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                    Type
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                    Description
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                    Amount
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                    Payment Method
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                    Date
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                    Invoice
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-100'>
                {transactions.map((transaction, index) => (
                  <motion.tr
                    key={transaction._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className='hover:bg-slate-50 transition-colors'
                  >
                    <td className='px-6 py-4'>
                      <div>
                        <p className='font-medium text-slate-900'>
                          {transaction.userId.name}
                        </p>
                        <p className='text-sm text-slate-500'>
                          {transaction.userId.suiteNumber}
                        </p>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <span
                        className={`text-sm font-semibold ${getTypeColor(
                          transaction.type
                        )}`}
                      >
                        {transaction.type.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      <p className='text-sm text-slate-700 max-w-xs truncate'>
                        {transaction.description}
                      </p>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-2'>
                        {getStatusIcon(transaction.status)}
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            transaction.status
                          )}`}
                        >
                          {transaction.status.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <span className='text-sm font-bold text-green-600'>
                        {transaction.amount.value.toLocaleString()}{' '}
                        {transaction.amount.currency}
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      <span className='text-sm text-slate-700 capitalize'>
                        {transaction.paymentMethod.replace('_', ' ')}
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      <span className='text-sm text-slate-600'>
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      {transaction.invoice?.number ? (
                        <button className='flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-semibold'>
                          <FileText className='w-4 h-4' />
                          {transaction.invoice.number}
                        </button>
                      ) : (
                        <span className='text-sm text-slate-400'>N/A</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between'>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className='px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              >
                Previous
              </button>
              <span className='text-sm text-slate-600'>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className='px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
