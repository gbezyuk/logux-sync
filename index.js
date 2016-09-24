module.exports = {
  LocalPair: require('./local-pair')
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
 * Subscribe for log events. It should implement nanoevents API.
 * Supported events:
 *
 * * `connect`: connection was established by any side.
 * * `disconnect`: connection was closed by any side.
 * * `message`: message was receive from other node.
 *
 * @param {"connect"|"disconnect"|"message"} event The event name.
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
 * by @{link Connection#connect}.
 *
 * @return {undefined}
 *
 * @name disconnect
 * @function
 * @memberof Connection#
 */
