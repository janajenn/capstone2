<?php

namespace App\Exports;

use App\Models\Employee;
use App\Models\LeaveCredit;
use App\Models\EmployeeMonthlyRecording;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Maatwebsite\Excel\Concerns\WithColumnWidths;

class EmployeeRecordingsExport implements FromCollection, WithHeadings, WithMapping, WithStyles, WithColumnWidths
{
    protected $departmentId;
    protected $year;

    public function __construct($departmentId = null, $year = null)
    {
        $this->departmentId = $departmentId;
        $this->year = $year ?? now()->year;
    }

    public function collection()
    {
        $query = Employee::with(['department', 'leaveCredit']);

        if ($this->departmentId) {
            $query->where('department_id', $this->departmentId);
        }

        return $query->orderBy('firstname')->orderBy('lastname')->get();
    }

    public function headings(): array
    {
        $headings = [
            'Employee ID',
            'Employee Name',
            'Department',
            'Position',
        ];

        $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        foreach ($months as $month) {
            $headings[] = $month . ' VL Used';
            $headings[] = $month . ' SL Used';
        }

        $headings[] = 'VL Balance (Current)';
        $headings[] = 'SL Balance (Current)';
        $headings[] = 'Total VL+SL';

        return $headings;
    }

    public function map($employee): array
    {
        $row = [
            $employee->employee_id,
            $employee->firstname . ' ' . $employee->lastname,
            $employee->department->name ?? 'N/A',
            $employee->position,
        ];

        $employeeId = $employee->employee_id;
        $year = $this->year;

        $recordings = EmployeeMonthlyRecording::where('employee_id', $employeeId)
            ->where('year', $year)
            ->get()
            ->keyBy('month');

        // Add monthly usage as raw floats
        for ($month = 1; $month <= 12; $month++) {
            $rec = $recordings[$month] ?? null;
            $row[] = (float) ($rec->vl_used ?? 0);
            $row[] = (float) ($rec->sl_used ?? 0);
        }

        // Current balances as raw floats
        $leaveCredit = LeaveCredit::where('employee_id', $employeeId)->first();
        $currentVl = (float) ($leaveCredit->vl_balance ?? 0);
        $currentSl = (float) ($leaveCredit->sl_balance ?? 0);

        $row[] = $currentVl;
        $row[] = $currentSl;
        $row[] = $currentVl + $currentSl;

        return $row;
    }

    public function styles(Worksheet $sheet)
    {
        // Bold header
        $sheet->getStyle('1')->getFont()->setBold(true);
        $sheet->getStyle('1')->getFill()
              ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
              ->getStartColor()->setARGB('FFE6E6FA');

        // Force 3 decimal places for all data cells (columns E onward)
        $highestColumn = $sheet->getHighestColumn(); // e.g., 'AE'
        $highestRow = $sheet->getHighestRow();
        if ($highestRow >= 2) {
            $sheet->getStyle('E2:' . $highestColumn . $highestRow)
                  ->getNumberFormat()
                  ->setFormatCode('0.000');
        }

        return [];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 15,
            'B' => 25,
            'C' => 20,
            'D' => 20,
        ];
    }
}