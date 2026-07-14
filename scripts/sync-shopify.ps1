$project = Split-Path -Parent $PSScriptRoot
Set-Location $project

Clear-Host

Write-Host ""
Write-Host "====================================================="
Write-Host "Shopify Sync & Launch"
Write-Host "====================================================="
Write-Host ""

$url = Read-Host "Paste your Cloudflare URL"

if (-not ($url -match "^https://.*\.trycloudflare\.com$")) {
    Write-Host ""
    Write-Host "Invalid Cloudflare URL."
    exit
}

$file = "shopify.app.toml"

$content = Get-Content $file -Raw

$content = $content -replace 'application_url = ".*?"', "application_url = `"$url`""
$content = $content -replace 'redirect_urls = \[.*?\]', "redirect_urls = [ `"$url`" ]"

Set-Content $file $content

Write-Host ""
Write-Host "shopify.app.toml updated."
Write-Host ""
Write-Host "====================================================="
Write-Host "Deploying Shopify App..."
Write-Host "====================================================="
Write-Host ""

shopify app deploy

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Deployment failed."
    exit
}

Write-Host ""
Write-Host "====================================================="
Write-Host "Launching Shopify App..."
Write-Host "====================================================="
Write-Host ""

shopify app dev