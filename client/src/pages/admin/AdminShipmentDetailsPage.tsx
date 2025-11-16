// client/src/pages/admin/AdminShipmentDetailsPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { apiHelpers } from '@/lib/api';

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
  weight: {
    total: number;
    unit: string;
  };
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
  insurance: {
    coverage: number;
    cost: number;
  };
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
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [dhlLabel, setDhlLabel] = useState<DHLLabelData | null>(null);
  const [trackingData, setTrackingData] = useState<any>(null);

  useEffect(() => {
    fetchShipmentDetails();
  }, [id]);

  const fetchShipmentDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiHelpers.get(`/admin/shipments/${id}`);
      setShipment(response.shipment);

      // Check if DHL label already exists in notes
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

  const handleUpdateStatus = async (newStatus: string) => {
    if (!shipment) return;

    try {
      setUpdatingStatus(true);
      setError('');

      await apiHelpers.put(`/admin/shipments/${id}/status`, {
        status: newStatus,
      });

      await fetchShipmentDetails();
      alert('Shipment status updated successfully!');
    } catch (error: any) {
      setError(error.message || 'Failed to update status');
      alert(error.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddTrackingEvent = async () => {
    const status = prompt('Enter status (e.g., in_transit, delivered):');
    const location = prompt('Enter location:');
    const description = prompt('Enter description:');

    if (!status || !location || !description) return;

    try {
      setError('');
      await apiHelpers.post(`/admin/shipments/${id}/tracking`, {
        status,
        location,
        description,
      });

      await fetchShipmentDetails();
      alert('Tracking event added successfully!');
    } catch (error: any) {
      setError(error.message || 'Failed to add tracking event');
      alert(error.message || 'Failed to add tracking event');
    }
  };

  const handlePrintLabel = () => {
    if (dhlLabel?.labelUrl) {
      // Open label in new window for printing
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
            {/* Status Badge */}
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
                          Create a DHL shipping label to enable tracking and
                          delivery
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

            {/* Tracking Timeline */}
            <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
              <div className='flex items-center justify-between mb-6'>
                <h2 className='text-xl font-bold text-slate-900'>
                  Tracking Timeline
                </h2>
                <button
                  onClick={handleAddTrackingEvent}
                  className='text-sm px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700'
                >
                  + Add Event
                </button>
              </div>

              <div className='relative'>
                {shipment.trackingEvents.length > 0 ? (
                  shipment.trackingEvents.map((event, index) => (
                    <div key={index} className='flex gap-4 pb-8 last:pb-0'>
                      {/* Timeline Line */}
                      <div className='flex flex-col items-center'>
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            event.status === 'delivered'
                              ? 'bg-green-500'
                              : event.status === 'in_transit'
                              ? 'bg-blue-500'
                              : 'bg-purple-500'
                          }`}
                        >
                          {event.status === 'delivered' ? (
                            <CheckCircle className='w-5 h-5 text-white' />
                          ) : (
                            <Truck className='w-5 h-5 text-white' />
                          )}
                        </div>
                        {index < shipment.trackingEvents.length - 1 && (
                          <div className='w-0.5 h-full my-2 bg-slate-300' />
                        )}
                      </div>

                      {/* Content */}
                      <div className='flex-1 pb-4'>
                        <h4 className='font-bold text-slate-900 mb-1'>
                          {event.description}
                        </h4>
                        <p className='text-sm text-slate-600 mb-2'>
                          {event.location}
                        </p>
                        <p className='text-xs text-slate-500'>
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className='text-center py-8'>
                    <p className='text-slate-500'>No tracking events yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Package Information */}
            <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
              <h2 className='text-xl font-bold text-slate-900 mb-4 flex items-center gap-2'>
                <Package className='w-5 h-5' />
                Packages ({shipment.packageIds.length})
              </h2>

              <div className='space-y-3'>
                {shipment.packageIds.map((pkg) => (
                  <div
                    key={pkg._id}
                    className='p-4 border-2 border-slate-200 rounded-xl'
                  >
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='font-bold text-slate-900'>
                          {pkg.description}
                        </p>
                        <p className='text-sm text-slate-600'>
                          Tracking: {pkg.trackingNumber}
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className='text-sm text-slate-600'>
                          {pkg.weight.value} {pkg.weight.unit}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Destination Address */}
            <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
              <h2 className='text-xl font-bold text-slate-900 mb-4 flex items-center gap-2'>
                <MapPin className='w-5 h-5' />
                Destination Address
              </h2>

              <div className='p-4 bg-slate-50 rounded-xl'>
                <p className='font-bold text-slate-900'>
                  {shipment.destination.fullName}
                </p>
                <p className='text-slate-700 mt-2'>
                  {shipment.destination.street}
                </p>
                <p className='text-slate-700'>
                  {shipment.destination.city}, {shipment.destination.postalCode}
                </p>
                <p className='text-slate-700'>{shipment.destination.country}</p>
                <p className='text-slate-600 mt-3'>
                  📞 {shipment.destination.phone}
                </p>
              </div>
            </div>

            {/* Customs Information */}
            <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
              <h2 className='text-xl font-bold text-slate-900 mb-4 flex items-center gap-2'>
                <FileText className='w-5 h-5' />
                Customs Declaration
              </h2>

              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead className='bg-slate-50'>
                    <tr>
                      <th className='px-4 py-3 text-left text-xs font-bold text-slate-700'>
                        Description
                      </th>
                      <th className='px-4 py-3 text-left text-xs font-bold text-slate-700'>
                        Quantity
                      </th>
                      <th className='px-4 py-3 text-left text-xs font-bold text-slate-700'>
                        Value
                      </th>
                      <th className='px-4 py-3 text-left text-xs font-bold text-slate-700'>
                        HS Code
                      </th>
                      <th className='px-4 py-3 text-left text-xs font-bold text-slate-700'>
                        Origin
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-slate-100'>
                    {shipment.customsInfo.map((item, index) => (
                      <tr key={index}>
                        <td className='px-4 py-3 text-sm text-slate-900'>
                          {item.description}
                        </td>
                        <td className='px-4 py-3 text-sm text-slate-700'>
                          {item.quantity}
                        </td>
                        <td className='px-4 py-3 text-sm text-slate-700'>
                          ${item.value}
                        </td>
                        <td className='px-4 py-3 text-sm text-slate-600 font-mono'>
                          {item.hsCode || 'N/A'}
                        </td>
                        <td className='px-4 py-3 text-sm text-slate-600'>
                          {item.countryOfOrigin}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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

            {/* Shipment Details */}
            <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
              <h3 className='font-bold text-slate-900 mb-4'>Details</h3>
              <div className='space-y-3'>
                <div>
                  <p className='text-xs text-slate-500'>Carrier</p>
                  <p className='font-semibold text-slate-900'>
                    {shipment.carrier}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-slate-500'>Service Level</p>
                  <p className='font-semibold text-slate-900'>
                    {shipment.serviceLevel}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-slate-500'>Weight</p>
                  <p className='font-semibold text-slate-900'>
                    {shipment.weight.total} {shipment.weight.unit}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-slate-500'>Dimensions</p>
                  <p className='font-semibold text-slate-900'>
                    {shipment.dimensions.length} × {shipment.dimensions.width} ×{' '}
                    {shipment.dimensions.height} {shipment.dimensions.unit}
                  </p>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
              <h3 className='font-bold text-slate-900 mb-4 flex items-center gap-2'>
                <Calendar className='w-5 h-5' />
                Important Dates
              </h3>
              <div className='space-y-3'>
                <div>
                  <p className='text-xs text-slate-500'>Created</p>
                  <p className='text-sm text-slate-900'>
                    {new Date(shipment.createdAt).toLocaleString()}
                  </p>
                </div>
                {shipment.shippedDate && (
                  <div>
                    <p className='text-xs text-slate-500'>Shipped</p>
                    <p className='text-sm text-slate-900'>
                      {new Date(shipment.shippedDate).toLocaleString()}
                    </p>
                  </div>
                )}
                <div>
                  <p className='text-xs text-slate-500'>
                    {shipment.actualDelivery ? 'Delivered' : 'Est. Delivery'}
                  </p>
                  <p
                    className={`text-sm font-semibold ${
                      shipment.actualDelivery
                        ? 'text-green-600'
                        : 'text-blue-600'
                    }`}
                  >
                    {new Date(
                      shipment.actualDelivery || shipment.estimatedDelivery
                    ).toLocaleDateString()}
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

            {/* Actions */}
            <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
              <h3 className='font-bold text-slate-900 mb-4'>Actions</h3>
              <div className='space-y-3'>
                <select
                  onChange={(e) => handleUpdateStatus(e.target.value)}
                  value={shipment.status}
                  disabled={updatingStatus}
                  className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
                >
                  <option value='pending'>Pending</option>
                  <option value='processing'>Processing</option>
                  <option value='in_transit'>In Transit</option>
                  <option value='delivered'>Delivered</option>
                  <option value='cancelled'>Cancelled</option>
                </select>

                <button
                  onClick={fetchShipmentDetails}
                  className='w-full px-4 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2'
                >
                  <RefreshCw className='w-5 h-5' />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
