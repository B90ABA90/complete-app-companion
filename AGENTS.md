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
- Resolve video artist labels from account display names and explicit main-site mappings before legacy names, suppress generated guest IDs, and drive the bottom record photo from actual media playback events so it stops on pause, buffering and end.
- Auth signup creates profiles through the application lifecycle trigger; authenticated publishing calls an idempotent auth.uid()-scoped profile repair for pre-existing remix sessions so missing profiles cannot break ownership foreign keys.
- Video retention is enforced by immutable database deadlines and restrictive read policies; managed authenticated HTTP cleanup removes private Storage files before deleting rows, retaining failed rows for retry. Readers cap signed URLs to the deadline and mounted media stops at expiry.
- Keep the existing TanStack routes and short-video feed; implement new screens as file routes sharing ClipShell and ClipNav to preserve navigation.
- Cloud owns application data and auth; enforce ownership and message participation in RLS, and validate video file signatures in an authenticated server function.
- Store uploads in a private bucket and issue expiring read URLs through authorized policies because public buckets are blocked by workspace policy.
- ClipSession is the sole auth subscriber; use TanStack Query for shared reads and invalidate affected queries after writes.
- Keep protected actions tied to a verified Cloud session until an authenticated parent-site identity bridge is implemented; PHP cookies or client-supplied user IDs do not establish identity in this app. Keep the legacy /auth URL as a redirect to the public feed, not an app-owned login surface.
- Video sharing always uses the app-origin video detail URL via clip-share; both providers use VINASOUND social actions outside the player so sharing never navigates to a provider page.
- Share VINASOUND branding through VinasoundBrand and a dismissible, visibility-triggered introduction; keep video surfaces scoped to contrast tokens and VINASOUND social actions in a separately themed footer without provider shortcuts so playback controls remain readable and the official iframe stays unobstructed.

- Main-site artist destinations use the public configuration in vinasound-integration with explicit Cloud-profile-to-artist mappings; never infer identities from guest handles. Video follow controls open a configured main-site page and never record a local follow or claim synchronization. The main site owns subscription authorization. Legacy creator URLs only forward to the main site; /profil is video management, not a separate account editor.
- TikTok integration was removed: never publish or render external TikTok links; feeds exclude legacy rows with source=tiktok.
- The live space was removed at the owner's request; the app contains only the video space plus the shared base.- Downloads are re-recorded in the browser (video-export) with a VINASOUND watermark, end card and signature sound burned in, preferring MP4; stored originals stay unchanged so the in-app end card is not doubled.
