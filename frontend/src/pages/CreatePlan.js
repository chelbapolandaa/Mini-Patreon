import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { creatorAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';

function CreatePlan() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    interval: 'monthly',
    features: ['']
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFeatureChange = (index, value) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData(prev => ({
      ...prev,
      features: newFeatures
    }));
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const removeFeature = (index) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      features: newFeatures
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price) {
      toast.error('Plan name and price are required');
      return;
    }

    if (parseFloat(formData.price) <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }

    const filteredFeatures = formData.features.filter(feature => feature.trim() !== '');

    const submitData = {
      ...formData,
      price: parseFloat(formData.price),
      features: filteredFeatures
    };

    setLoading(true);
    try {
      await creatorAPI.createPlan(submitData);
      toast.success('Subscription plan created successfully!');
      navigate('/creator/plans');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create plan');
      console.error('Error creating plan:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/creator/plans')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Plans
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900">Create Subscription Plan</h1>
          <p className="text-gray-600 mt-2">Set up pricing plans for your subscribers</p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            {/* Plan Name */}
            <div className="mb-6">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Plan Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="e.g., Basic, Premium, VIP"
                maxLength={100}
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows="3"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Describe what subscribers will get with this plan"
                maxLength={500}
              />
            </div>

            {/* Price and Interval */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                  Price (IDR) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">Rp</span>
                  </div>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Billing Interval
                </label>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, interval: 'monthly' }))}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition ${
                      formData.interval === 'monthly'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-medium">Monthly</div>
                    <div className="text-sm">Billed every month</div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, interval: 'yearly' }))}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition ${
                      formData.interval === 'yearly'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-medium">Yearly</div>
                    <div className="text-sm">Billed every year</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Features
                </label>
                <button
                  type="button"
                  onClick={addFeature}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  + Add Feature
                </button>
              </div>
              
              <div className="space-y-3">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => handleFeatureChange(index, e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="e.g., Access to all exclusive content"
                        maxLength={200}
                      />
                    </div>
                    {formData.features.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="ml-3 text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              <p className="text-xs text-gray-500 mt-2">
                List the benefits subscribers will receive with this plan
              </p>
            </div>

            {/* Preview */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Plan Preview</h3>
              <div className="bg-white rounded-lg border p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-xl">{formData.name || 'Plan Name'}</h4>
                    {formData.description && (
                      <p className="text-gray-600 mt-1">{formData.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {formData.price ? `Rp${parseFloat(formData.price).toLocaleString()}` : 'Rp0'}
                    </div>
                    <div className="text-gray-500 capitalize">/{formData.interval}</div>
                  </div>
                </div>
                
                <div className="border-t pt-3">
                  <h5 className="font-medium mb-2">Features:</h5>
                  <ul className="space-y-2">
                    {formData.features
                      .filter(f => f.trim() !== '')
                      .map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    
                    {formData.features.filter(f => f.trim() !== '').length === 0 && (
                      <li className="text-gray-400">No features added yet</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition duration-200 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating Plan...
                  </>
                ) : (
                  'Create Subscription Plan'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreatePlan;