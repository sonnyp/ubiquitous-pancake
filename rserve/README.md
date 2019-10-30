# rserve

rserve is a terminal application that starts an HTTP server and serves a directory via a [remoteStorage](https://remotestorage.io/) API.

It also implements OAuth, WebFinger and everything needed to use with any [remoteStorage app](https://wiki.remotestorage.io/Apps).

So far tested with:

- [Inspektor](https://inspektor.5apps.com/connect) / [repo](https://gitlab.com/skddc/inspektor)

## Install

```sh
git clone https://github.com/sonnyp/ubiquitous-pancake.git
cd ubiquitous-pancake/rserve
npm install
```

## Usage

There's in no authentication by default.

`rserve [--host] [--port=8181] [--url=http://localhost:$PORT] [path=$CWD]`

`port` and `host` are passed to [Node.js http server](https://nodejs.org/api/net.html#net_server_listen_port_host_backlog_callback).

`url` is the public facing URL, use this if you're being a proxy.

## Example

### Local

```sh
% ./rserve.js /home/sonny
Serving /home/sonny at http://localhost:8181/
```

### Local with tunnelling

```
% ssh -R 80:localhost:8181 serveo.net
```

Copy the URL and in an other terminal

```
./rserve.js --url $URL /home/sonny
```
