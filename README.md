# Light Archives

The prototype of the RP portal for the Light EU datacenter in FFXIV based on [chaos-archives](https://github.com/great-gubal-library/chaos-archives) from the great Maia-Everett. Thanks again!

## Building

### Client

```
cd client
quasar build
```

### Server

```
cd server
yarn docker:build
```

## Deploying

Currently the frontend and the API are served from the same HTTP host.

### Client

Just copy `dist/spa` to your web root or set up your web server to serve it directly.

### Server

```
cd server
docker-compose up -d
```

Set up your web server to proxy the `/api` directory to the API server (runs HTTP on port 8111 by default). Also, for RPP character update subscriptions to work, the `/socket.io` directory needs to be proxied to the same server as a WebSocket endpoint (see [Socket.io documentation](https://socket.io/docs/v4/reverse-proxy/) for details).
