/* 
* Hotel fields
*/
const DEFAULT_HOTEL_FIELDS = [
  'id',
  'location',
  'name',
  'description',
  'contacts',
  'address',
  'currency',
  'images',
  'amenities',
  'updatedAt',
];
const DEFAULT_HOTELS_FIELDS = [
  'id',
  'location',
  'name',
];

const HOTEL_FIELDS = [
  'manager',
];

const DESCRIPTION_FIELDS = [
  'name',
  'description',
  'location',
  'contacts',
  'address',
  'roomTypes',
  'timezone',
  'currency',
  'images',
  'amenities',
  'updatedAt',
  'defaultCancellationAmount',
  'cancellationPolicies',
];

/*
* Airline fields
*/
const DEFAULT_AIRLINES_FIELDS = [
  'id',
  'name',
  'address'
];

const DEFAULT_AIRLINE_FIELDS = [
  'id',
  'location',
  'name',
  'description',
  'contacts',
  'address',
  'currency',
  'images',
  'amenities',
  'updatedAt',
];

const AIRLINE_FIELDS = [
  'manager',
];

const DESCRIPTION_AIRLINE_FIELDS = [
  'name',
  'description',
  'location',
  'contacts',
  'address',
  'roomTypes',
  'timezone',
  'currency',
  'images',
  'amenities',
  'updatedAt',
  'defaultCancellationAmount',
  'cancellationPolicies',
];


const DEFAULT_PAGE_SIZE = 30;
const MAX_PAGE_SIZE = 300;

module.exports = {
  DESCRIPTION_AIRLINE_FIELDS,
  AIRLINE_FIELDS,
  DEFAULT_AIRLINE_FIELDS,
  DEFAULT_AIRLINES_FIELDS,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  DEFAULT_AIRLINES_FIELDS
};
