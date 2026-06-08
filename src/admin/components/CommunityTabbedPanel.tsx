import { useEffect, useState, type ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card.tsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs.tsx";
import { formatCommunity } from "../lib/format.ts";

type CommunityTabbedPanelProps<T extends { community: string }> = {
  rows: T[];
  title: string;
  description: string;
  renderPanel: (row: T) => ReactNode;
};

export function CommunityTabbedPanel<T extends { community: string }>({
  rows,
  title,
  description,
  renderPanel,
}: CommunityTabbedPanelProps<T>) {
  const [activeCommunity, setActiveCommunity] = useState(rows[0]?.community ?? "");

  useEffect(() => {
    if (rows.length === 0) {
      setActiveCommunity("");
      return;
    }

    if (!rows.some((row) => row.community === activeCommunity)) {
      setActiveCommunity(rows[0]!.community);
    }
  }, [rows, activeCommunity]);

  if (rows.length === 0) {
    return null;
  }

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeCommunity} onValueChange={setActiveCommunity}>
          <TabsList>
            {rows.map((row) => (
              <TabsTrigger key={row.community} value={row.community}>
                {formatCommunity(row.community)}
              </TabsTrigger>
            ))}
          </TabsList>

          {rows.map((row) => (
            <TabsContent key={row.community} value={row.community}>
              {renderPanel(row)}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
