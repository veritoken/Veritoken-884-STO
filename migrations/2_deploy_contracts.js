const VeritokenSTO = artifacts.require('./VeritokenSTO.sol')
const Veritoken884 = artifacts.require('./Veritoken884.sol')

const constants = require('./utils/constants')

module.exports = function(deployer, network, accounts) {
  // const openingTime = web3.eth.getBlock('latest').timestamp + 2; // two secs in the future
  // const closingTime = openingTime + 86400 * 20; // 20 days
  const tokenCapacity = new web3.utils.BN(3150000000)
  const rate = new web3.utils.BN(constants.eth.WEI_FOR_12_CENTS)
  const owner = accounts[0]

  let token, crowdsale

  return deployer
    .then(() => {
      return deployer.deploy(Veritoken884, tokenCapacity)
    })
    .then(instance => {
      token = instance
      return deployer.deploy(VeritokenSTO, rate, owner, token.address)
    })
    .then(instance => {
      crowdsale = instance
    })
    .catch(err => {
      throw err
    })
}
