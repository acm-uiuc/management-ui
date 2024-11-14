import React, { useEffect, useState } from 'react';
import {
  Table,
  Text,
  Group,
  Title,
  Badge,
  Card,
  Button,
  UnstyledButton,
  Center,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useApi } from '@/util/api';
import { AuthGuard } from '@/components/AuthGuard';
import FullScreenLoader from '@/components/AuthContext/LoadingScreen';
import { notifications } from '@mantine/notifications';
import { IconChevronUp, IconChevronDown, IconSelector } from '@tabler/icons-react';

const baseItemMetadata = z.object({
  itemId: z.string().min(1),
  itemName: z.string().min(1),
  itemSalesActive: z.union([z.string().transform((str) => new Date(str)), z.literal(false)]),
  priceDollars: z.object({
    member: z.number().min(0),
    nonMember: z.number().min(0),
  }),
});

const ticketingItemMetadata = baseItemMetadata.extend({
  eventCapacity: z.number(),
  ticketsSold: z.number(),
});

type ItemMetadata = z.infer<typeof baseItemMetadata>;
type TicketItemMetadata = z.infer<typeof ticketingItemMetadata>;

const listItemsResponseSchema = z.object({
  merch: z.array(baseItemMetadata),
  tickets: z.array(ticketingItemMetadata),
});

interface ThProps {
  children: React.ReactNode;
  reversed: boolean;
  sorted: boolean;
  onSort(): void;
}

function Th({ children, reversed, sorted, onSort }: ThProps) {
  const Icon = sorted ? (reversed ? IconChevronUp : IconChevronDown) : IconSelector;

  return (
    <Table.Th>
      <UnstyledButton
        onClick={onSort}
        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
      >
        <Text fw={500} size="sm">
          {children}
        </Text>
        <Center>
          <Icon size={14} stroke={1.5} />
        </Center>
      </UnstyledButton>
    </Table.Th>
  );
}

const getTicketStatus = (item: TicketItemMetadata) => {
  if (item.itemSalesActive === false) {
    return { text: 'Not Open', color: 'gray' as const };
  }
  if (item.ticketsSold >= item.eventCapacity) {
    return { text: 'Sold Out', color: 'red' as const };
  }
  if (typeof item.itemSalesActive === 'object' && item.itemSalesActive > new Date()) {
    return { text: 'Coming Soon', color: 'yellow' as const };
  }
  return { text: 'Active', color: 'green' as const };
};

const getMerchStatus = (item: ItemMetadata) => {
  if (item.itemSalesActive === false) {
    return { text: 'Not Available', color: 'gray' as const };
  }
  if (typeof item.itemSalesActive === 'object' && item.itemSalesActive > new Date()) {
    return { text: 'Coming Soon', color: 'yellow' as const };
  }
  return { text: 'Available', color: 'green' as const };
};

type SortBy = 'name' | 'status' | null;

const SelectTicketsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<{
    tickets: TicketItemMetadata[];
    merch: ItemMetadata[];
  }>({ tickets: [], merch: [] });
  const [sortBy, setSortBy] = useState<SortBy>(null);
  const [reversedSort, setReversedSort] = useState(false);
  const api = useApi('core');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/v1/tickets/');
        const parsed = listItemsResponseSchema.parse(response.data);
        setItems({
          tickets: parsed.tickets,
          merch: parsed.merch,
        });
      } catch (error) {
        console.error('Error fetching items:', error);
        notifications.show({
          title: 'Error fetching items',
          message: 'Failed to load available items. Please try again later.',
          color: 'red',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
    handleSort('status');
  }, []);

  const handleSort = (field: SortBy) => {
    if (sortBy === field) {
      setReversedSort((r) => !r);
    } else {
      setSortBy(field);
      setReversedSort(false);
    }
  };

  const isTicketItem = (item: ItemMetadata | TicketItemMetadata): item is TicketItemMetadata => {
    return 'eventCapacity' in item && 'ticketsSold' in item;
  };

  const sortItems = <T extends ItemMetadata | TicketItemMetadata>(items: T[]) => {
    if (!sortBy) return items;

    return [...items].sort((a, b) => {
      if (sortBy === 'name') {
        const comparison = a.itemName.localeCompare(b.itemName);
        return reversedSort ? -comparison : comparison;
      }

      if (sortBy === 'status') {
        const statusA = isTicketItem(a) ? getTicketStatus(a).text : getMerchStatus(a).text;
        const statusB = isTicketItem(b) ? getTicketStatus(b).text : getMerchStatus(b).text;
        const comparison = statusA.localeCompare(statusB);
        return reversedSort ? -comparison : comparison;
      }

      return 0;
    });
  };

  if (loading) {
    return <FullScreenLoader />;
  }

  const handleManageClick = (itemId: string) => {
    navigate(`/tickets/manage/${itemId}`);
  };

  const handleScanClick = () => {
    navigate(`/tickets/scan`);
  };

  const sortedMerch = sortItems(items.merch);
  const sortedTickets = sortItems(items.tickets);

  return (
    <AuthGuard resourceDef={{ service: 'core', validRoles: ['manage:tickets', 'scan:tickets'] }}>
      <Title order={2} mb="md">
        Tickets & Merchandise
      </Title>
      <AuthGuard isAppShell={false} resourceDef={{ service: 'core', validRoles: ['scan:tickets'] }}>
        <Button variant="primary" onClick={() => handleScanClick()} id={`merch-scan`} style={{marginBottom: '2vh'}}>
          Scan Ticket/Merch Codes
        </Button>
      </AuthGuard>
      <Card withBorder>
        <Title order={3} mb="md">
          Merchandise
        </Title>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Th
                sorted={sortBy === 'name'}
                reversed={reversedSort}
                onSort={() => handleSort('name')}
              >
                Item Name
              </Th>
              <Th
                sorted={sortBy === 'status'}
                reversed={reversedSort}
                onSort={() => handleSort('status')}
              >
                Status
              </Th>
              <Table.Th>Price (Member/Non-Member)</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {sortedMerch.map((item) => {
              const status = getMerchStatus(item);
              return (
                <Table.Tr
                  key={item.itemId}
                  style={{ cursor: 'pointer' }}
                  data-testid={`merch-row-${item.itemId}`}
                >
                  <Table.Td>{item.itemName}</Table.Td>
                  <Table.Td>
                    <Badge color={status.color}>{status.text}</Badge>
                  </Table.Td>
                  <Table.Td>
                    ${item.priceDollars.member.toFixed(2)} / $
                    {item.priceDollars.nonMember.toFixed(2)}
                  </Table.Td>
                  <Table.Td>
                    <Group>
                      <AuthGuard
                        isAppShell={false}
                        resourceDef={{ service: 'core', validRoles: ['manage:tickets'] }}
                      >
                        <Button
                          variant="outline"
                          onClick={() => handleManageClick(item.itemId)}
                          id={`merch-${item.itemId}-manage`}
                        >
                          View Sales
                        </Button>
                      </AuthGuard>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Card>

      <Card mb="lg" withBorder>
        <Title order={3} mb="md">
          Tickets
        </Title>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Th
                sorted={sortBy === 'name'}
                reversed={reversedSort}
                onSort={() => handleSort('name')}
              >
                Event Name
              </Th>
              <Th
                sorted={sortBy === 'status'}
                reversed={reversedSort}
                onSort={() => handleSort('status')}
              >
                Status
              </Th>
              <Table.Th>Capacity</Table.Th>
              <Table.Th>Price (Member/Non-Member)</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {sortedTickets.map((ticket) => {
              const status = getTicketStatus(ticket);
              return (
                <Table.Tr
                  key={ticket.itemId}
                  style={{ cursor: 'pointer' }}
                  data-testid={`ticket-row-${ticket.itemId}`}
                >
                  <Table.Td>{ticket.itemName}</Table.Td>
                  <Table.Td>
                    <Badge color={status.color}>{status.text}</Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Text>
                        {ticket.ticketsSold}/{ticket.eventCapacity}
                      </Text>
                      {ticket.ticketsSold >= ticket.eventCapacity && (
                        <Badge color="red" size="sm">
                          Full
                        </Badge>
                      )}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    ${ticket.priceDollars.member.toFixed(2)} / $
                    {ticket.priceDollars.nonMember.toFixed(2)}
                  </Table.Td>
                  <Table.Td>
                    <Group>
                      <AuthGuard
                        isAppShell={false}
                        resourceDef={{ service: 'core', validRoles: ['manage:tickets'] }}
                      >
                        <Button
                          variant="outline"
                          onClick={() => handleManageClick(ticket.itemId)}
                          id={`tickets-${ticket.itemId}-manage`}
                        >
                          View Sales
                        </Button>
                      </AuthGuard>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Card>
    </AuthGuard>
  );
};

export { SelectTicketsPage };
