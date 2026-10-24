<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Clip architecture
- External-site PHP/MySQL source deliverables are packaged independently of the TanStack app and do not modify its routing or Cloud integration, because the Lovable preview cannot run PHP.
- Video action silhouettes live in a browser-safe SVG component and use scoped action tokens; fixed-size right-side controls preserve existing comments/share flows without generated bitmap icons.
- Resolve video artist labels from account display names and explicit main-site mappings before legacy names, suppress generated guest IDs, and drive the bottom record photo from actual media playback events so it stops on pause, buffering and end.
- Auth signup creates profiles through the application lifecycle trigger; authenticated publishing calls an idempotent auth.uid()-scoped profile repair for pre-existing remix sessions so missing profiles cannot break ownership foreign keys.
- Video retention is enforced by immutable database deadlines and restrictive read policies; managed authenticated HTTP cleanup removes private Storage files before deleting rows, retaining failed rows for retry. Readers cap signed URLs to the deadline and mounted media stops at expiry.
- Keep the existing TanStack routes and short-video feed; implement new screens as file routes sharing ClipShell and ClipNav to preserve navigation.
- Videos and lives each live in their own feature folder (`src/videos`, `src/lives`) with only the common base in `src/shared`, because the owner downloads the repository and takes one space at a time; routes stay in `src/routes`, and the two spaces must never import each other.
- Cloud owns application data and auth; enforce ownership and message participation in RLS, and validate video file signatures in an authenticated server function.
- Store uploads in a private bucket and issue expiring read URLs through authorized policies because public buckets are blocked by workspace policy.
- ClipSession is the sole auth subscriber; use TanStack Query for shared reads and invalidate affected queries after writes.
- Keep protected actions tied to a verified Cloud session until an authenticated parent-site identity bridge is implemented; PHP cookies or client-supplied user IDs do not establish identity in this app. Keep the legacy /auth URL as a redirect to the public feed, not an app-owned login surface.
- Video sharing always uses the app-origin video detail URL via clip-share; both providers use VINASOUND social actions outside the player so sharing never navigates to a provider page.
- Share VINASOUND branding through VinasoundBrand and a dismissible, visibility-triggered introduction; keep video surfaces scoped to contrast tokens and VINASOUND social actions in a separately themed footer without provider shortcuts so playback controls remain readable and the official iframe stays unobstructed.
- Cloudflare Stream live inputs are created only in an authenticated server function via the connector gateway; stream keys live in an owner-only table, never in public live rows.
- Browser lives use peer-to-peer WebRTC with Cloud Realtime broadcast only for signalling (no media through the backend).
- Live guests publish their own peer-to-peer stream on a per-guest signalling channel (viewers subscribe to host + each accepted guest); stage requests, slots, slow mode and link filtering are enforced by database triggers, so UI checks are only hints.
- Live discovery and rooms use scoped live-theme tokens; keep broadcaster controls mounted when the studio is collapsed so closing tools does not interrupt transmission.

- Main navigation has only Vidéos (/) and Lives; other screens are reached from in-page actions so the menu stays minimal.
- The standalone video feed opts into all-viewport ClipNav; shell pages keep mobile navigation and desktop sidebar to avoid duplicate menus while keeping lives reachable.
- Main-site artist destinations use the public configuration in vinasound-integration with explicit Cloud-profile-to-artist mappings; never infer identities from guest handles. Video follow controls open a configured main-site page and never record a local follow or claim synchronization. The main site owns subscription authorization. Legacy creator URLs only forward to the main site; /profil is video management, not a separate account editor.
- TikTok integration was removed: never publish or render external TikTok links; feeds exclude legacy rows with source=tiktok.
- Visitors get an automatic anonymous Cloud session in ClipSession so publishing and going live need no account linking; RLS still scopes rows to auth.uid().