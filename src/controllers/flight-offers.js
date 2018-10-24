const NDC = require('ndc-adapter');
const parser = require('xml2json');
const { Http404Error } = require('../errors');

const mapOffer = function (ndcOffer, flights, segments) {
  let offer = {
    id: ndcOffer.OfferID,
    price: ndcOffer.TotalPrice.DetailCurrencyPrice.Total.$t,
    origin:
    destination:

  };

  return offer;
};

const mapToJSON = function (offersInXML) {
  let response = parser.toJson(offersInXML, { object: true })['S:Envelope']['S:Body'].AirShoppingRS;
  let offers = response.OffersGroup.AirlineOffers.Offer;
  let flights = response.DataLists.FlightList.Flight;
  let segments = response.DataLists.FlightSegmentList.FlightSegment;

  let mappedOffers = [];
  for (let offer in offers) {
    mappedOffers.push(mapOffer(offer, flights, segments));
  }
  console.log(mappedOffers);
  return response;
};

const findAll = async (req, res, next) => {
  const { destination, origin, date } = req.query;
  try {
    console.log('orig:' + origin + ' dest:' + destination + ' date:' + date);
    let ndc = new NDC('https://ndc-rct.airfranceklm.com/passenger/distribmgmt/001448v01/EXT?', 'key');
    let offers = await ndc.AirShopping(origin, destination, date);
    res.status(200).json(mapToJSON(offers));
  } catch (e) {
    next(e);
  }
};

module.exports = {
  findAll,
};
