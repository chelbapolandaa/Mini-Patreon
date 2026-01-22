import React, { useEffect, useState } from 'react';
import { subscriptionAPI } from '../services/api';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

// 
function MySubscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSubscriptions = async () => {
    try {
      const response = await subscriptionAPI.getMySubscriptions();
      setSubscriptions(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleCancel = async (id) => {
    try {
      await subscriptionAPI.cancelSubscription(id);
      toast.success('Subscription cancelled');
      fetchSubscriptions();
    } catch (error) {
      toast.error('Failed to cancel subscription');
    }
  };

  const handleRenew = async (id) => {
    try {
      await subscriptionAPI.renewSubscription(id);
      toast.success('Subscription renewed');
      fetchSubscriptions();
    } catch (error) {
      toast.error('Failed to renew subscription');
    }
  };

  if (loading) return <p className="p-4">Loading subscriptions...</p>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Subscriptions</h1>
      {subscriptions.length === 0 ? (
        <p>You don’t have any active subscriptions.</p>
      ) : (
        <ul className="space-y-4">
          {subscriptions.map((sub) => (
            <li key={sub.id} className="p-4 bg-white rounded-lg shadow flex justify-between items-center">
              <div>
                <p className="font-medium">{sub.creatorName}</p>
                <p className="text-sm text-gray-600">Plan: {sub.planName}</p>
                <Link
                  to={`/creator/${sub.creatorId}`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  View Creator
                </Link>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleRenew(sub.id)}
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                >
                  Renew
                </button>
                <button
                  onClick={() => handleCancel(sub.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                >
                  Cancel
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default MySubscriptions;
