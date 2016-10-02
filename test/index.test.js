var LocalPair = require('../local-pair')
var SyncError = require('../sync-error')
var BaseSync = require('../base-sync')
var Server = require('../server')
var Client = require('../client')
var sync = require('../')

it('has LocalPair class', function () {
  expect(sync.LocalPair).toBe(LocalPair)
})

it('has Server class', function () {
  expect(sync.Server).toBe(Server)
})

it('has Client class', function () {
  expect(sync.Client).toBe(Client)
})

it('has SyncError class', function () {
  expect(sync.SyncError).toBe(SyncError)
})

it('has BaseSync class', function () {
  expect(sync.BaseSync).toBe(BaseSync)
})
