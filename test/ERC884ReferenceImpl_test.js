const ERC884ReferenceImpl = artifacts.require('./token/ERC884/ERC884ReferenceImpl.sol')

const assertThrows = require('./utils/assertThrows')
const { getLog, ZERO_ADDRESS } = require('./utils/txHelpers')

contract('ERC884ReferenceImpl', ([owner, punter, anotherPunter]) => {
  let token
  let tx

  before(async () => {
    token = await ERC884ReferenceImpl.new()
  })

  it('decimals is 0', async () => {
    const decimals = await token.decimals()
    assert.equal(decimals.toNumber(), 0, 'expected 0')
  })

  it('has owner', async () => {
    assert.equal(await token.owner(), owner, `expected ${owner}`)
  })

  context('before any addresses are verified', () => {
    it('holderCount() is 0', async () => {
      assert.equal(await token.holderCount(), 0, 'Expected 0')
    })

    it("won't mint token for unverified address", async () => assertThrows(token.mint(punter, 1)))

    it('holderAt(0) throws an error', async () => assertThrows(token.holderAt(0)))

    it('isVerified(punter) is false', async () => {
      assert.isFalse(await token.isVerified(punter))
    })

    it('isVerified(ZERO_ADDRESS) is false', async () => {
      assert.isFalse(await token.isVerified(ZERO_ADDRESS))
    })

    it('isHolder(punter) is false', async () => {
      assert.isFalse(await token.isHolder(punter))
    })

    it('isHolder(ZERO_ADDRESS) is false', async () => {
      assert.isFalse(await token.isHolder(ZERO_ADDRESS))
    })

    it('isSuperseded(punter) is false', async () => {
      assert.isFalse(await token.isSuperseded(punter))
    })

    it('isSuperseded(ZERO_ADDRESS) is false', async () => {
      assert.isFalse(await token.isSuperseded(ZERO_ADDRESS))
    })
  })

  context('verify a punter', () => {
    const hash = web3.utils.toHex('someHash')

    it('zero address throws', async () => assertThrows(token.addVerified(ZERO_ADDRESS, hash)))

    it('zero hash throws', async () => assertThrows(token.addVerified(punter, web3.utils.toHex(''))))

    context('given a punter and hash', () => {
      before(async () => {
        tx = await token.addVerified(punter, hash)
      })

      it('emitted the VerifiedAddressAdded event', () => {
        assert.ok(getLog(tx, 'VerifiedAddressAdded'))
      })

      it('isVerified(punter) is true', async () => {
        assert.isTrue(await token.isVerified(punter))
      })

      it('isSuperseded(punter) is still false', async () => {
        assert.isFalse(await token.isSuperseded(punter))
      })

      it('isHolder(punter) is still false', async () => {
        assert.isFalse(await token.isHolder(punter))
      })

      it("won't verify the same address again", async () => assertThrows(token.addVerified(punter, hash)))

      context('mint a token for punter', () => {
        before(async () => {
          await token.mint(punter, 1)
        })

        it('holderCount is now 1', async () => {
          assert.equal(await token.holderCount(), 1)
        })

        it('holderAt(0) returns punter', async () => {
          assert.equal(await token.holderAt(0), punter)
        })

        it('isHolder(punter) is true', async () => {
          assert.isTrue(await token.isHolder(punter))
        })

        it("can't remove a verified address that holds a token", async () => assertThrows(token.removeVerified(punter)))

        context('hasHash', () => {
          it('given correct hash for punter returns true', async () => {
            assert.isTrue(await token.hasHash(punter, hash))
          })

          it('given incorrect hash for punter returns false', async () => {
            assert.isFalse(await token.hasHash(punter, web3.utils.toHex('nonsense')))
          })

          it('given a hash but ZERO_ADDRESS address returns false', async () => {
            assert.isFalse(await token.hasHash(ZERO_ADDRESS, hash))
          })

          it('given a zero hash returns false', async () => {
            assert.isFalse(await token.hasHash(punter, web3.utils.toHex('')))
          })

          context('updateVerified', () => {
            const newHash = web3.utils.toHex('some fancy new hash')

            before(async () => {
              tx = await token.updateVerified(punter, newHash)
            })

            it('emitted VerifiedAddressUpdated', () => {
              assert.ok(getLog(tx, 'VerifiedAddressUpdated'))
            })

            it('hasHash now returns true when given the new hash', async () => {
              assert.isTrue(await token.hasHash(punter, newHash))
            })

            it('given zero address throws', async () =>
              assertThrows(token.updateVerified(ZERO_ADDRESS, web3.utils.toHex('something something'))))

            it('given zero hash throws', async () => assertThrows(token.updateVerified(punter, web3.utils.toHex(''))))

            context('given identical hash', () => {
              before(async () => {
                tx = await token.updateVerified(punter, newHash)
              })

              it("doesn't emit VerifiedAddressUpdated", () => assert.throws(() => getLog(tx, 'VerifiedAddressUpdated')))
            })
          })
        })
      })
    })
  })

  context('verify another punter', () => {
    const hash = web3.utils.toHex('some other hash')

    before(async () => {
      await token.addVerified(anotherPunter, hash)
    })

    context('now un-verify it', () => {
      before(async () => {
        tx = await token.removeVerified(anotherPunter)
      })

      it('emitted VerifiedAddressRemoved', () => {
        assert.ok(getLog(tx, 'VerifiedAddressRemoved'))
      })

      it('isVerified(anotherPunter) is false', async () => {
        assert.isFalse(await token.isVerified(anotherPunter))
      })

      context("un-verifying a punter that's not verified", async () => {
        before(async () => {
          tx = await token.removeVerified(anotherPunter)
        })

        it("doesn't emit VerifiedAddressRemoved", () => assert.throws(() => getLog(tx, 'VerifiedAddressRemoved')))
      })
    })
  })
})
