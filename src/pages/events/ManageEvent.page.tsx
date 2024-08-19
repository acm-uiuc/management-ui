import React, { useEffect, useState } from 'react';
import { Title, Box, TextInput, Textarea, Switch, Select, Button, Loader } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { DateTimePicker } from '@mantine/dates';
import { z } from 'zod';
import dayjs from 'dayjs';
import { notifications } from '@mantine/notifications';
import { useApi } from '@/util/api';
import { getRunEnvironmentConfig } from '@/config';
import { AuthGuard } from '@/components/AuthGuard';
import FullScreenLoader from '@/components/AuthContext/LoadingScreen';
import { useParams } from 'react-router-dom';


function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

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
  paidEventId: z.string().min(1, 'Paid Event ID must be at least 1 character').optional(),
});

const requestBodySchema = baseBodySchema
  .extend({
    repeats: z.optional(z.enum(repeatOptions)),
    repeatEnds: z.date().optional(),
  })
  .refine((data) => (data.repeatEnds ? data.repeats !== undefined : true), {
    message: 'Repeat frequency is required when Repeat End is specified.',
  })
  .refine((data) => !data.end || (data.end >= data.start), {
    message: "Event end date cannot be earlier than the start date.",
    path: ["end"],
  })
  .refine((data) => !data.repeatEnds || (data.repeatEnds >= data.start), {
    message: "Repeat end date cannot be earlier than the start date.",
    path: ["repeatEnds"],
  });


type EventPostRequest = z.infer<typeof requestBodySchema>;

export const ManageEventPage: React.FC = () => {
  const [orgList, setOrgList] = useState<null | string[]>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const api = useApi('events');

  const { eventId } = useParams();

  const isEditing = eventId !== undefined;

  useEffect(() => {
    const getOrgs = async () => {
      const response = await api.get('/api/v1/organizations');
      setOrgList(response.data);
    };
    getOrgs();
  }, []);

  useEffect(() => {
    if (!isEditing) {
      return;
    }
    // Fetch event data and populate form
    const getEvent = async () => {
      try {
        const response = await api.get(`/api/v1/events/${eventId}`);
        const eventData = response.data;
        const formValues = {
          title: eventData.title,
          description: eventData.description,
          start: new Date(eventData.start),
          end: eventData.end ? new Date(eventData.end) : undefined,
          location: eventData.location,
          locationLink: eventData.locationLink,
          host: eventData.host,
          featured: eventData.featured,
          repeats: eventData.repeats,
          repeatEnds: eventData.repeatEnds ? new Date(eventData.repeatEnds) : undefined,
          paidEventId: eventData.paidEventId,
        };
        form.setValues(formValues);
      } catch (error) {
        console.error('Error fetching event data:', error);
        notifications.show({
          message: 'Failed to fetch event data, please try again.',
        });
      }
    };
    getEvent();
  }, [eventId, isEditing]);

  const form = useForm<EventPostRequest>({
    validate: zodResolver(requestBodySchema),
    initialValues: {
      title: '',
      description: '',
      start: new Date(),
      end: new Date((new Date()).valueOf() + (3.6e+6)), // 1 hr later
      location: 'ACM Room',
      locationLink: 'https://maps.app.goo.gl/dwbBBBkfjkgj8gvA8',
      host: 'ACM',
      featured: false,
      repeats: undefined,
      repeatEnds: undefined,
      paidEventId: undefined,
    },
  });

  const checkPaidEventId = async (paidEventId: string) => {
    try {
      const merchEndpoint = getRunEnvironmentConfig().ServiceConfiguration.merch.baseEndpoint;
      const ticketEndpoint = getRunEnvironmentConfig().ServiceConfiguration.tickets.baseEndpoint;
      const paidEventHref = paidEventId.startsWith('merch:')
          ? `${merchEndpoint}/api/v1/merch/details?itemid=${paidEventId.slice(6)}`
          : `${ticketEndpoint}/api/v1/event/details?eventid=${paidEventId}`
      const response = await api.get(paidEventHref);
      return Boolean(response.status < 299 && response.status >= 200);
    } catch (error) {
      console.error('Error validating paid event ID:', error);
      return false;
    }
  };

  const handleSubmit = async (values: EventPostRequest) => {
    try {
      const realValues = {
        ...values,
        start: dayjs(values.start).format('YYYY-MM-DD[T]HH:mm:00'),
        end: values.end ? dayjs(values.end).format('YYYY-MM-DD[T]HH:mm:00') : undefined,
        repeatEnds: values.repeatEnds ? dayjs(values.repeatEnds).format('YYYY-MM-DD[T]HH:mm:00') : undefined,
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
            withAsterisk
            placeholder="Event title"
            {...form.getInputProps('title')}
          />
          <Textarea
            label="Event Description"
            withAsterisk
            placeholder="Event description"
            {...form.getInputProps('description')}
          />
          <DateTimePicker
            label="Start Date"
            withAsterisk
            valueFormat="MM-DD-YYYY h:mm A [Urbana Time]"
            placeholder="Pick start date"
            {...form.getInputProps('start')}
          />
          <DateTimePicker
            label="End Date"
            withAsterisk
            valueFormat="MM-DD-YYYY h:mm A [Urbana Time]"
            placeholder="Pick end date (optional)"
            {...form.getInputProps('end')}
          />
          <TextInput
            label="Event Location"
            withAsterisk
            placeholder="ACM Room"
            {...form.getInputProps('location')}
          />
          <TextInput
            label="Location Link"
            placeholder="Google Maps link for location"
            {...form.getInputProps('locationLink')}
          />
          <Select
            label="Host"
            placeholder="Select host organization"
            withAsterisk
            data={orgList.map((org) => ({ value: org, label: org }))}
            {...form.getInputProps('host')}
          />
          <Switch
            label="Show on home page carousel?"
            style={{paddingTop: '0.5em'}}
            {...form.getInputProps('featured', { type: 'checkbox' })}
          />
          <Select
            label="Repeats"
            placeholder="Select repeat frequency"
            data={repeatOptions.map((option) => ({ value: option, label: capitalizeFirstLetter(option) }))}
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
          <TextInput
            label="Paid Event ID"
            placeholder="Enter Ticketing ID or Merch ID prefixed with merch:"
            {...form.getInputProps('paidEventId')}
          />
          <Button type="submit" mt="md">
            {isSubmitting ? <><Loader color='white'/>Submitting...</> : 'Create Event' }
          </Button>
        </form>
      </Box>
    </AuthGuard>
  );
};
