# Logux Sync

Tool to synchronize events between [Logux logs]. It could synchronize logs
on different machines through network, or on same machine.

Also it does authentication, events filtering, time fixing,
connection diagnostics.

Synchronization protocol specification: [`protocol.md`].

```js
import { Client } from 'logux-sync'
const sync = new Client('user:' + user.id + uniq, log1, connection, {
  credentials: user.token,
  outFilter: event => event.sync,
  timeout: 5000,
  fixTime: true,
  ping: 10000
})
```

```js
import { Server } from 'logux-sync'
const sync = new Server('server', log2, connection, {
  outFilter: event => access(event),
  timeout: 5000,
  auth: token => checkToken(token)
})
```

[`protocol.md`]: ./protocol.md
[Logux logs]:    https://github.com/logux/logux-core

<a href="https://evilmartians.com/?utm_source=logux-sync">
  <img src="https://evilmartians.com/badges/sponsored-by-evil-martians.svg"
       alt="Sponsored by Evil Martians" width="236" height="54">
</a>

## Connection

Logux protocol could work through any encoding (JSON, MessagePack or XML)
and any channel (WebSockets Secure or AJAX with HTTP “keep-alive”).

You could create a special connection classes for different channels
and encoding and use them with Logux Sync.

```js
import KeepWSConnection from 'logux-ws-browser/keep-ws-connection'
const connection = new KeepWSConnection(serverUrl)
const sync = new Client(host, log, connection, opts)
connection.connect()
```

Connection instance should provide `connect()` and `disconnect()`
methods and `connect`, `disconnect` and `message` events in [NanoEvents] API.

[NanoEvents]: https://github.com/ai/nanoevents

### Client and Server

The only difference between `Client` and `Server` is that client will
send `connect`, when connection will be started. Server will destroy itself,
when connection will be closed.

Messages are same for client and server. If you want a different behaviour,
you can take `BaseSync` class and make your own roles
(for example, for multi-master synchronization).

### Host Name

Logux Sync uses host names only for error messages. But host names are also
used in [default timer]. So host name uniqueness are very important
for correct timing and log synchronization.

Be sure, that you use unique host names. For example, your back-end
application could use counter to generate short and unique host name.
You could put this name in `<meta>` tag to use it in client JS.

If you can’t generate short unique host names, [UUID] will be best way.

Current host name will be saved to `host` property. Other host name
will be saved to `otherHost`.

```js
console.log('Start synchronization with ' + client.otherHost)
```

[default timer]: https://github.com/logux/logux-core#created-time
[UUID]:          https://github.com/broofa/node-uuid

### Authentication

Authentication is built-in into Logux protocol. Both client and server
could have credentials data (in most use cases only client will have it).
And both could have a `auth` callback to authenticate this credentials data.

```js
new Client(host, log, connection, {
  …
  credentials: user.token
})
```

Credentials could be a string, number, object or array.

Authentication callback should return a promise with `true` or `false`.
All message from this node will wait until authentication will be finished.

```js
new Server('server', log, connection, {
  …
  auth: token => {
    return findUserByToken(token).then(user => {
      return !!user
    })
  }
})
```

## Time Fixing

Some clients have wrong time zone and they fixed it by setting wrong time.
Other client could have ±10 minutes time mistake or just ignore computer time.

But correct time is highly important for CRDT and other log based operations.

This is why you can enable time fixing by `fixTime` option in client.
Logux Sync will calculate round-trip time and compare client and server time
to calculate time difference between them.

```js
new Client(host, log, connection, {
  …
  fixTime: true
})
```

This fix will be apply to events `created` time before events
will be sent to server or received from server to log.

## State

Client and server could be in 5 states:

* `disconnected`: no connection, but no new events to synchronization.
* `wait`: new events for synchronization but there is no connection.
* `connecting`: connection was established and we wait for node answer.
* `sending`: new events was sent, waiting for answer.
* `synchronized`: all events was synchronized and we keep connection.

You can get current state by `state` property and subscribe to it changes
by `state` event:

```js
client.on('state', () => {
  if (client.state === 'wait' && client.state === 'sending') {
    doNotCloseBrowser()
  } else {
    allowToCloseBrowser()
  }
})
```

## Synchronization

After `connect` and `connected` messages, nodes will synchronize events.

Every node has `synced` and `otherSynced` property. It contains latest
`added` time from sent and received events.

If node will go offline, `synced` and `otherSynced` will be used on next
connection to find new events to synchronization.

In most cases, you don’t need to synchronize all event.
Some client events is locally (like click or animations). Some server event
are now allowed to be shown for every client.

So client and server have `inFilter` and `outFilter` options. This callbacks
should return `true` or `false`.

In `outFilter` you can specify what event will be sent:

```js
new Client(host, log, connection, {
  …
  outFilter: event => event.sync
})
```

In `inFilter` to can specify what events will be received:

```js
new Server(host, log, connection, {
  …
  inFilter: event => doesUserHaveWriteAccess(event)
})
```

Also you can change events before send or adding them to log by `inMap`
and `outMap` options.

## Diagnostics

Sometimes connection could goes down without disconnected event.
So there is a answer for every message to be sure, that it was received.

You can set milliseconds `timeout` option and if answer will not received
in this time, Logux Sync will close connection and throw a error.

```js
new Client(host, log, connection, {
  …
  timeout: 5000
})
```

To be sure, that connection is working and you got latest state from server
Logux Sync could send a `ping` messages. Set milliseconds `ping` option,
how often it should test connection:

```js
new Client(host, log, connection, {
  …
  ping: 10000
})
```

All synchronization errors will be throw to be shown in terminal.
You can process this errors and disable throwing by `catch()`:

```js
client.catch(error => {
  showSyncError(error)
})
```

## Finishing

When you will finish synchronization call `destroy()` method. It will remove
all listeners and disable synchronization.

## Tests

`LocalPair` is a connection for tests or log synchronization on same machine.

```js
import { LocalPair } from 'logux-sync'
const pair = new LocalPair()
const client = new Client('client', log1, pair.left)
const server = new Server('server', log2, pair.right)
```
