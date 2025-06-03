'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { Amplify } from 'aws-amplify';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import outputs from '@/amplify_outputs.json';
import { Button, Flex, Heading, Tabs, Text, View } from '@aws-amplify/ui-react';

import { useReservations } from '@/hooks/useReservations';
import { useTrips } from '@/hooks/useTrip';
import AlertBanner from '../components/AlertBanner';
import TripTable from '../components/TripTable';
import ReservationSummary from '../components/ReservationSummary';
import ReservationList from '../components/ReservationsList';
import Navbar from '../components/Navbar';

Amplify.configure(outputs);

const client = generateClient<Schema>();

export default function ReservationsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('trips');
  const [selectedCapacities, setSelectedCapacities] = useState<
    Record<string, number>
  >({});
  const [reserving, setReserving] = useState(false);
  const [reservationSuccess, setReservationSuccess] = useState(false);
  const [reservationError, setReservationError] = useState<string | null>(null);
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const { trips, loading: tripsLoading, createTrip } = useTrips();
  const {
    reservations,
    reservationDetails,
    loading: reservationsLoading,
    fetchReservations,
    updateReservationStatus,
  } = useReservations();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          console.error('No user found, redirecting to sign in');
          router.push('/');
          return;
        }
        setCurrentUser(user);
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };

    fetchCurrentUser();
  }, []);

  const selectedTrips = trips.filter(
    (trip) => selectedCapacities[trip.id] && selectedCapacities[trip.id] > 0
  );

  const totalCapacity = Object.values(selectedCapacities).reduce(
    (sum, capacity) => sum + (capacity || 0),
    0
  );

  const totalPrice = trips.reduce((sum, trip) => {
    const capacity = selectedCapacities[trip.id] || 0;
    return sum + trip.price * capacity;
  }, 0);

  useEffect(() => {
    if (activeTab === 'reservations') {
      fetchReservations();
    }
  }, [activeTab]);

  const handleCapacityChange = (tripId: string, value: number) => {
    setSelectedCapacities((prev) => ({
      ...prev,
      [tripId]: value,
    }));
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const createReservation = async () => {
    if (totalCapacity === 0) return;

    setReserving(true);
    setReservationError(null);

    try {
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
            await client.models.ReservationTrip.create({
              tripId: tripId,
              reservationId: reservation.data?.id,
              reservedCapacity: capacity,
            });

            await client.models.Trip.update({
              id: tripId,
              availableCapacity: trip.availableCapacity - capacity,
            });
          }
        }
      }

      setReservationSuccess(true);
      setReservationId(reservation.data.id);
      setSelectedCapacities({});
    } catch (error) {
      console.error('Error creating reservation:', error);
      setReservationError('Failed to create reservation. Please try again.');
    } finally {
      setReserving(false);
    }
  };

  return (
    <View width={'100%'}>
      <Navbar currentUser={currentUser} />

      {reservationSuccess && (
        <AlertBanner
          type='success'
          title='Reservation Created Successfully'
          reservationId={reservationId}
          onDismiss={() => setReservationSuccess(false)}
        />
      )}

      {reservationError && (
        <AlertBanner
          type='error'
          title='Reservation Failed'
          message={reservationError}
          onDismiss={() => setReservationError(null)}
        />
      )}

      <Tabs
        spacing='equal'
        marginBottom='medium'
        value={activeTab}
        onValueChange={(tab) => setActiveTab(tab)}
        items={[
          {
            label: 'Available Trips',
            value: 'trips',
            content: (
              <>
                <TripTable
                  trips={trips}
                  loading={tripsLoading}
                  selectedCapacities={selectedCapacities}
                  onCapacityChange={handleCapacityChange}
                  onCreateTrip={createTrip}
                />
                <ReservationSummary
                  selectedTrips={selectedTrips}
                  selectedCapacities={selectedCapacities}
                  totalCapacity={totalCapacity}
                  totalPrice={totalPrice}
                  reserving={reserving}
                  onCreateReservation={createReservation}
                />
              </>
            ),
          },
          {
            label: 'My Reservations',
            value: 'reservations',
            content: (
              <ReservationList
                reservations={reservations}
                reservationDetails={reservationDetails}
                loading={reservationsLoading}
                onStatusUpdate={updateReservationStatus}
                onBrowseTrips={() => setActiveTab('trips')}
              />
            ),
          },
        ]}
      />
    </View>
  );
}
