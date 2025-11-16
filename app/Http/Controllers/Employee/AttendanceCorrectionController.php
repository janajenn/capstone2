<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Models\AttendanceCorrection;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class AttendanceCorrectionController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Show the correction request form
     */
    public function showCorrectionRequest(Request $request)
    {
        $user = $request->user()->load('employee.department');
        
        // Get prefill data from request
        $prefill = [
            'date' => $request->input('date'),
            'type' => $request->input('type', 'attendance_correction')
        ];

        return Inertia::render('Employee/AttendanceCorrectionRequest', [
            'employee' => $user->employee,
            'prefill' => $prefill
        ]);
    }

    /**
     * Submit a correction request
     */
    public function submitCorrectionRequest(Request $request)
    {
        $user = $request->user()->load('employee.department');
        $employee = $user->employee;

        if (!$employee) {
            return back()->withErrors(['error' => 'Employee profile not found.']);
        }

        $validated = $request->validate([
            'attendance_date' => ['required', 'date'],
            'explanation' => ['required', 'string', 'min:10', 'max:1000'],
            'proof_image' => ['required', 'file', 'image', 'max:5120'], // 5MB max
        ]);

        try {
            // Upload proof image
            $proofImagePath = null;
            if ($request->hasFile('proof_image')) {
                $proofImagePath = $request->file('proof_image')->store('attendance_corrections', 'public');
            }

            // Create correction request
            $correction = AttendanceCorrection::create([
                'employee_id' => $employee->employee_id,
                'department_id' => $employee->department_id,
                'attendance_date' => $validated['attendance_date'],
                'explanation' => $validated['explanation'],
                'proof_image' => $proofImagePath,
                'status' => 'Pending',
            ]);

            // 🔔 Send notifications
            $this->notificationService->notifyAttendanceCorrectionSubmission($correction);

            // 🔔 Create employee notification
            $this->notificationService->createEmployeeNotification(
                $employee->employee_id,
                'attendance_correction_submitted',
                'Attendance Correction Request Submitted',
                "Your attendance correction request for {$validated['attendance_date']} has been submitted successfully and is pending review.",
                [
                    'correction_id' => $correction->id,
                    'attendance_date' => $validated['attendance_date'],
                ]
            );

            return redirect()->route('employee.attendance-logs')->with('success', 'Correction request submitted successfully!');

        } catch (\Exception $e) {
            \Log::error('Failed to submit correction request: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Failed to submit correction request. Please try again.']);
        }
    }

    /**
     * Show employee's correction requests
     */
    // public function myCorrectionRequests(Request $request)
    // {
    //     $user = $request->user()->load('employee');
    //     $employeeId = $user->employee?->employee_id;

    //     if (!$employeeId) {
    //         abort(400, 'Employee profile not found for user.');
    //     }

    //     $corrections = AttendanceCorrection::with(['department', 'reviewer', 'approver'])
    //         ->where('employee_id', $employeeId)
    //         ->orderBy('created_at', 'desc')
    //         ->paginate(10)
    //         ->through(function ($correction) {
    //             return [
    //                 'id' => $correction->id,
    //                 'attendance_date' => $correction->attendance_date,
    //                 'explanation' => $correction->explanation,
    //                 'proof_image' => $correction->proof_image,
    //                 'status' => $correction->status,
    //                 'remarks' => $correction->remarks,
    //                 'reviewed_at' => $correction->reviewed_at,
    //                 'approved_at' => $correction->approved_at,
    //                 'created_at' => $correction->created_at,
    //                 'department' => $correction->department?->name,
    //                 'reviewer' => $correction->reviewer?->name,
    //                 'approver' => $correction->approver?->name,
    //             ];
    //         });

    //     return Inertia::render('Employee/MyCorrectionRequests', [
    //         'corrections' => $corrections,
    //     ]);
    // }

    /**
     * Download proof image
     */
    public function downloadProofImage($id)
    {
        $correction = AttendanceCorrection::findOrFail($id);
        
        // Check if user has permission to view this correction
        $user = auth()->user();
        if ($user->role !== 'admin' && $user->role !== 'hr' && $correction->employee_id !== $user->employee?->employee_id) {
            abort(403, 'Unauthorized action.');
        }

        if (!$correction->proof_image || !Storage::disk('public')->exists($correction->proof_image)) {
            abort(404, 'Proof image not found.');
        }

        return Storage::disk('public')->download($correction->proof_image);
    }



    /**
 * Show employee's correction requests
 */
public function myCorrectionRequests(Request $request)
{
    $user = $request->user()->load('employee');
    $employeeId = $user->employee?->employee_id;

    if (!$employeeId) {
        abort(400, 'Employee profile not found for user.');
    }

    $corrections = AttendanceCorrection::with(['department', 'reviewer', 'approver'])
        ->where('employee_id', $employeeId)
        ->orderBy('created_at', 'desc')
        ->paginate(10)
        ->through(function ($correction) {
            return [
                'id' => $correction->id,
                'attendance_date' => $correction->attendance_date,
                'explanation' => $correction->explanation,
                'proof_image' => $correction->proof_image,
                'status' => $correction->status,
                'remarks' => $correction->remarks,
                'reviewed_at' => $correction->reviewed_at,
                'approved_at' => $correction->approved_at,
                'created_at' => $correction->created_at,
                'department' => $correction->department?->name,
                'reviewer' => $correction->reviewer?->name,
                'approver' => $correction->approver?->name,
            ];
        });

    return Inertia::render('Employee/MyCorrectionRequests', [
        'corrections' => $corrections,
    ]);
}

/**
 * View proof image (updated to allow viewing instead of downloading)
 */
public function viewProofImage($id)
{
    $correction = AttendanceCorrection::findOrFail($id);
    
    // Check if user has permission to view this correction
    $user = auth()->user();
    $allowedRoles = ['admin', 'hr', 'dept_head'];
    
    // Allow access for:
    // - Admin, HR, Dept Head roles
    // - The employee who submitted the request
    // - Department Head of the employee's department
    $canAccess = in_array($user->role, $allowedRoles) || 
                 $correction->employee_id === $user->employee?->employee_id ||
                 ($user->role === 'dept_head' && $correction->department_id === $user->employee?->department_id);

    if (!$canAccess) {
        abort(403, 'Unauthorized action.');
    }

    if (!$correction->proof_image || !Storage::disk('public')->exists($correction->proof_image)) {
        abort(404, 'Proof image not found.');
    }

    // Return the image as a response instead of forcing download
    $filePath = Storage::disk('public')->path($correction->proof_image);
    $mimeType = mime_content_type($filePath);
    
    return response()->file($filePath, [
        'Content-Type' => $mimeType,
        'Content-Disposition' => 'inline; filename="' . basename($correction->proof_image) . '"'
    ]);
}
}