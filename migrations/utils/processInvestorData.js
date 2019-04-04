const verifiedAccounts = require('../../data/finalPresaleInvestors.json')
const keyedVerifiedAccounts = require('../../data/keyedPresaleInvestors.json')

// Creates publicAddresses[] and identityHashes[], with publicAddresses[n] linked to identityHashes[n]
const generateApprovalBatch = web3 => {
  const publicAddresses = []
  const identityHashes = []

  verifiedAccounts.forEach(account => {
    publicAddresses.push(account.publicAddress)
    identityHashes.push(web3.utils.sha3(account.identityString))
  })

  return { publicAddresses, identityHashes }
  // return verifyApprovalBatchIntegrity(publicAddresses, identityHashes)
}

// Creates publicAddresses[] and tokenAllocations[], with publicAddresses[n] linked to tokenAllocations[n]
const generatePresaleTransferBatch = () => {
  const publicAddresses = []
  const tokenAllocations = []

  verifiedAccounts.forEach(account => {
    publicAddresses.push(account.publicAddress)
    tokenAllocations.push(account.tokenAllocation)
  })
  return { publicAddresses, tokenAllocations }
}

const verifyApprovalBatchIntegrity = (publicAddresses, identityHashes) => {
  if (publicAddresses.length != identityHashes.length) {
    throw new Error('Approval Batch: Not of matching length')
  }

  // Make sure publicAddresses[n] and identityHashes[n] match against the data
  publicAddresses.forEach((publicAddress, idx) => {
    const { identityString } = keyedVerifiedAccounts[publicAddress]
    if (identityHashes[idx] != identityString) throw new Error(`Mismatch identity hash at index: ${idx}`)
  })
  return { publicAddresses, identityHashes }
}

const verifyTransferBatchIntegrity = (publicAddresses, tokenAllocations) => {
  if (publicAddresses.length != tokenAllocations.length) throw new Error('Transfer Batch: Not of matching length')

  // Make sure publicAddresses[n] and tokenAllocations[n] match against the data
  publicAddresses.forEach((publicAddress, idx) => {
    const { tokenAllocation } = keyedVerifiedAccounts[publicAddress]
    if (tokenAllocations[idx] != tokenAllocation) throw new Error(`Mismatch token alloc at index: ${idx}`)
  })
  return { publicAddresses, tokenAllocations }
}

module.exports = {
  generateApprovalBatch,
  generatePresaleTransferBatch,
}
