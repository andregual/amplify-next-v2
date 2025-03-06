'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { Amplify } from 'aws-amplify';
import outputs from '@/amplify_outputs.json';
import { format } from 'date-fns';
import {
  Alert,
  Badge,
  Button,
  Card,
  Divider,
  Flex,
  Heading,
  Loader,
  SelectField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Text,
  View,
} from '@aws-amplify/ui-react';

Amplify.configure(outputs);

const client = generateClient<Schema>();

export default function App() {
  const [activeTab, setActiveTab] = useState('trips');
  const [trips, setTrips] = useState<Array<Schema['Trip']['type']>>([]);
  const [reservationDetails, setReservationDetails] = useState<
    Record<string, any>
  >({});
  const [reservations, setReservations] = useState<
    Array<Schema['Reservation']['type']>
  >([]);
  const [selectedCapacities, setSelectedCapacities] = useState<
    Record<string, number>
  >({});
  const [loading, setLoading] = useState(true);
  const [reservationsLoading, setReservationsLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [reservationSuccess, setReservationSuccess] = useState(false);
  const [reservationError, setReservationError] = useState<string | null>(null);
  const [reservationId, setReservationId] = useState<string | null>(null);

  const selectedTrips = trips.filter(
    (trip) => selectedCapacities[trip.id] && selectedCapacities[trip.id] > 0
  );

  useEffect(() => {
    const subscription = client.models.Trip.observeQuery().subscribe({
      next: ({ items }) => {
        setTrips([...items]);
        setLoading(false);
      },
      error: (error) => {
        console.error('Error fetching trips:', error);
        setLoading(false);
      },
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch reservation details
  useEffect(() => {
    async function fetchDetailsByReservation() {
      if (reservations.length === 0) return;

      const details: Record<string, any> = {};

      for (const reservation of reservations) {
        try {
          // Fetch reservation trips for this reservation
          const reservationTripsResult =
            await client.models.ReservationTrip.list({
              filter: {
                reservationId: {
                  eq: reservation.id,
                },
              },
            });

          const tripDetails = [];
          let totalCapacity = 0;
          let totalPrice = 0;

          // For each reservation trip, get the trip details
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
      setReservationsLoading(false);
    }

    if (reservations.length > 0) {
      fetchDetailsByReservation();
    }
  }, [reservations]);

  // Fetch reservations
  useEffect(() => {
    if (activeTab === 'reservations') {
      fetchReservations();
    }
  }, [activeTab]);

  const fetchReservations = async () => {
    setReservationsLoading(true);
    try {
      const result = await client.models.Reservation.list();
      setReservations(result.data);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setReservationsLoading(false);
    }
  };

  const handleCapacityChange = (tripId: string, value: number) => {
    setSelectedCapacities((prev) => ({
      ...prev,
      [tripId]: value,
    }));
  };

  const totalCapacity = Object.values(selectedCapacities).reduce(
    (sum, capacity) => sum + (capacity || 0),
    0
  );

  const totalPrice = trips.reduce((sum, trip) => {
    const capacity = selectedCapacities[trip.id] || 0;
    return sum + trip.price * capacity;
  }, 0);

  // only for seeding purpose
  const createTrip = async () => {
    try {
      await client.models.Trip.create({
        availableCapacity: 10,
        date: new Date().toISOString(),
        price: 25.0,
      });
    } catch (error) {
      console.error('Error creating trip:', error);
    }
  };

  function getWeekNumber(date: Date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear =
      (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  // Group trips by week
  const tripsByWeek = trips.reduce((acc, trip) => {
    const date = new Date(trip.date);
    const weekNumber = getWeekNumber(date);
    const weekLabel = `Week ${weekNumber}`;

    if (!acc[weekLabel]) {
      acc[weekLabel] = [];
    }

    acc[weekLabel].push(trip);
    return acc;
  }, {} as Record<string, Array<Schema['Trip']['type']>>);

  // Create a reservation with selected trips
  const createReservation = async () => {
    if (totalCapacity === 0) return;

    setReserving(true);
    setReservationError(null);

    try {
      // 1. Create a new reservation
      const reservation = await client.models.Reservation.create({
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      });

      if (!reservation.data?.id) {
        throw new Error('Failed to create reservation');
      }

      for (const tripId in selectedCapacities) {
        const capacity = selectedCapacities[tripId];
        if (capacity > 0) {
          const trip = trips.find((t) => t.id === tripId);

          if (trip) {
            // Create reservation trip (join model)
            await client.models.ReservationTrip.create({
              tripId: tripId,
              reservationId: reservation.data?.id,
              reservedCapacity: capacity,
            });

            // Update available capacity
            await client.models.Trip.update({
              id: tripId,
              availableCapacity: trip.availableCapacity - capacity,
            });
          }
        }
      }

      setReservationSuccess(true);
      setReservationId(reservation.data.id);

      // Reset selected capacities after successful reservation
      setSelectedCapacities({});
    } catch (error) {
      console.error('Error creating reservation:', error);
      setReservationError('Failed to create reservation. Please try again.');
    } finally {
      setReserving(false);
    }
  };

  // Get status badge variation
  function getStatusBadgeVariation(status: string) {
    switch (status) {
      case 'CONFIRMED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'CANCELLED':
        return 'error';
      default:
        return 'info';
    }
  }

  // Update reservation status
  const updateReservationStatus = async (
    reservationId: string,
    newStatus: Schema['Reservation']['type']['status']
  ) => {
    try {
      await client.models.Reservation.update({
        id: reservationId,
        status: newStatus,
      });

      // Refresh reservations after update
      fetchReservations();
    } catch (error) {
      console.error('Error updating reservation status:', error);
    }
  };

  return (
    <main>
      <View padding='medium'>
        {reservationSuccess && (
          <Alert
            variation='success'
            isDismissible
            heading='Reservation Created Successfully'
            marginBottom='medium'
          >
            <Text>
              Your reservation (ID: {reservationId}) has been created
              successfully.
            </Text>
          </Alert>
        )}

        {reservationError && (
          <Alert
            variation='error'
            isDismissible
            heading='Reservation Failed'
            marginBottom='medium'
            onDismiss={() => setReservationError(null)}
          >
            {reservationError}
          </Alert>
        )}

        <Tabs
          spacing='equal'
          marginBottom='medium'
          value={activeTab}
          onValueChange={(tab) => setActiveTab(tab)}
          items={[
            {
              label: 'Trips',
              value: 'trips',
              content: (
                <>
                  <Card>
                    <Flex direction='column' gap='medium'>
                      <Flex justifyContent='space-between' alignItems='center'>
                        <Heading level={3}>Trips</Heading>

                        <Flex gap='small' alignItems='center'>
                          <Button size='small' onClick={createTrip}>
                            + New Trip (Dev Only)
                          </Button>
                        </Flex>
                      </Flex>
                      {loading ? (
                        <Flex justifyContent='center' padding='large'>
                          <Loader size='large' />
                        </Flex>
                      ) : (
                        <Table highlightOnHover>
                          <TableHead>
                            <TableRow>
                              <TableCell as='th'>Week</TableCell>
                              <TableCell as='th'>Supplier</TableCell>
                              <TableCell as='th'>Stops</TableCell>
                              <TableCell as='th'>Start Date</TableCell>
                              <TableCell as='th'>Finish Date</TableCell>
                              <TableCell as='th'>Transit time</TableCell>
                              <TableCell as='th'>Capacity blocks</TableCell>
                              <TableCell as='th'>Rate</TableCell>
                              <TableCell as='th'>Availability</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {trips.map((trip) => {
                              const startDate = new Date(trip.date);
                              const finishDate = new Date(trip.date);
                              finishDate.setHours(finishDate.getHours() + 4); // Assuming 4-hour transit

                              const weekNumber = getWeekNumber(startDate);

                              return (
                                <TableRow key={trip.id}>
                                  <TableCell>{weekNumber}</TableCell>
                                  <TableCell>
                                    Supplier Org {trip.id.slice(-1)}
                                  </TableCell>
                                  <TableCell>2</TableCell>
                                  <TableCell>
                                    {format(startDate, 'MM/dd/yyyy HH:mm')}
                                  </TableCell>
                                  <TableCell>
                                    {format(finishDate, 'MM/dd/yyyy HH:mm')}
                                  </TableCell>
                                  <TableCell>4h 0m</TableCell>
                                  <TableCell>
                                    <SelectField
                                      label=''
                                      labelHidden
                                      value={
                                        selectedCapacities[
                                          trip.id
                                        ]?.toString() || '0'
                                      }
                                      onChange={(e) =>
                                        handleCapacityChange(
                                          trip.id,
                                          parseInt(e.target.value, 10)
                                        )
                                      }
                                    >
                                      {Array.from(
                                        { length: trip.availableCapacity + 1 },
                                        (_, i) => (
                                          <option key={i} value={i.toString()}>
                                            {i}
                                          </option>
                                        )
                                      )}
                                    </SelectField>
                                  </TableCell>
                                  <TableCell>${trip.price}/CB</TableCell>
                                  <TableCell>
                                    <Badge variation='success'>
                                      {trip.availableCapacity}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      )}
                    </Flex>
                  </Card>

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
                                  <Text>
                                    {format(startDate, 'MMM d, yyyy')}
                                  </Text>
                                  <Text fontSize='small' color='neutral.60'>
                                    Week {getWeekNumber(startDate)} - {capacity}{' '}
                                    {capacity === 1 ? 'block' : 'blocks'} × $
                                    {trip.price}
                                    /block
                                  </Text>
                                </Flex>
                                <Text fontWeight='semibold'>
                                  ${subtotal.toFixed(2)}
                                </Text>
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

                      <Flex
                        justifyContent='space-between'
                        marginBottom='medium'
                      >
                        <Text>Expected total</Text>
                        <Text fontWeight='bold'>${totalPrice.toFixed(2)}</Text>
                      </Flex>

                      <Button
                        variation='primary'
                        isFullWidth
                        isDisabled={totalCapacity === 0 || reserving}
                        isLoading={reserving}
                        loadingText='Creating Reservation...'
                        onClick={createReservation}
                      >
                        Reserve Now
                      </Button>

                      <Text
                        fontSize='small'
                        color='neutral.60'
                        textAlign='center'
                      >
                        You will not be charged yet. Weekly billing will begin
                        72 hours before your first week's shipment.
                      </Text>
                    </Flex>
                  </Card>
                </>
              ),
            },
            {
              label: 'Reservations',
              value: 'reservations',
              content: (
                <>
                  {' '}
                  <Card>
                    <Flex direction='column' gap='medium'>
                      <Heading level={3}>My Reservations</Heading>

                      {reservationsLoading ? (
                        <Flex justifyContent='center' padding='large'>
                          <Loader size='large' />
                        </Flex>
                      ) : reservations.length === 0 ? (
                        <Flex
                          justifyContent='center'
                          direction='column'
                          alignItems='center'
                          padding='large'
                        >
                          <Text>You don't have any reservations yet.</Text>
                          <Button
                            onClick={() => setActiveTab('trips')}
                            marginTop='medium'
                          >
                            Browse Trips
                          </Button>
                        </Flex>
                      ) : (
                        <Flex direction='column' gap='medium'>
                          {reservations.map((reservation) => {
                            const details = reservationDetails[reservation.id];
                            const isExpanded = true; // For demo purposes, showing all details

                            return (
                              <Card key={reservation.id} variation='outlined'>
                                <Flex direction='column' gap='small'>
                                  <Flex
                                    justifyContent='space-between'
                                    alignItems='center'
                                  >
                                    <Flex direction='column'>
                                      <Heading level={5} marginBottom='0'>
                                        Reservation{' '}
                                        {reservation.id.substring(0, 8)}
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
                                            <TableCell as='th'>
                                              Blocks
                                            </TableCell>
                                            <TableCell as='th'>Rate</TableCell>
                                            <TableCell as='th'>Total</TableCell>
                                          </TableRow>
                                        </TableHead>
                                        <TableBody>
                                          {details.trips.map((trip: any) => {
                                            const tripDate = new Date(
                                              trip.date
                                            );
                                            return (
                                              <TableRow key={trip.id}>
                                                <TableCell>
                                                  {format(
                                                    tripDate,
                                                    'MM/dd/yyyy'
                                                  )}
                                                </TableCell>
                                                <TableCell>
                                                  Week {getWeekNumber(tripDate)}
                                                </TableCell>
                                                <TableCell>
                                                  {trip.reservedCapacity}
                                                </TableCell>
                                                <TableCell>
                                                  ${trip.price}/block
                                                </TableCell>
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
                                              updateReservationStatus(
                                                reservation.id,
                                                'CONFIRMED'
                                              )
                                            }
                                            variation='primary'
                                          >
                                            Confirm
                                          </Button>
                                          <Button
                                            onClick={() =>
                                              updateReservationStatus(
                                                reservation.id,
                                                'CANCELLED'
                                              )
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
                                              updateReservationStatus(
                                                reservation.id,
                                                'CANCELLED'
                                              )
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
                          })}
                        </Flex>
                      )}
                    </Flex>
                  </Card>
                </>
              ),
            },
          ]}
        />
      </View>
    </main>
  );
}
