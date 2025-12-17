// client/src/pages/admin/AdminShipmentDetailsPage.enhanced.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Truck,
  Package,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  Download,
  RefreshCw,
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Printer,
  CreditCard,
  MessageSquare,
  XCircle,
  Bell,
} from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { apiHelpers } from '@/lib/api';

interface Transaction {
  id: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  amount: { value: number; currency: string };
  paymentMethod: string;
  completedAt?: string;
  createdAt: string;
  metadata?: any;
}

interface ShipmentDetails {
  _id: string;
  trackingNumber: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    suiteNumber: string;
    phone: string;
  };
  packageIds: Array<{
    _id: string;
    trackingNumber: string;
    description: string;
    weight: { value: number; unit: string };
  }>;
  carrier: string;
  serviceLevel: string;
  status: string;
  shippedDate: string | null;
  estimatedDelivery: string;
  actualDelivery: string | null;
  destination: {
    fullName: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  weight: { total: number; unit: string };
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  cost: {
    shipping: number;
    insurance: number;
    total: number;
    currency: string;
  };
  insurance: { coverage: number; cost: number };
  customsInfo: Array<{
    description: string;
    quantity: number;
    value: number;
    hsCode: string;
    countryOfOrigin: string;
  }>;
  trackingEvents: Array<{
    status: string;
    location: string;
    description: string;
    timestamp: string;
  }>;
  notes: string;
  transaction: Transaction | null;
  createdAt: string;
  updatedAt: string;
}

interface DHLLabelData {
  trackingNumber: string;
  trackingUrl: string;
  labelUrl: string;
  waybillUrl?: string;
}

