'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
  Badge,
  Button,
  Card,
  Flex,
  Heading,
  Loader,
  SelectField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@aws-amplify/ui-react';
import type { Schema } from '@/amplify/data/resource';
import { getWeekNumber } from '@/utils/utils';

interface TripTableProps {
  trips: Array<Schema['Trip']['type']>;
  loading: boolean;
  selectedCapacities: Record<string, number>;
  onCapacityChange: (tripId: string, value: number) => void;
  onCreateTrip: () => void;
}

export default function TripTable({
  trips,
  loading,
  selectedCapacities,
  onCapacityChange,
  onCreateTrip,
}: TripTableProps) {
  return (
    <Card>
      <Flex direction='column' gap='medium'>
        <Flex justifyContent='space-between' alignItems='center'>
          <Heading level={3}>Trips</Heading>
          <Flex gap='small' alignItems='center'>
            <Button size='small' onClick={onCreateTrip}>
              + New Trip (Dev Only)
            </Button>
          </Flex>
        </Flex>

        {loading ? (
          <Flex justifyContent='center' padding='large'>
            <Loader size='large' />
          </Flex>
        ) : (
          <Flex overflow='auto' width='100%'>
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
                  finishDate.setHours(finishDate.getHours() + 4);
                  const weekNumber = getWeekNumber(startDate);

                  return (
                    <TableRow key={trip.id}>
                      <TableCell>{weekNumber}</TableCell>
                      <TableCell>Supplier Org {trip.id.slice(-1)}</TableCell>
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
                          value={selectedCapacities[trip.id]?.toString() || '0'}
                          onChange={(e) =>
                            onCapacityChange(
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
          </Flex>
        )}
      </Flex>
    </Card>
  );
}
