const winston = require('winston');
const WtJsLibs = require('@afklblockchain/wt-js-libs');
const InMemoryAdapter = require('@windingtree/off-chain-adapter-in-memory');

module.exports = {
  port: 8100,
  baseUrl: 'http://example.com',
  wtIndexAddress: 'will-be-set-during-init',
  ethNetwork: 'test',
  wtLibs: WtJsLibs.createInstance({
    dataModelOptions: {
      provider: 'http://localhost:8545',
    },
    offChainDataOptions: {
      adapters: {
        'in-memory': {
          options: { },
          create: (options) => {
            return new InMemoryAdapter(options);
          },
        },
      },
    },
  }),
  logger: winston.createLogger({
    level: 'warn',
    transports: [
      new winston.transports.Console({
        format: winston.format.simple(),
        handleExceptions: true,
      }),
    ],
  }),
};
