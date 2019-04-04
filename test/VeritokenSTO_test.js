const Veritoken884 = artifacts.require('Veritoken884.sol')
const VeritokenSTO = artifacts.require('VeritokenSTO.sol')

// constants
const constants = require('../migrations/utils/constants.js')

// utils / helpers
const assertThrows = require('./utils/assertThrows')
const { getLog, ZERO_ADDRESS } = require('./utils/txHelpers')
const { ethGetBalance } = require('./utils/web3')
const { generateApprovalBatch, generatePresaleTransferBatch } = require('./utils/processInvestorData')

// Crowdsale Constants
const { ETH_IN_WEI } = constants.eth
const TWELVE_CENTS_IN_WEI = constants.eth.WEI_FOR_12_CENTS // 846,753,500,847,432 wei = 0.000846753500847432
const crowdsaleRate = TWELVE_CENTS_IN_WEI
const expectedTokenAmount = Math.floor(ETH_IN_WEI / TWELVE_CENTS_IN_WEI) // Should be around 1180 tokens per 1ETH sent

// Token Params
const { tokenCapacity } = constants
const numMintedForCrowdsale = constants.mintedFor.crowdsale // 120,000,000 tokens
const numMintedForPresaleAutoDistribution = constants.mintedFor.presaleVerified // 12,619,957 tokens
const numMintedForPresaleCustody = constants.mintedFor.presaleCustody // 323,000 tokens
const numMintedForCSuite = constants.mintedFor.cSuite // 1,239,000,000 tokens
const numMintedForEquityPool = constants.mintedFor.equityPool //  1,742,557,043 tokens
const numMintedForEmployeeOptions = constants.mintedFor.employeeOptions // 35,000,000 tokens
// Total Mint = 3.15 billion

// Internal Public Keys
const cSuiteAccount = constants.accounts.internal.cSuite.address
const equityPoolAccount = constants.accounts.internal.equityPool.address
const employeeOptionsAccount = constants.accounts.internal.employeeOptions.address
const presaleCustodyAccount = constants.accounts.internal.presaleCustody.address

//  Internal Identity Hashes
const crowdsaleIdentityHash = web3.utils.sha3(constants.accounts.crowdsale.identityString)
const cSuiteAccountHash = web3.utils.sha3(constants.accounts.internal.cSuite.identityString)
const equityPoolAccountHash = web3.utils.sha3(constants.accounts.internal.equityPool.identityString)
const employeeOptionsAccountHash = web3.utils.sha3(constants.accounts.internal.employeeOptions.identityString)
const presaleCustodyAccountHash = web3.utils.sha3(constants.accounts.internal.presaleCustody.identityString)
const testIdentityhash = web3.utils.sha3('TEST')

