import type { AdminSessionSummary } from "../../shared/api/admin-schemas.ts";
import { Badge } from "../../components/ui/badge.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table.tsx";
import {
  EVENT_TABLE_LABELS,
  formatDurationMs,
  formatTimestamp,
} from "../lib/format.ts";

const EVENT_TABLE_ORDER = [
  "evt_session_start",
  "evt_content_link_display",
  "evt_content_link_click",
  "evt_content_stub_exit",
  "evt_interest_prompt_display",
  "evt_interest_response",
  "evt_video_view",
  "evt_like",
  "evt_playlist_complete",
  "evt_survey_complete",
] as const;

type EventTableName = (typeof EVENT_TABLE_ORDER)[number];
type EventRow = Record<string, unknown>;

type Column = {
  header: string;
  render: (row: EventRow) => string;
};

function asString(row: EventRow, key: string): string {
  const value = row[key];
  return typeof value === "string" ? value : String(value ?? "—");
}

function asNumber(row: EventRow, key: string): number | null {
  const value = row[key];
  return typeof value === "number" ? value : null;
}

function formatTimeCell(row: EventRow, key: string): string {
  const value = asString(row, key);
  if (!value || value === "—") return "—";
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? value : formatTimestamp(value);
}

function formatDurationCell(row: EventRow, key: string): string {
  const value = asNumber(row, key);
  return value === null ? "—" : formatDurationMs(value);
}

const TIMESTAMP_COLUMN: Column = {
  header: "Time",
  render: (row) => formatTimeCell(row, "timestamp"),
};

const VIDEO_COLUMNS: Column[] = [
  {
    header: "Video",
    render: (row) => asString(row, "video_id"),
  },
  {
    header: "Type",
    render: (row) => asString(row, "video_type"),
  },
];

const EVENT_TABLE_COLUMNS: Record<EventTableName, Column[]> = {
  evt_session_start: [TIMESTAMP_COLUMN],
  evt_content_link_display: [
    ...VIDEO_COLUMNS,
    {
      header: "Time",
      render: (row) => formatTimeCell(row, "timestamp_display"),
    },
  ],
  evt_content_link_click: [
    ...VIDEO_COLUMNS,
    {
      header: "Time",
      render: (row) => formatTimeCell(row, "timestamp_click"),
    },
    {
      header: "Latency",
      render: (row) => formatDurationCell(row, "latency_ms"),
    },
  ],
  evt_content_stub_exit: [
    {
      header: "Video",
      render: (row) => asString(row, "video_id"),
    },
    {
      header: "Time",
      render: (row) => formatTimeCell(row, "timestamp_exit"),
    },
    {
      header: "Time on stub",
      render: (row) => formatDurationCell(row, "time_on_stub_ms"),
    },
  ],
  evt_interest_prompt_display: [
    ...VIDEO_COLUMNS,
    {
      header: "Time",
      render: (row) => formatTimeCell(row, "timestamp_display"),
    },
  ],
  evt_interest_response: [
    ...VIDEO_COLUMNS,
    {
      header: "Answer",
      render: (row) => {
        const value = row.response;
        if (typeof value !== "boolean") return "—";
        return value ? "Yes" : "No";
      },
    },
    {
      header: "Time",
      render: (row) => formatTimeCell(row, "timestamp_response"),
    },
    {
      header: "Latency",
      render: (row) => formatDurationCell(row, "latency_ms"),
    },
  ],
  evt_video_view: [
    ...VIDEO_COLUMNS,
    {
      header: "Visit",
      render: (row) => asString(row, "visit_index"),
    },
    {
      header: "Started",
      render: (row) => formatTimeCell(row, "started_at"),
    },
    {
      header: "Dwell",
      render: (row) => formatDurationCell(row, "dwell_ms"),
    },
    {
      header: "Playback",
      render: (row) => formatDurationCell(row, "playback_ms"),
    },
    {
      header: "Ended",
      render: (row) => asString(row, "ended_reason"),
    },
  ],
  evt_like: [
    ...VIDEO_COLUMNS,
    {
      header: "Action",
      render: (row) => {
        const value = row.liked;
        if (typeof value !== "boolean") return "—";
        return value ? "Like" : "Unlike";
      },
    },
    TIMESTAMP_COLUMN,
  ],
  evt_playlist_complete: [TIMESTAMP_COLUMN],
  evt_survey_complete: [TIMESTAMP_COLUMN],
};

type SessionEventTablesProps = {
  eventCounts: AdminSessionSummary["event_counts"];
  events: AdminSessionSummary["events"];
};

export function SessionEventTables({
  eventCounts,
  events,
}: SessionEventTablesProps) {
  const populated = EVENT_TABLE_ORDER.filter(
    (table) => (events[table]?.length ?? 0) > 0,
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Event counts</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {EVENT_TABLE_ORDER.map((table) => {
            const count = eventCounts[table] ?? 0;
            return (
              <Badge
                key={table}
                variant={count === 0 ? "secondary" : "default"}
                className={count === 0 ? "text-zinc-500" : undefined}
              >
                {EVENT_TABLE_LABELS[table]} {count}
              </Badge>
            );
          })}
        </CardContent>
      </Card>

      {populated.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Events</CardTitle>
            <CardDescription>No events have been captured yet.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        populated.map((table) => {
          const rows = events[table] ?? [];
          const columns = EVENT_TABLE_COLUMNS[table];
          return (
            <Card key={table}>
              <CardHeader>
                <CardTitle>{EVENT_TABLE_LABELS[table]}</CardTitle>
                <CardDescription>
                  {rows.length} {rows.length === 1 ? "event" : "events"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((column) => (
                        <TableHead key={column.header}>{column.header}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, index) => (
                      <TableRow key={rowKey(row, index)}>
                        {columns.map((column) => (
                          <TableCell
                            key={column.header}
                            className={
                              column.header === "Video"
                                ? "font-mono text-xs"
                                : undefined
                            }
                          >
                            {column.render(row)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        })
      )}
    </>
  );
}

function rowKey(row: EventRow, index: number): string {
  const eventId = row.event_id;
  return typeof eventId === "string" ? eventId : String(index);
}
