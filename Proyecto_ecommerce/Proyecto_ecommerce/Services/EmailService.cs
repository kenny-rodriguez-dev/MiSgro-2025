using MailKit.Net.Smtp;
using MimeKit;
using MimeKit.Text;

public class EmailService
{
    public async Task SendEmailAsync(string to, string subject, string body)
    {
        var email = new MimeMessage();
        email.From.Add(new MailboxAddress("Mi E-commerce", "kennyrodriguezm2017@gmail.com"));
        email.To.Add(new MailboxAddress("", to));
        email.Subject = subject;

        // Aquí indicamos que el body es HTML
        email.Body = new TextPart(TextFormat.Html)
        {
            Text = body
        };

        using (var smtp = new SmtpClient())
        {
            // Ajusta a tu host SMTP
            await smtp.ConnectAsync("smtp.gmail.com", 587, false);
            await smtp.AuthenticateAsync("kennyrodriguezm2017@gmail.com", "nfmu gpic ygcm eisc");
            await smtp.SendAsync(email);
            await smtp.DisconnectAsync(true);
        }
    }
}
