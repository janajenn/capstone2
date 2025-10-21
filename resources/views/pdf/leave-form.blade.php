<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Leave Request Form - {{ $leaveRequest->id }}</title>
    <style>
        /* Reset margins and padding for full page usage */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            background: white;
            width: 90%;
            margin: 5mm; /* Small margin on bond paper */
            padding: 0;
            line-height: 1.3;
            color: #000 !important;
        }

        .leave-form-page {
            width: 100%;
            min-height: 275mm; /* A4 height */
            background: white;
        }

        .form-header {
            text-align: center;
            margin-bottom: 8px;
        }

        .government-info {
            font-size: 12px;
            font-weight: bold;
        }

        .form-title {
            text-align: center;
            font-weight: bold;
            font-size: 16px;
            margin: 10px 0;
            text-decoration: underline;
        }

        /* Form Info Table */
        .form-info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
            border: 1px solid #000;
        }

        .form-info-table td {
            padding: 6px 8px;
            border: 1px solid #000;
            vertical-align: top;
        }

        .section-title {
            font-weight: bold;
            background: #d9d9d9;
            padding: 4px 6px;
            border: 1px solid #000;
            margin-bottom: 8px;
            font-size: 12px;
        }

        .form-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
        }

        .form-table td, .form-table th {
            padding: 4px 6px;
            vertical-align: top;
            border: 1px solid #000;
        }

        .leave-type-option {
            margin-bottom: 3px;
            padding: 1px 0;
        }

        .checkbox {
            display: inline-block;
            width: 14px;
            height: 14px;
            border: 1px solid #000;
            margin-right: 5px;
            text-align: center;
            line-height: 12px;
            font-size: 10px;
            vertical-align: middle;
        }

        .checkbox.checked {
            background: #000;
            color: white;
        }

        .leave-credits-table {
            width: 100%;
            border: 1px solid #000;
            text-align: center;
            border-collapse: collapse;
            margin: 8px 0;
        }

        .leave-credits-table th,
        .leave-credits-table td {
            border: 1px solid #000;
            padding: 4px;
            font-size: 11px;
        }

        .signature-section {
            text-align: center;
            margin-top: 15px;
        }

        .approver-signature-line {
            width: 220px;
            margin: 0 auto;
            border-bottom: 1px solid #000;
            height: 20px;
            line-height: 20px;
            font-weight: bold;
            font-size: 11px;
        }

        .verification-text {
            margin-top: 3px;
            font-weight: bold;
            color: #333;
            font-style: italic;
            font-size: 10px;
        }

        .signature-label {
            margin-top: 3px;
            font-size: 9px;
            color: #333;
        }

        .final-approval-table {
            width: 100%;
            border: 1px solid #000;
            border-collapse: collapse;
        }

        .final-approval-table td {
            padding: 6px;
            border: 1px solid #000;
        }

        /* Ensure everything prints correctly */
        @media print {
            body {
                margin: 5mm;
                background: white;
            }
            
            .section-title {
                background: #d9d9d9 !important;
            }
            
            .checkbox.checked {
                background: #000 !important;
                color: white !important;
            }
            
            @page {
                margin: 5mm;
            }
        }

        /* Force dark borders and text */
        table, td, th {
            border-color: #000 !important;
        }
        
        strong {
            color: #000 !important;
        }
    </style>
