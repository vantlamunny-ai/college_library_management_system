# Resets the local MySQL80 root password (Windows).
#
# Why this exists: the root password for the local MySQL80 service isn't
# known/recoverable, and this app can't connect without it. This is MySQL's
# own documented recovery procedure for a forgotten local password -
# it stops the service, starts mysqld standalone (using the SAME config
# file the service itself uses, so it touches the real data directory)
# with an init file that resets the password, waits for it to actually
# apply, shuts it down cleanly, then restarts the service normally.
#
# Everything this script does is logged to reset-log.txt next to this
# script, regardless of success or failure - read that file to see
# exactly what happened.
#
# HOW TO RUN: open PowerShell "as Administrator" and run:
#   powershell -ExecutionPolicy Bypass -File "db\reset-mysql-root-password.ps1" -NewPassword "your-new-password"
# It must run elevated because it stops/starts a Windows service. It only
# touches the local MySQL80 install on this machine.

param(
    [Parameter(Mandatory = $true)]
    [string]$NewPassword
)

$MysqldPath = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe"
$MysqlAdminPath = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqladmin.exe"
$DefaultsFile = "C:\ProgramData\MySQL\MySQL Server 8.0\my.ini"
$ServiceName = "MySQL80"
$InitFile = "$env:TEMP\mysql-root-reset.sql"
$StdOutLog = "$env:TEMP\mysql-root-reset-stdout.log"
$StdErrLog = "$env:TEMP\mysql-root-reset-stderr.log"
$TranscriptLog = Join-Path $PSScriptRoot "reset-log.txt"

Start-Transcript -Path $TranscriptLog -Force

$serviceWasStopped = $false
$succeeded = $false

try {
    $currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        Write-Host "This script must be run as Administrator." -ForegroundColor Red
        return
    }

    foreach ($p in @($MysqldPath, $MysqlAdminPath, $DefaultsFile)) {
        if (-not (Test-Path $p)) {
            Write-Host "Expected path not found: $p" -ForegroundColor Red
            return
        }
    }

    Write-Host "1/6 Stopping $ServiceName..."
    Stop-Service -Name $ServiceName -Force -ErrorAction Stop
    $serviceWasStopped = $true
    Start-Sleep -Seconds 2

    Write-Host "2/6 Writing temporary password-reset init file..."
    "ALTER USER 'root'@'localhost' IDENTIFIED BY '$NewPassword';" | Set-Content -Path $InitFile -Encoding ascii
    Remove-Item -Path $StdOutLog, $StdErrLog -Force -ErrorAction SilentlyContinue

    Write-Host "3/6 Starting mysqld standalone with the real config file and the init file..."
    $proc = Start-Process -FilePath $MysqldPath `
        -ArgumentList "--defaults-file=`"$DefaultsFile`"", "--init-file=`"$InitFile`"", "--console" `
        -RedirectStandardOutput $StdOutLog -RedirectStandardError $StdErrLog `
        -PassThru -WindowStyle Hidden -ErrorAction Stop

    Write-Host "4/6 Waiting for it to come up and confirming the new password works..."
    $ready = $false
    for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep -Seconds 1
        if ($proc.HasExited) {
            Write-Host "mysqld exited early (exit code $($proc.ExitCode))." -ForegroundColor Red
            break
        }
        & $MysqlAdminPath -u root "--password=$NewPassword" ping *> $null
        if ($LASTEXITCODE -eq 0) { $ready = $true; break }
    }

    Write-Host "--- mysqld stdout ---"
    Get-Content $StdOutLog -ErrorAction SilentlyContinue | Select-Object -Last 60
    Write-Host "--- mysqld stderr ---"
    Get-Content $StdErrLog -ErrorAction SilentlyContinue | Select-Object -Last 60

    if (-not $ready) {
        Write-Host "Could not confirm the new password applied." -ForegroundColor Red
        if (-not $proc.HasExited) { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue }
        return
    }

    Write-Host "5/6 Password confirmed - shutting mysqld back down cleanly..."
    & $MysqlAdminPath -u root "--password=$NewPassword" shutdown *> $null
    $proc.WaitForExit(15000) | Out-Null
    if (-not $proc.HasExited) { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue }
    Remove-Item -Path $InitFile -Force -ErrorAction SilentlyContinue

    $succeeded = $true
}
catch {
    Write-Host "UNEXPECTED ERROR: $($_ | Out-String)" -ForegroundColor Red
}
finally {
    if ($serviceWasStopped) {
        Write-Host "6/6 Starting $ServiceName normally again..."
        try {
            Start-Service -Name $ServiceName -ErrorAction Stop
            Start-Sleep -Seconds 3
            Write-Host "$ServiceName is running." -ForegroundColor Green
        } catch {
            Write-Host "Failed to restart $ServiceName : $($_ | Out-String)" -ForegroundColor Red
        }
    }

    if ($succeeded) {
        Write-Host ""
        Write-Host "Done. New root password: $NewPassword" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "Reset did not complete. See the output above (and $TranscriptLog) for details." -ForegroundColor Red
    }

    Stop-Transcript
}
