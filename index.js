var ClientSync = require('./client-sync')
var ServerSync = require('./server-sync')
var LocalPair = require('./local-pair')
var SyncError = require('./sync-error')
var Reconnect = require('./reconnect')
var BaseSync = require('./base-sync')

module.exports = {
  ClientSync: ClientSync,
  ServerSync: ServerSync,
  LocalPair: LocalPair,
  SyncError: SyncError,
  Reconnect: Reconnect,
  BaseSync: BaseSync
}

/**
 * Logux protocol message. It is a array with message type string in first
 * position and JS simple types in next.
 *
 * @typedef {Array} Message
 * @property {string} 0 Message type
 */

/**
 *
 * Abstract interface for connection to sync over it.
 * For example, WebSocket or Loopback.
 *
 * @name Connection
 * @class
 * @abstract
 */
/**
 * Send message to connection.
 *
 * @param {Message} message Message to be sent
 *
 * @return {undefined}
 *
 * @name send
 * @function
 * @memberof Connection#
 */
/**
 * Subscribe for connection events. It should implement nanoevents API.
 * Supported events:
 *
 * * `connecting`: connection establishing was started.
 * * `connect`: connection was established by any side.
 * * `disconnect`: connection was closed by any side.
 * * `message`: message was receive from other node.
 * * `error`: message was wrong.
 *
 * @param {"connecting"|"connect"|"disconnect"|"message"|"error"} event Event.
 * @param {function} listener The listener function.
 *
 * @return {function} Unbind listener from event.
 *
 * @name on
 * @function
 * @memberof Connection#
 */
/**
 * Start connection. Connection should be in disconnected state
 * from the beginning and start connection only on this method call.
 *
 * This method could be called again if connection moved to disconnected state.
 *
 * @return {undefined}
 *
 * @name connect
 * @function
 * @memberof Connection#
 */
/**
 * Finish current connection.
 *
 * After disconnection, connection could be started again
 * by {@link Connection#connect}.
 *
 * @return {undefined}
 *
 * @name disconnect
 * @function
 * @memberof Connection#
 */
/**
 * Is connection is enabled.
 *
 * @name connected
 * @type {boolean}
 * @memberof Connection#
 */
