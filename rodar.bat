@echo off
rem Rota 404 - sobe o backend (Flask) e o frontend (Next.js) e abre o navegador.
rem   rodar.bat         desenvolvimento (npm run dev)
rem   rodar.bat feira   producao: npm run build + npm start (use na feira; o build precisa de internet)
rem Para parar: feche as janelas "Rota 404 - backend" e "Rota 404 - frontend".
setlocal
chcp 65001 >nul
cd /d "%~dp0"

set "MODE=%~1"
if "%MODE%"=="" set "MODE=dev"

rem ---------- backend ----------
if exist "backend\.venv\Scripts\python.exe" goto :venv_ok
echo [Rota 404] Criando o ambiente Python do backend (backend\.venv)...
where py >nul 2>nul
if errorlevel 1 (
  python -m venv "backend\.venv"
) else (
  py -3 -m venv "backend\.venv"
)
if not exist "backend\.venv\Scripts\python.exe" goto :erro_python
:venv_ok

echo [Rota 404] Conferindo as dependencias do backend...
"backend\.venv\Scripts\python.exe" -m pip install -q --disable-pip-version-check -r "backend\requirements.txt"
if errorlevel 1 goto :erro_pip

if not exist "backend\.env" (
  echo [Rota 404] backend\.env nao existe: copiando de .env.example ^(sem Supabase, a API usa os dados locais^).
  copy "backend\.env.example" "backend\.env" >nul
)

rem ---------- frontend ----------
where npm >nul 2>nul
if errorlevel 1 goto :erro_node

if exist "frontend\node_modules" goto :modules_ok
echo [Rota 404] Instalando as dependencias do frontend (npm install)...
pushd frontend
call npm install --no-audit --no-fund
set "NPM_ERR=%errorlevel%"
popd
if not "%NPM_ERR%"=="0" goto :erro_npm
:modules_ok

if /i not "%MODE%"=="feira" goto :build_ok
echo [Rota 404] Gerando o build de producao (npm run build)...
pushd frontend
call npm run build
set "BUILD_ERR=%errorlevel%"
popd
if not "%BUILD_ERR%"=="0" goto :erro_build
:build_ok

rem ---------- sobe os dois servidores em janelas proprias ----------
start "Rota 404 - backend" /d "%~dp0backend" cmd /k ".venv\Scripts\python.exe run.py"
if /i "%MODE%"=="feira" (
  start "Rota 404 - frontend" /d "%~dp0frontend" cmd /k "npm start"
) else (
  start "Rota 404 - frontend" /d "%~dp0frontend" cmd /k "npm run dev"
)

echo [Rota 404] Esperando o site responder em http://localhost:9000 ...
powershell -NoProfile -Command "$t=[DateTime]::Now.AddSeconds(90); while([DateTime]::Now -lt $t){ try { Invoke-WebRequest -UseBasicParsing http://localhost:9000 -TimeoutSec 5 | Out-Null; exit 0 } catch { Start-Sleep -Seconds 2 } }; exit 1"
if errorlevel 1 echo [Rota 404] O site ainda nao respondeu; confira a janela "Rota 404 - frontend".
start "" http://localhost:9000
echo [Rota 404] Pronto. Para parar, feche as janelas do backend e do frontend.
goto :fim

:erro_python
echo [Rota 404] ERRO: Python nao encontrado. Instale o Python 3.12 ou superior (python.org) e rode de novo.
goto :pausa
:erro_pip
echo [Rota 404] ERRO: falha ao instalar as dependencias do backend (pip). Confira a internet e rode de novo.
goto :pausa
:erro_node
echo [Rota 404] ERRO: Node.js/npm nao encontrado. Instale o Node.js 20.9 ou superior (nodejs.org) e rode de novo.
goto :pausa
:erro_npm
echo [Rota 404] ERRO: falha no npm install. Confira a internet e rode de novo.
goto :pausa
:erro_build
echo [Rota 404] ERRO: o build de producao falhou (ele precisa de internet para baixar as fontes).
goto :pausa

:pausa
pause
:fim
endlocal
