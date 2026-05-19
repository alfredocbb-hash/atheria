import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/acceder")({
  beforeLoad: () => {
    throw redirect({ to: "/login", replace: true });
  },
});
