const _ = require('lodash');
const { handleApplicationError } = require('../errors');
const {
  DEFAULT_HOTELS_FIELDS,
  DEFAULT_HOTEL_FIELDS,
  OBLIGATORY_FIELDS,
  HOTEL_FIELDS,
  DESCRIPTION_FIELDS,
} = require('../constants');
const {
  mapHotelObjectToResponse,
  mapHotelFieldsFromQuery,
} = require('../services/property-mapping');
const { paginate } = require('../services/pagination');

// Helpers

const VALID_FIELDS = _.union(HOTEL_FIELDS, DESCRIPTION_FIELDS);

const pickAndResolveFields = (contents, fields) => {
  return fields.reduce(async (plainContent, field) => {
    plainContent = await plainContent;
    plainContent[field] = await contents[field];
    return plainContent;
  }, {});
};

const resolveHotelObject = async (hotel, fields) => {
  let indexProperties;
  let descriptionProperties;
  let errorFields;
  try {
    const indexFields = _.intersection(fields, HOTEL_FIELDS);
    if (indexFields.length) {
      indexProperties = pickAndResolveFields(hotel, indexFields);
    }
    const descriptionFields = _.intersection(fields, DESCRIPTION_FIELDS);
    if (descriptionFields.length) {
      const indexContents = (await hotel.dataIndex).contents;
      const description = (await indexContents.descriptionUri).contents;
      descriptionProperties = pickAndResolveFields(description, descriptionFields);
    }
  } catch (e) {
    errorFields = {
      error: e.message,
    };
  }
  
  return mapHotelObjectToResponse({
    ...(await indexProperties),
    ...(await descriptionProperties),
    ...errorFields,
    id: hotel.address,
  });
};

const calculateFields = (fieldsQuery) => {
  const fieldsArray = fieldsQuery.split(',');
  const mappedFields = mapHotelFieldsFromQuery(fieldsArray);
  return _.intersection(
    VALID_FIELDS,
    _.union(OBLIGATORY_FIELDS, mappedFields)
  );
};

// Actual controllers

const findAll = async (req, res, next) => {
  const { limit, page } = req.query;
  const fieldsQuery = req.query.fields || DEFAULT_HOTELS_FIELDS;
  const fields = calculateFields(fieldsQuery);

  try {
    let hotels = await res.locals.wt.index.getAllHotels();
    let { items, next } = paginate(req.path, hotels, limit, page);
    let rawHotels = [];
    for (let hotel of items) {
      rawHotels.push(resolveHotelObject(hotel, fields));
    }
    items = await Promise.all(rawHotels);
    res.status(200).json({ items, next });
  } catch (e) {
    if (e.message.match(/limit and page are not numbers/i)) {
      return next(handleApplicationError('paginationFormat', e));
    }
    if (e.message.match(/Limit out of range/i)) {
      return next(handleApplicationError('limitRange', e));
    }
    if (e.message.match(/Pagination outside of the limits./i)) {
      return next(handleApplicationError('paginationLimit', e));
    }
    if (e.message.match(/Negative Page./i)) {
      return next(handleApplicationError('negativePage', e));
    }
    next(e);
  }
};

const find = async (req, res, next) => {
  let { hotelAddress } = req.params;
  const fieldsQuery = req.query.fields || DEFAULT_HOTEL_FIELDS;
  const { wt } = res.locals;
  const fields = calculateFields(fieldsQuery);
  try {
    let hotel = await wt.index.getHotel(hotelAddress);
    res.status(200).json(await resolveHotelObject(hotel, fields));
  } catch (e) {
    if (e.message.match(/cannot find hotel/i)) {
      return next(handleApplicationError('hotelNotFound', e));
    }
    next(e);
  }
};

module.exports = {
  find,
  findAll,
};
