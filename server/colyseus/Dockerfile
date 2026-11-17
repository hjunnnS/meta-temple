FROM node:24-bookworm-slim
WORKDIR /srv/sasa
COPY package*.json ./
RUN npm ci --omit=dev
COPY bootstrap.mjs nanoid.mjs contract.mjs temple-room.mjs community.mjs server.mjs ./
ENV NODE_ENV=production HOST=0.0.0.0 PORT=2567
USER node
EXPOSE 2567
CMD ["node","bootstrap.mjs"]
