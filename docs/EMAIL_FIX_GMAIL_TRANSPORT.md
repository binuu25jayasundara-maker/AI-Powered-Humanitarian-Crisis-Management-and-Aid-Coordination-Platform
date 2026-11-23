# Email failure fix — Gmail SMTP transport reset

## Observed failure

Direct SMTP test (`docs/test-gmail-smtp.ps1`) reported:

```text
System.Net.Mail.SmtpException: Failure sending mail.
 ---> System.IO.IOException: Unable to read data from the transport connection:
      net_io_connectionclosed.
   at System.Net.Mail.MailCommand.Send(...)
```

Interpretation:

- The failure occurs at the `MAIL FROM` command, after connection/TLS setup.
- There is **no 535 authentication error**, so the Gmail App Password is most likely valid.
- `net_io_connectionclosed` means the SMTP session was closed without a reply — typical of a network firewall/proxy/antivirus reset on port 587 STARTTLS, or Gmail closing the session at sender verification.

A later web UI attempt with the startup script reported:

```text
Notification Dispatch Failed!
Status: Delivery Failed
Delivery Mode: Failed
The SMTP server has unexpectedly disconnected.
```

This is MailKit's equivalent transport-reset message. The first version of the alternate-endpoint retry did not recognise this exact wording, so retry was skipped. That detection gap is fixed below.

## Code changes applied

1. `backend/ResQnet.Infrastructure/Channels/EmailNotificationChannel.cs`
   - Replaced `System.Net.Mail.SmtpClient` with **MailKit 5.0.0**.
   - Supports `Notifications:Email:SmtpSocketOptions = StartTls` (587) or `SslOnConnect` (465). `Auto` selects by port.
   - For `smtp.gmail.com`, automatically retries on the alternate endpoint when the first attempt is a transport reset (`net_io_connectionclosed`, connection closed/reset/refused, timeout, or MailKit's `The SMTP server has unexpectedly disconnected.`). Authentication errors are **not** retried.
   - Validates recipient before simulated/live dispatch.
   - Flattens inner exceptions so the API/UI show the real reason instead of only `Failure sending mail`.
   - Returns `DeliveryMode`: `Live`, `Simulated`, `Duplicate`, or `Failed`.
2. `backend/ResQnet.Application/Volunteers/DTOs/NotificationDtos.cs`
   - Added `DeliveryMode` to `NotificationResult`.
3. `backend/ResQnet.Application/Volunteers/Services/NotificationService.cs`
   - Duplicate suppression now reports `DeliveryMode = Duplicate`.
4. `frontend/src/services/api.ts`
   - Removed the fake success fallback. A missing/erroring API response now returns `isSuccess: false` with a clear message.
5. `frontend/src/pages/CommunicationCenterPage.tsx`
   - Result panel now checks `isSuccess` first.
   - Failed dispatch shows red **Notification Dispatch Failed!** / **Delivery Failed**.
   - Simulated fallback shows amber **Simulated Dispatch (No Email Sent)**.
   - Only a real live send shows green **Notification Dispatched Successfully! / Delivered to Gateway**.
6. `docs/start-with-external-services.ps1`
   - Stops any running API by executable path, waits for it to exit, shuts down stale MSBuild worker nodes, then rebuilds the solution.
   - Prompts for SMTP port and sets the correct MailKit socket option.
   - Aborts with a clear error if an API process still holds the DLLs after the stop attempt.
7. `docs/test-gmail-smtp.ps1`
   - Forces TLS 1.2, prints the full exception chain, and gives a diagnosis hint.

## Verification performed

- `dotnet build ResQnet.slnx`: **0 Warning(s), 0 Error(s)**.
- File-lock reproduction from the screenshot (`MSB3026` / `MSB3027` / `MSB3021` held by `ResQnet.Api.exe`): stopped the API and stale MSBuild nodes, then rebuilt with **0 Warning(s), 0 Error(s)**.
- Reproduced `The SMTP server has unexpectedly disconnected.` through the API with a fresh idempotency key; confirmed this wording was missing from the retry detector and added it.
- `dotnet test ResQnet.Tests.csproj`: **17/17 passed**.
- Frontend `npm run build`: passed.
- API checks:
  - Simulated fallback: `isSuccess: true`, `deliveryMode: "Simulated"`.
  - Duplicate key: `isSuccess: true`, `wasDuplicateSuppressed: true`, `deliveryMode: "Duplicate"`.
  - Invalid recipient: `isSuccess: false`, `errorMessage: "Invalid email address: not-an-email"`, `deliveryMode: "Failed"`.
  - Unreachable SMTP: `isSuccess: false`, `errorMessage: "No connection could be made because the target machine actively refused it."`, `deliveryMode: "Failed"`.
- Web UI checks at `http://localhost:5173/communications`:
  - Simulated send displayed **Simulated Dispatch (No Email Sent)**, status **Simulated (no external delivery)**.
  - Invalid recipient displayed **Notification Dispatch Failed!**, status **Delivery Failed**, with the exact validation error.
  - No browser console errors.

## User action to enable real Gmail delivery

Run in PowerShell and keep the window open:

```powershell
& 'C:\Users\LENOVO\Desktop\123456\docs\start-with-external-services.ps1'
```

When prompted:

1. SMTP port: `587` is fine. If the STARTTLS session is reset, the API automatically retries on `465` (and vice versa). You may also type `465` directly.
2. Gmail address: the same mailbox that owns the App Password.
3. Gmail App Password: 16 characters, copied without spaces.
4. Recipient in the web UI should be a valid address; use a **new idempotency key** for each retry.

Success is confirmed by the API log line:

```text
[EMAIL SENT] SMTP delivery to <recipient> via smtp.gmail.com:465 (SslOnConnect) from <gmail-user>.
```

If it still fails, the web card will now show the exact inner error (for example `net_io_connectionclosed` or `SMTP 535 ...`), which identifies network blocking versus credentials.
