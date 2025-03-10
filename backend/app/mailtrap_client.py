import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

MAILTRAP_USERNAME = os.getenv("MAILTRAP_USERNAME")
MAILTRAP_PASSWORD = os.getenv("MAILTRAP_PASSWORD")
MAILTRAP_HOST = os.getenv("MAILTRAP_HOST", "smtp.mailtrap.io")
MAILTRAP_PORT = int(os.getenv("MAILTRAP_PORT", 2525))

def send_otp_email(to_email: str, otp: str):
    # Create the HTML content
    html_content = f"""
    <html>
    <head>
        <style>
            body {{
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
            }}
            .container {{
                max-width: 600px;
                margin: 20px auto;
                padding: 20px;
                background-color: #ffffff;
                border-radius: 8px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }}
            .header {{
                text-align: center;
                margin-bottom: 20px;
            }}
            .header img {{
                width: 100px;
                height: auto;
            }}
            .header h2 {{
                color: #333333;
                margin: 10px 0 0;
            }}
            .otp-code {{
                font-size: 24px;
                font-weight: bold;
                color: #007BFF;
                text-align: center;
                margin: 20px 0;
            }}
            .footer {{
                margin-top: 20px;
                text-align: center;
                color: #777777;
                font-size: 14px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="https://i.ibb.co/YBStKgFC/logo-2.png" alt="logo-2" border="0">
                <h2>FutureProof</h2>
            </div>
            <h1>Your OTP Code</h1>
            <p>Please use the following OTP code to complete your verification:</p>
            <div class="otp-code">{otp}</div>
            <p>This code is valid for a limited time. Do not share it with anyone.</p>
            <div class="footer">
                <p>If you did not request this code, please ignore this email.</p>
            </div>
        </div>
    </body>
    </html>
    """

    # Create a MIMEMultipart message
    msg = MIMEMultipart()
    msg["Subject"] = "Your OTP Code"
    msg["From"] = "FutureProof@gmail.com"
    msg["To"] = to_email

    # Attach the HTML content
    msg.attach(MIMEText(html_content, "html"))

    # Send the email
    with smtplib.SMTP(MAILTRAP_HOST, MAILTRAP_PORT) as server:
        server.starttls()
        server.login(MAILTRAP_USERNAME, MAILTRAP_PASSWORD)
        server.sendmail(msg["From"], [msg["To"]], msg.as_string())

def send_reactivation_otp_email(to_email: str, otp: str):
    html_content = f"""
    <html>
    <head>
        <style>
            body {{
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            }}
            .container {{
            max-width: 600px;
            width: 100%;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            text-align: center;
            }}
            .header {{
            text-align: center;
            margin-bottom: 20px;

            }}
            .header img {{
                width: 100px;
                height: auto;
            }}
            .header h2 {{
                color: #333333;
                margin: 10px 0 0;
            }}
            .otp-code {{
                font-size: 24px;
                font-weight: bold;
                color: #007BFF;
                text-align: center;
                margin: 20px 0;
            }}
            .footer {{
                margin-top: 20px;
                text-align: center;
                color: #777777;
                font-size: 14px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="https://i.ibb.co/YBStKgFC/logo-2.png" alt="logo-2" border="0">
                <h2>FutureProof</h2>
            </div>
            <h1>Your Reactivation OTP Code</h1>
            <p> Your account has been temporarily deactivated due to lack of activities. You can use to use the OTP below to reactivate your action or ignore thise email to delete your account in 24 hours. </p>
            <p>Please use the following OTP code to reactivate your account:</p>
            <div class="otp-code">{otp}</div>
            <p>This code is valid for a limited time. Do not share it with anyone.</p>
            <div class="footer">
                <p>If you did not request this code, please ignore this email.</p>
            </div>
        </div>
    </body>
    </html>
    """
    msg = MIMEMultipart()
    msg["Subject"] = "Your Reactivation OTP Code"
    msg["From"] = "FutureProof@gmail.com"
    msg["To"] = to_email
    msg.attach(MIMEText(html_content, "html"))

    with smtplib.SMTP(MAILTRAP_HOST, MAILTRAP_PORT) as server:
        server.starttls()
        server.login(MAILTRAP_USERNAME, MAILTRAP_PASSWORD)
        server.sendmail(msg["From"], [msg["To"]], msg.as_string())

def send_account_disabled_email(to_email: str, reason: str):
    html_content = f"""
    <html>
    <head>
        <style>
            body {{
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            }}
            .container {{
            max-width: 600px;
            width: 100%;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            text-align: center;
            }}
            .header {{
            text-align: center;
            margin-bottom: 20px;

            }}
            .header img {{
                width: 100px;
                height: auto;
            }}
            .header h2 {{
                color: #333333;
                margin: 10px 0 0;
            }}
            .message {{
                font-size: 18px;
                color: #333333;
                text-align: center;
                margin: 20px 0;
            }}
            .footer {{
                margin-top: 20px;
                text-align: center;
                color: #777777;
                font-size: 14px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="https://i.ibb.co/YBStKgFC/logo-2.png" alt="logo-2" border="0">
                <h2>FutureProof</h2>
            </div>
            <h1>Account Disabled</h1>
            <p>Your FutureProof account has been disabled due to {reason}.</p>
            <div class="message">To reactivate your account, please login again. You will receive an OTP to complete the reactivation process.</div>
            <div class="footer">
                <p>If you have any questions, please contact our support team.</p>
            </div>
        </div>
    </body>
    </html>
    """
    msg = MIMEMultipart()
    msg["Subject"] = "Your FutureProof Account Has Been Disabled"
    msg["From"] = "FutureProof@gmail.com"
    msg["To"] = to_email
    msg.attach(MIMEText(html_content, "html"))

    with smtplib.SMTP(MAILTRAP_HOST, MAILTRAP_PORT) as server:
        server.starttls()
        server.login(MAILTRAP_USERNAME, MAILTRAP_PASSWORD)
        server.sendmail(msg["From"], [msg["To"]], msg.as_string())
