<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Welcome to Our Company</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: #3b82f6;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
        }
        .content {
            background: #f9fafb;
            padding: 20px;
            border: 1px solid #e5e7eb;
            border-top: none;
            border-radius: 0 0 5px 5px;
        }
        .credentials {
            background: white;
            padding: 15px;
            border: 1px solid #e5e7eb;
            border-radius: 5px;
            margin: 20px 0;
        }
        .warning {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            color: #92400e;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            color: #6b7280;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Welcome to the LGU Opol HR System!</h1>
    </div>
    
    <div class="content">
        <p>Dear {{ $employee->firstname }} {{ $employee->lastname }},</p>
        
        <p>Your employee account has been successfully created. Here are your login credentials:</p>
        
        <div class="credentials">
            <p><strong>Email:</strong> {{ $email }}</p>
            <p><strong>Password:</strong> {{ $password }}</p>
        </div>
        
        <div class="warning">
            <p><strong>Important Security Notice:</strong></p>
            <p>For security reasons, please change your password immediately after your first login.</p>
        </div>
        
        <p>You can access the system using the following link:</p>
        <p>
            <a href="{{ url('/login') }}" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Login to System
            </a>
        </p>
        
        <p>If you have any questions or need assistance, please contact the HR department.</p>
        
        <p>Best regards,<br>HR Department</p>
    </div>
    
    <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
    </div>
</body>
</html>