const verifiedAccounts = require('../../data/finalPresaleInvestors.json')
const keyedVerifiedAccounts = require('../../data/keyedPresaleInvestors.json')

const generateApprovalBatch = () => {
  const publicAddresses = []
  const identityHashes = []

  verifiedAccounts.forEach(account => {
    publicAddresses.push(account.publicAddress)
    identityHashes.push(web3.utils.sha3(account.identityString))
  })

  return verifyApprovalBatchIntegrity(publicAddresses, identityHashes)
}

const generatePresaleTransferBatch = () => {
  const publicAddresses = []
  const tokenAllocations = []

  verifiedAccounts.forEach(account => {
    publicAddresses.push(account.publicAddress)
    tokenAllocations.push(account.tokenAllocation)
  })
  return verifyTransferBatchIntegrity(publicAddresses, tokenAllocations)
}

const verifyApprovalBatchIntegrity = (publicAddresses, identityHashes) => {
  assert.equal(publicAddresses.length, identityHashes.length)

  // Make sure publicAddresses[n] and identityHashes[n] match against the data
  publicAddresses.forEach((publicAddress, idx) => {
    const { identityString } = keyedVerifiedAccounts[publicAddress]
    assert.equal(identityHashes[idx], web3.utils.sha3(identityString))
  })
  return { publicAddresses, identityHashes }
}

const verifyTransferBatchIntegrity = (publicAddresses, tokenAllocations) => {
  assert.equal(publicAddresses.length, tokenAllocations.length)

  // Make sure publicAddresses[n] and tokenAllocations[n] match against the data
  publicAddresses.forEach((publicAddress, idx) => {
    const { tokenAllocation } = keyedVerifiedAccounts[publicAddress]
    assert.equal(tokenAllocations[idx], tokenAllocation)
  })
  return { publicAddresses, tokenAllocations }
}

module.exports = {
  generateApprovalBatch,
  generatePresaleTransferBatch,
}
