var PassiveSync = require('../passive-sync')
var LocalPair = require('../local-pair')
var SyncError = require('../sync-error')
var BaseSync = require('../base-sync')
var sync = require('../')

it('has LocalPair class', function () {
  expect(sync.LocalPair).toBe(LocalPair)
})

it('has BaseSync class', function () {
  expect(sync.BaseSync).toBe(BaseSync)
})

it('has PassiveSync class', function () {
  expect(sync.PassiveSync).toBe(PassiveSync)
})

it('has SyncError class', function () {
  expect(sync.SyncError).toBe(SyncError)
})
