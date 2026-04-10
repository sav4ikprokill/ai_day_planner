FROM node:20-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/contracts/package.json packages/contracts/package.json
COPY services/bot-js/package.json services/bot-js/package.json

RUN pnpm install --filter @ai-planner/bot-js... --frozen-lockfile

COPY packages/contracts ./packages/contracts
COPY services/bot-js ./services/bot-js

WORKDIR /app/services/bot-js

CMD ["pnpm", "dev"]
