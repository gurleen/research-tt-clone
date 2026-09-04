import { Link } from "react-router";
import type { AdminSessionListItem } from "../../shared/api/admin-schemas.ts";
import { Badge } from "../../components/ui/badge.tsx";
import { Button } from "../../components/ui/button.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table.tsx";
import {
  formatCommunity,
  formatSessionId,
  formatSourceType,
  formatTimestamp,
} from "../lib/format.ts";

type SessionsTableProps = {
  sessions: AdminSessionListItem[];
};

export function SessionsTable({ sessions }: SessionsTableProps) {
  if (sessions.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
        No sessions match these filters.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Assigned</TableHead>
            <TableHead>Community</TableHead>
            <TableHead>Source type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>Session ID</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((session) => (
            <TableRow key={session.session_id}>
              <TableCell>{formatTimestamp(session.assigned_at)}</TableCell>
              <TableCell>{formatCommunity(session.community)}</TableCell>
              <TableCell>{formatSourceType(session.source_type)}</TableCell>
              <TableCell>
                <div className="flex flex-wrap items-center gap-1">
                  <Badge variant="secondary">{session.status}</Badge>
                  {session.demo_mode ? (
                    <Badge variant="outline">demo</Badge>
                  ) : null}
                </div>
              </TableCell>
              <TableCell>{session.current_position}</TableCell>
              <TableCell>
                <span
                  className="font-mono text-xs"
                  title={session.session_id}
                >
                  {formatSessionId(session.session_id)}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/admin/sessions/${session.session_id}`}>View</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
