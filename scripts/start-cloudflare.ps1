Write-Host ""
Write-Host "==========================================="
Write-Host "☁ ShroomHarvest Cloudflare Tunnel"
Write-Host "==========================================="
Write-Host ""
Write-Host "Starting Cloudflare..."
Write-Host ""

$cloudflared = "C:\Users\kimberly\AppData\Roaming\npm\node_modules\@shopify\cli\bin\cloudflared.exe"

& $cloudflared tunnel `
    --url http://localhost:5173 `
    --protocol http2 `
    --loglevel debug