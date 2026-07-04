# Publicar la Web

Esta version es una aplicacion estatica. Se puede publicar hoy sin build: solo hay que subir la carpeta completa `seguridad-obra-web`.

## Opcion recomendada: GitHub Pages

1. Crea un repositorio nuevo en GitHub, por ejemplo `seguridad-obra-web`.
2. Sube todos los archivos de esta carpeta a la rama `main`.
3. En GitHub entra a `Settings > Pages`.
4. En `Build and deployment`, selecciona:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
5. Guarda la configuracion.
6. GitHub entregara una URL publica del tipo `https://usuario.github.io/seguridad-obra-web/`.

## Alternativa rapida: Netlify Drop

1. Entra a `https://app.netlify.com/drop`.
2. Arrastra la carpeta `seguridad-obra-web` completa.
3. Netlify genera una URL publica.
4. Comparte esa URL con los usuarios.

## Opcion Vercel

1. Crea un nuevo proyecto.
2. Sube o conecta esta carpeta.
3. Framework: `Other`.
4. Build command: dejar vacio.
5. Output directory: `.`.

## Importante para esta version

- Los datos se guardan en el navegador de cada usuario.
- Para uso multiusuario real se debe conectar una base de datos y autenticacion.
- El correo, Drive y Sheets estan simulados o preparados para integracion.
- Para publicar hoy como demo compartible, Netlify Drop es el camino mas rapido.
