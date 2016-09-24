var sync = require('../')

it('has local pair class', function () {
  expect(typeof sync.LocalPair.prototype).toEqual('object')
})
