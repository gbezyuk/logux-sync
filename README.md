# Logux Sync

Tool to synchronize events between [Logux logs]. It could synchronize logs
on different machines through network, or it could do it on one machine.

It does authentication, events filtering, time fixing, connection diagnostics.

Synchronization protocol: [`protocol.md`].

```js
import { ActiveSync } from 'logux-sync'
const sync = new ActiveSync('user:' + user.id + uniq, log, connection, {
  credentials: user.token,
  outFilter: e => e.sync,
  timeout: 5000,
  fixTime: true,
  ping: 10000
})
```

[`protocol.md`]: ./protocol.md
[Logux logs]:    https://github.com/logux/logux-core

<a href="https://evilmartians.com/?utm_source=logux-sync">
  <img src="https://evilmartians.com/badges/sponsored-by-evil-martians.svg"
       alt="Sponsored by Evil Martians" width="236" height="54">
</a>
