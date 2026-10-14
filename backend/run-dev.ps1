$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "==> Compilando..." -ForegroundColor Cyan
& .\mvnw.cmd -q package -DskipTests

$jar = Get-ChildItem -Path "target\*.jar" | Select-Object -First 1
if (-not $jar) {
    Write-Error "Nenhum arquivo .jar encontrado em target/."
    exit 1
}

Write-Host "==> Iniciando (profile local)..." -ForegroundColor Green
& java -jar $jar.FullName --spring.profiles.active=local