</head>
<body>
    <div class="leave-form-page">
        <!-- Header -->
        <div class="form-header">
            <div class="government-info">
                Republic of the Philippines<br />
                Local Government Unit of Opol<br />
                Zone 3, Poblacion Opol, Misamis Oriental<br />
            </div>
        </div>

        <div class="form-title">APPLICATION FOR LEAVE</div>

        <!-- Basic Information Table -->
        <table class="form-info-table">
            <tbody>
                <tr>
                    <td>
                        <strong>1. Office/Department: {{ $employee->department->name ?? 'N/A' }}</strong>
                        <strong style="margin-left: 40px;">2. Name: {{ $employee->firstname ?? '' }} {{ $employee->lastname ?? 'N/A' }}</strong>
                    </td>
                </tr>
                <tr>
                    <td>
                        <strong>3. Date of filing: {{ \Carbon\Carbon::parse($leaveRequest->created_at)->format('F j, Y') }}</strong>
                        <strong style="margin-left: 40px;">4. Position: {{ $employee->position ?? 'N/A' }}</strong>
                        <strong style="margin-left: 40px;">5. Salary: ₱{{ $employee->salary ? number_format($employee->salary, 2) : 'N/A' }}</strong>
                    </td>
                </tr>
            </tbody>
        </table>

        <!-- Leave Details Section -->
        <div class="section-title">6. DETAILS OF APPLICATION</div>

        <table class="form-table">
            <tbody>
                <tr>
                    <td style="width: 50%">
                        6.A TYPE OF LEAVE TO BE AVAILED OF:<br /><br />
                        
                        @php
                            $leaveTypes = [
                                'VL' => 'Vacation Leave',
                                'FL' => 'Forced Leave',
                                'SL' => 'Sick Leave',
                                'ML' => 'Maternity Leave',
                                'PL' => 'Paternity Leave',
                                'SPL' => 'Special Privilege Leave',
                                'SOLOPL' => 'Solo Parent Leave',
                                'STL' => 'Study Leave',
                                '10DVL' => '10-Day VAWC Leave',
                                'RL' => 'Rehabilitation Privilege',
                                'SLBW' => 'Special Leave Benefits for Women',
                                'AL' => 'Adoption Leave'
                            ];
                            
                            $currentLeaveType = $leaveRequest->leave_type;
                        @endphp
                        
                        @foreach($leaveTypes as $type => $label)
                        <div class="leave-type-option">
                            <span class="checkbox @if($currentLeaveType === $type) checked @endif">
                                @if($currentLeaveType === $type) ✓ @endif
                            </span> {{ $label }}
                        </div>
                        @endforeach
                        
                        <div class="leave-type-option">
                            <span class="checkbox"></span> Others: 
                        </div><br />
                        ________________________________________
                    </td>
                    
                    <td style="width: 50%">
                        6.B DETAILS OF LEAVE<br /><br />
                        
                        <div>
                            <!-- Vacation Leave -->
                            @php
                                $vacationLocation = null;
                                $sickType = null;
                                $illness = null;
                                $studyPurpose = null;
                                
                                // Extract details from leave request details
                                foreach($leaveRequest->details as $detail) {
                                    $fieldValue = $detail->field_value;
                                    if (in_array($fieldValue, ['within_philippines', 'abroad'])) {
                                        $vacationLocation = $fieldValue;
                                    }
                                    if (in_array($fieldValue, ['in_hospital', 'outpatient'])) {
                                        $sickType = $fieldValue;
                                    }
                                    if ($fieldValue && !in_array($fieldValue, ['in_hospital', 'outpatient', 'within_philippines', 'abroad', 'masters_completion', 'board_exam', 'continuing_education', 'gynecological_surgery', 'miscarriage'])) {
                                        $illness = $fieldValue;
                                    }
                                    if (in_array($fieldValue, ['masters_completion', 'board_exam', 'continuing_education'])) {
                                        $studyPurpose = $fieldValue;
                                    }
                                }
                            @endphp
                            
                            <div style="margin-bottom: 8px;">
                                In case of Vacation Leave:<br />
                                <span class="checkbox @if($vacationLocation === 'within_philippines') checked @endif">
                                    @if($vacationLocation === 'within_philippines') ✓ @endif
                                </span> Within the Philippines<br />
                                <span class="checkbox @if($vacationLocation === 'abroad') checked @endif">
                                    @if($vacationLocation === 'abroad') ✓ @endif
                                </span> Abroad (Specify)<br />
                                @if($vacationLocation)
                                    <strong>Selected: {{ $vacationLocation === 'within_philippines' ? 'Within Philippines' : 'Abroad' }}</strong><br />
                                @endif
                            </div>
                            
                            <!-- Sick Leave -->
                            <div style="margin-bottom: 8px;">
                                In case of Sick Leave:<br />
                                <span class="checkbox @if($sickType === 'in_hospital') checked @endif">
                                    @if($sickType === 'in_hospital') ✓ @endif
                                </span> In Hospital<br />
                                <span class="checkbox @if($sickType === 'outpatient') checked @endif">
                                    @if($sickType === 'outpatient') ✓ @endif
                                </span> Out Patient<br />
                                @if($illness)
                                    <strong>Illness/Reason: {{ $illness }}</strong><br />
                                @endif
                            </div>

                            <!-- Study Leave -->
                            <div style="margin-bottom: 8px;">
                                In case of Study Leave:<br />
                                <span class="checkbox @if($studyPurpose === 'masters_completion') checked @endif">
                                    @if($studyPurpose === 'masters_completion') ✓ @endif
                                </span> Completion of Master's<br />    
                                <span class="checkbox @if($studyPurpose === 'board_exam') checked @endif">
                                    @if($studyPurpose === 'board_exam') ✓ @endif
                                </span> BAR/Board Exam Review<br />
                                <span class="checkbox @if($studyPurpose === 'continuing_education') checked @endif">
                                    @if($studyPurpose === 'continuing_education') ✓ @endif
                                </span> Continuing Education<br />
                                @if($studyPurpose)
                                    <strong>Purpose: 
                                        @if($studyPurpose === 'masters_completion')
                                            Completion of Master's
                                        @elseif($studyPurpose === 'board_exam')
                                            BAR/Board Exam Review
                                        @elseif($studyPurpose === 'continuing_education')
                                            Continuing Education
                                        @else
                                            Other
                                        @endif
                                    </strong><br />
                                @endif
                            </div>

                            Other Purpose: _____________________________________<br />
                            <span class="checkbox" style="margin-top: 4px;"></span> Monetization of Leave Credits<br />
                            <span class="checkbox"></span> Terminal Leave<br />
                        </div>
                    </td>
                </tr>
                
                <tr>
                    <td>
                        6.C NUMBER OF WORKING DAYS APPLIED FOR<br />
                        <strong>{{ ($leaveRequest->days_with_pay ?? 0) + ($leaveRequest->days_without_pay ?? 0) }} days</strong><br />
                        Inclusive Dates: <br />
                        <strong>{{ \Carbon\Carbon::parse($leaveRequest->start_date)->format('F j, Y') }} to {{ \Carbon\Carbon::parse($leaveRequest->end_date)->format('F j, Y') }}</strong>
                    </td>
                    <td>
                        6.D COMMUTATION<br />
                        <span class="checkbox checked">✓</span> Not Requested<br />
                        <span class="checkbox"></span> Requested
                        
                        <div class="signature-section">
                            <div style="font-weight: bold; color: #666; font-style: italic;">Digitally Signed by Applicant</div>
                            <div class="signature-label">(Signature of Applicant)</div>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>

        <!-- Action Details Section -->
        <div class="section-title" style="text-align: center">
            7. DETAILS OF ACTION ON APPLICATION
        </div>

        <table class="form-table">
            <tbody>
                <tr>
                    <td style="width: 50%">
                        7.A CERTIFICATION OF LEAVE CREDITS<br />
                        <div style="text-align: center">
                            As of {{ \Carbon\Carbon::now()->format('F j, Y') }} <br />
                        </div>
                        
                        <table class="leave-credits-table">
                            <thead>
                                <tr>
                                    <th></th>
                                    <th>Vacation Leave</th>
                                    <th>Sick Leave</th>
                                </tr>
                            </thead>
                            <tbody>
                                @php
                                    // Simple balance calculation for PDF
                                    $vlBalance = $employee->leaveCredit->vl_balance ?? 0;
                                    $slBalance = $employee->leaveCredit->sl_balance ?? 0;
                                    $daysApplied = ($leaveRequest->days_with_pay ?? 0) + ($leaveRequest->days_without_pay ?? 0);
                                    
                                    if ($currentLeaveType === 'VL') {
                                        $vlUsed = $daysApplied;
                                        $slUsed = 0;
                                    } elseif ($currentLeaveType === 'SL') {
                                        $vlUsed = 0;
                                        $slUsed = $daysApplied;
                                    } else {
                                        $vlUsed = 0;
                                        $slUsed = 0;
                                    }
                                @endphp
                                <tr>
                                    <td>Total Earned</td>
                                    <td>{{ $vlBalance + $vlUsed }}</td>
                                    <td>{{ $slBalance + $slUsed }}</td>
                                </tr>
                                <tr>
                                    <td>Less this application</td>
                                    <td>{{ $vlUsed }}</td>
                                    <td>{{ $slUsed }}</td>
                                </tr>
                                <tr>
                                    <td>Balance</td>
                                    <td>{{ $vlBalance }}</td>
                                    <td>{{ $slBalance }}</td>
                                </tr>
                            </tbody>
                        </table>
                        
                        <div class="signature-section">
                            <div class="approver-signature-line">
                                @php
                                    $hrApprover = 'HRMO-Designate';
                                    if (isset($approvers) && $approvers->isNotEmpty()) {
                                        $hrApproval = $approvers->firstWhere('role', 'HRMO-Designate') ?? $approvers->firstWhere('role', 'hr');
                                        if ($hrApproval && isset($hrApproval->approver)) {
                                            $hrApprover = $hrApproval->approver->name ?? 'HRMO-Designate';
                                        }
                                    }
                                @endphp
                                {{ $hrApprover }}
                            </div>
                            <div class="verification-text">Digitally Signed and Certified by</div>
                            <div class="signature-label">(HRMO-Designate)</div>
                        </div>
                    </td>
                    
                    <td style="width: 50%">
                        7.B RECOMMENDATION<br />
                        <span class="checkbox checked">✓</span> For approval<br />
                        <span class="checkbox"></span> For disapproval due to: _____________________________________<br />
                        ___________________________________________________________<br /><br />
                        <div class="signature-section">
                            <div class="approver-signature-line">
                                @php
                                    $deptHeadApprover = 'Department Head';
                                    if (isset($approvers) && $approvers->isNotEmpty()) {
                                        $deptHeadApproval = $approvers->firstWhere('role', 'Department Head') ?? $approvers->firstWhere('role', 'dept_head');
                                        if ($deptHeadApproval && isset($deptHeadApproval->approver)) {
                                            $deptHeadApprover = $deptHeadApproval->approver->name ?? 'Department Head';
                                        }
                                    }
                                @endphp
                                {{ $deptHeadApprover }}
                            </div>
                            <div class="verification-text">Digitally Signed and Approved by</div>
                            <div class="signature-label">(Department Head/Authorized Personnel)</div>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>

        <!-- Final Approval Section -->
        <table class="final-approval-table">
            <tbody>
                <tr>
                    <td style="width: 50%;">
                        7.C APPROVED FOR: <br />
                        <strong>{{ $leaveRequest->days_with_pay ?? 0 }} days with pay</strong><br />
                        <strong>{{ $leaveRequest->days_without_pay ?? 0 }} days without pay</strong><br />
                        _____ others (specify)__________
                    </td>
                    <td style="width: 50%;">
                        7.D DISAPPROVED DUE TO:<br />
                        ______________________________________________________________<br />    
                        ______________________________________________________________
                    </td>
                </tr>
                <tr>
                    <td colspan="2" style="text-align: center; padding-top: 15px;">
                        <div class="approver-signature">
                            <div class="approver-signature-line">
                                @php
                                    $adminApprover = 'Municipal Vice Mayor';
                                    if (isset($approvers) && $approvers->isNotEmpty()) {
                                        $adminApproval = $approvers->firstWhere('role', 'Municipal Vice Mayor') ?? $approvers->firstWhere('role', 'admin');
                                        if ($adminApproval && isset($adminApproval->approver)) {
                                            $adminApprover = $adminApproval->approver->name ?? 'Municipal Vice Mayor';
                                        }
                                    }
                                @endphp
                                {{ $adminApprover }}
                            </div>
                            <div class="verification-text">Digitally Signed and Approved by</div>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</body>
</html>