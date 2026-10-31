FROM node:22-alpine AS base

WORKDIR /app

COPY package*.json ./

RUN npm ci

# Local development target used by docker-compose.yml.
FROM base AS development

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]

# Compile the application and generate Prisma Client for production.
FROM base AS build

COPY . .

RUN npx prisma generate

RUN npm run build

# Production image used by Render.
FROM node:22-alpine AS production

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma7.config.ts ./prisma7.config.ts

EXPOSE 3000

USER node

CMD ["npm", "start"]
