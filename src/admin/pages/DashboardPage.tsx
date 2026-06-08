import { Link } from "react-router";
import { adminNavItems } from "../nav.ts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card.tsx";

export function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Manage study stimulus content and configuration.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {adminNavItems
          .filter((item) => item.path !== "/admin")
          .map((item) => (
            <Link key={item.path} to={item.path}>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle>{item.label}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-sm font-medium text-zinc-900">
                    Open →
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
      </div>
    </div>
  );
}
