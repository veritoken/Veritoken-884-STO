const { name: packageName, version, description, keywords, license, author, contributors } = require('./package.json')
const secrets = require('./secrets.json')

const HDWalletProvider = require('truffle-hdwallet-provider')

const DEFAULT = {
  host: 'localhost',
  port: 8545,
  network_id: '*', // Match any network id
  gas: 4600000,
}

module.exports = {
  packageName,
  version,
  description,
  keywords,
  license,
  authors: [author, ...contributors],
  networks: {
    geth: { ...DEFAULT, gas: 999999 },
    mainnet: {
      provider: function() {
        return new HDWalletProvider(secrets.MNEMONIC, `https://mainnet.infura.io/v3/${secrets.INFURA_API_KEY}`)
      },
      network_id: 1,
      gasPrice: 50000000000, // 50 gwei,
      timeoutBlocks: 1000,
    },
    ropsten: {
      provider: function() {
        return new HDWalletProvider(secrets.MNEMONIC, `https://ropsten.infura.io/v3/${secrets.INFURA_API_KEY}`)
      },
      network_id: 3,
      gasPrice: 30000000000, // 30 gwei
    },
    rinkeby: {
      provider: function() {
        return new HDWalletProvider(secrets.MNEMONIC, `https://rinkeby.infura.io/v3/${secrets.INFURA_API_KEY}`)
      },
      network_id: 4,
      gasPrice: 30000000000, // 30 gwei
    },
  },
  compilers: {
    solc: {
      version: '0.4.24',
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
}
