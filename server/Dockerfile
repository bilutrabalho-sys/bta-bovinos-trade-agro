# ============================================================================
#  Dockerfile — imagem portável do backend BTA (Railway, Fly.io, Cloud Run...).
#  É uma ALTERNATIVA ao Render (o Render NÃO precisa de Docker; use render.yaml).
#
#  IMPORTANTE: construa a partir da RAIZ do repositório (não de dentro de
#  server/), porque a imagem precisa de server/ E de db/:
#
#      docker build -f server/Dockerfile -t bta-server .
#      docker run --rm -p 3001:3001 \
#        -e DATABASE_URL="postgres://usuario:senha@host/db?sslmode=require" \
#        bta-server
#
#  Por que db/ ? O runner de migrations (server/src/migrate.ts) lê os .sql em
#  db/ resolvendo o caminho como <arquivo>/../../db. Espelhamos a estrutura do
#  repo dentro da imagem (/app/server + /app/db) para que, se quiser aplicar as
#  migrations DENTRO do container, funcione:
#
#      docker run --rm \
#        -e DATABASE_URL="postgres://...?sslmode=require" \
#        bta-server npm run db:setup:demo
#
#  O servidor em si (npm start) NÃO precisa de db/ — só o runner de migrations.
#  Dica: para acelerar o build, um .dockerignore na RAIZ do repo com
#  "node_modules", "dist" e ".git" evita mandar arquivos grandes ao daemon
#  (o build já não os copia, mas o contexto fica mais leve).
# ============================================================================
FROM node:22-slim

# Diretório da app dentro da imagem, espelhando a raiz do repo.
WORKDIR /app

# 1) Só os manifests primeiro => melhor cache de camadas do Docker.
COPY server/package.json server/package-lock.json ./server/

# 2) Instala dependências de forma reprodutível, sem devDeps.
#    (tsx é dependency de RUNTIME, então sobrevive ao --omit=dev.)
WORKDIR /app/server
RUN npm ci --omit=dev

# 3) Código da API + tsconfig + pasta de migrations (sem node_modules do host).
WORKDIR /app
COPY server/src ./server/src
COPY server/tsconfig.json ./server/
COPY db ./db

ENV NODE_ENV=production
# Porta padrão da API; o host pode injetar outra via -e PORT=...
ENV PORT=3001
EXPOSE 3001

WORKDIR /app/server
CMD ["npm", "start"]
