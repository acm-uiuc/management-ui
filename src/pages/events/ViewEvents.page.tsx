import React, { useEffect, useState } from 'react';
import { Title, Box, Card, Text, Grid, SimpleGrid, Button, Flex } from '@mantine/core';
import { z } from 'zod';
import dayjs from 'dayjs';
import { useApi } from '@/util/api';
import { getRunEnvironmentConfig } from '@/config';
import { AuthGuard } from '@/components/AuthGuard';
import FullScreenLoader from '@/components/AuthContext/LoadingScreen';

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
  const { friendlyName } = getRunEnvironmentConfig().ServiceConfiguration.events;
  const [eventList, setEventList] = useState<EventsGetResponse>([]);
  const api = useApi('events');

  useEffect(() => {
    const getEvents = async () => {
      const response = await api.get('/api/v1/events');
      setEventList(response.data);
    };
    getEvents();
  }, []);

  if (eventList.length === 0) {
    return <FullScreenLoader />;
  }

  return (
    <AuthGuard resourceDef={{ service: 'events', validRoles: ['manage:events'] }}>
      <Title order={2}>All Events</Title>
      <SimpleGrid cols={3}>
        {eventList.map((event) => (
            <Card key={event.id} shadow="xs" padding="md" radius="md" style={{ marginBottom: 20 }}>
              <Flex direction="row" justify="space-between">
                <Title order={4}>{event.title}</Title>
                <Button
                  component="a"
                  href={`/events/edit/${event.id}`}
                >
                  Edit
                </Button>
              </Flex>
              <Text>{dayjs(event.start).format('MMMM D, YYYY')}</Text>
              <Text>{event.location}</Text>
              <Text>{event.description}</Text>
              <Text>{event.host}</Text>
              {event.featured && <Text>Featured</Text>}
              {event.repeats && <Text>Repeats "{event.repeats}"</Text>}
            </Card>
        ))}
      </SimpleGrid>
    </AuthGuard>
  );
};
