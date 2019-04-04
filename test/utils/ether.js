const ether = n => {
  return new web3.utils.BN(web3.utils.toWei(n, 'ether'))
}

const weiToEther = wei => {
  return new web3.utils.BN(web3.utils.fromWei(wei, 'ether'))
}

module.exports = {
  ether,
  weiToEther,
}
