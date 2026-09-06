# pedidos360-frontend

Frontend de Pedidos360 en **React + Vite**, con login via **MSAL** (Azure AD,
multi-tenant + cuentas personales de Microsoft, flujo Authorization Code con
PKCE).

## Flujo de la app

1. **Catálogo público** (`/`): cualquiera puede verlo, sin loguearse — usa
   la ruta `/publico/productos` del API Gateway, que no exige token.
2. **Agregar al carrito**: al hacer clic, si no hay sesión, se dispara el
   login (popup de Microsoft) automáticamente. Una vez logueado, el item se
   agrega normalmente.
3. **`/carrito`** y **`/pedidos`**: páginas protegidas — si entras sin sesión,
   se dispara el login antes de mostrar el contenido.

## Stack

- React 18 + Vite
- React Router (navegación)
- `@azure/msal-browser` + `@azure/msal-react` (autenticación)
- Axios (llamadas HTTP)
- Nginx (para servir el build en producción/Docker)

## Variables de entorno

Copia `.env.example` a `.env` y completa:

| Variable | Descripción |
|---|---|
| `VITE_AZURE_FRONTEND_CLIENT_ID` | Client ID de `Pedidos360-Frontend` |
| `VITE_AZURE_API_CLIENT_ID` | Client ID de `Pedidos360-API` |
| `VITE_API_BASE_URL` | URL del API Gateway (invoke URL) |

> ⚠️ **Importante:** Vite incorpora las variables `VITE_*` al bundle en
> **tiempo de build**, no en tiempo de ejecución. Si cambias el `.env`
> después de compilar, necesitas volver a correr `npm run build` (o
> reconstruir la imagen Docker) para que el cambio tenga efecto — a
> diferencia de los microservicios backend, donde las variables de entorno
> se leen al arrancar el contenedor.

### Sobre qué API Gateway usar

Si usas `pedidos360-api-produccion` (solo rutas públicas + `{proxy+}`),
`GET /api/carrito` y `GET /api/pedidos` **exactos** (sin nada después) no
resuelven ahí, porque `{proxy+}` exige al menos un segmento adicional en la
URL. Usa `pedidos360-api-desarrollo` (que tiene el set completo de rutas)
mientras no se agreguen también las rutas "exactas" al ambiente de
producción.

## Ejecución local (sin Docker)

```bash
npm install
npm run dev
```

Abre `http://localhost:4200`.

## Build y ejecución con Docker

```bash
docker build \
  --build-arg VITE_AZURE_FRONTEND_CLIENT_ID=f9b0d953-5e2c-4df9-8407-aa76b7a1d74f \
  --build-arg VITE_AZURE_API_CLIENT_ID=11ca102e-9f51-438c-94d6-5c0bf54920b7 \
  --build-arg VITE_API_BASE_URL=https://uddk9wm4r7.execute-api.us-east-1.amazonaws.com \
  -t pedidos360/frontend .

docker run -d --restart unless-stopped --name frontend -p 80:80 pedidos360/frontend
```

## Configuración pendiente en Azure

En el App Registration `Pedidos360-Frontend`, agrega la Redirect URI real de
donde termine viviendo el frontend (además de `http://localhost:4200` para
desarrollo), como **Single-page application (SPA)**:

```
http://<IP-PUBLICA-DE-pedidos360-frontend>
```

Sin este paso, el login va a fallar con el mismo error de `redirect_uri`
que vimos antes con Postman.

## Notas de arquitectura

- El carrito y los pedidos viven 100% en el backend — este frontend no
  guarda ningún estado de carrito en `localStorage` ni similar, siempre
  consulta a `carrito-ms`/`pedidos-ms` directamente.
- `useAccessToken` centraliza la lógica de "intenta renovar el token en
  silencio, si no se puede, pide login" — todas las páginas protegidas lo
  usan igual, sin duplicar esa lógica.
- El checkout no borra el carrito automáticamente en el backend (no hay un
  endpoint para eso), así que el frontend borra cada item manualmente
  después de crear el pedido.
