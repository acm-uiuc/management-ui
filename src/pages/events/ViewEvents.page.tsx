import React, { useEffect, useState } from 'react';
import { Title, Box, Card, Text, Grid, SimpleGrid, Button, Flex, Table } from '@mantine/core';
import { z } from 'zod';
import dayjs from 'dayjs';
import { useApi } from '@/util/api';
import { getRunEnvironmentConfig } from '@/config';
import { AuthGuard } from '@/components/AuthGuard';
import FullScreenLoader from '@/components/AuthContext/LoadingScreen';
import { notifications } from '@mantine/notifications';

const repeatOptions = ['weekly', 'biweekly'] as const;

const baseSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  start: z.string(),
  end: z.optional(z.string()),
  location: z.string(),
  locationLink: z.optional(z.string().url()),
  host: z.string(),
  featured: z.boolean().default(false),
  paidEventId: z.optional(z.string().min(1)),
});

const requestSchema = baseSchema.extend({
  repeats: z.optional(z.enum(repeatOptions)),
  repeatEnds: z.string().optional(),
});

const getEventSchema = requestSchema.extend({
  id: z.string(),
});

export type EventGetResponse = z.infer<typeof getEventSchema>;
const getEventsSchema = z.array(getEventSchema);
export type EventsGetResponse = z.infer<typeof getEventsSchema>;

export const ViewEventsPage: React.FC = () => {
  const [eventList, setEventList] = useState<EventsGetResponse>([]);
  const api = useApi('events');

  useEffect(() => {
    const getEvents = async () => {
      const response = await api.get('/api/v1/events');
      const events = response.data;
      events.sort((a: EventGetResponse, b: EventGetResponse) => {
        return a.start.localeCompare(b.start);
      });
      setEventList(response.data);
    };
    getEvents();
  }, []);

  const deleteEvent = async (eventId: string) => {
    try {
      const response = await api.delete(`/api/v1/events/${eventId}`);
      setEventList((prevEvents) => prevEvents.filter((event) => event.id !== eventId));
      notifications.show({
        title: 'Event deleted',
        message: `The event was successfully deleted.`,
      });
    } catch (error) {
      console.error(error);
      notifications.show({
        title: 'Error deleting event',
        message: `${error}`,
        color: 'red',
      });
    }
  };

  if (eventList.length === 0) {
    return <FullScreenLoader />;
  }

  return (
    <AuthGuard resourceDef={{ service: 'events', validRoles: ['manage:events'] }}>
      <Title order={2}>All Events</Title>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Title</Table.Th>
            <Table.Th>Start</Table.Th>
            <Table.Th>End</Table.Th>
            <Table.Th>Location</Table.Th>
            <Table.Th>Description</Table.Th>
            <Table.Th>Host</Table.Th>
            <Table.Th>Featured</Table.Th>
            <Table.Th>Repeats</Table.Th>
            <Table.Th />
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {eventList.map((event) => (
            <Table.Tr key={event.id}>
              <Table.Td>{event.title}</Table.Td>
              <Table.Td>{dayjs(event.start).format('MMM D YYYY hh:mm')}</Table.Td>
              <Table.Td>{event.end ? dayjs(event.end).format('MMM D YYYY hh:mm') : 'N/A'}</Table.Td>
              <Table.Td>{event.location}</Table.Td>
              <Table.Td>{event.description}</Table.Td>
              <Table.Td>{event.host}</Table.Td>
              <Table.Td>{event.featured ? 'Yes' : 'No'}</Table.Td>
              <Table.Td>{event.repeats}</Table.Td>
              <Table.Td>
                <Button
                  component="a"
                  href={`/events/edit/${event.id}`}
                >
                  Edit
                </Button>
              </Table.Td>
              <Table.Td>
                <Button
                  color="red"
                  onClick={() => {
                    deleteEvent(event.id);
                  }}
                >
                  Delete
                </Button>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </AuthGuard>
  );
};