contract('VeritokenSTO', ([owner, wallet, thirdParty, fourthParty]) => {
  let token
  let crowdsale

  context('Veritoken', () => {
    context('Deployment', () => {
      beforeEach(async () => {
        token = await Veritoken884.new(tokenCapacity)
        crowdsale = await VeritokenSTO.new(crowdsaleRate, wallet, token.address)
      })

      it('decimals is 0', async () => {
        const decimals = await token.decimals()
        assert.equal(decimals.toNumber(), 0, 'expected 0')
      })

      it('has owner', async () => {
        assert.equal(await token.owner(), owner, `expected ${owner}`)
      })
    })

    context('Approval', () => {
      beforeEach(async () => {
        token = await Veritoken884.new(tokenCapacity)
        crowdsale = await VeritokenSTO.new(crowdsaleRate, wallet, token.address)
      })

      it('should not mint to an unapproved account', async () => {
        assertThrows(token.mint(thirdParty, 1))
      })

      it('should verify all pre-approved pre-sale investors', async () => {
        const { publicAddresses, identityHashes } = generateApprovalBatch()
        // assert.equal(publicAddresses.length, 79)
        // assert.equal(identityHashes.length, 79)

        publicAddresses.forEach(async (address, idx) => {
          await token.addVerified(address, identityHashes[idx])
          assert.equal(await token.isVerified(address), true)
        })
      })

      it('should succesfully check approval for all accounts', async () => {
        // Verify all accounts
        await token.addVerified(crowdsale.address, crowdsaleIdentityHash)
        await token.addVerified(cSuiteAccount, cSuiteAccountHash)
        await token.addVerified(equityPoolAccount, equityPoolAccountHash)
        await token.addVerified(employeeOptionsAccount, employeeOptionsAccountHash)

        // FIXME: Missing: Verify Pre-sale Auto Distribution accounts
        await token.addVerified(presaleCustodyAccount, presaleCustodyAccountHash)

        // Check Verification
        assert.isTrue(await token.isVerified(crowdsale.address))
        assert.isTrue(await token.isVerified(cSuiteAccount))
        assert.isTrue(await token.isVerified(equityPoolAccount))
        assert.isTrue(await token.isVerified(employeeOptionsAccount))
        assert.isTrue(await token.isVerified(presaleCustodyAccount))
      })
    })

    context('Minting', () => {
      beforeEach(async () => {
        token = await Veritoken884.new(tokenCapacity)
        crowdsale = await VeritokenSTO.new(crowdsaleRate, wallet, token.address)
      })

      it('should not mint more than token capacity', async () => {
        await token.addVerified(thirdParty, testIdentityhash)
        assertThrows(token.mint(thirdParty, tokenCapacity + 1))
      })

      it('should be able to mint exactly token capacity', async () => {
        await token.addVerified(thirdParty, testIdentityhash)
        await token.mint(thirdParty, tokenCapacity)
        assert.equal(await token.balanceOf(thirdParty), tokenCapacity)
      })

      it('holderCount should increment', async () => {
        await token.addVerified(thirdParty, testIdentityhash)
        await token.mint(thirdParty, 1)
        assert.equal(await token.holderCount(), 1)
      })

      it('should approve then mint tokens to Crowdsale (crowdsale allocation only)', async () => {
        await token.addVerified(crowdsale.address, crowdsaleIdentityHash)
        await token.mint(crowdsale.address, numMintedForCrowdsale)
        assert.isTrue(await token.isVerified(crowdsale.address))
        assert.equal(await token.balanceOf(crowdsale.address), numMintedForCrowdsale)
      })

      it('should approve then mint tokens to Crowdsale (crowdsale + 2018 pre-sale allocation)', async () => {
        await token.addVerified(crowdsale.address, crowdsaleIdentityHash)
        await token.mint(crowdsale.address, numMintedForCrowdsale + numMintedForPresaleAutoDistribution)
        assert.equal(
          await token.balanceOf(crowdsale.address),
          numMintedForCrowdsale + numMintedForPresaleAutoDistribution,
        )
      })

      it('should approve then mint tokens to CSuite Account', async () => {
        await token.addVerified(cSuiteAccount, cSuiteAccountHash)
        await token.mint(cSuiteAccount, numMintedForCSuite)
        assert.equal(await token.balanceOf(cSuiteAccount), numMintedForCSuite)
      })

      it('should approve then mint tokens to Equity Pool Account', async () => {
        await token.addVerified(equityPoolAccount, equityPoolAccountHash)
        await token.mint(equityPoolAccount, numMintedForEquityPool)
        assert.equal(await token.balanceOf(equityPoolAccount), numMintedForEquityPool)
      })

      it('should approve then mint tokens to Employee Options Account', async () => {
        await token.addVerified(employeeOptionsAccount, employeeOptionsAccountHash)
        await token.mint(employeeOptionsAccount, numMintedForEmployeeOptions)
        assert.equal(await token.balanceOf(employeeOptionsAccount), numMintedForEmployeeOptions)
      })

      it('should approve then mint tokens to Pre-sale Custodial Account', async () => {
        await token.addVerified(presaleCustodyAccount, presaleCustodyAccountHash)
        await token.mint(presaleCustodyAccount, numMintedForPresaleCustody)
        assert.equal(await token.balanceOf(presaleCustodyAccount), numMintedForPresaleCustody)
      })

      it(`should approve then mint entire supply to  all accounts. token supply should be ${tokenCapacity}`, async () => {
        // Verify all accounts
        await token.addVerified(crowdsale.address, crowdsaleIdentityHash)
        await token.addVerified(cSuiteAccount, cSuiteAccountHash)
        await token.addVerified(equityPoolAccount, equityPoolAccountHash)
        await token.addVerified(employeeOptionsAccount, employeeOptionsAccountHash)
        // FIXME: Missing: Verify Pre-sale Auto Distribution accounts
        await token.addVerified(presaleCustodyAccount, presaleCustodyAccountHash)

        // Mint for all accounts
        await token.mint(crowdsale.address, numMintedForCrowdsale + numMintedForPresaleAutoDistribution)
        await token.mint(cSuiteAccount, numMintedForCSuite)
        await token.mint(equityPoolAccount, numMintedForEquityPool)
        await token.mint(employeeOptionsAccount, numMintedForEmployeeOptions)
        await token.mint(presaleCustodyAccount, numMintedForPresaleCustody)

        // Assert individual balances are sound
        assert.equal(
          await token.balanceOf(crowdsale.address),
          numMintedForCrowdsale + numMintedForPresaleAutoDistribution,
        )
        assert.equal(await token.balanceOf(cSuiteAccount), numMintedForCSuite)
        assert.equal(await token.balanceOf(equityPoolAccount), numMintedForEquityPool)
        assert.equal(await token.balanceOf(employeeOptionsAccount), numMintedForEmployeeOptions)
        assert.equal(await token.balanceOf(presaleCustodyAccount), numMintedForPresaleCustody)

        // Assert total supply has been minted
        let totalSupply = await token.totalSupply()
        assert.equal(totalSupply.toNumber(), tokenCapacity)

        // Assert you cannot mint any more tokens
        assertThrows(token.mint(cSuiteAccount, 1))
      })
    })
  })

  context('Crowdsale', () => {
    context('Before anything', () => {
      beforeEach(async () => {
        token = await Veritoken884.new(tokenCapacity)
        crowdsale = await VeritokenSTO.new(crowdsaleRate, wallet, token.address)
      })

      it('requires a non-null token', async function() {
        await assertThrows(VeritokenSTO.new(crowdsaleRate, wallet, ZERO_ADDRESS))
      })
    })

    context('With token', () => {
      beforeEach(async () => {
        token = await Veritoken884.new(tokenCapacity)
      })

      it('requires a non-zero rate', async function() {
        await assertThrows(VeritokenSTO.new(0, wallet, token.address))
      })

      it('requires a non-null wallet', async function() {
        await assertThrows(VeritokenSTO.new(crowdsaleRate, ZERO_ADDRESS, token.address))
      })
    })

    context('Once deployed', async () => {
      beforeEach(async () => {
        token = await Veritoken884.new(tokenCapacity)
        crowdsale = await VeritokenSTO.new(crowdsaleRate, wallet, token.address)

        // Verify Crowdsale address and Presale address(es)
        await token.addVerified(crowdsale.address, crowdsaleIdentityHash)

        // Mint tokens for Crowdsale and Presale addresses to CrowdsaleP
        await token.mint(crowdsale.address, numMintedForCrowdsale + numMintedForPresaleAutoDistribution)
      })

      context('After receiving tokens - Before any activity', () => {
        it(`should hold ${numMintedForCrowdsale + numMintedForPresaleAutoDistribution} tokens`, async () => {
          assert.equal(
            await token.balanceOf(crowdsale.address),
            numMintedForCrowdsale + numMintedForPresaleAutoDistribution,
          )
        })

        it(`token should not be able to transfer from third party`, async () => {
          assertThrows(token.transfer(thirdParty, 1, { from: thirdParty }))
        })

        it(`should have an owner of accounts[0]`, async () => {
          const crowdaleOwner = await crowdsale.owner()
          assert.isOk(crowdaleOwner)
          assert.equal(owner, crowdaleOwner)
        })
      })

      context('Pre-sale Distribution', () => {
        it('should be able to properly pull all pre-approved pre-sale investors and tokens', async () => {
          const { publicAddresses, tokenAllocations } = generatePresaleTransferBatch()

          assert.equal(publicAddresses.length, 80)
          assert.equal(tokenAllocations.length, 80)
        })

        it(`should not disburse presale allocations when non-owner calls the disburseTokens function`, async () => {
          const { publicAddresses, tokenAllocations } = generatePresaleTransferBatch()
          assertThrows(crowdsale.disburseTokens(publicAddresses[0], tokenAllocations[0], { from: thirdParty }))
        })

        it(`should not disburse presale allocations if sendTokensDisabled() is true`, async () => {
          const { publicAddresses, tokenAllocations } = generatePresaleTransferBatch()
          await crowdsale.disableSendTokens()
          assert.equal(await crowdsale.isSendTokensDisabled(), true)
          assertThrows(crowdsale.disburseTokens(publicAddresses[0], tokenAllocations[0]))
        })

        it(`should disburse presale allocations when owner calls the disburseTokens function`, async () => {
          const { publicAddresses, tokenAllocations } = generatePresaleTransferBatch()
          const { identityHashes } = generateApprovalBatch()

          // Transfer to first investor on the presale list
          await token.addVerified(publicAddresses[0], identityHashes[0])
          await crowdsale.disburseTokens(publicAddresses[0], tokenAllocations[0])
          const balance = (await token.balanceOf(publicAddresses[0])).toNumber()
          assert.equal(balance, tokenAllocations[0])
        })

        it(`should disburse all presale allocations`, async () => {
          const { publicAddresses, tokenAllocations } = generatePresaleTransferBatch()
          const { identityHashes } = generateApprovalBatch()

          const verifiedPromises = []
          const disbursePromises = []
          const balancePromises = []

          publicAddresses.forEach((address, idx) => {
            verifiedPromises.push(token.addVerified(address, identityHashes[idx]))
            disbursePromises.push(crowdsale.disburseTokens(address, tokenAllocations[idx]))
            balancePromises.push(token.balanceOf(address))
          })

          Promise.all(verifiedPromises)
            .then(verified => {
              return Promise.all(disbursePromises)
            })
            .then(async disbursed => {
              assert.equal(await token.balanceOf(crowdsale.address), numMintedForCrowdsale) // crowdsale balance = numMintedForCrowdsale
              await crowdsale.disableSendTokens()
              assert.equal(await crowdsale.isSendTokensDisabled(), true)
              return Promise.all(balancePromises)
            })
            .then(async bnBalances => {
              // Convert Balances to number & get sum
              const balances = bnBalances.map(bn => bn.toNumber())
              const sumOfBalances = balances.reduce((total, num) => total + num)
              assert.equal(balances.length, publicAddresses.length)
              assert.equal(sumOfBalances, numMintedForPresaleAutoDistribution) // sum = numMintedForPresale
            })
        })
      })

      context('General Token Sale', () => {
        it(`should have a rate of ${crowdsaleRate} wei`, async () => {
          //   assert.equal(await token.balanceOf(crowdsale.address), numMintedForCrowdsale + numMintedForPresaleList)
          assert.equal(await crowdsale.rate(), crowdsaleRate)
        })

        it(`should not accept funds from a non-approved account`, async () => {
          //   assert.equal(await token.balanceOf(crowdsale.address), numMintedForCrowdsale + numMintedForPresaleList)
          assert.equal(await crowdsale.rate(), crowdsaleRate)
        })

        context('endsale', () => {
          it(`should not let anyone but owner call endSale()`, async () => {
            assertThrows(crowdsale.endSale({ from: thirdParty }))
          })

          it(`should forward funds to owner if endSale() is called`, async () => {
            //   assert.equal(await crowdsale.rate(), crowdsaleRate)
            const crowdsalePreEndSaleBalance = (await token.balanceOf(crowdsale.address)).toNumber()
            await token.addVerified(owner, testIdentityhash)
            await crowdsale.endSale({ from: owner })
            const crowdsaleBalance = (await token.balanceOf(crowdsale.address)).toNumber()
            const ownerBalance = (await token.balanceOf(owner)).toNumber()
            assert.equal(crowdsaleBalance, 0)
            assert.equal(ownerBalance, crowdsalePreEndSaleBalance)
          })
        })

        context('accepting payments', () => {
          context('bare payments', () => {
            // FIXME: Ether helper
            it('should not accept payments from unverified investors', async () => {
              const value = ETH_IN_WEI
              assertThrows(crowdsale.send(value, { from: thirdParty }))
            })

            it('reverts on zero-valued payments', async () => {
              token.addVerified(thirdParty, testIdentityhash)
              assertThrows(crowdsale.send(0, { from: thirdParty }))
            })

            it('should accept payments from verified investors', async () => {
              const value = ETH_IN_WEI
              await token.addVerified(thirdParty, testIdentityhash)
              await crowdsale.send(value, { from: thirdParty })
              assert.equal(
                (await token.balanceOf(crowdsale.address)).toNumber(),
                numMintedForCrowdsale + numMintedForPresaleAutoDistribution - expectedTokenAmount,
              )
              assert.equal((await token.balanceOf(thirdParty)).toNumber(), expectedTokenAmount)
            })
          })

          context('buyTokens', function() {
            it('(buyTokens) should not accept payments from unverified investors', async function() {
              assertThrows(crowdsale.buyTokens(thirdParty, { value: 1, from: thirdParty }))
            })

            it('(buyTokens) reverts on zero-valued payments', async function() {
              token.addVerified(thirdParty, testIdentityhash)
              await assertThrows(crowdsale.buyTokens(thirdParty, { value: 0, from: thirdParty }))
            })

            it('(buyTokens) requires a non-null beneficiary', async function() {
              await assertThrows(crowdsale.buyTokens(ZERO_ADDRESS, { value: 1, from: thirdParty }))
            })

            it('(buyTokens) should accept payments and transfer tokens to verified investors ', async function() {
              // verify thirdParty (Receiver of tokens)
              await token.addVerified(thirdParty, testIdentityhash)
              // unverified fourthparty buys tokens for verified thirdparty
              await crowdsale.buyTokens(thirdParty, { value: ETH_IN_WEI, from: fourthParty })
              // Crowdsale balance should have transferred `expectedTokenAmount` tokens
              assert.equal(
                (await token.balanceOf(crowdsale.address)).toNumber(),
                numMintedForCrowdsale + numMintedForPresaleAutoDistribution - expectedTokenAmount,
              )
              // Account thirdParty should have `expectedTokenAmount` tokens
              assert.equal((await token.balanceOf(thirdParty)).toNumber(), expectedTokenAmount)
            })
          })

          context('high-level purchase', () => {
            it('should log purchase', async () => {
              const value = ETH_IN_WEI
              await token.addVerified(thirdParty, testIdentityhash)
              const tx = await crowdsale.sendTransaction({ value: value, from: thirdParty })
              assert.ok(getLog(tx, 'TokenPurchase'))
            })

            it('should assign tokens to sender', async function() {
              const value = ETH_IN_WEI
              await token.addVerified(thirdParty, testIdentityhash)
              await crowdsale.sendTransaction({ value: value, from: thirdParty })
              assert.equal((await token.balanceOf(thirdParty)).toNumber(), expectedTokenAmount)
            })

            it('should forward funds to wallet', async function() {
              const value = 100
              await token.addVerified(thirdParty, testIdentityhash)

              const pre = await ethGetBalance(wallet)
              await crowdsale.sendTransaction({ value, from: thirdParty })
              const post = await ethGetBalance(wallet)

              const preBN = web3.utils.toBN(pre)
              const postBN = web3.utils.toBN(post)

              assert.equal(postBN.sub(preBN), value)
            })
          })

          context('low-level purchase', () => {
            it('should log purchase', async function() {
              const value = 100
              await token.addVerified(thirdParty, testIdentityhash)
              const tx = await crowdsale.buyTokens(thirdParty, { value: value, from: thirdParty })
              assert.ok(getLog(tx, 'TokenPurchase'))
            })

            it('should assign tokens to beneficiary', async function() {
              const value = ETH_IN_WEI
              await token.addVerified(thirdParty, testIdentityhash)
              await crowdsale.buyTokens(thirdParty, { value, from: thirdParty })
              assert.equal((await token.balanceOf(thirdParty)).toNumber(), expectedTokenAmount)
            })

            it('should forward funds to wallet', async function() {
              const value = ETH_IN_WEI
              await token.addVerified(thirdParty, testIdentityhash)

              const pre = await ethGetBalance(wallet)
              await crowdsale.buyTokens(thirdParty, { value, from: thirdParty })
              const post = await ethGetBalance(wallet)

              const preBN = web3.utils.toBN(pre)
              const postBN = web3.utils.toBN(post)

              assert.equal(postBN.sub(preBN), value)
            })
          })
        })
      })
    })
  })
})
