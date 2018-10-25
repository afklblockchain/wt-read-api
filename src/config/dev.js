const WtJsLibs = require('@afklblockchain/wt-js-libs');
const InMemoryAdapter = require('@windingtree/off-chain-adapter-in-memory');
const SwarmAdapter = require('@windingtree/off-chain-adapter-swarm');
const HttpAdapter = require('@windingtree/off-chain-adapter-http');
const { deployIndex, deployAirlinesIndex, deployFullHotel, deployAirline, getContractAt } = require('../../management/local-network');
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
  ethNetwork: 'ropsten',
  wtLibs: WtJsLibs.createInstance({
    dataModelOptions: {
      provider: 'https://ropsten.infura.io/v3/7697444efe2e4751bc2f20f7f4549c36',
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
    // const indexContract = await deployAirlineyIndex();
    currentConfig.wtIndexAddress = '0x5637a2fe3eab21d742e67354ac07979117837432';
    currentConfig.logger.info(`Winding Tree index deployed to ${currentConfig.wtIndexAddress}`);

    //
    // const airlineIndexContract = await getContractAt(currentConfig.wtIndexAddress);
    // currentConfig.airlineIndex = airlineIndexContract.address;
    // currentConfig.logger.info(`Winding Tree Airlines index deployed to ${currentConfig.airlineIndex}`);

    // const hotelAddress = await deployFullHotel(await currentConfig.wtLibs.getOffChainDataClient('in-memory'), indexContract, HOTEL_DESCRIPTION, RATE_PLANS, AVAILABILITY);
    // currentConfig.logger.info(`Example hotel deployed to ${hotelAddress}`);

    // const airlineAddress = await deployAirline('https://ndc-rct.airfranceklm.com', airlineIndexContract);
    // currentConfig.logger.info(`Example airline deployed to ${airlineAddress}`);
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
