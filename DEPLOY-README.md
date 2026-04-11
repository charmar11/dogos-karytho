# Dogos Karytho - Despliegue

## Archivos

- `deploy.bat` - Script principal para subir cambios a GitHub
- `setup-git.bat` - Configurar el repositorio remoto (solo ejecutar una vez)

## Cómo usar

### 1. Primera vez: Configurar GitHub

1. Haz doble clic en `setup-git.bat`
2. Ingresa la URL de tu repositorio GitHub
3. Presiona Enter

### 2. Subir cambios

1. Haz doble clic en `deploy.bat`
2. Se mostrarán los cambios detectados
3. Se hará commit y push automáticamente
4. Verás "DESPLIEGUE EXITOSO!" al terminar

## Notas

- El mensaje de commit se genera automáticamente con la fecha/hora
- Si no hay cambios, te lo indicará
- Si hay errores de conexión, te lo notificará

## Solución de problemas

### "ERROR: No hay repositorio remoto configurado"
Ejecuta `setup-git.bat` y configura la URL de tu repositorio

### "ERROR: No se pudo subir a GitHub"
1. Verifica tu conexión a internet
2. Verifica que tienes permisos de push al repositorio
3. Puede que necesites autenticarte con GitHub

### Para autenticarte en GitHub:
```bash
git config --global credential.helper store
git push origin main
# Te pedirá usuario y token (no contraseña)
```
