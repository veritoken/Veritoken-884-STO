const VeritokenSTO = artifacts.require('./VeritokenSTO.sol')
const Veritoken884 = artifacts.require('./Veritoken884.sol')

const constants = require('./utils/constants')

module.exports = function(deployer, network, accounts) {
  const owner = accounts[0]
  const wallet = accounts[1]
  const whitelistedInvestor = accounts[2]

  let token, crowdsale
  const mintPromises = []
  return deployer
    .then(async () => {
      /*
       *   MINT TOKENS FOR:
       *       - CROWDSALE
       *       - CSUITE, EMPLOYEEOPTIONS, EQUITYPOOL, PRESALECUSTODY
       *
       *   TOTAL MINTED: 3,150,000,000 TOKENS
       */

      const { mintedFor, accounts } = constants
      const { internal } = accounts
      token = await Veritoken884.deployed()
      crowdsale = await VeritokenSTO.deployed()

      console.log('Minting Tokens')

      //   Mint tokens allocated for Crowdsale and Presale Investors to Crowdsale
      mintPromises.push(token.mint(crowdsale.address, mintedFor.crowdsale + mintedFor.presaleVerified))

      // Mint tokens allocated for internal accounts
      mintPromises.push(token.mint(internal.cSuite.address, mintedFor.cSuite))
      mintPromises.push(token.mint(internal.employeeOptions.address, mintedFor.employeeOptions))
      mintPromises.push(token.mint(internal.equityPool.address, mintedFor.equityPool))
      mintPromises.push(token.mint(internal.presaleCustody.address, mintedFor.presaleCustody))
      //FIXME: PRESALE CUSTODY MINT NOT WORK
    })
    .then(async () => {
      console.log('Awaiting mintPromises')
      Promise.all(mintPromises).then(res => {
        console.log('\nmintPromises finished:')
      })
    })
    .catch(err => {
      throw err
    })
}
