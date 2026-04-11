@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

title Dogos Karytho - Deploy

echo ============================================
echo    DOGOS KARYTHO - Desplegando cambios
echo ============================================
echo.

cd /d "%~dp0"

REM Verificar si hay cambios
git status --porcelain >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: No es un repositorio Git
    echo Ejecuta este script desde la carpeta del proyecto
    pause
    exit /b 1
)

REM Verificar remote
git remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: No hay repositorio remoto configurado
    echo Ejecuta: git remote add origin [URL_DEL_REPO]
    pause
    exit /b 1
)

REM Guardar cambios en archivo temporal
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

REM Generar mensaje de commit con fecha/hora
for /f "tokens=1-4 delims=/ " %%a in ('date /t') do set DATE=%%c-%%a-%%b
for /f "tokens=1-2 delims=: " %%a in ('time /t') do set TIME=%%a:%%b
set TIMESTAMP=%DATE% %TIME%

REM Analizar cambios específicos
set MSG_PREFIJO=Actualizacion"

git diff --name-only --diff-filter=M > "%TEMP%\dk_mod.txt"
git diff --name-only --diff-filter=A > "%TEMP%\dk_add.txt"

REM Buscar index.html en cambios
findstr /i "index.html" "%TEMP%\dk_mod.txt" >nul 2>&1
if !errorlevel!==0 goto SKIP_HTML
findstr /i "index.html" "%TEMP%\dk_add.txt" >nul 2>&1
:SKIP_HTML

REM Contar archivos
set /p MOD_FILES=<"%TEMP%\dk_mod.txt"
set /p ADD_FILES=<"%TEMP%\dk_add.txt"

del "%TEMP%\dk_mod.txt" >nul 2>&1
del "%TEMP%\dk_add.txt" >nul 2>&1

REM Generar mensaje
set COMMIT_MSG=Actualizacion - %TIMESTAMP%

REM Agregar archivos
echo Agregando archivos...
git add -A

REM Commit
echo.
echo Haciendo commit...
git commit -m "%COMMIT_MSG%"

if %errorlevel% neq 0 (
    echo.
    echo ERROR: No se pudo hacer el commit
    pause
    exit /b 1
)

REM Push
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