export default function AdminShipmentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [shipment, setShipment] = useState<ShipmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creatingLabel, setCreatingLabel] = useState(false);
  const [dhlLabel, setDhlLabel] = useState<DHLLabelData | null>(null);

  // 🔥 NEW: Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  // 🔥 NEW: Form states
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationPriority, setNotificationPriority] = useState('normal');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchShipmentDetails();
  }, [id]);

  const fetchShipmentDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiHelpers.get(`/admin/shipments/${id}`);
      setShipment(response.shipment);

      // Check if DHL label exists
      if (response.shipment.notes?.includes('DHL Label:')) {
        const labelMatch = response.shipment.notes.match(
          /DHL Label: (https?:\/\/[^\s]+)/
        );
        if (labelMatch) {
          setDhlLabel({
            trackingNumber: response.shipment.trackingNumber,
            trackingUrl: `https://www.dhl.com/en/express/tracking.html?AWB=${response.shipment.trackingNumber}`,
            labelUrl: labelMatch[1],
          });
        }
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load shipment details');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 NEW: Approve shipment
  const handleApprove = async () => {
    if (!shipment) return;

    try {
      setActionLoading(true);
      await apiHelpers.post(`/admin/shipments/${id}/approve`, {
        notes: approvalNotes,
      });
      alert('Shipment approved successfully!');
      setShowApprovalModal(false);
      setApprovalNotes('');
      await fetchShipmentDetails();
    } catch (error: any) {
      alert(error.message || 'Failed to approve shipment');
    } finally {
      setActionLoading(false);
    }
  };

  // 🔥 NEW: Reject shipment
  const handleReject = async () => {
    if (!shipment || !rejectionReason) {
      alert('Rejection reason is required');
      return;
    }

    if (
      !confirm(
        'Are you sure you want to reject this shipment? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      setActionLoading(true);
      await apiHelpers.post(`/admin/shipments/${id}/reject`, {
        reason: rejectionReason,
      });
      alert('Shipment rejected successfully');
      setShowApprovalModal(false);
      setRejectionReason('');
      await fetchShipmentDetails();
    } catch (error: any) {
      alert(error.message || 'Failed to reject shipment');
    } finally {
      setActionLoading(false);
    }
  };

  // 🔥 NEW: Update payment status
  const handleUpdatePayment = async () => {
    if (!paymentStatus) {
      alert('Please select a payment status');
      return;
    }

    try {
      setActionLoading(true);
      await apiHelpers.put(`/admin/shipments/${id}/payment-status`, {
        status: paymentStatus,
        notes: paymentNotes,
      });
      alert('Payment status updated successfully!');
      setShowPaymentModal(false);
      setPaymentStatus('');
      setPaymentNotes('');
      await fetchShipmentDetails();
    } catch (error: any) {
      alert(error.message || 'Failed to update payment status');
    } finally {
      setActionLoading(false);
    }
  };

  // 🔥 NEW: Send notification
  const handleSendNotification = async () => {
    if (!notificationTitle || !notificationMessage) {
      alert('Title and message are required');
      return;
    }

    try {
      setActionLoading(true);
      await apiHelpers.post(`/admin/shipments/${id}/notify`, {
        title: notificationTitle,
        message: notificationMessage,
        priority: notificationPriority,
      });
      alert('Notification sent successfully!');
      setShowNotificationModal(false);
      setNotificationTitle('');
      setNotificationMessage('');
      setNotificationPriority('normal');
    } catch (error: any) {
      alert(error.message || 'Failed to send notification');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateDHLLabel = async () => {
    if (!shipment) return;

    try {
      setCreatingLabel(true);
      setError('');

      const response = await apiHelpers.post(
        `/admin/shipments/${id}/create-label`,
        {}
      );

      setDhlLabel(response.dhl);
      await fetchShipmentDetails();

      alert('DHL shipping label created successfully!');
    } catch (error: any) {
      setError(error.message || 'Failed to create DHL label');
      alert(error.message || 'Failed to create DHL label');
    } finally {
      setCreatingLabel(false);
    }
  };

  const handlePrintLabel = () => {
    if (dhlLabel?.labelUrl) {
      const printWindow = window.open(dhlLabel.labelUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      processing: 'bg-blue-100 text-blue-700 border-blue-300',
      in_transit: 'bg-purple-100 text-purple-700 border-purple-300',
      delivered: 'bg-green-100 text-green-700 border-green-300',
      cancelled: 'bg-red-100 text-red-700 border-red-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      completed: 'bg-green-100 text-green-700 border-green-300',
      failed: 'bg-red-100 text-red-700 border-red-300',
      refunded: 'bg-purple-100 text-purple-700 border-purple-300',
      cancelled: 'bg-gray-100 text-gray-700 border-gray-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className='flex items-center justify-center h-96'>
          <div className='text-center'>
            <Loader2 className='w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4' />
            <p className='text-slate-600 font-semibold'>
              Loading shipment details...
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error && !shipment) {
    return (
      <AdminLayout>
        <div className='flex items-center justify-center h-96'>
          <div className='text-center'>
            <AlertCircle className='w-16 h-16 text-red-500 mx-auto mb-4' />
            <h2 className='text-2xl font-bold text-slate-900 mb-2'>Error</h2>
            <p className='text-slate-600 mb-4'>{error}</p>
            <button
              onClick={() => navigate('/admin/shipments')}
              className='px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700'
            >
              Back to Shipments
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!shipment) return null;

  const isPending = shipment.status === 'pending';
  const isPaid =
    shipment.transaction?.status === 'completed' ||
    shipment.transaction?.paymentMethod === 'cash_on_delivery';

  return (
    <AdminLayout>
      <div className='max-w-7xl mx-auto space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <button
              onClick={() => navigate('/admin/shipments')}
              className='p-2 hover:bg-slate-100 rounded-lg transition-colors'
            >
              <ArrowLeft className='w-6 h-6 text-slate-700' />
            </button>
            <div>
              <h1 className='text-3xl font-bold text-slate-900'>
                Shipment Details
              </h1>
              <p className='text-slate-600'>
                Tracking: {shipment.trackingNumber}
              </p>
            </div>
          </div>

          <div className='flex items-center gap-3'>
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${getStatusColor(
                shipment.status
              )}`}
            >
              {shipment.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className='bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3'
          >
            <AlertCircle className='w-5 h-5 text-red-600 flex-shrink-0 mt-0.5' />
            <div>
              <p className='font-semibold text-red-900'>Error</p>
              <p className='text-sm text-red-700'>{error}</p>
            </div>
          </motion.div>
        )}

        {/* 🔥 NEW: Action Buttons */}
        <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
          <h3 className='font-bold text-slate-900 mb-4'>Quick Actions</h3>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            {isPending && (
              <>
                <button
                  onClick={() => setShowApprovalModal(true)}
                  disabled={!isPaid}
                  className='flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                  title={!isPaid ? 'Payment must be confirmed first' : ''}
                >
                  <CheckCircle className='w-5 h-5' />
                  Approve Shipment
                </button>
                <button
                  onClick={() => {
                    setShowApprovalModal(true);
                  }}
                  className='flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors'
                >
                  <XCircle className='w-5 h-5' />
                  Reject Shipment
                </button>
              </>
            )}

            <button
              onClick={() => setShowPaymentModal(true)}
              className='flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors'
            >
              <CreditCard className='w-5 h-5' />
              Manage Payment
            </button>

            <button
              onClick={() => setShowNotificationModal(true)}
              className='flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors'
            >
              <MessageSquare className='w-5 h-5' />
              Send Notification
            </button>
          </div>
        </div>

        {/* 🔥 NEW: Payment Information */}
        {shipment.transaction && (
          <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-xl font-bold text-slate-900 flex items-center gap-2'>
                <CreditCard className='w-5 h-5' />
                Payment Information
              </h2>
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${getPaymentStatusColor(
                  shipment.transaction.status
                )}`}
              >
                {shipment.transaction.status.toUpperCase()}
              </span>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <div>
                <p className='text-sm text-slate-600 mb-1'>Amount</p>
                <p className='text-2xl font-bold text-green-600'>
                  {shipment.transaction.amount.value}{' '}
                  {shipment.transaction.amount.currency}
                </p>
              </div>
              <div>
                <p className='text-sm text-slate-600 mb-1'>Payment Method</p>
                <p className='font-semibold text-slate-900'>
                  {shipment.transaction.paymentMethod
                    .replace('_', ' ')
                    .toUpperCase()}
                </p>
              </div>
              <div>
                <p className='text-sm text-slate-600 mb-1'>
                  {shipment.transaction.completedAt
                    ? 'Completed At'
                    : 'Created At'}
                </p>
                <p className='font-semibold text-slate-900'>
                  {new Date(
                    shipment.transaction.completedAt ||
                      shipment.transaction.createdAt
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className='grid lg:grid-cols-3 gap-6'>
          {/* Main Content */}
          <div className='lg:col-span-2 space-y-6'>
            {/* DHL Label Section */}
            <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
              <h2 className='text-xl font-bold text-slate-900 mb-4 flex items-center gap-2'>
                <Truck className='w-5 h-5' />
                DHL Shipping
              </h2>

              {dhlLabel ? (
                <div className='space-y-4'>
                  <div className='p-4 bg-green-50 border-2 border-green-200 rounded-xl'>
                    <div className='flex items-start gap-3'>
                      <CheckCircle className='w-5 h-5 text-green-600 flex-shrink-0 mt-0.5' />
                      <div className='flex-1'>
                        <p className='font-semibold text-green-900'>
                          DHL Label Created
                        </p>
                        <p className='text-sm text-green-700 mt-1'>
                          Tracking Number: {dhlLabel.trackingNumber}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className='grid md:grid-cols-2 gap-3'>
                    <button
                      onClick={handlePrintLabel}
                      className='flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors'
                    >
                      <Printer className='w-5 h-5' />
                      Print Label
                    </button>

                    <a
                      href={dhlLabel.labelUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='flex items-center justify-center gap-2 px-4 py-3 border-2 border-blue-600 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors'
                    >
                      <Download className='w-5 h-5' />
                      Download Label
                    </a>

                    <a
                      href={dhlLabel.trackingUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='flex items-center justify-center gap-2 px-4 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors md:col-span-2'
                    >
                      <ExternalLink className='w-5 h-5' />
                      Track on DHL.com
                    </a>
                  </div>
                </div>
              ) : (
                <div className='space-y-4'>
                  <div className='p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl'>
                    <div className='flex items-start gap-3'>
                      <AlertCircle className='w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5' />
                      <div>
                        <p className='font-semibold text-yellow-900'>
                          No DHL Label Created
                        </p>
                        <p className='text-sm text-yellow-700 mt-1'>
                          Create a DHL shipping label to enable tracking
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleCreateDHLLabel}
                    disabled={
                      creatingLabel ||
                      shipment.status === 'delivered' ||
                      shipment.status === 'cancelled'
                    }
                    className='w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {creatingLabel ? (
                      <>
                        <Loader2 className='w-5 h-5 animate-spin' />
                        Creating DHL Label...
                      </>
                    ) : (
                      <>
                        <Send className='w-5 h-5' />
                        Create DHL Shipping Label
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Rest of existing content (Tracking Timeline, Packages, etc.) */}
            {/* ... Keep existing sections ... */}
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Client Info */}
            <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
              <h3 className='font-bold text-slate-900 mb-4'>Client</h3>
              <div className='space-y-3'>
                <div>
                  <p className='text-xs text-slate-500'>Name</p>
                  <p className='font-semibold text-slate-900'>
                    {shipment.userId.name}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-slate-500'>Suite Number</p>
                  <p className='font-mono font-bold text-blue-600'>
                    {shipment.userId.suiteNumber}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-slate-500'>Email</p>
                  <p className='text-sm text-slate-700'>
                    {shipment.userId.email}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-slate-500'>Phone</p>
                  <p className='text-sm text-slate-700'>
                    {shipment.userId.phone}
                  </p>
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className='bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200'>
              <h3 className='font-bold text-slate-900 mb-4 flex items-center gap-2'>
                <DollarSign className='w-5 h-5' />
                Cost
              </h3>
              <div className='space-y-2'>
                <div className='flex justify-between'>
                  <span className='text-slate-700'>Shipping</span>
                  <span className='font-semibold text-slate-900'>
                    {shipment.cost.shipping} {shipment.cost.currency}
                  </span>
                </div>
                {shipment.cost.insurance > 0 && (
                  <div className='flex justify-between'>
                    <span className='text-slate-700'>Insurance</span>
                    <span className='font-semibold text-slate-900'>
                      {shipment.cost.insurance} {shipment.cost.currency}
                    </span>
                  </div>
                )}
                <div className='pt-2 border-t-2 border-green-300 flex justify-between'>
                  <span className='font-bold text-slate-900'>Total</span>
                  <span className='text-xl font-bold text-green-600'>
                    {shipment.cost.total} {shipment.cost.currency}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 🔥 NEW: Approval Modal */}
        <AnimatePresence>
          {showApprovalModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className='bg-white rounded-2xl p-8 max-w-md w-full'
              >
                <h3 className='text-2xl font-bold text-slate-900 mb-6'>
                  Shipment Approval
                </h3>

                <div className='space-y-4 mb-6'>
                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      Approval Notes (Optional)
                    </label>
                    <textarea
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      rows={3}
                      className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none'
                      placeholder='Add any notes for the approval...'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      Rejection Reason (Required for rejection)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                      className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none'
                      placeholder='Enter reason if rejecting...'
                    />
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-3'>
                  <button
                    onClick={() => {
                      setShowApprovalModal(false);
                      setApprovalNotes('');
                      setRejectionReason('');
                    }}
                    disabled={actionLoading}
                    className='px-6 py-3 border-2 border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50'
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleApprove}
                    disabled={actionLoading || !isPaid}
                    className='px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                  >
                    {actionLoading ? (
                      <Loader2 className='w-5 h-5 animate-spin' />
                    ) : (
                      <>
                        <CheckCircle className='w-5 h-5' />
                        Approve
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleReject}
                    disabled={actionLoading || !rejectionReason}
                    className='col-span-2 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                  >
                    {actionLoading ? (
                      <Loader2 className='w-5 h-5 animate-spin' />
                    ) : (
                      <>
                        <XCircle className='w-5 h-5' />
                        Reject
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🔥 NEW: Payment Modal */}
        <AnimatePresence>
          {showPaymentModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className='bg-white rounded-2xl p-8 max-w-md w-full'
              >
                <h3 className='text-2xl font-bold text-slate-900 mb-6'>
                  Update Payment Status
                </h3>

                <div className='space-y-4 mb-6'>
                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      Payment Status
                    </label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                      className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
                    >
                      <option value=''>Select status...</option>
                      <option value='pending'>Pending</option>
                      <option value='completed'>Completed</option>
                      <option value='failed'>Failed</option>
                      <option value='refunded'>Refunded</option>
                    </select>
                  </div>

                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      Notes (Optional)
                    </label>
                    <textarea
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      rows={3}
                      className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none'
                      placeholder='Add any notes about the payment...'
                    />
                  </div>
                </div>

                <div className='flex gap-3'>
                  <button
                    onClick={() => {
                      setShowPaymentModal(false);
                      setPaymentStatus('');
                      setPaymentNotes('');
                    }}
                    disabled={actionLoading}
                    className='flex-1 px-6 py-3 border-2 border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50'
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleUpdatePayment}
                    disabled={actionLoading || !paymentStatus}
                    className='flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                  >
                    {actionLoading ? (
                      <Loader2 className='w-5 h-5 animate-spin' />
                    ) : (
                      <>
                        <CheckCircle className='w-5 h-5' />
                        Update
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🔥 NEW: Notification Modal */}
        <AnimatePresence>
          {showNotificationModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className='bg-white rounded-2xl p-8 max-w-md w-full'
              >
                <h3 className='text-2xl font-bold text-slate-900 mb-6'>
                  Send Notification
                </h3>

                <div className='space-y-4 mb-6'>
                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      Title
                    </label>
                    <input
                      type='text'
                      value={notificationTitle}
                      onChange={(e) => setNotificationTitle(e.target.value)}
                      className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
                      placeholder='Notification title...'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      Message
                    </label>
                    <textarea
                      value={notificationMessage}
                      onChange={(e) => setNotificationMessage(e.target.value)}
                      rows={4}
                      className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none'
                      placeholder='Your message to the customer...'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      Priority
                    </label>
                    <select
                      value={notificationPriority}
                      onChange={(e) => setNotificationPriority(e.target.value)}
                      className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
                    >
                      <option value='low'>Low</option>
                      <option value='normal'>Normal</option>
                      <option value='high'>High</option>
                    </select>
                  </div>
                </div>

                <div className='flex gap-3'>
                  <button
                    onClick={() => {
                      setShowNotificationModal(false);
                      setNotificationTitle('');
                      setNotificationMessage('');
                      setNotificationPriority('normal');
                    }}
                    disabled={actionLoading}
                    className='flex-1 px-6 py-3 border-2 border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50'
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleSendNotification}
                    disabled={
                      actionLoading ||
                      !notificationTitle ||
                      !notificationMessage
                    }
                    className='flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                  >
                    {actionLoading ? (
                      <Loader2 className='w-5 h-5 animate-spin' />
                    ) : (
                      <>
                        <Bell className='w-5 h-5' />
                        Send
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
}
