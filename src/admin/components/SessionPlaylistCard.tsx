import { Link } from "react-router";
import type { AdminSessionPlaylistItem } from "../../shared/api/admin-schemas.ts";
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

type SessionPlaylistCardProps = {
  playlist: AdminSessionPlaylistItem[];
  currentPosition: number;
};

export function SessionPlaylistCard({
  playlist,
  currentPosition,
}: SessionPlaylistCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Playlist</CardTitle>
        <CardDescription>
          {playlist.length === 0
            ? "No videos were assigned to this session."
            : `${playlist.length} videos in feed order`}
        </CardDescription>
      </CardHeader>
      {playlist.length > 0 ? (
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Video</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Flags</TableHead>
                <TableHead>Reached</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {playlist.map((item) => {
                const reached = item.position <= currentPosition;
                return (
                  <TableRow key={`${item.position}-${item.video_id}`}>
                    <TableCell className="text-zinc-500">
                      {item.position + 1}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      <Link
                        to={`/admin/videos/${item.video_id}`}
                        className="hover:underline"
                      >
                        {item.video_id}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.video_type === "ingroup" ? "default" : "secondary"
                        }
                      >
                        {item.video_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>{item.account_name}</div>
                      <div className="text-xs text-zinc-500">
                        {item.account_handle}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {item.show_learn_more ? (
                          <Badge variant="secondary">Learn more</Badge>
                        ) : null}
                        {item.show_interest_prompt ? (
                          <Badge variant="secondary">
                            {item.video_type === "filler"
                              ? "See more prompt"
                              : "Topic prompt"}
                          </Badge>
                        ) : null}
                        {!item.show_learn_more && !item.show_interest_prompt
                          ? "—"
                          : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={reached ? "default" : "secondary"}>
                        {reached ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      ) : null}
    </Card>
  );
}
