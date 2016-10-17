var ClientSync = require('../client-sync')
var ServerSync = require('../server-sync')
var LocalPair = require('../local-pair')
var SyncError = require('../sync-error')
var Reconnect = require('../reconnect')
var BaseSync = require('../base-sync')
var sync = require('../')

it('has LocalPair class', function () {
  expect(sync.LocalPair).toBe(LocalPair)
})

it('has ServerSync class', function () {
  expect(sync.ServerSync).toBe(ServerSync)
})

it('has ClientSync class', function () {
  expect(sync.ClientSync).toBe(ClientSync)
})

it('has SyncError class', function () {
  expect(sync.SyncError).toBe(SyncError)
})

it('has Reconnect class', function () {
  expect(sync.Reconnect).toBe(Reconnect)
})

it('has BaseSync class', function () {
  expect(sync.BaseSync).toBe(BaseSync)
})
