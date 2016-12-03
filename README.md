# Logux Sync

A tool for synchronizing events between [Logux logs]. It could synchronize logs
on different machines through network, or on same machine.

Also it does authentication, events filtering, timestamp fixing and connection diagnostics.

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

Logux protocol can work with any data encoding format (e.g. JSON or XML) and via
any data transfer channel (e.g. WebSockets Secure or AJAX with HTTP “keep-alive”).

You can create special connection classes for different channels
and encoding formats and use them with Logux Sync.

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

Some old proxy servers may block unsafe WebSocket protocol.
It is one of the reasons why we highly recommend to use `wss://` over `ws://`.

WebSocket Secure is a “HTTPS” for WebSockets. First of all, it increases user security.
On the other hand, it also protects you from proxy-related problems.


### Reconnect

Logux Sync has special wrapper classes, which automatically reestablish
lost connections:

```js
const reconnect = new Reconnect(connection, {
  minDelay: 0,
  attempts: 10
})
```


### Client and Server

There is not that much difference between `ClientSync` and `ServerSync`.
For one, the client will send `connect`, when connection will be started.
Also, the server will destroy itself after the connection is closed.

Messages are same for client and server. However, if you want a different behaviour,
you can take `BaseSync` class and make your own roles (e.g. for a multi-master synchronization).


### Node Name

Logux Sync uses node names only for error messages. But node names are also
used in the [default timer]. So node name uniqueness is very important
for correct timing and log synchronization.

Ensure using unique node names. For example, your back-end
application may use a counter to generate short and unique names.
You can put this name in a `<meta>` tag for using it in the client JS code.

If you can’t generate short unique names, [UUID] will be best way.

Current node name will be saved to the `nodeId` property. Other node name
will be saved to `otherNodeId`.

```js
console.log('Start synchronization with ' + client.otherNodeId)
```

[default timer]: https://github.com/logux/logux-core#created-time
[UUID]:          https://github.com/broofa/node-uuid


### Subprotocol Versions

Subprotocol is an application protocol, which you build on top of Logux.
It consists of events and expected reactions on them.

In future you may want to change some event types or options. But some clients could
still be using old code for some time after an update.

It's a good reason to specify a subprotocol version using Logux Sync.
The format in use for this purpose is a `[number major, number minor]` array:

```js
new ClientSync(nodeId, log, connection, {
  …
  subprotocol: [3, 1]
})
```

Logux will send this version from the client to the server and from the server
to the client. Other node subprotocol will be saved as `otherSubprotocol`:

```js
if (semver.satisfies(sync.otherSubprotocol[0], '4.x')) {
  useOldAPI()
}
```

You can check if the subprotocol is supported in the `connect` event
and send a `wrong-subprotocol` response in case of a wrong subprotocol version:

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
can have credentials data (yet in most use cases only client will have it).
Both can as well  have an `auth` callback for authenticating.

```js
new ClientSync(nodeId, log, connection, {
  …
  credentials: user.token
})
```

Credentials can be stored as a string, number, object or an array.

Authentication callback should return a promise with `true` or `false`.
All messages from this node will wait until the authentication is finished.

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

Some clients may have wrong time zone fixing it by setting a wrong time.
Other client may have a small (±10 minutes) time mistake or just ignore the computer's time.

Nevertheless, the correct time is vitally important for CRDT and other log based operations.

This is why you can enable time fixing using the `fixTime` option in the client.
Logux Sync will calculate a round-trip time and compare client and server times
in order to calculate the time difference between them.

```js
new ClientSync(nodeId, log, connection, {
  …
  fixTime: true
})
```

This fix will be applied to the events `created` timestamps before sending them to
the server or receiving them from the server to a client log.


## State

At every moment, the client-server interaction can be in one of 5 possible states:

* `disconnected`: there is no connection, nor new events for synchronization.
* `wait`: new events are awaiting synchronization, but there is no connection.
* `connecting`: connection was established and we wait for the node's response.
* `sending`: new events were sent, waiting for the answer.
* `synchronized`: all events are synchronized, and the connection is active.

You can get the current state accessing the `state` property or subscribing
to it changes using the `state` event:

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

After receiving `connect` and `connected` messages, nodes will synchronize events.

Every node has `synced` and `otherSynced` properties. They contain the latest
`added` time of sent and received events.

If the node will go offline, `synced` and `otherSynced` properties will be used on the next
connection for finding new events for synchronization.

In most cases, you don’t need to synchronize all events.
Some client events are local (like clicks or animation updates).
Some server events, however, are now allowed to be shown for every client.

So client and server have `inFilter` and `outFilter` options. This callbacks
should return Promises resolving with `true` or `false`.

In the `outFilter`, you can specify the event to send:

```js
new ClientSync(nodeId, log, connection, {
  …
  outFilter: event => Promise.resolve(event.sync)
})
```

In the `inFilter` you can specify the events to be received:

```js
new ServerSync(nodeId, log, connection, {
  …
  inFilter: event => doesUserHaveWriteAccess(event)
})
```

Also, you can change events before sending or adding them to the log using `inMap`
and `outMap` options.


## Diagnostics

Sometimes the connection can go down without emitting a `disconnected` event.
So there is an explicit answer for every message in order to ensure that it was received.

You can set a milliseconds `timeout` option and if the answer will not received
after this time, Logux Sync will close the connection and throw an error.

```js
new ClientSync(nodeId, log, connection, {
  …
  timeout: 5000
})
```

To be sure that connection is working and you get the latest state from the server,
Logux Sync can send `ping` messages. Set milliseconds `ping` option specifying
how often it should test the connection:

```js
new ClientSync(nodeId, log, connection, {
  …
  ping: 10000
})
```

All synchronization errors will be thrown to be shown in the terminal.
You can process this errors and disable throwing by `catch()` method:

```js
client.catch(error => {
  showSyncError(error)
})
```


## Finishing

After finishing the synchronization, call the `destroy()` method. It will remove
every listener and disable the synchronization.


## Tests

`LocalPair` is a connection for tests or log synchronization on the same machine.

```js
import { LocalPair } from 'logux-sync'
const pair = new LocalPair()
const client = new ClientSync('client', log1, pair.left)
const server = new ServerSync('server', log2, pair.right)
```
