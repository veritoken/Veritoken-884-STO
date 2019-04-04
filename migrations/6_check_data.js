const VeritokenSTO = artifacts.require('./VeritokenSTO.sol')
const Veritoken884 = artifacts.require('./Veritoken884.sol')

const constants = require('./utils/constants')
const getKeyByNestedValue = require('./utils/getKeyByNestedValue.js')
const getIdentityString = require('./utils/getIdentityStringFromInvestors.js')

module.exports = function(deployer, network, accounts) {
  const owner = accounts[0]
  //   const wallet = accounts[1]
  //   const whitelistedInvestor = accounts[2]

  let token, crowdsale
  const mintPromises = []
  return deployer
    .then(async () => {
      /* Check Stuff */

      const { mintedFor, accounts } = constants
      const { internal, preSale } = accounts
      token = await Veritoken884.deployed()
      crowdsale = await VeritokenSTO.deployed()

      console.log('Checking Token Balances:')
      const balances = {
        crowdsale: (await token.balanceOf(crowdsale.address)).toNumber(),
        cSuite: (await token.balanceOf(internal.cSuite.address)).toNumber(),
        employeeOptions: (await token.balanceOf(internal.employeeOptions.address)).toNumber(),
        equityPool: (await token.balanceOf(internal.equityPool.address)).toNumber(),
        presaleCustody: (await token.balanceOf(internal.presaleCustody.address)).toNumber(),
      }
      console.log('Balances', balances)

      // Total Supply and Cap from contract
      const totalSupply = await token.totalSupply()
      const cap = await token.cap()
      console.log('\nCrowdsale\n \ttotalSupply:', totalSupply.toNumber(), '\n\tcap:', cap.toNumber(), '\n')

      // Token holders from contract
      const holderCount = await token.holderCount()
      console.log('Total Token Holders:', holderCount.toNumber())
      for (let i = 0; i < holderCount; i++) {
        const holderAddress = await token.holderAt(i)
        let key = getKeyByNestedValue(internal, holderAddress) //query "constants" for account name

        if (key === undefined) {
          key = getIdentityString(preSale, holderAddress)
        }

        const balance = (await token.balanceOf(holderAddress)).toNumber()
        const tabs = balance.toString().length > 5 ? '\t' : '\t\t' //for clean formatting
        console.log(`\tHolder ${i}:`, holderAddress, '\tBalance:', balance, tabs, key)
      }

      // Check if isSendTokensDisabled() is true
      console.log('\n_sendTokensDisabled:', await crowdsale.isSendTokensDisabled())
    })
    .catch(err => {
      throw err
    })
}
