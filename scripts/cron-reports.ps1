# Cron Reports PowerShell Script
# Usage: .\scripts\cron-reports.ps1
# 
# This script simulates a cron job by calling the reports endpoint every minute

param(
    [string]$BaseUrl = "http://localhost:3000",
    [int]$IntervalSeconds = 60,
    [switch]$Force = $false
)

Write-Host "🚀 Starting Cron Reports Simulator..." -ForegroundColor Green
Write-Host "📍 Base URL: $BaseUrl" -ForegroundColor Cyan
Write-Host "⏰ Interval: $IntervalSeconds seconds" -ForegroundColor Cyan
Write-Host "🔥 Force mode: $Force" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

$counter = 0

while ($true) {
    $counter++
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    try {
        Write-Host "[$timestamp] 🔄 Attempt #$counter - Calling cron endpoint..." -ForegroundColor White
        
        if ($Force) {
            # Manual trigger with force
            $body = @{ force = $true } | ConvertTo-Json
            $response = Invoke-RestMethod -Uri "$BaseUrl/api/cron/reports" -Method POST -Body $body -ContentType "application/json"
        } else {
            # Normal GET request
            $response = Invoke-RestMethod -Uri "$BaseUrl/api/cron/reports" -Method GET
        }
        
        if ($response.success) {
            Write-Host "[$timestamp] ✅ $($response.message)" -ForegroundColor Green
            
            if ($response.sentAt) {
                Write-Host "[$timestamp] 📤 Report sent at: $($response.sentAt)" -ForegroundColor Cyan
            }
            
            if ($response.nextReportIn) {
                $nextReportMinutes = [math]::Round($response.nextReportIn / 1000 / 60, 1)
                Write-Host "[$timestamp] ⏰ Next report in: $nextReportMinutes minutes" -ForegroundColor Yellow
            }
        } else {
            Write-Host "[$timestamp] ❌ Failed: $($response.message)" -ForegroundColor Red
        }
        
    } catch {
        $errorMessage = $_.Exception.Message
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode
            Write-Host "[$timestamp] ❌ HTTP $statusCode - $errorMessage" -ForegroundColor Red
        } else {
            Write-Host "[$timestamp] ❌ Connection error: $errorMessage" -ForegroundColor Red
        }
    }
    
    Write-Host "[$timestamp] 💤 Sleeping for $IntervalSeconds seconds..." -ForegroundColor Gray
    Write-Host ""
    
    Start-Sleep -Seconds $IntervalSeconds
}
