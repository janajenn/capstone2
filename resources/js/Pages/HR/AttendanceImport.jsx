import React, { useState, useRef, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import HRLayout from '@/Layouts/HRLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
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
    Trash2,
    Eye,
    ChevronDown,
    ChevronUp,
    Play,
    StopCircle,
    Table,
    X,
    ZoomIn,
    ZoomOut,
    Maximize2
} from 'lucide-react';

export default function AttendanceImport({ auth, importResult, flash, lateCreditResult, success, error, warning, reasons }) {
    console.log('🔍 COMPONENT PROPS DEBUG:');
    console.log('📋 importResult:', importResult);
    console.log('💬 flash:', flash);
    console.log('⚠️ warning:', warning);
    console.log('🎉 success:', success);
    console.log('❌ error:', error);
    console.log('📝 reasons:', reasons);


    const [isUploading, setIsUploading] = useState(false);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [importConfirmed, setImportConfirmed] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(100);
    const fileInputRef = useRef(null);
    const modalRef = useRef(null);
    const [reasonsList, setReasonsList] = useState([]);

    const { data, setData, post, processing, errors, reset } = useForm({
        file: null,
        overwrite: false
    });

    useEffect(() => {
    console.log('🔍 useEffect - Checking for initial messages');
    console.log('💬 Flash:', flash);
    console.log('⚠️ Warning prop:', warning);
    console.log('🎉 Success prop:', success);
    console.log('❌ Error prop:', error);
    console.log('📝 Reasons prop:', reasons);
    
    // Check both direct props and flash session
    const flashMessages = flash || {};
    
    console.log('🔍 Flash messages:', flashMessages);
    
    if (success || flashMessages.success) {
        const message = success || flashMessages.success;
        console.log('🎉 Setting success message:', message);
        setMessage(message);
        setMessageType('success');
    } else if (warning || flashMessages.warning) {
        const message = warning || flashMessages.warning;
        console.log('⚠️ Setting warning message:', message);
        setMessage(message);
        setMessageType('warning');
        setReasonsList(reasons || []);
    } else if (error || flashMessages.error) {
        const message = error || flashMessages.error;
        console.log('❌ Setting error message:', message);
        setMessage(message);
        setMessageType('error');
    } else {
        console.log('🔍 No initial messages found');
    }
}, [success, warning, error, reasons, flash]);

    // Auto-preview when file is selected - FIXED
    useEffect(() => {
        if (selectedFile && !previewData) {
            handleAutoPreview();
        }
    }, [selectedFile, previewData]); // Added previewData to dependencies

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
            setPreviewData(null); // Reset preview data when new file is selected
            setImportConfirmed(false);
            setZoomLevel(100); // Reset zoom when new file is selected
        }
    };

    // FIXED: handleAutoPreview function is properly defined
    const handleAutoPreview = async () => {
        if (!selectedFile) return;

        setIsPreviewing(true);
        showMessage('Generating preview...', 'success');

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await fetch('/hr/attendance/visual-preview', {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                },
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                setPreviewData(result);
                setShowPreviewModal(true);
                showMessage('File preview generated automatically!', 'success');
            } else {
                showMessage(result.message || 'Failed to generate preview', 'error');
            }
        } catch (error) {
            showMessage('Failed to generate preview: ' + error.message, 'error');
        } finally {
            setIsPreviewing(false);
        }
    };

    // Add manual preview function for the button
    const handleManualPreview = async () => {
        if (!selectedFile) {
            showMessage('Please select a file first', 'error');
            return;
        }
        await handleAutoPreview();
    };

    const handleImport = (e) => {
        e.preventDefault();
        
        console.log('🚀 handleImport triggered');
        console.log('📁 Selected file:', selectedFile);
        console.log('📊 Preview data exists:', !!previewData);
        console.log('✅ Import confirmed:', importConfirmed);
        
        if (!data.file) {
            console.log('❌ No file selected');
            showMessage('Please select a file to import', 'error');
            return;
        }
    
        // If preview is available but not confirmed, show modal
        if (previewData && !importConfirmed) {
            console.log('⚠️ Preview available but not confirmed, showing modal');
            setShowPreviewModal(true);
            showMessage('Please confirm the preview before importing', 'warning');
            return;
        }
    
        setIsUploading(true);
        setUploadProgress(0);
    
        console.log('🔄 Starting import process...');
    
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
    
        post('/hr/attendance/process-import', {
            onSuccess: (page) => {
                console.log('✅ POST request successful');
                console.log('📄 Full page props:', page.props);
                console.log('💬 Flash data:', page.props.flash);
                console.log('📋 Import result:', page.props.importResult);
                console.log('⚠️ Warning prop:', page.props.warning);
                console.log('🎉 Success prop:', page.props.success);
                console.log('❌ Error prop:', page.props.error);
                console.log('📝 Reasons prop:', page.props.reasons);
                
                clearInterval(progressInterval);
                setUploadProgress(100);
                
                // FIXED: Check flash messages from session
                const flash = page.props.flash || {};
                
                console.log('🔍 Checking flash messages:', flash);
                
                if (flash.warning) {
                    console.log('⚠️ Flash warning found:', flash.warning);
                    // Show warning message when 0 records imported
                    showMessage(flash.warning, 'warning');
                    // Also show the reasons if available
                    if (page.props.reasons) {
                        console.log('📋 Reasons found:', page.props.reasons);
                        setReasonsList(page.props.reasons);
                    }
                } else if (flash.success) {
                    console.log('🎉 Flash success found:', flash.success);
                    // Show success message when records are imported
                    showMessage(flash.success, 'success');
                } else if (page.props.warning) {
                    console.log('⚠️ Direct warning prop found:', page.props.warning);
                    showMessage(page.props.warning, 'warning');
                    if (page.props.reasons) {
                        console.log('📋 Reasons found:', page.props.reasons);
                        setReasonsList(page.props.reasons);
                    }
                } else if (page.props.success) {
                    console.log('🎉 Direct success prop found:', page.props.success);
                    showMessage(page.props.success, 'success');
                } else if (page.props.importResult) {
                    console.log('📊 Import result found, checking counts');
                    // Fallback: Check import result directly
                    const { success_count, error_count } = page.props.importResult;
                    console.log(`📈 Success count: ${success_count}, Error count: ${error_count}`);
                    
                    if (success_count === 0) {
                        console.log('❌ No records imported, showing warning');
                        showMessage('No records were imported. Please check the file format.', 'warning');
                    } else {
                        console.log(`✅ ${success_count} records imported, showing success`);
                        showMessage(`Successfully imported ${success_count} records!`, 'success');
                    }
                } else {
                    console.log('🔍 No specific messages found, using fallback');
                    // Final fallback message
                    showMessage('Attendance data imported successfully!', 'success');
                }
                
                console.log('🔄 Resetting form...');
                resetForm();
                
                setTimeout(() => {
                    setUploadProgress(0);
                }, 1000);
            },
            onError: (errors) => {
                console.log('❌ POST request failed with errors:', errors);
                clearInterval(progressInterval);
                setUploadProgress(0);
                
                let errorMessage = 'Import failed';
                if (errors.file) {
                    errorMessage = errors.file;
                } else if (errors.message) {
                    errorMessage = errors.message;
                }
                
                console.log('🚨 Error message to display:', errorMessage);
                showMessage(errorMessage, 'error');
            },
            onFinish: () => {
                console.log('🏁 Import process finished');
                setIsUploading(false);
            }
        });
    };

    const resetForm = () => {
        reset();
        setSelectedFile(null);
        setPreviewData(null);
        setShowPreviewModal(false);
        setImportConfirmed(false);
        setZoomLevel(100);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const confirmImport = () => {
        setImportConfirmed(true);
        setShowPreviewModal(false);
        showMessage('Import confirmed! Click "Process Import" to proceed.', 'success');
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

    const zoomIn = () => {
        setZoomLevel(prev => Math.min(prev + 20, 200));
    };

    const zoomOut = () => {
        setZoomLevel(prev => Math.max(prev - 20, 50));
    };

    const resetZoom = () => {
        setZoomLevel(100);
    };

    // Close modal when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                setShowPreviewModal(false);
            }
        };

        if (showPreviewModal) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showPreviewModal]);

    return (
        <HRLayout user={auth.user}>
            <Head title="Attendance Import" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Attendance Import</h1>
                        <p className="text-muted-foreground">
                            Select a file to automatically preview it before importing
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
                        <div className="flex items-start">
                            {messageType === 'error' ? (
                                <XCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                            ) : messageType === 'warning' ? (
                                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                            ) : (
                                <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                                <span className="font-medium">{message}</span>
                                {messageType === 'warning' && reasonsList && reasonsList.length > 0 && (
                                    <ul className="mt-2 text-sm list-disc list-inside space-y-1">
                                        {reasonsList.map((reason, index) => (
                                            <li key={index} className="text-yellow-700">{reason}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
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
                            Select a file - it will automatically open in preview mode for verification
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
                                        disabled={isUploading || isPreviewing}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                    {selectedFile && (
                                        <div className="flex items-center text-sm text-gray-500">
                                            <FileSpreadsheet className="w-4 h-4 mr-1" />
                                            {selectedFile.name}
                                            {importConfirmed && (
                                                <CheckCircle className="w-4 h-4 ml-2 text-green-600" />
                                            )}
                                        </div>
                                    )}
                                </div>
                                {errors.file && (
                                    <InputError message={errors.file} />
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex space-x-3">
                                <SecondaryButton
                                    type="button"
                                    onClick={handleManualPreview} // Changed to use manual preview function
                                    disabled={!selectedFile || isUploading || isPreviewing}
                                    className="flex-1"
                                >
                                    {isPreviewing ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                                            Generating Preview...
                                        </>
                                    ) : (
                                        <>
                                            <Eye className="w-4 h-4 mr-2" />
                                            {previewData ? 'Show Preview' : 'Generate Preview'}
                                        </>
                                    )}
                                </SecondaryButton>

                                <PrimaryButton 
                                    type="submit" 
                                    disabled={!selectedFile || isUploading || isPreviewing}
                                    className="flex-1"
                                >
                                    {isUploading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Importing...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4 mr-2" />
                                            {importConfirmed ? 'Process Import' : 'Review & Import'}
                                        </>
                                    )}
                                </PrimaryButton>
                            </div>

                            {/* Options */}
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    name="overwrite"
                                    checked={data.overwrite}
                                    onChange={(e) => setData('overwrite', e.target.checked)}
                                    disabled={isUploading || isPreviewing}
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

                            {/* Preview Status */}
                            {isPreviewing && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span>Generating preview...</span>
                                        <span>Please wait</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div className="bg-blue-600 h-2 rounded-full animate-pulse"></div>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>
                </div>

                {/* Preview Modal */}
                {showPreviewModal && previewData && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div 
                            ref={modalRef}
                            className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white sticky top-0 z-20">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <Table className="w-6 h-6 text-blue-600 mr-2" />
                                        <h3 className="text-xl font-semibold text-gray-900">
                                            File Preview: {selectedFile?.name}
                                        </h3>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                            {previewData.summary?.file_type?.toUpperCase()} File
                                        </span>
                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                                            {previewData.summary?.total_rows} total rows
                                        </span>
                                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                            {previewData.summary?.columns} columns
                                        </span>
                                        {previewData.summary?.displayed_rows && (
                                            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                                {previewData.summary.displayed_rows} displayed
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    {/* Zoom Controls */}
                                    <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                                        <button
                                            onClick={zoomOut}
                                            disabled={zoomLevel <= 30}
                                            className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Zoom Out"
                                        >
                                            <ZoomOut className="w-4 h-4" />
                                        </button>
                                        <span className="text-sm font-medium px-2 min-w-[3rem] text-center">
                                            {zoomLevel}%
                                        </span>
                                        <button
                                            onClick={zoomIn}
                                            disabled={zoomLevel >= 200}
                                            className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Zoom In"
                                        >
                                            <ZoomIn className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={resetZoom}
                                            className="p-1 rounded hover:bg-gray-200"
                                            title="Reset Zoom"
                                        >
                                            <Maximize2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => setShowPreviewModal(false)}
                                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body - Excel Preview with ALL rows */}
                            <div className="flex-1 overflow-hidden">
                                <div 
                                    className="excel-modal-preview-container h-full"
                                    style={{ 
                                        transform: `scale(${zoomLevel / 100})`,
                                        transformOrigin: 'top left',
                                        width: `${100 / (zoomLevel / 100)}%`,
                                        height: `${100 / (zoomLevel / 100)}%`
                                    }}
                                >
                                    <div 
                                        dangerouslySetInnerHTML={{ __html: previewData.preview }} 
                                        className="excel-modal-preview-content h-full"
                                    />
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 sticky bottom-0 z-20">
                                <div className="text-sm text-gray-600 flex items-center space-x-4">
                                    {importConfirmed ? (
                                        <div className="flex items-center text-green-600">
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            File confirmed and ready for import
                                        </div>
                                    ) : (
                                        <div className="flex items-center">
                                            <AlertCircle className="w-4 h-4 mr-2 text-yellow-600" />
                                            Please review ALL rows before confirming
                                        </div>
                                    )}
                                    <div className="text-xs text-gray-500">
                                        Showing all {previewData.summary?.displayed_rows || previewData.summary?.total_rows} rows from the file
                                    </div>
                                </div>
                                <div className="flex space-x-3">
                                    <SecondaryButton
                                        onClick={() => setShowPreviewModal(false)}
                                    >
                                        Cancel
                                    </SecondaryButton>
                                    <PrimaryButton
                                        onClick={confirmImport}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Confirm All Data & Import
                                    </PrimaryButton>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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
                        </div>
                    </div>
                )}

                {/* Instructions */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">How to Import</h3>
                    </div>
                    <div className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-medium mb-2">Automatic Preview Workflow</h4>
                                <ol className="text-sm text-gray-600 space-y-2">
                                    <li className="flex items-start">
                                        <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0">1</span>
                                        <span><strong>Select your file</strong> - Preview opens automatically</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0">2</span>
                                        <span><strong>Review the preview</strong> - Use zoom controls if text is small</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0">3</span>
                                        <span><strong>Confirm the import</strong> - Click "Confirm & Import" in the modal</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="bg-orange-100 text-orange-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0">4</span>
                                        <span><strong>Process the file</strong> - Click "Process Import" in the main form</span>
                                    </li>
                                </ol>
                            </div>
                            <div>
                                <h4 className="font-medium mb-2">Preview Features</h4>
                                <ul className="text-sm text-gray-600 space-y-1">
                                    <li>• <strong>Automatic opening</strong> when file is selected</li>
                                    <li>• <strong>Zoom controls</strong> to adjust text size (50% - 200%)</li>
                                    <li>• <strong>Full file content</strong> displayed in Excel-like format</li>
                                    <li>• <strong>Scrollable view</strong> for large files</li>
                                    <li>• <strong>File statistics</strong> shown in header</li>
                                    <li>• <strong>Two-step confirmation</strong> for safety</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CSS Styles */}
<style>
{`
    .excel-modal-preview-container {
        overflow: auto;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 0.375rem;
    }

    .excel-preview-container {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .excel-style-table {
        border-collapse: collapse;
        width: max-content;
        font-size: 12px; /* Smaller base font for modal */
        min-width: 100%;
    }

    .excel-style-table .column-headers {
        background-color: #f8fafc;
        position: sticky;
        top: 0;
        z-index: 10;
    }

    .excel-style-table .column-header {
        border: 1px solid #d1d5db;
        padding: 2px 6px;
        text-align: center;
        font-weight: 600;
        color: #374151;
        background-color: #f3f4f6;
        min-width: 60px;
        height: 20px;
        position: sticky;
        top: 0;
    }

    .excel-style-table .row-header {
        border: 1px solid #d1d5db;
        padding: 2px 6px;
        text-align: center;
        font-weight: 600;
        color: #374151;
        background-color: #f3f4f6;
        min-width: 30px;
        position: sticky;
        left: 0;
        z-index: 5;
    }

    .excel-style-table .excel-cell {
        border: 1px solid #d1d5db;
        padding: 2px 6px;
        min-width: 100px;
        max-width: 250px;
        height: 20px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        background: white;
    }

    .excel-style-table .header-cell {
        background-color: #e5e7eb;
        font-weight: 600;
    }

    .excel-style-table .empty-cell {
        background-color: #f9fafb;
    }

    .excel-style-table .numeric-cell {
        text-align: right;
        font-family: 'Courier New', monospace;
    }

    .excel-style-table .date-cell {
        color: #059669;
    }

    .excel-style-table .employee-header-cell {
        background-color: #dbeafe;
        font-weight: 600;
    }

    .excel-style-table tr:hover .excel-cell:not(.column-header):not(.row-header) {
        background-color: #f0f9ff;
    }

    /* Ensure proper scrolling and sticky headers */
    .excel-modal-preview-content {
        position: relative;
    }

    .excel-style-table {
        background: white;
    }
`}
</style>
            </div>
        </HRLayout>
    );
}