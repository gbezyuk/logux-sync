# Logux Sync

Tool to synchronize events between [Logux logs]. It could synchronize logs
on different machines through network, or on same machine.

Also it does authentication, events filtering, time fixing,
connection diagnostics.

Synchronization protocol specification: [`protocol.md`].

```js
import BrowserConnection from 'logux-sync/browser-connection'
import ClientSync from 'logux-sync/client-sync'
import Reconnect from 'logux-sync/reconnect'

const connection = new BrowserConnection('wss://logux.example.com')
const reconnect  = new Reconnect(connection)
const sync = new ClientSync('user' + user.id + ':' + uuid, log1, connection, {
  subprotocol: [3, 0],
  credentials: user.token,
  outFilter: event => Promise.resolve(event.sync)
})

reconnect.connect()
```

```js
import { ServerSync, ServerConnection } from 'logux-sync'

wss.on('connection', function connection (ws) {
  const connection = new ServerConnection(ws)
  const sync = new ServerSync('server', log2, connection, {
    subprotocol: [3, 1],
    outFilter: event => access(event),
    auth: token => checkToken(token)
  })
})
```

[`protocol.md`]: https://github.com/logux/logux-protocol
[Logux logs]:    https://github.com/logux/logux-core

<a href="https://evilmartians.com/?utm_source=logux-sync">
  <img src="https://evilmartians.com/badges/sponsored-by-evil-martians.svg"
       alt="Sponsored by Evil Martians" width="236" height="54">
</a>

## Connection

Logux protocol could work through any encoding (JSON or XML)
and any channel (WebSockets Secure or AJAX with HTTP “keep-alive”).

You could create a special connection classes for different channels
and encoding and use them with Logux Sync.

```js
import BrowserConnection from 'logux-websocket/browser-connection'
const connection = new BrowserConnection(serverUrl)
const sync = new ClientSync(nodeId, log, connection, opts)
connection.connect()
```

Connection instance should provide `connect()` and `disconnect()`
methods and `connect`, `disconnect` and `message` events in [NanoEvents] API.

[NanoEvents]: https://github.com/ai/nanoevents

### WebSocket

Some old proxy could block WebSocket protocol.
It is one of reason, why we highly recommend to use `wss://` over `ws://`.

WebSocket Secure is a “HTTPS” for WebSocket. In first hand, it increase
user security. In other hand, it protects you from problems with proxies.

### Reconnect

Logux Sync has special wrapper classes, which will automatically connect
connection again:

```js
const reconnect = new Reconnect(connection, {
  minDelay: 0,
  attempts: 10
})
```

### Client and Server

The only difference between `ClientSync` and `ServerSync` is that client will
send `connect`, when connection will be started. Server will destroy itself,
when connection will be closed.

Messages are same for client and server. If you want a different behaviour,
you can take `BaseSync` class and make your own roles
(for example, for multi-master synchronization).

### Node Name

Logux Sync uses node names only for error messages. But node names are also
used in [default timer]. So node name uniqueness are very important
for correct timing and log synchronization.

Be sure, that you use unique node names. For example, your back-end
application could use counter to generate short and unique names.
You could put this name in `<meta>` tag to use it in client JS.

If you can’t generate short unique names, [UUID] will be best way.

Current node name will be saved to `nodeId` property. Other node name
will be saved to `otherNodeId`.

```js
console.log('Start synchronization with ' + client.otherNodeId)
```

[default timer]: https://github.com/logux/logux-core#created-time
[UUID]:          https://github.com/broofa/node-uuid

### Subprotocol Versions

Subprotocol is a application protocol, which you build on top of Logux.
Events data and expected reactions on this events.

In future you may change event types or options. But some clients could
use old code for some time.

In this case you can set subprotocol version to Logux Sync.
It is a `[number major, number minor]` array:

```js
new ClientSync(nodeId, log, connection, {
  …
  subprotocol: [3, 1]
})
```

And Logux will send this version from client to server and from server
to client. Other node subprotocol will be saved to `otherSubprotocol`:

```js
if (semver.satisfies(sync.otherSubprotocol[0], '4.x')) {
  useOldAPI()
}
```

You can check supported subprotocol in `connect` event
and send `wrong-subprotocol` on wrong version:

```js
import SyncError from 'logux-sync/sync-error'
sync.on('connect', () => {
  if (!semver.satisfies(sync.otherSubprotocol, '>= 4.0.0')) {
    throw new SyncError(sync, 'wrong-subprotocol', {
      supported: '>= 4.0.0',
      used: sync.otherSubprotocol
    })
  }
})
```

### Authentication

Authentication is built-in into Logux protocol. Both client and server
could have credentials data (in most use cases only client will have it).
And both could have a `auth` callback to authenticate this credentials data.

```js
new ClientSync(nodeId, log, connection, {
  …
  credentials: user.token
})
```

Credentials could be a string, number, object or array.

Authentication callback should return a promise with `true` or `false`.
All message from this node will wait until authentication will be finished.

```js
new ServerSync('server', log, connection, {
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
new ClientSync(nodeId, log, connection, {
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
  if (client.state === 'wait' || client.state === 'sending') {
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
Some client events is locally (like click or animations).
Some server event are now allowed to be shown for every client.

So client and server have `inFilter` and `outFilter` options. This callbacks
should return Promise with `true` or `false`.

In `outFilter` you can specify what event will be sent:

```js
new ClientSync(nodeId, log, connection, {
  …
  outFilter: event => Promise.resolve(event.sync)
})
```

In `inFilter` to can specify what events will be received:

```js
new ServerSync(nodeId, log, connection, {
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
new ClientSync(nodeId, log, connection, {
  …
  timeout: 5000
})
```

To be sure, that connection is working and you got latest state from server
Logux Sync could send a `ping` messages. Set milliseconds `ping` option,
how often it should test connection:

```js
new ClientSync(nodeId, log, connection, {
  …
  ping: 10000
})
```

All synchronization errors will be throw to be shown in terminal.
You can process this errors and disable throwing by `catch()` method:

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
const client = new ClientSync('client', log1, pair.left)
const server = new ServerSync('server', log2, pair.right)
```
