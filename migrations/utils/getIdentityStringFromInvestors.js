const getIdentityString = function(investorArray, address) {
  let filteredArray = investorArray.filter(function(investor) {
    return investor.publicAddress.toLowerCase() === address.toLowerCase()
  })
  if (filteredArray.length === 0) return undefined
  return filteredArray[0].identityString
}

module.exports = getIdentityString
