<?php

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\DatabaseMessage;

class LeaveApproved extends Notification
{
    use Queueable;

    protected $leaveRequest;

    public function __construct($leaveRequest)
    {
        $this->leaveRequest = $leaveRequest;
    }

    public function via($notifiable)
    {
        return ['database']; // You can add 'mail', 'broadcast', etc. too
    }

    public function toDatabase($notifiable)
    {
        return [
            'message' => 'Your leave request from ' . $this->leaveRequest->date_from . ' to ' . $this->leaveRequest->date_to . ' has been approved.',
            'leave_id' => $this->leaveRequest->id,
        ];
    }
}
