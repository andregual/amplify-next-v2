'use client';

import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import {
  View,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Flex,
  Heading,
  Card,
  Text,
  StepperField,
} from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { Reservation, Schema, Trip } from '@/amplify/data/resource';
import { Amplify } from 'aws-amplify';
import outputs from '@/amplify_outputs.json';

Amplify.configure(outputs);

const ReservationManager = () => {
  const client = generateClient<Schema>();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrips, setSelectedTrips] = useState<{
    [tripId: string]: number;
  }>({});
  const [reservation, setReservation] = useState<Partial<Reservation>>({
    totalCapacity: 0,
    totalPrice: 0,
    status: 'draft',
  });

  useEffect(() => {
    const fetchTrips = async () => {
      const { data } = await client.models.Trip.list();
      setTrips(data);
    };
    fetchTrips();
  }, []);

  const updateTripSelection = (trip: Trip, capacity: number) => {
    const updatedSelections = { ...selectedTrips };

    if (capacity > 0) {
      updatedSelections[trip.id] = capacity;
    } else {
      delete updatedSelections[trip.id];
    }

    const totalCapacity = Object.entries(updatedSelections).reduce(
      (total, [tripId, selectedCapacity]) => {
        const trip = trips.find((t) => t.id === tripId);
        return total + selectedCapacity;
      },
      0
    );

    const totalPrice = Object.entries(updatedSelections).reduce(
      (total, [tripId, selectedCapacity]) => {
        const trip = trips.find((t) => t.id === tripId);
        return total + (trip?.price || 0) * selectedCapacity;
      },
      0
    );

    setSelectedTrips(updatedSelections);
    setReservation({
      totalCapacity,
      totalPrice,
      status: 'draft',
    });
  };

  const confirmReservation = async () => {
    try {
      const { data: newReservation } = await client.models.Reservation.create({
        totalCapacity: reservation.totalCapacity,
        totalPrice: reservation.totalPrice,
        status: 'confirmed',
      });

      if (!newReservation) {
        alert('Failed to create reservation');
        return;
      }

      const updatePromises = Object.entries(selectedTrips).map(
        ([tripId, capacity]) =>
          client.models.Trip.update({
            id: tripId,
            reservationId: newReservation.id,
          })
      );

      await Promise.all(updatePromises);

      setSelectedTrips({});
      setReservation({
        totalCapacity: 0,
        totalPrice: 0,
        status: 'draft',
      });

      const { data } = await client.models.Trip.list();
      setTrips(data);
    } catch (error) {
      console.error('Reservation creation failed', error);
    }
  };

  const handleStepChange = (newValue: number, trip: Trip) => {
    updateTripSelection(trip, newValue);
  };

  return (
    <View padding='1rem'>
      <Flex direction='row' gap='1rem'>
        <View width='60%'>
          <Heading level={3}>Available Trips</Heading>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell as='th'>Date</TableCell>
                <TableCell as='th'>Supplier</TableCell>
                <TableCell as='th'>Price/Unit</TableCell>
                <TableCell as='th'>Capacity</TableCell>
                <TableCell as='th'>Reserve</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {trips.map((trip) => (
                <TableRow key={trip.id}>
                  <TableCell>
                    {trip.date
                      ? new Date(trip.date).toLocaleDateString()
                      : 'N/A'}
                  </TableCell>
                  <TableCell>{trip.supplier}</TableCell>
                  <TableCell>${trip.price?.toFixed(2)}</TableCell>
                  <TableCell>{trip.capacity}</TableCell>
                  <TableCell>
                    <StepperField
                      min={0}
                      max={trip.capacity || 0}
                      value={selectedTrips[trip.id] || 0}
                      onStepChange={(newVal) => handleStepChange(newVal, trip)}
                      label='Units'
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </View>

        <View width='40%'>
          <Heading level={3}>Reservation Summary</Heading>
          <Card>
            <Heading level={4}>Selected Trips:</Heading>
            {Object.entries(selectedTrips).map(([tripId, capacity]) => {
              const trip = trips.find((t) => t.id === tripId);
              return trip ? (
                <Flex key={tripId} justifyContent='space-between'>
                  <Text>{trip.supplier}</Text>
                  <Text>{capacity} units</Text>
                </Flex>
              ) : null;
            })}

            <View marginTop='1rem' paddingTop='0.5rem'>
              <Flex justifyContent='space-between'>
                <Text>Total Capacity:</Text>
                <Text>{reservation.totalCapacity} units</Text>
              </Flex>
              <Flex justifyContent='space-between'>
                <Text>Total Price:</Text>
                <Text>${reservation.totalPrice?.toFixed(2)}</Text>
              </Flex>
            </View>

            <Button
              onClick={confirmReservation}
              isDisabled={reservation.totalCapacity === 0}
              variation='primary'
              isFullWidth
            >
              Confirm Reservation
            </Button>
          </Card>
        </View>
      </Flex>
    </View>
  );
};

export default ReservationManager;
