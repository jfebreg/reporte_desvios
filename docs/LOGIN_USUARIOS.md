# Login por usuario

La web usa una pantalla de acceso con usuario y PIN para reemplazar el selector libre de cuentas.

## Uso inicial

- Todos los usuarios existentes reciben PIN inicial `1234`.
- El administrador puede cambiar el PIN desde `Personas`.
- El PIN tambien puede cargarse masivamente con CSV.

Formato recomendado:

```txt
nombre,correo,area,rol,pin
Mauricio Munoz,mauricio@empresa.cl,Produccion,usuario,4521
Carolina Rivas,carolina@empresa.cl,Prevencion,admin,9001
```

## Recomendaciones

- Cambiar los PIN iniciales antes de operar con terceros.
- Usar PIN distintos por persona.
- Eliminar personas que ya no participen o dejarlas sin rol admin.

## Siguiente mejora

Para una version corporativa completa, reemplazar este PIN por Google Workspace o Microsoft Entra ID.
