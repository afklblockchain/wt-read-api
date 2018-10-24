const WtJsLibs = require('@windingtree/wt-js-libs');
const InMemoryAdapter = require('@windingtree/off-chain-adapter-in-memory');
const SwarmAdapter = require('@windingtree/off-chain-adapter-swarm');
const HttpAdapter = require('@windingtree/off-chain-adapter-http');
const { deployIndex, deployAirlinesIndex, deployFullHotel, deployAirline } = require('../../management/local-network');
const {
  HOTEL_DESCRIPTION,
  RATE_PLANS,
  AVAILABILITY,
} = require('../../test/utils/test-data');

const winston = require('winston');

module.exports = {
  port: 3000,
  baseUrl: 'http://localhost:3000',
  wtIndexAddress: 'will-be-set-during-init',
  ethNetwork: 'local',
  wtLibs: WtJsLibs.createInstance({
    dataModelOptions: {
      provider: 'http://localhost:8545',
    },
    offChainDataOptions: {
      adapters: {
        'in-memory': {
          create: (options) => {
            return new InMemoryAdapter(options);
          },
        },
        'bzz-raw': {
          options: {
            swarmProviderUrl: 'http://localhost:8500',
            timeoutRead: 500,
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
  networkSetup: async (currentConfig) => {
    const indexContract = await deployIndex();
    currentConfig.wtIndexAddress = indexContract.address;
    currentConfig.logger.info(`Winding Tree index deployed to ${currentConfig.wtIndexAddress}`);

    const airlineIndexContract = await deployAirlinesIndex();
    currentConfig.airlineIndex = airlineIndexContract.address;
    currentConfig.logger.info(`Winding Tree Airlines index deployed to ${currentConfig.airlineIndex}`);

    const hotelAddress = await deployFullHotel(await currentConfig.wtLibs.getOffChainDataClient('in-memory'), indexContract, HOTEL_DESCRIPTION, RATE_PLANS, AVAILABILITY);
    currentConfig.logger.info(`Example hotel deployed to ${hotelAddress}`);

    const airlineAddress = await deployAirline('http://www.klm.com', airlineIndexContract);
    currentConfig.logger.info(`Example airline deployed to ${airlineAddress}`);
  },
  logger: winston.createLogger({
    level: 'debug',
    transports: [
      new winston.transports.Console({
        format: winston.format.simple(),
        handleExceptions: true,
      }),
    ],
  }),
};
