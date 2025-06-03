import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Trip: a
    .model({
      id: a.id().required(),
      price: a.float().required(),
      availableCapacity: a.integer().required(),
      date: a.datetime().required(),
      // Relationship field referencing the join model
      reservationTrips: a.hasMany('ReservationTrip', 'tripId'),
    })
    .authorization((allow) => [
      allow.publicApiKey(),
      // allow.publicApiKey().to(['read']),
      // allow.authenticated().to(['create', 'update', 'delete', 'read']),
    ]),

  Reservation: a
    .model({
      id: a.id().required(),
      createdAt: a.datetime().required(),
      status: a.enum(['PENDING', 'CONFIRMED', 'CANCELLED']),
      // Relationship field referencing the join model
      reservationTrips: a.hasMany('ReservationTrip', 'reservationId'),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  ReservationTrip: a
    .model({
      id: a.id().required(),
      // Reference fields for the relationships
      tripId: a.id().required(),
      reservationId: a.id().required(),
      reservedCapacity: a.integer().required(),
      // Relationship fields using the reference fields
      trip: a.belongsTo('Trip', 'tripId'),
      reservation: a.belongsTo('Reservation', 'reservationId'),
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

export type Schema = ClientSchema<typeof schema>;

export type Trip = Schema['Trip']['type'];
export type Reservation = Schema['Reservation']['type'];
export type ReservationTrip = Schema['ReservationTrip']['type'];

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
