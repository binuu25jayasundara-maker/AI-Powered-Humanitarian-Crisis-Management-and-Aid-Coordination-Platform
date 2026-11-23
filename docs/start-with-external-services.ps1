# Starts ResQnet API with REAL Email / SMS / AI providers.
# Secrets are prompted at runtime and kept only in this process environment.
# Do NOT paste credentials into appsettings.json or into chat.

$ErrorActionPreference = 'Stop'
$root = 'C:\Users\LENOVO\Desktop\123456'

function Read-Secret([string]$prompt) {
    $secure = Read-Host $prompt -AsSecureString
    return [System.Net.NetworkCredential]::new('', $secure).Password
}

Write-Host "`n=== EMAIL (Gmail SMTP) ==="
$env:Notifications__Email__Provider    = 'Smtp'
$env:Notifications__Email__SmtpHost    = 'smtp.gmail.com'
$smtpPort = Read-Host 'SMTP port (587 STARTTLS recommended; use 465 if 587 is blocked)'
if ([string]::IsNullOrWhiteSpace($smtpPort)) { $smtpPort = '587' }
$env:Notifications__Email__SmtpPort    = $smtpPort.Trim()
$env:Notifications__Email__EnableSsl   = 'true'
$env:Notifications__Email__SmtpSocketOptions = if ($smtpPort.Trim() -eq '465') { 'SslOnConnect' } else { 'StartTls' }
$env:Notifications__Email__SmtpUser    = Read-Host 'Gmail address (e.g. you@gmail.com)'
$env:Notifications__Email__SmtpPassword = Read-Secret 'Gmail App Password (16 characters)'
$env:Notifications__Email__FromAddress = $env:Notifications__Email__SmtpUser
$env:Notifications__Email__FromName    = 'ResQnet.AI'

Write-Host "`n=== SMS (Notify.lk) ==="
$env:Notifications__Sms__Provider         = 'NotifyLk'
$env:Notifications__Sms__NotifyLkUserId   = Read-Host 'Notify.lk User ID'
$env:Notifications__Sms__NotifyLkApiKey   = Read-Secret 'Notify.lk API Key'
$env:Notifications__Sms__NotifyLkSenderId = 'NotifyDEMO'
$env:Notifications__Sms__NotifyLkEndpoint = 'https://app.notify.lk/api/v1/send'

Write-Host "`n=== AI (OpenAI-compatible Chat Completions) ==="
$env:AI__ApiKey        = Read-Secret 'OpenAI API key'
$env:AI__Endpoint      = 'https://api.openai.com/v1/chat/completions'
$env:AI__Model         = 'gpt-4o-mini'
$env:AI__TimeoutSeconds = '20'

Write-Host "`n=== BUILDING API (stops any running instance first) ==="
$apiProcesses = @(Get-CimInstance Win32_Process | Where-Object {
    $_.Name -eq 'ResQnet.Api.exe' -or ([string]$_.CommandLine -like '*\ResQnet.Api.exe*')
})
foreach ($p in $apiProcesses) {
    Write-Host "Stopping running API PID $($p.ProcessId)..."
    Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
}
if ($apiProcesses.Count -gt 0) { Start-Sleep -Seconds 2 }

$stillRunning = @(Get-CimInstance Win32_Process | Where-Object {
    $_.Name -eq 'ResQnet.Api.exe' -or ([string]$_.CommandLine -like '*\ResQnet.Api.exe*')
})
if ($stillRunning.Count -gt 0) {
    $pids = ($stillRunning.ProcessId) -join ', '
    throw "Cannot build: ResQnet.Api is still running (PID(s): $pids). Close it manually and retry."
}

# Release stale MSBuild worker nodes that may also hold DLL locks.
dotnet build-server shutdown | Out-Null

dotnet build "$root\backend\ResQnet.slnx" --nologo -v minimal
if ($LASTEXITCODE -ne 0) {
    throw "Build failed with exit code $LASTEXITCODE. Fix the compile errors before starting the API."
}

Write-Host "`n=== STARTING API ==="
$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:ASPNETCORE_URLS = 'http://localhost:5000;http://localhost:5016'
Set-Location "$root\backend\ResQnet.Api\bin\Debug\net10.0"
& '.\ResQnet.Api.exe'
