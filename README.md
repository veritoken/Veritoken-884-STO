# Veritoken ERC884 and STO Contract

## Status

An `ERC-884` token is an `ERC-20` compatible token that is compliant with Delaware General Corporate Law.

- See [EIPS/eip-884](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-884.md) for the official spec.
- - See [Tokenising Shares: Introducing ERC-884](https://medium.com/coinmonks/tokenising-shares-introducing-erc-884-cc491258e413) for a more wordy overview.

## Development

The smart contracts are implemented using Solidity `0.4.24`.

### Development Prerequisites

- [NodeJS](htps://nodejs.org), version 11.6+ or better (I use [`nvm`](https://github.com/creationix/nvm) to manage Node versions — `brew install nvm`.)
- [truffle](http://truffleframework.com/), which is a comprehensive framework for Ethereum development. `npm install -g truffle` — this should install Truffle v5.0.1 or better. Check that with `truffle version`.

### Initialisation

Install dependencies:
`npm install`

Verify `secrets.json` is valid with a MNEMONIC and INFURA API KEY

### Testing

    npm test

### Deploying

Local ganache instance:

```sh
    ganache-cli -p 7545 -i 5777
    npm run deploy
```

Ropsten:

```sh
    npm run deploy:ropsten
```

Rinkeby:

```sh
    npm run deploy:rinkeby
```

Mainnet:

```sh
    npm run deploy:mainnet
```

### Linting

You can use the following linting options

- `npm run lint:sol` — to lint the Solidity files, and
- `npm run lint:js` — to lint the Javascript.

## Contributing

Please see the [contributing notes](CONTRIBUTING.md).
