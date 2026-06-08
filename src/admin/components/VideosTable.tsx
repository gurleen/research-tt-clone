import { Link } from "react-router";
import type { Tables } from "../../server/db/database.types.ts";
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

type VideoRow = Tables<"videos">;

type VideosTableProps = {
  videos: VideoRow[];
  onDelete: (videoId: string) => void;
  deletingId: string | null;
};

export function VideosTable({ videos, onDelete, deletingId }: VideosTableProps) {
  if (videos.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
        No videos yet. Add your first stimulus video to get started.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Video ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Community</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Handle</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {videos.map((video) => (
            <TableRow key={video.video_id}>
              <TableCell className="font-mono text-xs">{video.video_id}</TableCell>
              <TableCell>
                <Badge variant={video.video_type === "ingroup" ? "default" : "secondary"}>
                  {video.video_type}
                </Badge>
              </TableCell>
              <TableCell>{video.community ?? "—"}</TableCell>
              <TableCell>{video.source_type ?? "—"}</TableCell>
              <TableCell>{video.account_handle}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/admin/videos/${video.video_id}`}>Edit</Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={deletingId === video.video_id}
                    onClick={() => onDelete(video.video_id)}
                  >
                    {deletingId === video.video_id ? "Deleting…" : "Delete"}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
