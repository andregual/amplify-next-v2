'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';

const client = generateClient<Schema>();

export function useReservations() {
  const [reservations, setReservations] = useState<
    Array<Schema['Reservation']['type']>
  >([]);
  const [reservationDetails, setReservationDetails] = useState<
    Record<string, any>
  >({});
  const [loading, setLoading] = useState(true);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const result = await client.models.Reservation.list();
      setReservations(result.data);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReservationDetails = async () => {
    if (reservations.length === 0) return;

    const details: Record<string, any> = {};

    for (const reservation of reservations) {
      try {
        const reservationTripsResult = await client.models.ReservationTrip.list(
          {
            filter: { reservationId: { eq: reservation.id } },
          }
        );

        const tripDetails = [];
        let totalCapacity = 0;
        let totalPrice = 0;

        for (const rt of reservationTripsResult.data) {
          const { data: trip } = await client.models.Trip.get({
            id: rt.tripId,
          });

          if (trip) {
            const subtotal = rt.reservedCapacity * trip.price;
            totalCapacity += rt.reservedCapacity;
            totalPrice += subtotal;

            tripDetails.push({
              ...trip,
              reservedCapacity: rt.reservedCapacity,
              subtotal,
            });
          }
        }

        details[reservation.id] = {
          trips: tripDetails,
          totalCapacity,
          totalPrice,
        };
      } catch (error) {
        console.error(
          `Error fetching details for reservation ${reservation.id}:`,
          error
        );
      }
    }

    setReservationDetails(details);
  };

  const updateReservationStatus = async (
    reservationId: string,
    newStatus: Schema['Reservation']['type']['status']
  ) => {
    try {
      await client.models.Reservation.update({
        id: reservationId,
        status: newStatus,
      });
      fetchReservations();
    } catch (error) {
      console.error('Error updating reservation status:', error);
    }
  };

  useEffect(() => {
    if (reservations.length > 0) {
      fetchReservationDetails();
    }
  }, [reservations]);

  return {
    reservations,
    reservationDetails,
    loading,
    fetchReservations,
    updateReservationStatus,
  };
}
