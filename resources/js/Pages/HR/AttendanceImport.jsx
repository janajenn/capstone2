import React, { useState, useRef } from 'react';
import { Head, useForm } from '@inertiajs/react';
import HRLayout from '@/Layouts/HRLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import Checkbox from '@/Components/Checkbox';
import { 
    Upload, 
    Download, 
    FileSpreadsheet, 
    CheckCircle, 
    XCircle, 
    AlertCircle,
    Calendar,
    Users,
    Clock,
    Trash2
} from 'lucide-react';

export default function AttendanceImport({ auth, importResult, flash }) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedFile, setSelectedFile] = useState(null);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const fileInputRef = useRef(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        file: null,
        overwrite: false
    });

    // Handle flash messages and import results
    React.useEffect(() => {
        if (flash?.success) {
            showMessage(flash.success, 'success');
        }
        if (flash?.error) {
            showMessage(flash.error, 'error');
        }
        if (flash?.warning) {
            showMessage(flash.warning, 'warning');
        }
    }, [flash]);

    const showMessage = (text, type = 'success') => {
        setMessage(text);
        setMessageType(type);
        setTimeout(() => {
            setMessage('');
            setMessageType('');
        }, 6000);
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            setData('file', file);
        }
    };

    const handleImport = (e) => {
        e.preventDefault();
        
        if (!data.file) {
            showMessage('Please select a file to import', 'error');
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        // Simulate progress
        const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 90) {
                    clearInterval(progressInterval);
                    return prev;
                }
                return prev + 10;
            });
        }, 200);

        // Use Inertia's post method for file upload
        post('/hr/attendance/import', {
            onSuccess: (page) => {
                clearInterval(progressInterval);
                setUploadProgress(100);
                
                // Always show a success message, with fallback if no flash
                let successMsg = page.props.flash?.success || 'Attendance data imported successfully!';
                
                // Enhance with importResult details if available
                if (page.props.importResult) {
                    const { success_count, error_count } = page.props.importResult;
                    if (error_count > 0) {
                        successMsg = `${success_count} records imported successfully, but ${error_count} errors occurred. Check details below.`;
                        showMessage(successMsg, 'warning');
                    } else {
                        successMsg = `${success_count} records imported successfully!`;
                        showMessage(successMsg, 'success');
                    }
                } else {
                    showMessage(successMsg, 'success');
                }
                
                // Reset form
                reset();
                setSelectedFile(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                
                // Brief delay to show 100% progress before hiding
                setTimeout(() => {
                    setUploadProgress(0);
                }, 1000);
            },
            onError: (errors) => {
                clearInterval(progressInterval);
                setUploadProgress(0);
                
                let errorMessage = 'Import failed';
                if (errors.file) {
                    errorMessage = errors.file;
                } else if (errors.message) {
                    errorMessage = errors.message;
                }
                
                showMessage(errorMessage, 'error');
            },
            onFinish: () => {
                setIsUploading(false);
            }
        });
    };

    const downloadTemplate = async () => {
        try {
            const response = await fetch('/hr/attendance/template');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'attendance_import_template.csv';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showMessage('Template downloaded successfully', 'success');
        } catch (error) {
            showMessage('Failed to download template', 'error');
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            'On Time': { className: 'bg-green-100 text-green-800 px-2 py-1 rounded text-xs' },
            'Late': { className: 'bg-red-100 text-red-800 px-2 py-1 rounded text-xs' },
            'Absent': { className: 'bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs' },
            'No Time In': { className: 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs' },
            'No Time Out': { className: 'bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs' }
        };

        const config = statusConfig[status] || { className: 'bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs' };
        
        return (
            <span className={config.className}>
                {status}
            </span>
        );
    };

    return (
        <HRLayout user={auth.user}>
            <Head title="Attendance Import" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Attendance Import</h1>
                        <p className="text-muted-foreground">
                            Import attendance data from Excel files
                        </p>
                    </div>
                    <SecondaryButton onClick={downloadTemplate}>
                        <Download className="w-4 h-4 mr-2" />
                        Download Template
                    </SecondaryButton>
                </div>

                {/* Message Display */}
                {message && (
                    <div className={`p-4 rounded-xl border ${
                        messageType === 'error' 
                            ? 'bg-red-50 border-red-200 text-red-800' 
                            : messageType === 'warning'
                            ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                            : 'bg-green-50 border-green-200 text-green-800'
                    }`}>
                        <div className="flex items-center">
                            {messageType === 'error' ? (
                                <XCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                            ) : messageType === 'warning' ? (
                                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                            ) : (
                                <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                            )}
                            <span className="font-medium">{message}</span>
                        </div>
                    </div>
                )}

                {/* Import Form */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                            <FileSpreadsheet className="w-5 h-5 mr-2" />
                            Import Attendance Data
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Upload an Excel file containing attendance data. Make sure the file follows the template format.
                        </p>
                    </div>
                    <div className="px-6 py-4">
                        <form onSubmit={handleImport} className="space-y-6">
                            {/* File Upload */}
                            <div className="space-y-2">
                                <InputLabel htmlFor="file" value="Excel File" />
                                <div className="flex items-center space-x-4">
                                    <input
                                        id="file"
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleFileSelect}
                                        ref={fileInputRef}
                                        disabled={isUploading}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                    {selectedFile && (
                                        <div className="flex items-center text-sm text-gray-500">
                                            <FileSpreadsheet className="w-4 h-4 mr-1" />
                                            {selectedFile.name}
                                        </div>
                                    )}
                                </div>
                                {errors.file && (
                                    <InputError message={errors.file} />
                                )}
                            </div>

                            {/* Options */}
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    name="overwrite"
                                    checked={data.overwrite}
                                    onChange={(e) => setData('overwrite', e.target.checked)}
                                    disabled={isUploading}
                                />
                                <InputLabel htmlFor="overwrite" value="Overwrite existing records" />
                            </div>

                            {/* Upload Progress */}
                            {isUploading && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span>Uploading and processing...</span>
                                        <span>{uploadProgress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <PrimaryButton 
                                type="submit" 
                                disabled={!data.file || isUploading}
                                className="w-full"
                            >
                                {isUploading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4 mr-2" />
                                        Import Attendance Data
                                    </>
                                )}
                            </PrimaryButton>
                        </form>
                    </div>
                </div>

                {/* Import Results */}
                {importResult && (
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                {importResult.error_count > 0 ? (
                                    <AlertCircle className="w-5 h-5 mr-2 text-yellow-600" />
                                ) : (
                                    <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                                )}
                                Import Results
                            </h3>
                        </div>
                        <div className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="flex items-center space-x-2">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="text-sm font-medium">Successful: {importResult.success_count}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <XCircle className="w-4 h-4 text-red-600" />
                                    <span className="text-sm font-medium">Errors: {importResult.error_count}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium">Total: {importResult.success_count + importResult.error_count}</span>
                                </div>
                            </div>

                            {/* Errors */}
                            {importResult.errors && importResult.errors.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="font-medium text-red-600">Errors:</h4>
                                    <div className="max-h-40 overflow-y-auto space-y-1">
                                        {importResult.errors.map((error, index) => (
                                            <div key={index} className="p-3 bg-red-50 border border-red-200 rounded">
                                                <p className="text-sm text-red-800">
                                                    Row {error.row}: {error.message}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Processed Rows */}
                            {importResult.processed_rows && importResult.processed_rows.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="font-medium text-green-600">Successfully Processed:</h4>
                                    <div className="max-h-40 overflow-y-auto space-y-1">
                                        {importResult.processed_rows.map((row, index) => (
                                            <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                                                <span className="text-sm">
                                                    Row {row.row}: {row.employee} - {row.date}
                                                </span>
                                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                                    {row.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Instructions */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Import Instructions</h3>
                    </div>
                    <div className="px-6 py-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-medium mb-2">Excel File Format</h4>
                                <ul className="text-sm text-gray-600 space-y-1">
                                    <li>• Employee Name (Column A)</li>
                                    <li>• Biometric Code (Column B)</li>
                                    <li>• Work Date (Column C)</li>
                                    <li>• Schedule Start (Column D)</li>
                                    <li>• Schedule End (Column E)</li>
                                    <li>• Time In (Column F)</li>
                                    <li>• Time Out (Column G)</li>
                                    <li>• Break Start (Column H) - Optional</li>
                                    <li>• Break End (Column I) - Optional</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-medium mb-2">Important Notes</h4>
                                <ul className="text-sm text-gray-600 space-y-1">
                                    <li>• Biometric codes must match existing employees</li>
                                    <li>• Dates should be in YYYY-MM-DD format</li>
                                    <li>• Times should be in HH:MM format</li>
                                    <li>• Empty time fields will be treated as absent</li>
                                    <li>• Duplicate records will be skipped unless overwrite is enabled</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </HRLayout>
    );
}