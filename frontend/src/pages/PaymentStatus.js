import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { subscriptionAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

function PaymentStatus() {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [transaction, setTransaction] = useState(null);
  
  const checkPaymentStatus = useCallback(async () => {
    try {
      // Get orderId from URL query params
      const params = new URLSearchParams(location.search);
      const orderId = params.get('order_id');
      const transactionStatus = params.get('transaction_status');
      const statusCode = params.get('status_code');
      
      console.log('Payment callback params:', {
        orderId,
        transactionStatus,
        statusCode,
        allParams: Object.fromEntries(params)
      });
      
      // Jika ada transaction_status langsung dari URL Midtrans
      if (transactionStatus) {
        console.log('Got transaction status from URL:', transactionStatus);
        
        // Success statuses from Midtrans
        const successStatuses = ['capture', 'settlement', 'success'];
        const pendingStatuses = ['pending', 'challenge', 'authorize'];
        const failedStatuses = ['deny', 'cancel', 'expire', 'failure'];
        
        if (successStatuses.includes(transactionStatus.toLowerCase())) {
          setStatus('success');
          toast.success('Payment successful! Your subscription is now active.');
          return;
        } else if (pendingStatuses.includes(transactionStatus.toLowerCase())) {
          setStatus('pending');
          return;
        } else if (failedStatuses.includes(transactionStatus.toLowerCase())) {
          setStatus('failed');
          return;
        }
      }
      
      // Fallback: Check dengan API backend
      if (!orderId) {
        setStatus('error');
        toast.error('No order ID found in URL');
        return;
      }

      const response = await subscriptionAPI.checkPaymentStatus(orderId);
      console.log('Backend payment status response:', response.data);
      
      if (response.data.success) {
        const backendStatus = response.data.transaction?.status;
        
        if (backendStatus === 'success' || backendStatus === 'capture' || backendStatus === 'settlement') {
          setStatus('success');
          toast.success('Payment successful! Your subscription is now active.');
        } else if (backendStatus === 'pending') {
          setStatus('pending');
        } else {
          setStatus('failed');
        }
        
        setTransaction(response.data.transaction);
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      setStatus('error');
      toast.error('Failed to verify payment status');
    }
  }, [location.search]);

  useEffect(() => {
    checkPaymentStatus();
  }, [checkPaymentStatus]); // ✅ Fixed: added checkPaymentStatus to dependency array

  const renderStatus = () => {
    switch (status) {
      case 'success':
      case 'capture':
      case 'settlement':
        return (
        <div className="text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircleIcon className="h-16 w-16 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Payment Successful!</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Thank you for your subscription. You now have access to exclusive content from {transaction?.creatorName}.
          </p>
          
          {transaction && (
            <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Subscription Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-medium">{transaction.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">Rp{parseFloat(transaction.amount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Creator:</span>
                  <span className="font-medium">{transaction.creatorName || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan:</span>
                  <span className="font-medium">{transaction.planName || 'Unknown'}</span>
                </div>
                {transaction.planInterval && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Billing:</span>
                    <span className="font-medium capitalize">{transaction.planInterval}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition duration-200"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate(`/creator/${transaction?.creatorId || ''}`)}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-8 rounded-lg transition duration-200"
            >
              View Creator Content
            </button>
          </div>
        </div>
      );


      case 'pending':
        return (
          <div className="text-center">
            <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ClockIcon className="h-16 w-16 text-yellow-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Payment Pending</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Your payment is being processed. This may take a few moments.
              We'll notify you once it's completed.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition duration-200"
            >
              Return to Dashboard
            </button>
          </div>
        );

      case 'failed':
        return (
          <div className="text-center">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircleIcon className="h-16 w-16 text-red-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Payment Failed</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              We couldn't process your payment. Please try again or contact support if the problem persists.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => navigate('/creators')}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-8 rounded-lg transition duration-200"
              >
                Browse Creators
              </button>
              <button
                onClick={() => window.history.back()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition duration-200"
              >
                Try Again
              </button>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ExclamationCircleIcon className="h-16 w-16 text-red-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Something Went Wrong</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              We couldn't verify your payment status. Please check your dashboard or contact support.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition duration-200"
            >
              Go to Dashboard
            </button>
          </div>
        );

      default:
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Checking Payment Status</h2>
            <p className="text-gray-600">Please wait while we verify your payment...</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {renderStatus()}
      </div>
    </div>
  );
}

export default PaymentStatus;