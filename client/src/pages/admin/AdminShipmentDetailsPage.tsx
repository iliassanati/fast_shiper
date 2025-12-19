// client/src/pages/admin/AdminShipmentDetailsPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Truck,
  Package,
  MapPin,
  User,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  ExternalLink,
  Send,
  CreditCard,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { useAdminShipmentStore } from '@/stores/useAdminShipmentStore';

export default function AdminShipmentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    selectedShipment,
    loading,
    error,
    fetchShipmentById,
    approveShipment,
    rejectShipment,
    updatePaymentStatus,
    trackShipment,
    sendNotification,
  } = useAdminShipmentStore();

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [approveNotes, setApproveNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (id) {
      fetchShipmentById(id);
    }
  }, [id, fetchShipmentById]);

  const handleApprove = async () => {
    if (!id) return;
    setProcessing(true);
    try {
      await approveShipment(id, approveNotes);
      setShowApproveModal(false);
      setApproveNotes('');
    } catch (error) {
      console.error('Failed to approve shipment:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!id || !rejectReason.trim()) return;
    setProcessing(true);
    try {
      await rejectShipment(id, rejectReason);
      setShowRejectModal(false);
      setRejectReason('');
    } catch (error) {
      console.error('Failed to reject shipment:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleNotify = async () => {
    if (!id || !notificationTitle.trim() || !notificationMessage.trim()) return;
    setProcessing(true);
    try {
      await sendNotification(id, notificationTitle, notificationMessage);
      setShowNotifyModal(false);
      setNotificationTitle('');
      setNotificationMessage('');
    } catch (error) {
      console.error('Failed to send notification:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentUpdate = async (status: string) => {
    if (!id) return;
    setProcessing(true);
    try {
      await updatePaymentStatus(id, status);
    } catch (error) {
      console.error('Failed to update payment status:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleTrackShipment = async () => {
    if (!id) return;
    await trackShipment(id);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      in_transit: 'bg-blue-100 text-blue-800 border-blue-300',
      delivered: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className='w-5 h-5' />;
      case 'in_transit':
        return <Truck className='w-5 h-5' />;
      case 'delivered':
        return <CheckCircle className='w-5 h-5' />;
      case 'cancelled':
        return <XCircle className='w-5 h-5' />;
      default:
        return <Package className='w-5 h-5' />;
    }
  };

  if (loading && !selectedShipment) {
    return (
      <AdminLayout>
        <div className='flex items-center justify-center h-96'>
          <div className='text-center'>
            <div className='w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
            <p className='text-slate-600 font-semibold'>Loading shipment...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !selectedShipment) {
    return (
      <AdminLayout>
        <div className='text-center py-12'>
          <AlertCircle className='w-16 h-16 text-red-500 mx-auto mb-4' />
          <h2 className='text-2xl font-bold text-slate-900 mb-2'>
            Shipment Not Found
          </h2>
          <p className='text-slate-600 mb-6'>
            {error || 'Unable to load shipment details'}
          </p>
          <button
            onClick={() => navigate('/admin/shipments')}
            className='px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700'
          >
            Back to Shipments
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <button
              onClick={() => navigate('/admin/shipments')}
              className='p-2 hover:bg-slate-100 rounded-lg transition-colors'
            >
              <ArrowLeft className='w-6 h-6 text-slate-600' />
            </button>
            <div>
              <h1 className='text-3xl font-bold text-slate-900'>
                Shipment Details
              </h1>
              <p className='text-slate-600'>
                {selectedShipment.trackingNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-6 border-2 ${getStatusColor(
            selectedShipment.status
          )}`}
        >
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              {getStatusIcon(selectedShipment.status)}
              <div>
                <p className='font-bold text-lg'>
                  {selectedShipment.status.replace('_', ' ').toUpperCase()}
                </p>
                <p className='text-sm opacity-75'>
                  {selectedShipment.deliveredAt
                    ? `Delivered on ${new Date(
                        selectedShipment.deliveredAt
                      ).toLocaleDateString()}`
                    : selectedShipment.estimatedDelivery
                    ? `Est. delivery: ${new Date(
                        selectedShipment.estimatedDelivery
                      ).toLocaleDateString()}`
                    : 'Processing'}
                </p>
              </div>
            </div>
            {selectedShipment.trackingUrl && (
              <a
                href={selectedShipment.trackingUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='flex items-center gap-2 px-4 py-2 bg-white rounded-lg font-semibold hover:bg-opacity-90 transition-colors'
              >
                Track Package
                <ExternalLink className='w-4 h-4' />
              </a>
            )}
          </div>
        </motion.div>

        {/* Action Buttons */}
        {selectedShipment.status === 'pending' && (
          <div className='flex gap-3'>
            <motion.button
              onClick={() => setShowApproveModal(true)}
              className='flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 flex items-center justify-center gap-2'
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <CheckCircle className='w-5 h-5' />
              Approve Shipment
            </motion.button>
            <motion.button
              onClick={() => setShowRejectModal(true)}
              className='flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 flex items-center justify-center gap-2'
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <XCircle className='w-5 h-5' />
              Reject Shipment
            </motion.button>
          </div>
        )}

        {selectedShipment.status === 'in_transit' && (
          <motion.button
            onClick={() => setShowNotifyModal(true)}
            className='w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 flex items-center justify-center gap-2'
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Send className='w-5 h-5' />
            Notify User
          </motion.button>
        )}

        {/* Main Content Grid */}
        <div className='grid lg:grid-cols-3 gap-6'>
          {/* Left Column - Shipment Details */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Shipping Information */}
            <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
              <h2 className='text-xl font-bold text-slate-900 mb-4 flex items-center gap-2'>
                <Truck className='w-6 h-6 text-blue-600' />
                Shipping Information
              </h2>
              <div className='grid md:grid-cols-2 gap-4'>
                <div>
                  <p className='text-sm text-slate-600'>Carrier</p>
                  <p className='font-semibold text-slate-900'>
                    {selectedShipment.carrier}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-slate-600'>Service Level</p>
                  <p className='font-semibold text-slate-900'>
                    {selectedShipment.serviceLevelName}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-slate-600'>Tracking Number</p>
                  <p className='font-semibold text-slate-900'>
                    {selectedShipment.trackingNumber}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-slate-600'>Weight</p>
                  <p className='font-semibold text-slate-900'>
                    {selectedShipment.weight} kg
                  </p>
                </div>
                <div>
                  <p className='text-sm text-slate-600'>
                    Dimensions (L × W × H)
                  </p>
                  <p className='font-semibold text-slate-900'>
                    {selectedShipment.dimensions.length} ×{' '}
                    {selectedShipment.dimensions.width} ×{' '}
                    {selectedShipment.dimensions.height} cm
                  </p>
                </div>
                <div>
                  <p className='text-sm text-slate-600'>Declared Value</p>
                  <p className='font-semibold text-green-600'>
                    ${selectedShipment.declaredValue}
                  </p>
                </div>
              </div>
              {selectedShipment.labelUrl && (
                <a
                  href={selectedShipment.labelUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold'
                >
                  <Download className='w-4 h-4' />
                  Download Shipping Label
                </a>
              )}
            </div>

            {/* Destination */}
            <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
              <h2 className='text-xl font-bold text-slate-900 mb-4 flex items-center gap-2'>
                <MapPin className='w-6 h-6 text-red-600' />
                Destination
              </h2>
              <div className='space-y-3'>
                <div>
                  <p className='text-sm text-slate-600'>Recipient</p>
                  <p className='font-semibold text-slate-900'>
                    {selectedShipment.recipientInfo.name}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-slate-600'>Address</p>
                  <p className='font-semibold text-slate-900'>
                    {selectedShipment.recipientInfo.address}
                  </p>
                  <p className='text-slate-700'>
                    {selectedShipment.recipientInfo.city}
                    {selectedShipment.recipientInfo.state &&
                      `, ${selectedShipment.recipientInfo.state}`}{' '}
                    {selectedShipment.recipientInfo.postalCode}
                  </p>
                  <p className='text-slate-700'>
                    {selectedShipment.recipientInfo.country}
                  </p>
                </div>
                <div className='grid md:grid-cols-2 gap-4'>
                  <div>
                    <p className='text-sm text-slate-600'>Phone</p>
                    <p className='font-semibold text-slate-900'>
                      {selectedShipment.recipientInfo.phone}
                    </p>
                  </div>
                  {selectedShipment.recipientInfo.email && (
                    <div>
                      <p className='text-sm text-slate-600'>Email</p>
                      <p className='font-semibold text-slate-900'>
                        {selectedShipment.recipientInfo.email}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Packages */}
            <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
              <h2 className='text-xl font-bold text-slate-900 mb-4 flex items-center gap-2'>
                <Package className='w-6 h-6 text-purple-600' />
                Packages ({selectedShipment.packages.length})
              </h2>
              <div className='space-y-3'>
                {selectedShipment.packages.map((pkg, index) => (
                  <div
                    key={index}
                    className='p-4 bg-slate-50 rounded-xl border border-slate-200'
                  >
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='font-semibold text-slate-900'>
                          {pkg.trackingNumber}
                        </p>
                        <p className='text-sm text-slate-600'>
                          {pkg.description}
                        </p>
                      </div>
                      <span className='text-sm font-semibold text-blue-600'>
                        {pkg.retailer}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - User & Transaction */}
          <div className='space-y-6'>
            {/* User Information */}
            <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
              <h2 className='text-xl font-bold text-slate-900 mb-4 flex items-center gap-2'>
                <User className='w-6 h-6 text-indigo-600' />
                Customer
              </h2>
              <div className='space-y-3'>
                <div>
                  <p className='text-sm text-slate-600'>Name</p>
                  <p className='font-semibold text-slate-900'>
                    {selectedShipment.userId.name}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-slate-600'>Suite Number</p>
                  <p className='font-semibold text-slate-900'>
                    {selectedShipment.userId.suiteNumber}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-slate-600'>Email</p>
                  <p className='font-semibold text-slate-900 flex items-center gap-2'>
                    <Mail className='w-4 h-4 text-slate-400' />
                    {selectedShipment.userId.email}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-slate-600'>Phone</p>
                  <p className='font-semibold text-slate-900 flex items-center gap-2'>
                    <Phone className='w-4 h-4 text-slate-400' />
                    {selectedShipment.userId.phone}
                  </p>
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
              <h2 className='text-xl font-bold text-slate-900 mb-4 flex items-center gap-2'>
                <DollarSign className='w-6 h-6 text-green-600' />
                Cost Breakdown
              </h2>
              <div className='space-y-3'>
                <div className='flex justify-between'>
                  <span className='text-slate-600'>Shipping Cost</span>
                  <span className='font-semibold text-slate-900'>
                    ${selectedShipment.shippingCost}
                  </span>
                </div>
                {selectedShipment.photoRequestFees > 0 && (
                  <div className='flex justify-between'>
                    <span className='text-slate-600'>Photo Requests</span>
                    <span className='font-semibold text-slate-900'>
                      ${selectedShipment.photoRequestFees}
                    </span>
                  </div>
                )}
                {selectedShipment.protectionFee > 0 && (
                  <div className='flex justify-between'>
                    <span className='text-slate-600'>Protection Fee</span>
                    <span className='font-semibold text-slate-900'>
                      ${selectedShipment.protectionFee}
                    </span>
                  </div>
                )}
                <div className='border-t border-slate-200 pt-3'>
                  <div className='flex justify-between items-center'>
                    <span className='text-lg font-bold text-slate-900'>
                      Total
                    </span>
                    <span className='text-2xl font-bold text-green-600'>
                      ${selectedShipment.totalCost}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Status */}
            <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
              <h2 className='text-xl font-bold text-slate-900 mb-4 flex items-center gap-2'>
                <CreditCard className='w-6 h-6 text-purple-600' />
                Payment Status
              </h2>
              <div className='space-y-4'>
                <div>
                  <p className='text-sm text-slate-600 mb-2'>Status</p>
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      selectedShipment.paymentStatus === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : selectedShipment.paymentStatus === 'refunded'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {selectedShipment.paymentStatus.toUpperCase()}
                  </span>
                </div>
                {selectedShipment.transaction && (
                  <div>
                    <p className='text-sm text-slate-600'>Transaction ID</p>
                    <p className='font-mono text-sm text-slate-900'>
                      {selectedShipment.transaction.id}
                    </p>
                  </div>
                )}
                {selectedShipment.paymentStatus === 'pending' && (
                  <button
                    onClick={() => handlePaymentUpdate('paid')}
                    disabled={processing}
                    className='w-full px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50'
                  >
                    Mark as Paid
                  </button>
                )}
                {selectedShipment.paymentStatus === 'paid' && (
                  <button
                    onClick={() => handlePaymentUpdate('refunded')}
                    disabled={processing}
                    className='w-full px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50'
                  >
                    Process Refund
                  </button>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
              <h2 className='text-xl font-bold text-slate-900 mb-4'>
                Quick Actions
              </h2>
              <div className='space-y-2'>
                <button
                  onClick={handleTrackShipment}
                  disabled={loading}
                  className='w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2'
                >
                  <RefreshCw className='w-4 h-4' />
                  Update Tracking
                </button>
                <button
                  onClick={() => setShowNotifyModal(true)}
                  className='w-full px-4 py-2 border-2 border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 flex items-center justify-center gap-2'
                >
                  <Send className='w-4 h-4' />
                  Send Notification
                </button>
              </div>
            </div>

            {/* Timestamps */}
            <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
              <h2 className='text-xl font-bold text-slate-900 mb-4 flex items-center gap-2'>
                <Calendar className='w-6 h-6 text-orange-600' />
                Timeline
              </h2>
              <div className='space-y-3 text-sm'>
                <div>
                  <p className='text-slate-600'>Created</p>
                  <p className='font-semibold text-slate-900'>
                    {new Date(selectedShipment.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className='text-slate-600'>Last Updated</p>
                  <p className='font-semibold text-slate-900'>
                    {new Date(selectedShipment.updatedAt).toLocaleString()}
                  </p>
                </div>
                {selectedShipment.deliveredAt && (
                  <div>
                    <p className='text-slate-600'>Delivered</p>
                    <p className='font-semibold text-green-600'>
                      {new Date(selectedShipment.deliveredAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approve Modal */}
      <AnimatePresence>
        {showApproveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
            onClick={() => setShowApproveModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className='bg-white rounded-2xl p-6 max-w-md w-full shadow-xl'
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className='text-2xl font-bold text-slate-900 mb-4'>
                Approve Shipment
              </h2>
              <p className='text-slate-600 mb-4'>
                Are you sure you want to approve this shipment? This will
                proceed with the shipping process.
              </p>
              <textarea
                value={approveNotes}
                onChange={(e) => setApproveNotes(e.target.value)}
                placeholder='Add notes (optional)'
                className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none mb-4'
                rows={3}
              />
              <div className='flex gap-3'>
                <button
                  onClick={() => setShowApproveModal(false)}
                  className='flex-1 px-4 py-2 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50'
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={processing}
                  className='flex-1 px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50'
                >
                  {processing ? 'Processing...' : 'Approve'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
            onClick={() => setShowRejectModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className='bg-white rounded-2xl p-6 max-w-md w-full shadow-xl'
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className='text-2xl font-bold text-slate-900 mb-4'>
                Reject Shipment
              </h2>
              <p className='text-slate-600 mb-4'>
                Please provide a reason for rejecting this shipment.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder='Reason for rejection *'
                className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-red-500 focus:outline-none mb-4'
                rows={4}
                required
              />
              <div className='flex gap-3'>
                <button
                  onClick={() => setShowRejectModal(false)}
                  className='flex-1 px-4 py-2 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50'
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={processing || !rejectReason.trim()}
                  className='flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50'
                >
                  {processing ? 'Processing...' : 'Reject'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notify Modal */}
      <AnimatePresence>
        {showNotifyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
            onClick={() => setShowNotifyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className='bg-white rounded-2xl p-6 max-w-md w-full shadow-xl'
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className='text-2xl font-bold text-slate-900 mb-4'>
                Send Notification
              </h2>
              <p className='text-slate-600 mb-4'>
                Send a notification to the customer about this shipment.
              </p>
              <input
                type='text'
                value={notificationTitle}
                onChange={(e) => setNotificationTitle(e.target.value)}
                placeholder='Notification title *'
                className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none mb-3'
                required
              />
              <textarea
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                placeholder='Notification message *'
                className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none mb-4'
                rows={4}
                required
              />
              <div className='flex gap-3'>
                <button
                  onClick={() => setShowNotifyModal(false)}
                  className='flex-1 px-4 py-2 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50'
                >
                  Cancel
                </button>
                <button
                  onClick={handleNotify}
                  disabled={
                    processing ||
                    !notificationTitle.trim() ||
                    !notificationMessage.trim()
                  }
                  className='flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50'
                >
                  {processing ? 'Sending...' : 'Send'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
