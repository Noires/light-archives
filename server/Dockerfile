FROM node:20-alpine
WORKDIR /usr/src/app

RUN apk add --update --no-cache \
  shadow \
  make \
  g++ \
  automake \
  autoconf \
  libtool \
  nasm \
  libjpeg-turbo-dev
RUN npm install jpegtran-bin
RUN npm install -g @nestjs/cli && rm -rf /root/npm/_cacache
COPY package.json yarn.lock ./

# Switch to unprivileged user
RUN groupmod -g 1000 node && usermod -u 1000 -g 1000 node && chown -R node.node /usr/src/app
USER node

# Build application
RUN yarn install --verbose && rm -rf /home/node/.cache/yarn /home/node/.npm

COPY . .

RUN nest build chaosarchives && nest build steward

CMD ["node", "dist/apps/chaosarchives/main.js"]
