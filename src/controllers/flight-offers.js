const { NDC_ADAPTER_AFKL, NDC_ADAPTER_LH } = require('ndc-adapter');
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
          arrivalTime: s.Arrival.Time,
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
    currency: ndcOffer.TotalPrice.DetailCurrencyPrice.Total.Code,
    origin: od.DepartureCode,
    destination: od.ArrivalCode,
    journeyTime: flight.Journey.Time,
    segments: mapLegs(flight, segments),
  };

  return offer;
};

const mapOfferLH = function (ndcOffer, segments) {
  let legs = [];

  for (let segment of ndcOffer.PricedOffer.Associations.ApplicableFlight.FlightSegmentReference) {
    for (let s of segments) {
      if (s.SegmentKey === segment.ref) {
        let leg = {
          departureStation: s.Departure.AirportCode,
          arrivalStation: s.Arrival.AirportCode,
          departureDate: s.Departure.Date,
          arrivalDate: s.Arrival.Date,
          departureTime: s.Departure.Time,
          arrivalTime: s.Arrival.Time,
          airlineCode: s.MarketingCarrier.AirlineID,
          flightNumber: s.MarketingCarrier.FlightNumber,
        };
        legs.push(leg);
      }
    }
  }

  let offer = {
    id: ndcOffer.OfferID.t,
    price: ndcOffer.TotalPrice.DetailCurrencyPrice.Total.t,
    currency: ndcOffer.TotalPrice.DetailCurrencyPrice.Total.Code,
    origin: legs[0].departureStation,
    destination: legs[legs.length - 1].arrivalStation,
    segments: legs,
  };

  return offer;
};


const mapAFKL = function (json) {
  let response = json['S:Envelope']['S:Body'].AirShoppingRS;
  let offers = response.OffersGroup.AirlineOffers.Offer;
  let flights = response.DataLists.FlightList.Flight;
  let segments = response.DataLists.FlightSegmentList.FlightSegment;
  let odlist = response.DataLists.OriginDestinationList.OriginDestination;

  let mappedOffers = [];
  for (let offer of offers) {
    mappedOffers.push(mapOffer(offer, flights, segments, odlist));
  }
  return mappedOffers;
}

const mapLH = function (json) {
  let response = json.FaresResponse.AirShoppingRS;
  let offers = response.OffersGroup.AirlineOffers.AirlineOffer;
  let segments = response.DataLists.FlightSegmentList.FlightSegment;

  let mappedOffers = [];
  for (let offer of offers) {
    mappedOffers.push(mapOfferLH(offer, segments));
  }
  return mappedOffers;
}

const mapToJSON = function (offersInXML) {
  let json = parser.toJson(offersInXML, { object: true });
  if (json['S:Envelope']) {
    return mapAFKL(json);
  } else {
    return mapLH(json);
  }
};

const findAll = async (req, res, next) => {
  const { destination, origin, date } = req.query;
  try {
    const baseURL = await res.locals.wt.airline._dataUri;

    let offers = {}
    if (baseURL.includes('airfranceklm')) {
      let ndc = new NDC_ADAPTER_AFKL(baseURL + '/passenger/distribmgmt/001448v01/EXT?', 'vtbeehq2ydu5a6d82sftudwa');
      offers = await ndc.AirShopping(origin, destination, date);
    } else {
      let ndc = new NDC_ADAPTER_LH(baseURL + '?', 'r4r7swg9qfvrjg33kcc3s9kb');
      offers = await ndc.AirShopping(origin, destination, date, '2019-02-04');
      offers = offers.replace(/(?:\r\n|\r|\n)/g, ' ')
      offers = offers.replace(/@/g, '')
      offers = offers.replace(/\$/g, 't')

    }
    res.status(200).json(mapToJSON(offers));
  } catch (e) {
    next(e);
  }
};

module.exports = {
  findAll,
};
