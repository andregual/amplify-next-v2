'use client';

import { format } from 'date-fns';
import {
  Button,
  Card,
  Divider,
  Flex,
  Heading,
  Text,
} from '@aws-amplify/ui-react';
import type { Schema } from '@/amplify/data/resource';
import { getWeekNumber } from '@/utils/utils';

interface ReservationSummaryProps {
  selectedTrips: Array<Schema['Trip']['type']>;
  selectedCapacities: Record<string, number>;
  totalCapacity: number;
  totalPrice: number;
  reserving: boolean;
  onCreateReservation: () => void;
}

export default function ReservationSummary({
  selectedTrips,
  selectedCapacities,
  totalCapacity,
  totalPrice,
  reserving,
  onCreateReservation,
}: ReservationSummaryProps) {
  return (
    <Card variation='elevated' marginTop='medium'>
      <Flex direction='column' gap='medium' padding='medium'>
        <Heading level={4}>Total Reservation</Heading>

        {selectedTrips.length > 0 ? (
          <>
            <Heading level={5} marginTop='0'>
              Selected Trips
            </Heading>

            {selectedTrips.map((trip) => {
              const startDate = new Date(trip.date);
              const capacity = selectedCapacities[trip.id] || 0;
              const subtotal = trip.price * capacity;

              return (
                <Flex
                  key={trip.id}
                  justifyContent='space-between'
                  alignItems='center'
                >
                  <Flex direction='column'>
                    <Text>{format(startDate, 'MMM d, yyyy')}</Text>
                    <Text fontSize='small' color='neutral.60'>
                      Week {getWeekNumber(startDate)} - {capacity}{' '}
                      {capacity === 1 ? 'block' : 'blocks'} × ${trip.price}
                      /block
                    </Text>
                  </Flex>
                  <Text fontWeight='semibold'>${subtotal.toFixed(2)}</Text>
                </Flex>
              );
            })}

            <Divider marginBlock='small' />
          </>
        ) : (
          <Text>No trips selected</Text>
        )}

        <Flex
          justifyContent='space-between'
          borderColor='neutral.20'
          paddingBottom='small'
        >
          <Text>Total Capacity Blocks</Text>
          <Text fontWeight='bold'>{totalCapacity}</Text>
        </Flex>

        <Flex justifyContent='space-between' marginBottom='medium'>
          <Text>Expected total</Text>
          <Text fontWeight='bold'>${totalPrice.toFixed(2)}</Text>
        </Flex>

        <Button
          variation='primary'
          isFullWidth
          isDisabled={totalCapacity === 0 || reserving}
          isLoading={reserving}
          loadingText='Creating Reservation...'
          onClick={onCreateReservation}
        >
          Reserve Now
        </Button>

        <Text fontSize='small' color='neutral.60' textAlign='center'>
          You will not be charged yet. Weekly billing will begin 72 hours before
          your first week's shipment.
        </Text>
      </Flex>
    </Card>
  );
}
