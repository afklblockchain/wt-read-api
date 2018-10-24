const wtJsLibs = require('@windingtree/wt-js-libs');
const { baseUrl } = require('../config');
const {
  HttpValidationError,
  Http404Error,
} = require('../errors');
const {
  DEFAULT_AIRLINES_FIELDS,
} = require('../constants');
const {
  mapAirlineObjectToResponse,
} = require('../services/property-mapping');
const {
  DEFAULT_PAGE_SIZE,
} = require('../constants');
const {
  paginate,
  LimitValidationError,
  MissingStartWithError,
} = require('../services/pagination');

// Helpers
const flattenObject = (contents, fields) => {
  let currentFieldDef = {},
    currentLevelName,
    result = {};
  for (let field of fields) {
    let remainingPath;
    if (field.indexOf('.') === -1) {
      currentLevelName = field;
    } else {
      currentLevelName = field.substring(0, field.indexOf('.'));
      remainingPath = field.substring(field.indexOf('.') + 1);
    }
    if (remainingPath) {
      if (!currentFieldDef[currentLevelName]) {
        currentFieldDef[currentLevelName] = [];
      }
      currentFieldDef[currentLevelName].push(remainingPath);
    } else {
      currentFieldDef[currentLevelName] = undefined;
    }
  }

  for (let field in currentFieldDef) {
    if (contents[field] !== undefined) {
      // No specific children selected
      if (!currentFieldDef[field]) {
        // Differentiate between storage pointers and plain objects
        result[field] = contents[field].contents ? contents[field].contents : contents[field];
      // Specific children selected
      } else {
        let searchSpace;
        if (contents[field].ref && contents[field].contents) { // StoragePointer
          searchSpace = contents[field].contents;
        } else { // POJO
          searchSpace = contents[field];
        }
        result[field] = flattenObject(searchSpace, currentFieldDef[field]);
      }
    } else if (contents && typeof contents === 'object') { // Mapping object such as roomTypes
      for (let key in contents) {
        if (contents[key][field] !== undefined) {
          if (!result[key]) {
            result[key] = {};
          }
          result[key][field] = contents[key][field];
        }
      }
    }
  }

  return result;
};

const resolveAirlineObject = async (airline, offChainFields, onChainFields) => {
  let airlineData = {};
  try {
    if (offChainFields.length) {
      const plainAirline = await airline.toPlainObject(offChainFields);
      const flattenedOffChainData = flattenObject(plainAirline.dataUri.contents, offChainFields);
      airlineData = {
        ...flattenedOffChainData.descriptionUri,
        ...(flattenObject(plainAirline, offChainFields)),
      };
    }
    for (let i = 0; i < onChainFields.length; i += 1) {
      if (airline[onChainFields[i]]) {
        airlineData[onChainFields[i]] = await airline[onChainFields[i]];
      }
    }
    // Always append airline chain address as id property
    airlineData.id = airline.address;
  } catch (e) {
    let message = 'Cannot get airline data';
    if (e instanceof wtJsLibs.errors.RemoteDataReadError) {
      message = 'Cannot access on-chain data, maybe the deployed smart contract is broken';
    }
    if (e instanceof wtJsLibs.errors.StoragePointerError) {
      message = 'Cannot access off-chain data';
    }
    return {
      error: message,
      originalError: e.message,
      data: {
        id: airline.address,
      },
    };
  }
  return mapAirlineObjectToResponse(airlineData);
};

const fillAirlineList = async (path, fields, airlines, limit, startWith) => {
  limit = limit ? parseInt(limit, 10) : DEFAULT_PAGE_SIZE;
  let { items, nextStart } = paginate(airlines, limit, startWith, 'address');
  let rawAirlines = [];
  for (let airline of items) {
    rawAirlines.push(resolveAirlineObject(airline, fields.toFlatten, fields.onChain));
  }
  const resolvedItems = await Promise.all(rawAirlines);
  let realItems = resolvedItems.filter((i) => !i.error);
  let realErrors = resolvedItems.filter((i) => i.error);
  let next = nextStart ? `${baseUrl}${path}?limit=${limit}&fields=${fields.mapped.join(',')}&startWith=${nextStart}` : undefined;

  if (realErrors.length && realItems.length < limit && nextStart) {
    const nestedResult = await fillAirlineList(path, fields, airlines, limit - realItems.length, nextStart);
    realItems = realItems.concat(nestedResult.items);
    realErrors = realErrors.concat(nestedResult.errors);
    if (realItems.length && nestedResult.nextStart) {
      next = `${baseUrl}${path}?limit=${limit}&fields=${fields.mapped.join(',')}&startWith=${nestedResult.nextStart}`;
    } else {
      next = undefined;
    }
  }
  return {
    items: realItems,
    errors: realErrors,
    next,
    nextStart,
  };
};

// Actual controllers
const findAll = async (req, res, next) => {
  const { limit, startWith } = req.query;
  const fieldsQuery = req.query.fields || DEFAULT_AIRLINES_FIELDS;

  try {
    let airlines = await res.locals.wt.index.getAllAirlines();
    const { items, errors, next } = await fillAirlineList(req.path, calculateFields(fieldsQuery), airlines, limit, startWith);
    res.status(200).json({ items, errors, next });
  } catch (e) {
    if (e instanceof LimitValidationError) {
      return next(new HttpValidationError('paginationLimitError', 'Limit must be a natural number greater than 0.'));
    }
    if (e instanceof MissingStartWithError) {
      return next(new Http404Error('paginationStartWithError', 'Cannot find startWith in airline collection.'));
    }
    next(e);
  }
};

module.exports = {
  findAll,
};
