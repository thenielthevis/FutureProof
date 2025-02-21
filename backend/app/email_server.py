from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import smtplib

class RequestHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)

            email = data.get('email')
            username = data.get('username')

            # Log received data for debugging
            print(f"Received data: email={email}, username={username}")

            # Send email
            self.send_email(email, username)

            self.send_response(200)
            self.end_headers()
            self.wfile.write(json.dumps({"status": "Email sent"}).encode())
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
            print(f"Error handling POST request: {e}")

    def send_email(self, email, username):
        sender = "Private Person <from@example.com>"
        receiver = f"{username} <{email}>"

        message = f"""\
Subject: Hi Mailtrap
To: {receiver}
From: {sender}

This is a test e-mail message."""

        try:
            with smtplib.SMTP("sandbox.smtp.mailtrap.io", 2525) as server:
                server.starttls()
                server.login("3e5da143b7a5f6", "4e0634ed53aaf2")
                server.sendmail(sender, receiver, message)
            print(f"Email successfully sent to {receiver}")
        except Exception as e:
            print(f"Failed to send email to {receiver}. Error: {e}")
            raise

def run(server_class=HTTPServer, handler_class=RequestHandler, port=8081):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f'Starting httpd on port {port}...')
    httpd.serve_forever()

if __name__ == "__main__":
    run()

    