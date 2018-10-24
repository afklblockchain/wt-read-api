const TruffleContract = require('truffle-contract');
const Web3 = require('web3');
const WTIndexContract = require('@afklblockchain/wt-contracts/build/contracts/WTIndex');
const WTAirlinesIndexContract = require('@afklblockchain/wt-contracts/build/contracts/WTIndex');

const provider = new Web3.providers.HttpProvider('http://localhost:8545');
const web3 = new Web3(provider);

// dirty hack for web3@1.0.0 support for localhost testrpc, see
// https://github.com/trufflesuite/truffle-contract/issues/56#issuecomment-331084530
const hackInSendAsync = (instance) => {
  if (typeof instance.currentProvider.sendAsync !== 'function') {
    instance.currentProvider.sendAsync = function () {
      return instance.currentProvider.send.apply(
        instance.currentProvider, arguments
      );
    };
  }
  return instance;
};

const getContractWithProvider = (metadata, provider) => {
  let contract = new TruffleContract(metadata);
  contract.setProvider(provider);
  contract = hackInSendAsync(contract);
  return contract;
};

const deployIndex = async () => {
  const indexContract = getContractWithProvider(WTIndexContract, provider);
  const accounts = await web3.eth.getAccounts();
  return indexContract.new({
    from: accounts[0],
    gas: 6000000,
  });
};
const deployAirlinesIndex = async () => {
  const indexContract = getContractWithProvider(WTAirlinesIndexContract, provider);
  const accounts = await web3.eth.getAccounts();
  return indexContract.new({
    from: accounts[0],
    gas: 6000000,
  });
};

const deployFullHotel = async (offChainDataAdapter, index, hotelDescription, ratePlans, availability) => {
  const accounts = await web3.eth.getAccounts();
  const indexFile = {};

  if (hotelDescription) {
    indexFile['descriptionUri'] = await offChainDataAdapter.upload(hotelDescription);
  }
  if (ratePlans) {
    indexFile['ratePlansUri'] = await offChainDataAdapter.upload(ratePlans);
  }
  if (availability) {
    indexFile['availabilityUri'] = await offChainDataAdapter.upload(availability);
  }
  indexFile.notificationsUri = 'https://notifications.example';
  indexFile.bookingUri = 'https://booking.example';
  const dataUri = await offChainDataAdapter.upload(indexFile);

  const registerResult = await index.registerHotel(dataUri, {
    from: accounts[0],
    gas: 6000000,
  });
  return web3.utils.toChecksumAddress(registerResult.logs[0].args.hotel);
};

const deployAirline = async (dataUri, index) => {
  const accounts = await web3.eth.getAccounts();

  const registerResult = await index.registerAirline(dataUri, {
    from: accounts[0],
    gas: 6000000,
  });
  return web3.utils.toChecksumAddress(registerResult.logs[0].args.airline);
};

module.exports = {
  deployIndex,
  deployAirlinesIndex,
  deployFullHotel,
  deployAirline,
};
