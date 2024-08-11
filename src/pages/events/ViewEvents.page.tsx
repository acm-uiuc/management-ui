import React, { useEffect, useState } from 'react';
import { Title, Box, TextInput, Textarea, Switch, Select, Button } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { DateTimePicker } from '@mantine/dates';
import { z } from 'zod';
import dayjs from 'dayjs';
import { notifications } from '@mantine/notifications';
import { useApi } from '@/util/api';
import { getRunEnvironmentConfig } from '@/config';
import { AuthGuard } from '@/components/AuthGuard';
import FullScreenLoader from '@/components/AuthContext/LoadingScreen';

const repeatOptions = ['weekly', 'biweekly'] as const;

const baseBodySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  start: z.date(),
  end: z.optional(z.date()),
  location: z.string().min(1, 'Location is required'),
  locationLink: z.optional(z.string().url('Invalid URL')),
  host: z.string().min(1, 'Host is required'),
  featured: z.boolean().default(false),
});

const requestBodySchema = baseBodySchema
  .extend({
    repeats: z.optional(z.enum(repeatOptions)),
    repeatEnds: z.date().optional(),
  })
  .refine((data) => (data.repeatEnds ? data.repeats !== undefined : true), {
    message: 'Repeats is required when Repeat Ends is defined',
  });

type EventPostRequest = z.infer<typeof requestBodySchema>;

export const EventsPage: React.FC = () => {
  const { friendlyName } = getRunEnvironmentConfig().ServiceConfiguration.events;
  const [orgList, setOrgList] = useState<null | string[]>(null);
  const api = useApi('events');

  useEffect(() => {
    const getOrgs = async () => {
      const response = await api.get('/api/v1/organizations');
      setOrgList(response.data);
    };
    getOrgs();
  }, []);

  const form = useForm<EventPostRequest>({
    validate: zodResolver(requestBodySchema),
    initialValues: {
      title: '',
      description: '',
      start: new Date(),
      end: new Date(),
      location: '',
      locationLink: undefined,
      host: orgList ? orgList[0] : 'ACM',
      featured: false,
      repeats: undefined,
      repeatEnds: undefined,
    },
  });

  const handleSubmit = async (values: EventPostRequest) => {
    try {
      // const response = await api.post('/api/v1/events', values);
      const realValues = {
        ...values,
        start: dayjs(values.start).format('YYYY-MM-DD[T]HH:mm:00'),
        end: dayjs(values.end).format('YYYY-MM-DD[T]HH:mm:00'),
      };
      const response = await api.post('/api/v1/events', realValues);
      notifications.show({
        title: 'Event created!',
        message: `The event ID is "${response.data.id}".`,
      });
    } catch (error) {
      console.error('Error creating event:', error);
      notifications.show({
        message: 'Failed to create event, please try again.',
      });
    }
  };

  if (orgList === null) {
    return <FullScreenLoader />;
  }

  return (
    <AuthGuard resourceDef={{ service: 'events', validRoles: ['manage:events'] }}>
      <Title order={2}>Add Event</Title>
      <Box maw={400} mx="auto" mt="xl">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            label="Event Title"
            placeholder="Event title"
            {...form.getInputProps('title')}
          />
          <Textarea
            label="Event Description"
            placeholder="Event description"
            {...form.getInputProps('description')}
          />
          <DateTimePicker
            label="Start Date"
            valueFormat="MM-DD-YYYY h:mm A [Urbana Time]"
            placeholder="Pick start date"
            {...form.getInputProps('start')}
          />
          <DateTimePicker
            label="End Date"
            valueFormat="MM-DD-YYYY h:mm A [Urbana Time]"
            placeholder="Pick end date (optional)"
            {...form.getInputProps('end')}
          />
          <TextInput
            label="Event Location"
            placeholder="ACM Room"
            {...form.getInputProps('location')}
          />
          <TextInput
            label="Location Link"
            placeholder="https://maps.app.goo.gl/dwbBBBkfjkgj8gvA8"
            {...form.getInputProps('locationLink')}
          />
          <Select
            label="Host"
            placeholder="Select host organization"
            data={orgList.map((org) => ({ value: org, label: org }))}
            {...form.getInputProps('host')}
          />
          <Switch
            label="Featured Event?"
            {...form.getInputProps('featured', { type: 'checkbox' })}
          />
          <Select
            label="Repeats"
            placeholder="Select repeat option"
            data={repeatOptions.map((option) => ({ value: option, label: option }))}
            clearable
            {...form.getInputProps('repeats')}
          />
          {form.values.repeats && (
            <DateTimePicker
              valueFormat="MM-DD-YYYY h:mm A [Urbana Time]"
              label="Repeat Ends"
              placeholder="Pick repeat end date"
              {...form.getInputProps('repeatEnds')}
            />
          )}
          <Button type="submit" mt="md">
            Create Event
          </Button>
        </form>
      </Box>
    </AuthGuard>
  );
};
