// hooks/useTrips.ts
'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';

const client = generateClient<Schema>();

export function useTrips() {
  const [trips, setTrips] = useState<Array<Schema['Trip']['type']>>([]);
  const [loading, setLoading] = useState(true);

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

  return { trips, loading, createTrip };
}
