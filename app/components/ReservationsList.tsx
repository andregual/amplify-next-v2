'use client';

import { format } from 'date-fns';
import {
  Badge,
  Button,
  Card,
  Divider,
  Flex,
  Heading,
  Loader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Text,
} from '@aws-amplify/ui-react';
import type { Schema } from '@/amplify/data/resource';
import { getStatusBadgeVariation, getWeekNumber } from '@/utils/utils';

interface ReservationListProps {
  reservations: Array<Schema['Reservation']['type']>;
  reservationDetails: Record<string, any>;
  loading: boolean;
  onStatusUpdate: (
    reservationId: string,
    status: Schema['Reservation']['type']['status']
  ) => void;
  onBrowseTrips: () => void;
}

export default function ReservationList({
  reservations,
  reservationDetails,
  loading,
  onStatusUpdate,
  onBrowseTrips,
}: ReservationListProps) {
  if (reservations.length === 0 && !loading) {
    return (
      <Card>
        <Flex direction='column' gap='medium'>
          <Heading level={3}>My Reservations</Heading>
          <Flex
            justifyContent='center'
            direction='column'
            alignItems='center'
            padding='large'
          >
            <Text>You don't have any reservations yet.</Text>
            <Button onClick={onBrowseTrips} marginTop='medium'>
              Browse Trips
            </Button>
          </Flex>
        </Flex>
      </Card>
    );
  }

  return (
    <Card>
      <Flex direction='column' gap='medium'>
        <Heading level={3}>My Reservations</Heading>
        <Flex direction='column' gap='medium'>
          {loading ? (
            <Flex justifyContent='center' padding='large'>
              <Loader size='large' />
            </Flex>
          ) : (
            reservations.map((reservation) => {
              const details = reservationDetails[reservation.id];
              const isExpanded = true; // For demo purposes

              return (
                <Card key={reservation.id} variation='outlined'>
                  <Flex direction='column' gap='small'>
                    <Flex justifyContent='space-between' alignItems='center'>
                      <Flex direction='column'>
                        <Heading level={5} marginBottom='0'>
                          Reservation {reservation.id.substring(0, 8)}
                        </Heading>
                        <Text fontSize='small' color='neutral.60'>
                          Created on{' '}
                          {format(
                            new Date(reservation.createdAt),
                            'MMM d, yyyy'
                          )}
                        </Text>
                      </Flex>
                      <Badge
                        variation={getStatusBadgeVariation(
                          reservation.status || ''
                        )}
                      >
                        {reservation.status}
                      </Badge>
                    </Flex>

                    {isExpanded && details && (
                      <>
                        <Divider marginBlock='small' />
                        <Table size='small'>
                          <TableHead>
                            <TableRow>
                              <TableCell as='th'>Date</TableCell>
                              <TableCell as='th'>Week</TableCell>
                              <TableCell as='th'>Blocks</TableCell>
                              <TableCell as='th'>Rate</TableCell>
                              <TableCell as='th'>Total</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {details.trips.map((trip: any) => {
                              const tripDate = new Date(trip.date);
                              return (
                                <TableRow key={trip.id}>
                                  <TableCell>
                                    {format(tripDate, 'MM/dd/yyyy')}
                                  </TableCell>
                                  <TableCell>
                                    Week {getWeekNumber(tripDate)}
                                  </TableCell>
                                  <TableCell>{trip.reservedCapacity}</TableCell>
                                  <TableCell>${trip.price}/block</TableCell>
                                  <TableCell>
                                    ${trip.subtotal.toFixed(2)}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>

                        <Flex
                          justifyContent='space-between'
                          alignItems='center'
                          marginTop='small'
                        >
                          <Text fontWeight='bold'>Total:</Text>
                          <Text fontWeight='bold'>
                            ${details.totalPrice.toFixed(2)}
                          </Text>
                        </Flex>

                        {reservation.status === 'PENDING' && (
                          <Flex gap='small' marginTop='medium'>
                            <Button
                              onClick={() =>
                                onStatusUpdate(reservation.id, 'CONFIRMED')
                              }
                              variation='primary'
                            >
                              Confirm
                            </Button>
                            <Button
                              onClick={() =>
                                onStatusUpdate(reservation.id, 'CANCELLED')
                              }
                              variation='destructive'
                            >
                              Cancel
                            </Button>
                          </Flex>
                        )}

                        {reservation.status === 'CONFIRMED' && (
                          <Flex gap='small' marginTop='medium'>
                            <Button
                              onClick={() =>
                                onStatusUpdate(reservation.id, 'CANCELLED')
                              }
                              variation='destructive'
                            >
                              Cancel Reservation
                            </Button>
                          </Flex>
                        )}
                      </>
                    )}
                  </Flex>
                </Card>
              );
            })
          )}
        </Flex>
      </Flex>
    </Card>
  );
}
