ARG node_version=17-alpine

FROM node:${node_version}

RUN mkdir -p /app/frontend/.next /app/frontend/node_modules
WORKDIR /app/frontend

VOLUME /app/frontend/.next
VOLUME /app/frontend/node_modules
VOLUME /app/

ENV NODE_ENV=development

COPY frontend/package*.json ./

RUN npm ci

COPY frontend/prisma ./prisma
RUN npx prisma generate

RUN chown node:node -R .next node_modules

USER node

ARG port=80
ENV PORT=${port}
EXPOSE ${port}

CMD [ "npm", "run", "dev" ]
