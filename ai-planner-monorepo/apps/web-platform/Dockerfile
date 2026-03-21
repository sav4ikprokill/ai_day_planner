FROM node:20-alpine

WORKDIR /workspace

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web-platform/package.json ./apps/web-platform/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY packages/db-ts/package.json ./packages/db-ts/package.json
COPY services/bot-js/package.json ./services/bot-js/package.json

RUN pnpm install --frozen-lockfile

COPY . .

WORKDIR /workspace/apps/web-platform

EXPOSE 5173

CMD ["sh", "-c", "pnpm dev --host 0.0.0.0 --port 5173"]
