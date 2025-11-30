import { useEffect, useState } from 'react';

const EmployeeModal = ({ employee, isOpen, onClose }) => {
    const [leaveHistories, setLeaveHistories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [employeeData, setEmployeeData] = useState(null);
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        if (isOpen && employee) {
            fetchEmployeeData();
        }
    }, [isOpen, employee]);

    const fetchEmployeeData = async () => {
        if (!employee) return;
        
        setLoading(true);
        try {
            const response = await fetch(`/hr/employees/${employee.employee_id}/leave-histories`);
            const data = await response.json();
            
            if (data.success) {
                setEmployeeData(data.employee);
                setLeaveHistories(data.leaveHistories || []);
            } else {
                setEmployeeData(employee);
                setLeaveHistories([]);
            }
        } catch (error) {
            console.error('Error fetching employee data:', error);
            setEmployeeData(employee);
            setLeaveHistories([]);
        } finally {
            setLoading(false);
        }
    };

    const formatDateRange = (leave) => {
        if (leave.selected_dates && Array.isArray(leave.selected_dates) && leave.selected_dates.length > 0) {
            const dates = leave.selected_dates;
            if (dates.length === 1) {
                return new Date(dates[0]).toLocaleDateString();
            } else {
                return `${new Date(dates[0]).toLocaleDateString()} - ${new Date(dates[dates.length - 1]).toLocaleDateString()}`;
            }
        }
        return `${new Date(leave.date_from).toLocaleDateString()} - ${new Date(leave.date_to).toLocaleDateString()}`;
    };

    const calculateDuration = (leave) => {
        if (leave.selected_dates && Array.isArray(leave.selected_dates)) {
            return leave.selected_dates.length;
        }
        return leave.total_days || 'N/A';
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved':
                return '✅';
            case 'pending':
                return '⏳';
            case 'rejected':
                return '❌';
            case 'rescheduled':
                return '🔄';
            default:
                return '📄';
        }
    };

    const filteredLeaves = leaveHistories.filter(leave => {
        if (activeTab === 'all') return true;
        return leave.status === activeTab;
    });

    const statusCounts = {
        all: leaveHistories.length,
        approved: leaveHistories.filter(l => l.status === 'approved').length,
        pending: leaveHistories.filter(l => l.status === 'pending').length,
        rejected: leaveHistories.filter(l => l.status === 'rejected').length,
    };

    if (!isOpen || !employee) return null;

    const displayEmployee = employeeData || employee;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xl z-50 transition-all duration-500 flex items-center justify-center p-4">
            {/* Animated Background Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10"></div>
            
            <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl w-full max-w-7xl h-[75vh] flex flex-col transform transition-all duration-500 scale-95 hover:scale-100 border border-white/20 relative overflow-hidden">
                
                {/* Premium Header with Gradient */}
                <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-t-3xl">
                    <div className="absolute inset-0 bg-black/10 rounded-t-3xl"></div>
                    <div className="relative flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-2 inline-block">
                                👤 Employee Profile
                            </h2>
                            <p className="text-white/80 text-sm mt-2 font-light">
                                {displayEmployee.firstname} {displayEmployee.lastname} • {displayEmployee.position}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white transition-all duration-300 p-2 hover:bg-white/20 rounded-xl backdrop-blur-sm hover:scale-110"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Side - Employee Information - Glass Morphism */}
                    <div className="w-2/5 border-r border-white/20 overflow-y-auto">
                        <div className="p-6">
                            {/* Profile Card with Glass Effect */}
                            <div className="bg-gradient-to-br from-white/50 to-white/30 backdrop-blur-lg rounded-2xl p-6 border border-white/40 shadow-lg mb-6">
                                <div className="flex items-center space-x-4 mb-4">
                                    <div className="relative">
                                        <EmployeeAvatar gender={displayEmployee.gender} className="w-16 h-16 ring-4 ring-white/50 shadow-2xl" />
                                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${
                                            displayEmployee.status === 'active' ? 'bg-emerald-400' : 'bg-red-400'
                                        }`}></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-xl font-bold text-gray-800 truncate">
                                            {displayEmployee.firstname} {displayEmployee.middlename} {displayEmployee.lastname}
                                        </h3>
                                        <p className="text-gray-600 text-sm">{displayEmployee.position}</p>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                                displayEmployee.status === 'active' 
                                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                                    : 'bg-red-100 text-red-800 border border-red-200'
                                            }`}>
                                                <span className={`w-2 h-2 rounded-full mr-2 ${
                                                    displayEmployee.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'
                                                }`}></span>
                                                {displayEmployee.status?.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div className="grid grid-cols-2 gap-3 text-center">
                                    <div className="bg-white/60 rounded-xl p-3 border border-white/40">
                                        <div className="text-2xl font-bold text-indigo-600">{statusCounts.approved}</div>
                                        <div className="text-xs text-gray-600">Approved</div>
                                    </div>
                                    <div className="bg-white/60 rounded-xl p-3 border border-white/40">
                                        <div className="text-2xl font-bold text-amber-600">{statusCounts.pending}</div>
                                        <div className="text-xs text-gray-600">Pending</div>
                                    </div>
                                </div>
                            </div>

                            {/* Information Grid */}
                            <div className="space-y-4">
                                <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                                    <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-2 rounded-lg mr-3">📋</span>
                                    Personal Information
                                </h4>
                                
                                <div className="grid grid-cols-1 gap-3">
                                    {[
                                        { icon: '📧', label: 'Email', value: displayEmployee.email || 'N/A' },
                                        { icon: '📞', label: 'Contact', value: displayEmployee.contact_number || 'N/A' },
                                        { icon: '🏢', label: 'Department', value: displayEmployee.department?.name || 'N/A' },
                                        { icon: '⚧️', label: 'Gender', value: displayEmployee.gender?.toUpperCase() || 'N/A' },
                                        { icon: '🎂', label: 'Birth Date', value: displayEmployee.date_of_birth ? new Date(displayEmployee.date_of_birth).toLocaleDateString() : 'N/A' },
                                        { icon: '💍', label: 'Civil Status', value: displayEmployee.civil_status?.toUpperCase() || 'N/A' },
                                        { icon: '💰', label: 'Monthly Salary', value: displayEmployee.monthly_salary ? `₱${parseFloat(displayEmployee.monthly_salary).toLocaleString()}` : 'N/A' },
                                        { icon: '💵', label: 'Daily Rate', value: displayEmployee.daily_rate ? `₱${parseFloat(displayEmployee.daily_rate).toLocaleString()}` : 'N/A' },
                                    ].map((item, index) => (
                                        <div key={index} className="flex items-center space-x-3 p-3 bg-white/50 rounded-xl border border-white/40 hover:bg-white/70 transition-all duration-300">
                                            <span className="text-lg">{item.icon}</span>
                                            <div className="flex-1">
                                                <div className="text-xs text-gray-500 font-medium">{item.label}</div>
                                                <div className="text-sm text-gray-800 font-semibold truncate">{item.value}</div>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {/* Address - Full Width */}
                                    <div className="p-3 bg-white/50 rounded-xl border border-white/40 hover:bg-white/70 transition-all duration-300">
                                        <div className="flex items-start space-x-3">
                                            <span className="text-lg">🏠</span>
                                            <div className="flex-1">
                                                <div className="text-xs text-gray-500 font-medium">Address</div>
                                                <div className="text-sm text-gray-800 font-semibold">{displayEmployee.address || 'N/A'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Leave Histories - Premium Design */}
                    <div className="w-3/5 overflow-y-auto bg-gradient-to-b from-gray-50/80 to-white/50">
                        <div className="p-6">
                            {/* Header with Tabs */}
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 flex items-center">
                                        <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-2 rounded-lg mr-3">📊</span>
                                        Leave History
                                    </h3>
                                    <p className="text-gray-600 text-sm mt-1">{leaveHistories.length} total records</p>
                                </div>
                                <button 
                                    onClick={fetchEmployeeData}
                                    disabled={loading}
                                    className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                >
                                    <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span>Refresh</span>
                                </button>
                            </div>

                            {/* Status Tabs */}
                            <div className="flex space-x-2 mb-6 bg-white/60 rounded-2xl p-2 border border-white/40">
                                {[
                                    { key: 'all', label: 'All', count: statusCounts.all, color: 'gray' },
                                    { key: 'approved', label: 'Approved', count: statusCounts.approved, color: 'emerald' },
                                    { key: 'pending', label: 'Pending', count: statusCounts.pending, color: 'amber' },
                                    { key: 'rejected', label: 'Rejected', count: statusCounts.rejected, color: 'red' },
                                ].map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                                            activeTab === tab.key
                                                ? `bg-${tab.color}-500 text-white shadow-lg transform scale-105`
                                                : `text-gray-600 hover:bg-white/80 hover:text-${tab.color}-600`
                                        }`}
                                    >
                                        <span>{tab.label}</span>
                                        <span className={`bg-${tab.color}-100 text-${tab.color}-800 px-2 py-1 rounded-full text-xs ${
                                            activeTab === tab.key ? 'bg-white/20 text-white' : ''
                                        }`}>
                                            {tab.count}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* Leave History Cards */}
                            {loading ? (
                                <div className="flex justify-center items-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                                </div>
                            ) : filteredLeaves.length > 0 ? (
                                <div className="space-y-4">
                                    {filteredLeaves.map((leave, index) => (
                                        <div key={leave.id || index} className="group bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/60 hover:border-indigo-300 hover:shadow-xl transition-all duration-500 hover:scale-[1.02]">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-3 mb-2">
                                                        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-2 rounded-xl text-sm">
                                                            {getStatusIcon(leave.status)}
                                                        </div>
                                                        <div>
                                                            <h4 className="text-lg font-bold text-gray-800">
                                                                {leave.leave_type?.name || 'Leave'}
                                                            </h4>
                                                            <p className="text-sm text-gray-600">
                                                                {formatDateRange(leave)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <p className="text-gray-700 text-sm leading-relaxed line-clamp-2">
                                                        {leave.reason || 'No reason provided'}
                                                    </p>
                                                </div>
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border-2 ${
                                                    leave.status === 'approved' 
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : leave.status === 'pending'
                                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                        : leave.status === 'rejected'
                                                        ? 'bg-red-50 text-red-700 border-red-200'
                                                        : leave.status === 'rescheduled'
                                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                        : 'bg-gray-50 text-gray-700 border-gray-200'
                                                }`}>
                                                    {leave.status.toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <div className="flex items-center space-x-4">
                                                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-semibold">
                                                        📅 {calculateDuration(leave)} day(s)
                                                    </span>
                                                    <span className="text-gray-500">
                                                        Applied: {new Date(leave.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <span className="text-gray-400 group-hover:text-indigo-500 transition-colors">
                                                    #{leave.leave_type?.code}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16">
                                    <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-3xl flex items-center justify-center">
                                        <span className="text-4xl">📭</span>
                                    </div>
                                    <h4 className="text-lg font-semibold text-gray-600 mb-2">No Leave History</h4>
                                    <p className="text-gray-500 text-sm">No {activeTab !== 'all' ? activeTab : ''} leave records found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Premium EmployeeAvatar with gradient effects
const EmployeeAvatar = ({ gender, className = "w-8 h-8" }) => {
    const gradient = gender === 'female' 
        ? "from-pink-400 via-rose-400 to-red-500" 
        : "from-blue-400 via-indigo-400 to-purple-500";

    return (
        <div className={`${className} bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center text-white font-bold shadow-2xl relative overflow-hidden`}>
            <div className="absolute inset-0 bg-white/20"></div>
            <svg className="w-1/2 h-1/2 relative z-10" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
        </div>
    );
};

export default EmployeeModal;