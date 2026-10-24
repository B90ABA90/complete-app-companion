import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";
import { Route as directAccessRoute } from "@/routes/auth";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("keeps videos and lives accessible as separate pages", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    expect(router.matchRoutes("/").at(-1)?.routeId).toBe("/");
    expect(router.matchRoutes("/lives").at(-1)?.routeId).toBe("/lives");
    expect(router.matchRoutes("/live/example").at(-1)?.routeId).toBe("/live/$id");
  });
  it("redirects the old login URL directly to the feed", () => {
    let result: unknown;
    try {
      directAccessRoute.options.beforeLoad?.({} as never);
    } catch (error) {
      result = error;
    }
    expect(result).toMatchObject({ options: { to: "/", replace: true } });
  });
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });
});
