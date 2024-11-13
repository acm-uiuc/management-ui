import React, { useEffect, useState } from 'react';
import {
  Title,
  Box,
  Card,
  Text,
  Grid,
  SimpleGrid,
  Button,
  Flex,
  Table,
  Modal,
  Group,
} from '@mantine/core';
import { z } from 'zod';
import dayjs from 'dayjs';
import { useApi } from '@/util/api';
import { getRunEnvironmentConfig } from '@/config';
import { AuthGuard } from '@/components/AuthGuard';
import FullScreenLoader from '@/components/AuthContext/LoadingScreen';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useDisclosure } from '@mantine/hooks';
import { capitalizeFirstLetter } from './ManageEvent.page';

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
  const api = useApi('core');
  const [opened, { open, close }] = useDisclosure(false);
  const [deleteCandidate, setDeleteCandidate] = useState<EventGetResponse | null>(null);
  const navigate = useNavigate();

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
      close();
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
    <AuthGuard resourceDef={{ service: 'core', validRoles: ['manage:events'] }}>
      {deleteCandidate && (
        <Modal
          opened={opened}
          onClose={() => {
            setDeleteCandidate(null);
            close();
          }}
          title="Confirm action"
        >
          <Text>
            Are you sure you want to delete the event <i>{deleteCandidate?.title}</i>?
          </Text>
          <hr />
          <Group>
            <Button
              leftSection={<IconTrash />}
              onClick={() => {
                deleteEvent(deleteCandidate?.id);
              }}
            >
              Delete
            </Button>
          </Group>
        </Modal>
      )}
      <div>
        <Button
          leftSection={<IconPlus size={14} />}
          onClick={() => {
            navigate('/events/add');
          }}
        >
          New Calendar Event
        </Button>
      </div>

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
              <Table.Td>{capitalizeFirstLetter(event.repeats || 'Never') || 'Never'}</Table.Td>
              <Table.Td>
                <Button component="a" href={`/events/edit/${event.id}`}>
                  Edit
                </Button>
              </Table.Td>
              <Table.Td>
                <Button
                  color="red"
                  onClick={() => {
                    setDeleteCandidate(event);
                    open();
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
