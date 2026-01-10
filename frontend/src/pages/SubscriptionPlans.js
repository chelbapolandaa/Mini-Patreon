import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { creatorAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import {
  CurrencyDollarIcon,
  CalendarIcon,
  CheckIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

function SubscriptionPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await creatorAPI.getMyPlans();
      setPlans(response.data.plans || []);
    } catch (error) {
      toast.error('Failed to load subscription plans');
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this plan? Existing subscribers will not be affected.')) {
      return;
    }

    try {
      // TODO: Implement delete API endpoint
      toast.error('Delete functionality not implemented yet');
      // await creatorAPI.deletePlan(id);
      // toast.success('Plan deleted successfully');
      // fetchPlans();
    } catch (error) {
      toast.error('Failed to delete plan');
      console.error('Error deleting plan:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Subscription Plans</h1>
            <p className="text-gray-600 mt-2">Manage your subscription pricing plans</p>
          </div>
          
          <Link
            to="/creator/plans/create"
            className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition duration-200 inline-flex items-center"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Plan
          </Link>
        </div>

        {/* Plans Grid */}
        {plans.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CurrencyDollarIcon className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No subscription plans yet</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Create your first subscription plan to start earning from your content. 
              You can offer different plans with various benefits and pricing.
            </p>
            <Link
              to="/creator/plans/create"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition duration-200 inline-flex items-center"
            >
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Your First Plan
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div key={plan.id} className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
                {/* Plan Header */}
                <div className="p-6 border-b">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                      {plan.description && (
                        <p className="text-gray-600 mt-1">{plan.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {formatCurrency(plan.price)}
                      </div>
                      <div className="text-gray-500 capitalize">/{plan.interval}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {plan.interval === 'monthly' ? 'Billed monthly' : 'Billed yearly'}
                  </div>
                </div>

                {/* Features */}
                <div className="p-6">
                  <h4 className="font-medium text-gray-900 mb-3">Features:</h4>
                  <ul className="space-y-2">
                    {plan.features && plan.features.length > 0 ? (
                      plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-400">No features specified</li>
                    )}
                  </ul>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      {plan.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {/* TODO: Edit functionality */}}
                        className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                        title="Edit"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      
                      <button
                        onClick={() => handleDelete(plan.id)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tips Section */}
        <div className="mt-12 bg-blue-50 rounded-xl p-6">
          <h2 className="text-lg font-bold text-blue-900 mb-4">Tips for Setting Prices</h2>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <li className="flex items-start">
              <div className="bg-blue-100 text-blue-600 rounded-full p-1 mr-3 mt-1">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-blue-800">Start with a low price and increase as you add more value</span>
            </li>
            <li className="flex items-start">
              <div className="bg-blue-100 text-blue-600 rounded-full p-1 mr-3 mt-1">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-blue-800">Offer yearly plans at a discount (e.g., 20% off)</span>
            </li>
            <li className="flex items-start">
              <div className="bg-blue-100 text-blue-600 rounded-full p-1 mr-3 mt-1">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-blue-800">Clearly list benefits so subscribers know what they're getting</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default SubscriptionPlans;