# start-server.ps1 — intenta iniciar un servidor HTTP simple (Windows PowerShell)
param(
    [int]$Port = 8000
)

function Start-PythonServer {
    if (Get-Command python -ErrorAction SilentlyContinue) {
        python -m http.server $Port
        return $true
    }
    if (Get-Command py -ErrorAction SilentlyContinue) {
        py -m http.server $Port
        return $true
    }
    return $false
}

function Start-NodeServer {
    if (Get-Command npx -ErrorAction SilentlyContinue) {
        npx http-server -p $Port
        return $true
    }
    return $false
}

Push-Location -Path (Split-Path -Path $MyInvocation.MyCommand.Path -Parent)

if (Start-PythonServer) { Pop-Location; exit 0 }
if (Start-NodeServer) { Pop-Location; exit 0 }

Write-Error "No se encontró Python ni npx. Instala Python o Node.js o usa Live Server en VS Code."
Pop-Location
exit 1
