FROM node:20-alpine
WORKDIR /usr/src/app
ARG SENTRY_RELEASE=dev
ENV SENTRY_RELEASE=$SENTRY_RELEASE

RUN apk add --update --no-cache \
  shadow \
  python3 \
  make \
  g++ \
  automake \
  autoconf \
  libtool \
  nasm \
  libjpeg-turbo-dev
ENV PYTHON=/usr/bin/python3
ENV npm_config_python=/usr/bin/python3
RUN npm install jpegtran-bin
RUN npm install -g @nestjs/cli && rm -rf /root/npm/_cacache
COPY package.json yarn.lock ./

# Switch to unprivileged user
RUN groupmod -g 1000 node && usermod -u 1000 -g 1000 node && chown -R node:node /usr/src/app
USER node

# Build application
RUN yarn install --verbose && rm -rf /home/node/.cache/yarn /home/node/.npm

COPY . .

RUN nest build chaosarchives && nest build steward

CMD ["node", "dist/apps/chaosarchives/main.js"]
