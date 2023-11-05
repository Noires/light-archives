# The jpegtran-bin dependency tries to build from source (and fails) under node:lts-alpine,
# so we use node:lts-slim instead.
FROM node:18-slim
WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y libjpeg-turbo-progs
RUN mkdir -p /usr/local/lib/node_modules/jpegtran-bin/vendor/jpegtran
RUN ln -sf /usr/bin/jpegtran /usr/local/lib/node_modules/jpegtran-bin/vendor/jpegtran
RUN npm install -g @nestjs/cli && rm -rf /root/npm/_cacache

# Switch to unprivileged user
RUN groupmod -g 1000 node && usermod -u 1000 -g 1000 node && chown -R node.node /usr/src/app
USER node

# Build application

COPY package.json yarn.lock ./
RUN yarn install && rm -rf /home/node/.cache/yarn /home/node/.npm

COPY . .

RUN nest build chaosarchives && nest build steward

CMD ["node", "dist/apps/chaosarchives/main.js"]
