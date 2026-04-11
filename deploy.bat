@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

title Dogos Karytho - Deploy

echo ============================================
echo    DOGOS KARYTHO - Desplegando cambios
echo ============================================
echo.

cd /d "%~dp0"

git status --porcelain >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: No es un repositorio Git
    echo Ejecuta este script desde la carpeta del proyecto
    pause
    exit /b 1
)

git remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: No hay repositorio remoto configurado
    echo Ejecuta setup-git.bat primero
    pause
    exit /b 1
)

git status --porcelain > "%TEMP%\dk_changes.txt"
set CHANGES=
set /p CHANGES=<"%TEMP%\dk_changes.txt"
del "%TEMP%\dk_changes.txt" >nul 2>&1

if "%CHANGES%"=="" (
    echo No hay cambios para subir.
    echo.
    pause
    exit /b 0
)

echo Cambios detectados:
git status --short
echo.

for /f "tokens=1-4 delims=/ " %%a in ('date /t') do set DATE=%%c-%%a-%%b
for /f "tokens=1-2 delims=: " %%a in ('time /t') do set TIME=%%a:%%b
set TIMESTAMP=%DATE% %TIME%

set COMMIT_MSG=Actualizacion - %TIMESTAMP%

echo Agregando archivos...
git add -A

echo.
echo Haciendo commit...
git commit -m "%COMMIT_MSG%"

if %errorlevel% neq 0 (
    echo.
    echo ERROR: No se pudo hacer el commit
    pause
    exit /b 1
)

echo.
echo Subiendo a GitHub...
git push

if %errorlevel% neq 0 (
    echo.
    echo ERROR: No se pudo subir a GitHub
    echo Verifica tu conexion y credenciales
    pause
    exit /b 1
)

echo.
echo ============================================
echo    DESPLIEGUE EXITOSO!
echo ============================================
echo.
pause
