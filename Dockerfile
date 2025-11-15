##
# Send
#
# License https://gitlab.com/timvisee/send/blob/master/LICENSE
##

# Build project
FROM node:20-alpine AS builder

# Define non-root user
USER node

# Set working directory
WORKDIR /app
COPY --chown=node:node . .

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Clean install and build
RUN npm ci --omit=optional && npm run build

# Main image
FROM node:20-alpine AS runtime

USER node
WORKDIR /app

COPY --chown=node:node package*.json ./
COPY --chown=node:node app app
COPY --chown=node:node common common
COPY --chown=node:node public/locales public/locales
COPY --chown=node:node server server
COPY --chown=node:node --from=builder /app/dist dist

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Required configuration for some Node.js libraries
RUN mkdir -p ~/.config/configstore

# Create a symlink to the version file
RUN ln -s dist/version.json version.json

ENV PORT=1443

EXPOSE ${PORT}

CMD ["node", "server/bin/prod.js"]
