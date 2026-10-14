@echo off
cd /d "%~dp0"

echo ==^> Compilando...
call .\mvnw.cmd -q package -DskipTests
if errorlevel 1 exit /b %errorlevel%

echo ==^> Iniciando (profile local)...
for %%f in (target\*.jar) do (
    java -jar "%%f" --spring.profiles.active=local
    goto :eof
)
