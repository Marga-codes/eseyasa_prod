param(
    [string]$ZipPath = "assets.zip",
    [string]$OutDir = "assets"
)

if (-not (Test-Path $ZipPath)) {
    Write-Error "Zip file not found: $ZipPath"
    exit 1
}

if (-not (Test-Path $OutDir)) {
    New-Item -ItemType Directory -Path $OutDir | Out-Null
}

try {
    Expand-Archive -LiteralPath $ZipPath -DestinationPath $OutDir -Force
    Write-Output "Extracted $ZipPath to $OutDir"
} catch {
    Write-Error "Failed to extract: $_"
    exit 1
}
