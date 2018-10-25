const WtJsLibs = require('@afklblockchain/wt-js-libs');
const SwarmAdapter = require('@windingtree/off-chain-adapter-swarm');
const HttpAdapter = require('@windingtree/off-chain-adapter-http');

module.exports = {
  wtIndexAddress: '0x3b476ac17ffea8dcf2dbd5ef787a5baeeebe9984',
  port: 3000,
  baseUrl: process.env.BASE_URL || 'https://playground-api.windingtree.com',
  ethNetwork: 'ropsten',
  wtLibs: WtJsLibs.createInstance({
    dataModelOptions: {
      provider: 'https://ropsten.infura.io/' + process.env.INFURA_API_KEY,
    },
    offChainDataOptions: {
      adapters: {
        'bzz-raw': {
          options: {
            swarmProviderUrl: 'https://swarm.windingtree.com/',
            timeoutRead: 1000,
          },
          create: (options) => {
            return new SwarmAdapter(options);
          },
        },
        https: {
          create: () => {
            return new HttpAdapter();
          },
        },
      },
    },
  }),
};
