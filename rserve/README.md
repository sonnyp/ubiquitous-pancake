# rserve

rserve is an application that starts an HTTP server and serves a directory via the [remoteStorage](https://remotestorage.io/) API.

It also implements OAuth, WebFinger and everything needed to use with any [remoteStorage app](https://wiki.remotestorage.io/Apps).

- [Install](#install)
- [Usage](#usage)
- [Options](#options)
  - [path](#path)
  - [host](#host)
  - [port](#port)
  - [url](#url)
  - [mode](#mode)
- [Examples](#examples)
  - [LAN](#lan)

## Install

```sh
git clone https://github.com/sonnyp/ubiquitous-pancake.git
cd ubiquitous-pancake/rserve
npm install
```

## Usage

```
% ./rserve.js ~
rserve@localhost:8181
```

Launch your remoteStorage app locally and connect to `rserve@localhost:8181`.
Since there's no authentication by default you can also directly access the remoteStorage API.

```sh
% curl -i localhost:8181/storage/
```

## Options

<pre>
  rserve
    [--mode=rw]
    [--host=localhost]
    [--username=rserve]
    [--port=0]
    [--url=http://localhost:$PORT]
    [path=$CWD]
</pre>

### path

The directory to serve, defaults to [\$CWD](https://en.wikipedia.org/wiki/Working_directory).

### host

The address to accept connections from, defaults to `localhost`.

see [server.listen](https://nodejs.org/api/net.html#net_server_listen_port_host_backlog_callback)

### port

The port to bind, defaults to `0` (random).

see [server.listen](https://nodejs.org/api/net.html#net_server_listen_port_host_backlog_callback)

### url

The public base URL, defaults to `http://localhost:$PORT`.

Set this if you wish to use rserve behind a reverse proxy or from a remote computer.

Examples

`% rserve --url=https://example.net/ ~`

### mode

Use `--mode=ro` for read-only mode.

Options

- `rw` read-write, normal remoteStorage access (default)
- `ro` read-only, prevents deleting, replacing or creating files

## Examples

### LAN

If you ip address is 192.168.0.12

`% rserve --host=192.168.1.12 --port=3000`
`rserve@192.168.1.12:3000`

<!-- ### Local -->

<!-- ### Local with tunnelling

You can use a remoteStorage

```sh
% ssh -R 80:localhost:8181 serveo.net
```

Copy the URL and in an other terminal

```
./rserve.js --url $URL /home/sonny
```
