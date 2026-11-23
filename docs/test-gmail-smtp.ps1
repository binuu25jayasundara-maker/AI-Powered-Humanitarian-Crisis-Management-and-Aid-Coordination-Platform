# Direct Gmail SMTP test — independent of the ResQnet API.
# Prompts for credentials; nothing is written to disk.
# This diagnostic uses .NET SmtpClient (STARTTLS on 587 only).
# The web API uses MailKit and also supports port 465 implicit SSL.
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$user = Read-Host 'Gmail address'
$secure = Read-Host 'Gmail App Password (16 chars, no spaces)' -AsSecureString
$pass = [System.Net.NetworkCredential]::new('', $secure).Password
$to   = Read-Host 'Recipient address'

$message = $null
$smtp = $null

function Show-ExceptionChain([System.Exception]$error) {
    $level = 0
    while ($null -ne $error) {
        Write-Host ("[{0}] {1}" -f $level, $error.GetType().FullName) -ForegroundColor Yellow
        Write-Host $error.Message
        $level++
        $error = $error.InnerException
    }
}

try {
    $message = [System.Net.Mail.MailMessage]::new()
    $message.From = [System.Net.Mail.MailAddress]::new($user, 'ResQnet SMTP Test')
    $message.To.Add($to)
    $message.Subject = 'ResQnet Gmail SMTP test'
    $message.Body = 'If you received this, Gmail SMTP works.'

    $smtp = [System.Net.Mail.SmtpClient]::new('smtp.gmail.com', 587)
    $smtp.EnableSsl = $true
    $smtp.UseDefaultCredentials = $false
    $smtp.Credentials = [System.Net.NetworkCredential]::new($user, $pass)
    $smtp.Timeout = 20000

    $smtp.Send($message)
    Write-Host "`nSUCCESS: Gmail accepted the message for $to" -ForegroundColor Green
}
catch {
    Write-Host "`nFAILED:" -ForegroundColor Red
    Show-ExceptionChain $_.Exception

    $text = $_.Exception.ToString()
    if ($text -match '535|Username and Password not accepted') {
        Write-Host "`nDIAGNOSIS: Authentication failed. Use a 16-character Gmail App Password (2FA must be on)." -ForegroundColor Yellow
    }
    elseif ($text -match 'net_io_connectionclosed|actively refused|timed out') {
        Write-Host "`nDIAGNOSIS: Connection was dropped/blocked after the SMTP session started. " -ForegroundColor Yellow
        Write-Host 'Credentials are likely correct. Try the web app with SMTP port 465 (implicit SSL), or check firewall/proxy/antivirus rules for smtp.gmail.com.' -ForegroundColor Yellow
    }
}
finally {
    if ($smtp) { $smtp.Dispose() }
    if ($message) { $message.Dispose() }
}
