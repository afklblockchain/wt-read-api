const express = require('express');
const {
  injectWtLibs,
  validateAirlineAddress,
  resolveAirline,
  handleOnChainErrors,
  handleDataFetchingErrors,
} = require('../middlewares');
const airlinesController = require('../controllers/airlines');
const flightOfferController = require('../controllers/flight-offers');

const airlinesRouter = express.Router();

airlinesRouter.get('/airlines', injectWtLibs, airlinesController.findAll, handleOnChainErrors);
airlinesRouter.get('/airlines/:airlineAddress/flight-offers', injectWtLibs, validateAirlineAddress, resolveAirline, flightOfferController.findAll, handleOnChainErrors, handleDataFetchingErrors);

module.exports = {
  airlinesRouter,
};
