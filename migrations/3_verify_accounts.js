const VeritokenSTO = artifacts.require('./VeritokenSTO.sol')
const Veritoken884 = artifacts.require('./Veritoken884.sol')

const { generateApprovalBatch } = require('./utils/processInvestorData')
const constants = require('./utils/constants')

const { sha3 } = web3.utils

module.exports = function(deployer, network, accounts) {
  const owner = accounts[0]
  const wallet = accounts[1]
  const whitelistedInvestor = accounts[2]

  let token, crowdsale
  const approvalPromises = []
  return deployer
    .then(async () => {
      /*
       *  ADD ACCOUNTS TO VERIFIED LIST ON TOKEN:
       *       - PRESALE INVESTORS (79)
       *       - CSUITE, EMPLOYEEOPTIONS, EQUITYPOOL, PRESALECUSTODY
       *       - CROWDSALE
       *
       *   TOTAL VERIFIED ACCOUNTS: 84 ACCOUNTS
       */
      const { accounts } = constants
      const { internal } = accounts
      const { publicAddresses, identityHashes } = generateApprovalBatch(web3)

      console.log('Verifying Accounts')
      token = await Veritoken884.deployed()
      crowdsale = await VeritokenSTO.deployed()

      // Verify every Pre-Sale Investor
      publicAddresses.forEach(async (address, idx) => {
        approvalPromises.push(token.addVerified(address, identityHashes[idx]))
      })

      // Verify crowdsale
      approvalPromises.push(token.addVerified(crowdsale.address, sha3(accounts.crowdsale.identityString)))

      //  Verify Internal Accounts
      approvalPromises.push(token.addVerified(internal.cSuite.address, sha3(internal.cSuite.identityString)))
      approvalPromises.push(
        token.addVerified(internal.employeeOptions.address, sha3(internal.employeeOptions.identityString)),
      )
      approvalPromises.push(token.addVerified(internal.equityPool.address, sha3(internal.equityPool.identityString)))
      approvalPromises.push(
        token.addVerified(internal.presaleCustody.address, sha3(internal.presaleCustody.identityString)),
      )

      //  Verify test ganache whitelisted investor:
      approvalPromises.push(token.addVerified(owner, identityHashes[0]))
    })
    .then(async () => {
      console.log('Awaiting approvalPromises')
      Promise.all(approvalPromises).then(res => {
        console.log('\napprovalPromises finished:')
      })
    })
    .catch(err => {
      throw err
    })
}
