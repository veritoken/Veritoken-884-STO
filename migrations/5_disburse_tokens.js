const VeritokenSTO = artifacts.require('./VeritokenSTO.sol')
const Veritoken884 = artifacts.require('./Veritoken884.sol')

const { generatePresaleTransferBatch } = require('./utils/processInvestorData')
const constants = require('./utils/constants')

module.exports = function(deployer, network, accounts) {
  const owner = accounts[0]
  const wallet = accounts[1]
  const whitelistedInvestor = accounts[2]

  let token, crowdsale
  const disbursePromises = []
  return (
    deployer
      .then(async () => {
        /*
         *   DISBURSE TOKENS FOR
         *       - 80 PRESALE INVESTORS
         *
         *   TOTAL DISBURSED: 12,532,457 TOKENS
         */

        const { mintedFor, accounts } = constants
        const { internal } = accounts
        token = await Veritoken884.deployed()
        crowdsale = await VeritokenSTO.deployed()

        const { publicAddresses, tokenAllocations } = generatePresaleTransferBatch()

        // Loop through presale investors
        publicAddresses.forEach((address, idx) => {
          disbursePromises.push(
            crowdsale.disburseTokens(address, tokenAllocations[idx]).catch(err => {
              throw new Error(address, err)
            }),
          )
        })
      })
      // Once all promises resolve,
      .then(async () => {
        console.log('Awaiting disbursePromises')
        Promise.all(disbursePromises).then(res => {
          console.log('\ndisbursePromises finished:')
          // return crowdsale.disableSendTokens()     //disableDisburse() ignored. must be triggered manually
        })
      })
      .catch(err => {
        throw err
      })
  )
}
