import React, { useState, useEffect } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import EmployeeLayout from '@/Layouts/EmployeeLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import { motion } from 'framer-motion';

export default function CreditConversion({ auth, leaveCredits, eligibility, conversionStats }) {
    const { data, setData, post, processing, errors } = useForm({
        leave_type: 'VL', // Default to VL only
        credits_requested: 10,
        remarks: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('employee.credit-conversion.submit'));
    };



    // In your React component, update the status display
const getStatusDisplay = (status) => {
    const statusMap = {
      'pending': 'Pending HR Review',
      'hr_approved': 'Approved by HR - Pending Dept Head',
      'dept_head_approved': 'Approved by Dept Head - Pending Admin',
      'admin_approved': 'Fully Approved - Ready for Processing',
      'rejected': 'Rejected'
    };
    return statusMap[status] || status;
  };
  
  // Update the eligibility check to require 15 credits
  const getEligibilityMessage = () => {
    const elig = eligibility.vl;
    if (!elig.eligible) {
      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-start space-x-3 p-4 bg-gradient-to-r from-rose-50 to-red-50 border border-rose-200 rounded-xl backdrop-blur-sm"
        >
          <div className="flex-shrink-0 w-5 h-5 bg-gradient-to-r from-rose-500 to-red-500 rounded-full flex items-center justify-center mt-0.5">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold bg-gradient-to-r from-rose-700 to-red-700 bg-clip-text text-transparent">Not Eligible</div>
            <div className="text-sm text-rose-700 mt-1">{elig.reason}</div>
            <div className="text-sm text-rose-600 mt-2 bg-white/50 rounded-full px-3 py-1 inline-block">
              Available balance: {elig.available_balance} days
            </div>
          </div>
        </motion.div>
      );
    }
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-start space-x-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl backdrop-blur-sm"
      >
        <div className="flex-shrink-0 w-5 h-5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mt-0.5">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">Eligible for Conversion</div>
          <div className="text-sm text-green-700 mt-1">Available balance: {elig.available_balance} days</div>
          <div className="text-sm text-green-600 mt-2 bg-white/50 rounded-full px-3 py-1 inline-block">
            Remaining annual quota: {elig.available_quota} days
          </div>
        </div>
      </motion.div>
    );
  };
    // Check if VL is eligible
    const isVLEligible = eligibility?.vl?.eligible || false;

    return (
        <EmployeeLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Convert Leave Credits to Cash</h2>}
        >
            <Head title="Convert Leave Credits" />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header Section */}
                    <motion.div
                        className="mb-8"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                        </svg>
                                    </div>
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent">
                                        Vacation Leave Monetization
                                    </h1>
                                    <p className="text-gray-600 mt-2 bg-white/50 backdrop-blur-sm rounded-full px-3 py-1 inline-block">
                                        Convert your unused Vacation Leave (VL) credits
                                    </p>
                                </div>
                            </div>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Link 
                                    href={route('employee.credit-conversions')}
                                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 border border-transparent rounded-xl font-semibold text-sm text-white uppercase tracking-wider hover:from-emerald-600 hover:to-green-700 focus:from-emerald-600 focus:to-green-700 active:from-emerald-700 active:to-green-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    View History
                                </Link>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Important Notice */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl shadow-sm backdrop-blur-sm"
                    >
                        <div className="flex items-start">
                            <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mt-0.5 mr-4">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold bg-gradient-to-r from-blue-700 to-cyan-700 bg-clip-text text-transparent">Important Information</h4>
                                <p className="text-sm text-blue-700 mt-2">
                                    <strong>Only Vacation Leave (VL) credits can be monetized.</strong> Minimum 10 VL credits required per request. 
                                    Maximum 10 days can be converted per year. Approval required from HR department.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-12 gap-8">
                        {/* Main Form - 8 columns */}
                        <div className="col-span-12 xl:col-span-8">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20"
                            >
                                <div className="px-8 py-6 border-b border-gray-200/30 bg-gradient-to-r from-emerald-50/50 to-green-50/30">
                                    <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent">
                                        Conversion Request
                                    </h2>
                                </div>
                                <div className="p-8">
                                    <form onSubmit={submit} className="space-y-8">
                                        {/* Current Balance Card - Only VL */}
                                        <motion.div 
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.3 }}
                                            className="grid grid-cols-1 gap-6"
                                        >
                                            {/* Vacation Leave Card Only */}
                                            <div className="bg-gradient-to-br from-emerald-500 to-green-600 border border-emerald-400 rounded-2xl p-6 text-white shadow-lg">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="text-sm font-medium text-emerald-100">Available Vacation Leave Credits</div>
                                                        <div className="text-3xl font-bold text-white mt-2">{leaveCredits.vl} days</div>
                                                        <div className="text-xs text-emerald-100 mt-2 bg-white/20 rounded-full px-3 py-1 inline-block">Monetizable credits</div>
                                                    </div>
                                                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>

                                        {/* Leave Type Selection - Only VL Available */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 }}
                                        >
                                            <label className="block text-lg font-semibold text-gray-900 mb-6">
                                                Leave Type to Convert
                                            </label>
                                            <div className="grid grid-cols-1 gap-4">
                                                {/* Vacation Leave Option - Only option */}
                                                <motion.div 
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    className={`relative border-2 rounded-2xl p-6 cursor-pointer transition-all duration-200 backdrop-blur-sm ${
                                                        data.leave_type === 'VL' 
                                                            ? 'border-emerald-500 bg-gradient-to-r from-emerald-50 to-green-50 shadow-lg' 
                                                            : 'border-emerald-200 hover:border-emerald-300 hover:shadow-md bg-white/50'
                                                    } ${!isVLEligible ? 'opacity-60 cursor-not-allowed grayscale' : ''}`}
                                                    onClick={() => isVLEligible && setData('leave_type', 'VL')}
                                                >
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div>
                                                            <div className="font-bold text-gray-900 text-lg">Vacation Leave (VL)</div>
                                                            <div className="text-sm text-gray-600 mt-2 bg-white/50 rounded-full px-3 py-1 inline-block">
                                                                Balance: {leaveCredits.vl} days
                                                            </div>
                                                        </div>
                                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                                                            data.leave_type === 'VL' 
                                                                ? 'bg-gradient-to-r from-emerald-500 to-green-500 border-emerald-500 shadow-inner' 
                                                                : 'border-emerald-300 bg-white'
                                                        } ${!isVLEligible ? 'bg-gray-300 border-gray-300' : ''}`}>
                                                            {data.leave_type === 'VL' && isVLEligible && (
                                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                            {!isVLEligible && (
                                                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {getEligibilityMessage()}
                                                </motion.div>
                                            </div>
                                            {errors.leave_type && (
                                                <motion.div 
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="flex items-center mt-3 text-sm bg-gradient-to-r from-rose-50 to-red-50 border border-rose-200 rounded-xl p-3"
                                                >
                                                    <div className="w-5 h-5 bg-gradient-to-r from-rose-500 to-red-500 rounded-full flex items-center justify-center mr-2">
                                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </div>
                                                    {errors.leave_type}
                                                </motion.div>
                                            )}
                                        </motion.div>

                                        {/* Conversion Details */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.5 }}
                                            className="grid grid-cols-1 gap-6"
                                        >
                                            {/* Credits Information */}
                                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 backdrop-blur-sm shadow-sm">
                                                <div className="flex items-center mb-4">
                                                    <div className="w-6 h-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mr-3">
                                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </div>
                                                    <div className="text-sm font-semibold bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text text-transparent">Conversion Details</div>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center py-2 border-b border-amber-200/50">
                                                        <span className="text-sm text-amber-700">Leave Type:</span>
                                                        <span className="text-sm font-semibold text-amber-900">Vacation Leave (VL)</span>
                                                    </div>
                                                    <div className="flex justify-between items-center py-2 border-b border-amber-200/50">
                                                        <span className="text-sm text-amber-700">Minimum Conversion:</span>
                                                        <span className="text-sm font-semibold text-amber-900">10 days</span>
                                                    </div>
                                                    <div className="flex justify-between items-center py-2 border-b border-amber-200/50">
                                                        <span className="text-sm text-amber-700">Credits to Convert:</span>
                                                        <span className="text-lg font-bold text-gray-900">10 days</span>
                                                    </div>
                                                    <div className="flex justify-between items-center py-2">
                                                        <span className="text-sm text-amber-700">Annual Limit:</span>
                                                        <span className="text-sm font-semibold text-amber-900">10 days per year</span>
                                                    </div>
                                                </div>
                                                <input type="hidden" value={10} onChange={(e) => setData('credits_requested', 10)} />
                                            </div>
                                        </motion.div>

                                        {/* Remarks */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.6 }}
                                        >
                                            <label htmlFor="remarks" className="block text-lg font-semibold text-gray-900 mb-4">
                                                Additional Remarks (Optional)
                                            </label>
                                            <textarea
                                                id="remarks"
                                                rows={4}
                                                className="block w-full border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 p-4 resize-none bg-white/50 backdrop-blur-sm transition-all duration-200"
                                                value={data.remarks}
                                                onChange={(e) => setData('remarks', e.target.value)}
                                                placeholder="Provide any additional information or context for your conversion request..."
                                            />
                                            {errors.remarks && (
                                                <motion.div 
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="flex items-center mt-3 text-sm bg-gradient-to-r from-rose-50 to-red-50 border border-rose-200 rounded-xl p-3"
                                                >
                                                    <div className="w-5 h-5 bg-gradient-to-r from-rose-500 to-red-500 rounded-full flex items-center justify-center mr-2">
                                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18-6M6 6l12 12" />
                                                        </svg>
                                                    </div>
                                                    {errors.remarks}
                                                </motion.div>
                                            )}
                                        </motion.div>

                                        {/* Submit Button */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.7 }}
                                            className="flex items-center justify-between pt-6 border-t border-gray-200/30"
                                        >
                                            <div className="text-sm text-gray-600 bg-white/50 backdrop-blur-sm rounded-full px-4 py-2">
                                                {isVLEligible 
                                                    ? "Ensure you meet all eligibility requirements before submitting"
                                                    : "You are not currently eligible for VL credit conversion"
                                                }
                                            </div>
                                            <motion.button
                                                type="submit"
                                                disabled={processing || !data.leave_type || !isVLEligible}
                                                whileHover={!processing && isVLEligible ? { scale: 1.05 } : {}}
                                                whileTap={!processing && isVLEligible ? { scale: 0.95 } : {}}
                                                className={`px-10 py-4 text-base font-semibold rounded-xl transition-all duration-200 shadow-lg ${
                                                    processing || !isVLEligible
                                                        ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed'
                                                        : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white hover:shadow-xl'
                                                }`}
                                            >
                                                {processing ? (
                                                    <div className="flex items-center">
                                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Processing...
                                                    </div>
                                                ) : (
                                                    isVLEligible ? 'Submit VL Conversion Request' : 'Not Eligible'
                                                )}
                                            </motion.button>
                                        </motion.div>
                                    </form>
                                </div>
                            </motion.div>
                        </div>

                        {/* Sidebar - 4 columns */}
                        <div className="col-span-12 xl:col-span-4 space-y-6">
                            {/* Statistics Card */}
                           {/* Statistics Card */}
<motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5, delay: 0.3 }}
    className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20"
>
    <div className="px-6 py-5 border-b border-gray-200/30 bg-gradient-to-r from-emerald-50/50 to-green-50/30">
        <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent">
            Conversion Statistics
        </h3>
    </div>
    <div className="p-6">
        <div className="space-y-4">
            {[
                { 
                    icon: (
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    ),
                    label: 'Total Converted', 
                    value: `${conversionStats.total_converted_days || 0} days`,
                    bg: 'from-blue-50 to-cyan-50',
                    border: 'border-blue-200'
                },
                { 
                    icon: (
                        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    ),
                    label: 'Remaining Quota', 
                    value: `${conversionStats.remaining_quota || 0} days`,
                    bg: 'from-amber-50 to-orange-50',
                    border: 'border-amber-200'
                },
                { 
                    icon: (
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    ),
                    label: 'Pending Requests', 
                    value: conversionStats.pending_requests || 0,
                    bg: 'from-purple-50 to-violet-50',
                    border: 'border-purple-200'
                },
                { 
                    icon: (
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    ),
                    label: 'Available VL Credits', 
                    value: `${leaveCredits.vl || 0} days`,
                    bg: 'from-green-50 to-emerald-50',
                    border: 'border-green-200'
                }
            ].map((stat, index) => (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className={`flex items-center justify-between p-4 bg-gradient-to-r ${stat.bg} border ${stat.border} rounded-xl backdrop-blur-sm shadow-sm`}
                >
                    <div className="flex items-center">
                        <div className="w-10 h-10 bg-white/80 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                            {stat.icon}
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{stat.label}</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{stat.value}</span>
                </motion.div>
            ))}
        </div>
    </div>
</motion.div>

                            {/* Information Card */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.4 }}
                                className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl backdrop-blur-sm shadow-sm"
                            >
                                <div className="px-6 py-5 border-b border-blue-200/30 bg-gradient-to-r from-blue-100/50 to-cyan-100/50">
                                    <h3 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-cyan-700 bg-clip-text text-transparent flex items-center">
                                        <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mr-3">
                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        Requirements
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-4 text-sm text-blue-800">
                                        {[
                                            "Minimum VL Credits: 15 points required",
                                            "Annual Limit: Maximum 10 days per year",
                                            "HR approval required",
                                            "Processing time: 3-5 business days"
                                        ].map((requirement, index) => (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.5 + index * 0.1 }}
                                                className="flex items-start"
                                            >
                                                <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1">
                                                    <strong>{requirement.split(':')[0]}:</strong>{requirement.split(':')[1] || requirement}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </EmployeeLayout>
    );
}