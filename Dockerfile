# --- Etapa 1: build ---
FROM node:22-alpine AS build
WORKDIR /app

# Vite incorpora las variables VITE_* al bundle en tiempo de BUILD, no de
# ejecucion. Por eso se pasan como build-args (ver README para el comando
# docker build completo), no como -e en docker run.
ARG VITE_AZURE_FRONTEND_CLIENT_ID
ARG VITE_AZURE_API_CLIENT_ID
ARG VITE_API_BASE_URL
ENV VITE_AZURE_FRONTEND_CLIENT_ID=$VITE_AZURE_FRONTEND_CLIENT_ID
ENV VITE_AZURE_API_CLIENT_ID=$VITE_AZURE_API_CLIENT_ID
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# --- Etapa 2: runtime (Nginx sirviendo los archivos estaticos) ---
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
