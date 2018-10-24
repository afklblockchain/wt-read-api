const NDC = require('ndc-adapter');
const parser = require('xml2json');
const { Http404Error } = require('../errors');

const mapLegs = function (flight, segments) {
  let legs = [];
  for (let segment of flight.SegmentReferences.split(' ')) {
    for (let s of segments) {
      if (s.SegmentKey === segment) {
        let leg = {
          departureStation: s.Departure.AirportCode,
          arrivalStation: s.Arrival.AirportCode,
          departureDate: s.Departure.Date,
          arrivalDate: s.Arrival.Date,
          departureTime: s.Departure.Time,
          arrivalTime:  s.Arrival.Time,
          airlineCode: s.MarketingCarrier.AirlineID,
          flightNumber: s.MarketingCarrier.FlightNumber,
        };
        legs.push(leg);
      }
    }
  }
  return legs;
};

const mapOffer = function (ndcOffer, flights, segments, od) {
  let flight;
  for (let f of flights) {
    if (f.FlightKey === ndcOffer.FlightsOverview.FlightRef.$t) {
      flight = f;
      break;
    }
  }

  let offer = {
    id: ndcOffer.OfferID,
    price: ndcOffer.TotalPrice.DetailCurrencyPrice.Total.$t,
    origin: od.DepartureCode,
    destination: od.ArrivalCode,
    journeyTime: flight.Journey.Time,
    segments: mapLegs(flight, segments),
  };

  return offer;
};

const mapToJSON = function (offersInXML) {
  let response = parser.toJson(offersInXML, { object: true })['S:Envelope']['S:Body'].AirShoppingRS;
  let offers = response.OffersGroup.AirlineOffers.Offer;
  let flights = response.DataLists.FlightList.Flight;
  let segments = response.DataLists.FlightSegmentList.FlightSegment;
  let odlist = response.DataLists.OriginDestinationList.OriginDestination;

  let mappedOffers = [];
  for (let offer of offers) {
    mappedOffers.push(mapOffer(offer, flights, segments, odlist));
  }
  return mappedOffers;
};

const findAll = async (req, res, next) => {
  const { destination, origin, date } = req.query;
  try {
    console.log('orig:' + origin + ' dest:' + destination + ' date:' + date);
    let ndc = new NDC('https://ndc-rct.airfranceklm.com/passenger/distribmgmt/001448v01/EXT?', '3nnfesjhfupgh9dbb42yay55');
    let offers = await ndc.AirShopping(origin, destination, date);
    res.status(200).json(mapToJSON(offers));
  } catch (e) {
    next(e);
  }
};

module.exports = {
  findAll,
};
