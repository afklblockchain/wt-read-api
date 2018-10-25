const airlineMapping = {
  manager: 'managerAddress',
};

const mapAirlineObjectToResponse = (airline) => {
  return Object.keys(airline).reduce((newAirline, field) => {
    const newField = airlineMapping[field] || field;
    newAirline[newField] = airline[field];
    /*if (field === 'roomTypes') {
      for (let roomTypeId in hotel[field]) {
        newHotel[field][roomTypeId].id = roomTypeId;
      }
    }
    if (field === 'ratePlans') {
      for (let ratePlanId in hotel[field]) {
        newHotel[field][ratePlanId].id = ratePlanId;
      }
    }*/
    return newAirline;
  }, {});
};


const fieldMapping = {
  managerAddress: 'manager',
  ratePlans: 'ratePlansUri',
  availability: 'availabilityUri',
};

const mapAirlineFieldsFromQuery = (fields) => {
  return fields.reduce((newFields, field) => {
    const newField = field.split('.').map((f) => fieldMapping[f] || f).join('.');
    newFields.push(newField);
    return newFields;
  }, []);
};

module.exports = {
  mapAirlineObjectToResponse,
  mapAirlineFieldsFromQuery,
};
