# Build project
# Check for latest node and keep it up to date: https://hub.docker.com/_/node/
FROM node:20-alpine3.17 AS build
RUN set -x \
  # Change node uid/gid
  && apk --no-cache add shadow \
  && groupmod -g 1001 node \
  && usermod -u 1001 -g 1001 node
RUN set -x \
    # Add user
    && addgroup --gid 1000 app \
    && adduser --disabled-password \
        --gecos '' \
        --ingroup app \
        --home /app \
        --uid 1000 \
        app
COPY --chown=app:app . /app
USER app
WORKDIR /app
RUN set -x \
    # Build
    && PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm ci \
    && npm run build
# Main image
FROM node:20-alpine3.17
RUN set -x \
  # Change node uid/gid
  && apk --no-cache add shadow \
  && groupmod -g 1001 node \
  && usermod -u 1001 -g 1001 node
RUN set -x \
    # Add user
    && addgroup --gid 1000 app \
    && adduser --disabled-password \
        --gecos '' \
        --ingroup app \
        --home /app \
        --uid 1000 \
        app
USER app
WORKDIR /app
COPY --chown=app:app package*.json ./
COPY --chown=app:app app app
COPY --chown=app:app common common
COPY --chown=app:app public/locales public/locales
COPY --chown=app:app server server
COPY --chown=app:app --from=builder /app/dist dist
RUN npm ci --production && npm cache clean --force
RUN mkdir -p /app/.config/configstore
RUN ln -s dist/version.json version.json
ENV PORT=1234
EXPOSE ${PORT}
CMD ["node", "server/bin/prod.js"]
