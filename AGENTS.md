# AppHarbr Network Compatibility — Agent Handoff

This file is the durable context for agents working in this workspace. Read it before changing or publishing the Site.

## Project objective

Build and maintain a publisher-facing AppHarbr compatibility resource that:

- Shows supported ad-network adapter ranges for each AppHarbr SDK release on iOS and Android.
- Shows Unity releases with their verified native Android/iOS SDK pair and OS-specific network ranges.
- Exposes the normalized data through a JSON API for automated publisher checks.
- Reads the live AppHarbr platform configuration rather than maintaining a separate compatibility database.
- Uses AppHarbr branding and is suitable for eventual external-publisher access.

The implementation is in ``.

## Current hosted state

Verified on 2026-10-28:

- Sites project ID: `appgprj_6ae061a8aec48191b0c41fe386641800`
- Production URL: `https://appharbr-network-compatibility.geoedge-9073.chatgpt.site`
- Site title: `AppHarbr Network Compatibility`
- Published version: 7 at the time of writing; re-verify, the access change published again
- Published source commit: `9ceffc8d6da862c1ff65bc076fa7d61a03f679e2`
- Access mode: `public` (changed from owner-only `custom` on 2026-10-28)
- Anonymous visitors and unauthenticated API callers are served
- Available access modes: `custom`, `workspace_all`, and `public`
- Custom domains: none attached
- Proposed custom domain: `compatibility.appharbr.com`

Re-read the Site with `mcp__codex_apps__sites_get_site` before any hosting or access operation because these values may advance.

## User-approved product decisions

- Use the official AppHarbr logo, not a generated logo.
- Use the purple/magenta/yellow palette from the AppHarbr login experience.
- Use recognizable Apple and Android icons in the platform switcher.
- Exclude Android AppHarbr SDK `2.90.0` everywhere: selectors, defaults, API anchors, and calculations.
- Do not expose the upstream config URL in the JSON response or page footer.
- Do not add a `source` field to the public response.
- Keep the explanatory table note free of upstream-source details.
- Table column order is:
  1. Ad network
  2. Supported network versions
  3. Top supported version
  4. AppHarbr minimum version
  5. Status
- `Top supported version` means the highest adapter version present for that network across all visible AppHarbr anchors, independent of the selected SDK.
- The selected-version supported range is the lowest through highest eligible adapter anchor at or before the selected AppHarbr SDK.
- The automation card shows both:
  - Platform-only request for all version anchors.
  - Platform plus optional `sdk` for a point-in-time result.
- At tablet/desktop widths, the gray platform-tab background should fit the three buttons. At mobile widths it remains full width for usable tap targets.
- Unity is a third platform tab and uses the official Unity logo from Simple Icons.
- Unity rows show Android and iOS supported network ranges side by side. Google AdMob and Google Ad Manager are presented as one Google row using the AdMob adapter range.
- Unity releases without a new verified native compatibility entry inherit the most recent verified Android/iOS SDK pair at or before that release.

## Live upstream data

These URLs are implementation details and must not be included in the publisher-facing response:

- Android: `https://gw.geoedge.be/api/sdk_config/android`
- iOS: `https://gw.geoedge.be/api/sdk_config/ios`

The response is an envelope whose `json` property contains the configuration. The decoder tries, in order:

1. URL-decoded JSON.
2. Base64-decoded JSON.
3. Plain JSON.

Compatibility data is under `native_ad_support`.

Unity release mappings are maintained in `lib/compatibility.ts` from the internal Unity Changelog. The current snapshot covers Unity `1.0.0` through `1.27.0`; it maps the latest release to Android `2.41.0` and iOS `1.38.0`. The publisher-facing response must not expose the internal changelog URL.

Platform field mapping:

| Platform | Adapter version | Minimum AppHarbr version |
| --- | --- | --- |
| iOS | `adapter_ver` | `min_sdk_ver` |
| Android | `ad_ver` | `sdk_ver` |

The normalized representation is:

```json
{
  "adapterVersion": "5.4.0",
  "minimumAppHarbrVersion": "2.24.2"
}
```

## API architecture

The API is part of this Site, not a pre-existing GeoEdge API and not a separate service.

- Route: `app/api/compatibility/route.ts`
- Normalization and range logic: `lib/compatibility.ts`
- Browser integration and API examples: `app/page.tsx`

Endpoint:

```text
GET /api/compatibility?platform=android
```

Supported query parameters:

- `platform`: `ios`, `android`, or `unity`. Defaults to `ios`; invalid values return HTTP 400.
- `sdk`: optional AppHarbr SDK version. If omitted, calculations use the latest referenced SDK while `versionAnchors` still contains the complete history.
- `network`: optional network ID or display name filter.

Examples:

```text
/api/compatibility?platform=android
/api/compatibility?platform=android&sdk=2.24.2
/api/compatibility?platform=android&sdk=2.24.2&network=openwrapdfp
```

Important response fields:

- `requestedSdkVersion`
- `latestReferencedSdkVersion`
- `availableSdkVersions`
- `sourceUpdatedAt`
- `fetchedAt`
- `networkCount`
- `supportedNetworkCount`
- `networks[].versionAnchors`
- `networks[].supportedRange`
- `networks[].topSupportedAdapter`
- `networks[].minimumAppHarbrForLatest`
- `networks[].supported`

Unity responses additionally include:

- `nativeSdkVersions.android`
- `nativeSdkVersions.ios`
- `networks[].android`
- `networks[].ios`

For Unity, `sdk` is an AppHarbr Unity version. Each nested OS network object uses the same native compatibility schema as the iOS and Android responses.

The route intentionally does not return the upstream URL.

Caching and access:

- The server-side upstream fetch uses `cache: "no-store"`.
- The normalized API response uses `s-maxage=3600` and `stale-while-revalidate=86400`.
- CORS currently allows `*`.
- Sites access control still gates the route. CORS does not make a private Site externally callable.

## Compatibility calculations

The implementation:

1. Normalizes all platform entries.
2. Removes Android anchors whose minimum AppHarbr version is `2.90.0`.
3. Sorts adapter versions numerically by dot-separated components.
4. Builds the available AppHarbr SDK list from visible anchors, adding iOS `sdk_latest_version` when provided.
5. Uses `sdk_latest_version` when present; otherwise derives the latest referenced SDK from anchors.
6. For a requested SDK, selects anchors whose minimum AppHarbr version is less than or equal to it.
7. Sets `supportedRange.min` to the first eligible adapter and `supportedRange.max` to the last eligible adapter.
8. Sets `topSupportedAdapter` to the highest visible adapter anchor across the network's full history.
9. Returns every normalized anchor in `versionAnchors`.

Example expected for Android OpenWrap DFP at SDK `2.24.2`:

- Anchors: `4.5.1` / `2.24.2`, and `5.4.0` / `2.24.2`.
- Supported range: `4.5.1`–`5.4.0`.
- Top supported adapter: `5.4.0`.

## UI and branding

Primary files:

- `app/page.tsx`
- `app/globals.css`

Official logo asset:

```text
https://appharbr.com/wp-content/uploads/2022/09/APPHARBR-LOGO-COLOR-ON-WHITE-RGB-medium-copy-2.png
```

AppHarbr login background reference:

```text
https://appharbr.geoedge.com/media/login-background-X2LSJMYM.png
```

Platform icons use Simple Icons CDN for Apple and Android.

Current notable UI behavior:

- Switching platform reloads live data and selects the latest visible SDK.
- Unity selection resolves the mapped Android and iOS SDKs, loads both live configs, and combines networks into one OS-by-OS table.
- Selecting a different SDK recalculates the table.
- Search filters by normalized network name or ID.
- `Copy request` copies the platform-only endpoint.
- `Open JSON` opens the platform-only endpoint.
- The specific-SDK API example follows the selected SDK.

## Local testing

Before browser preview, read the Sites local-preview reference:

```text
/Users/arielwendichansky/.codex/plugins/cache/openai-curated-remote/sites/1.1.2/skills/sites/references/preview/local.md
```

Build:

```bash
node '/Users/arielwendichansky/.codex/plugins/cache/openai-curated-remote/sites/1.1.2/scripts/build-site.mjs'
```

Local preview:

```bash
npm run dev -- --port 5173
```

Run from ``.

Representative API checks:

```bash
curl -fsS 'http://127.0.0.1:5173/api/compatibility?platform=android'
curl -fsS 'http://127.0.0.1:5173/api/compatibility?platform=android&sdk=2.24.2&network=openwrapdfp'
curl -i 'http://127.0.0.1:5173/api/compatibility?platform=invalid'
```

Verify:

- The response has no `source` property or upstream URL.
- Android `2.90.0` is absent.
- Platform-only responses include full `versionAnchors` histories.
- Invalid platforms return HTTP 400.
- UI column order matches the approved order.
- Unity `1.27.0` resolves to Android `2.41.0` and iOS `1.38.0`; the Google row shows both OS ranges.
- At a viewport near 872 px wide, the platform selector should wrap only its three buttons plus the 10 px total inner padding.

## Tooling split: Claude Code and Codex

Verified on 2026-10-28. The Sites tools (`mcp__codex_apps__sites_*`) are **not reachable from Claude
Code**, and no configuration fixes this:

- The Sites plugin declares `connector_20205bf7d4e99a89d7154bb849718324` as a required app in
  `.app.json`.
- Those tools are served by the `codex_app` MCP server, which launches over
  `CODEX_APP_TOOLS_PIPE_PATH`, a pipe into the running ChatGPT desktop app.
- That server reports `disabled` in `codex mcp list`, so `codex exec` from a terminal does not get
  them either. The capability is bound to the ChatGPT app runtime.

The working split is therefore:

| Work | Where |
| --- | --- |
| Edit `app/page.tsx`, `lib/compatibility.ts`, `app/api/compatibility/route.ts` | Claude Code |
| Build, local preview, browser QA | Claude Code |
| Verify API responses and the guardrails below | Claude Code |
| Git history and the GitHub backup | Claude Code |
| `save_version_and_deploy*` | Codex / ChatGPT app |

An agent in Claude Code should do the full change and verification, leave the tree clean and
committed, then hand the user a publish instruction to run in Codex. Do not claim a deploy happened
from Claude Code.

The Sites source helper pushes with explicit URLs (`git push <remote_url>`) and never configures a
named remote, so the GitHub `origin` on this repository does not interfere with publishing. The
helper does require a clean working tree and a HEAD that is a descendant of the remote Site source,
so commit before publishing and never rewrite pushed history.

## Sites development and publishing workflow

The `sites:sites` skill applies to Site edits, publication, access changes, and custom domains. The main agent must read it completely before acting:

```text
/Users/arielwendichansky/.codex/plugins/cache/openai-curated-remote/sites/1.1.2/skills/sites/SKILL.md
```

Never create a new Site for this project. Always reuse:

```text
appgprj_6ae061a8aec48191b0c41fe386641800
```

For source edits:

1. Call `mcp__codex_apps__sites_get_site`.
2. Call `mcp__codex_apps__sites_create_source_repository_write_credential` for a fresh short-lived credential.
3. Run the source helper from ``:

   ```bash
   node '/Users/arielwendichansky/.codex/plugins/cache/openai-curated-remote/sites/1.1.2/scripts/site-workflow.mjs' --project-id 'appgprj_6ae061a8aec48191b0c41fe386641800'
   ```

4. Pass the credential to the helper through hidden stdin only. Never print, save, or put the token in shell arguments.
5. Edit source with `apply_patch`.
6. Build and preview in proportion to the change.
7. Re-run the source helper with its opening result, `commands: []` when the unchanged source already built successfully, and an archive path under `outputs/`.
8. Save and deploy the exact pushed commit/archive.
9. Preserve the audience unless the user explicitly requests an access change.

Because the Site is currently owner-only, use `mcp__codex_apps__sites_save_version_and_deploy_private` after confirming access. If access becomes public or shared, use the matching non-private save/deploy flow from the Sites skill.

Do not manually edit build output in `dist/`; edit authored files and rebuild.

## External sharing and custom domain

Current state:

- The Site is `public`. Anyone with the URL reaches the page and the API with no sign-in.
- Verified unauthenticated on 2026-10-28: `/` returns 200, `/api/compatibility?platform=android`
  returns 200, and `/api/compatibility?platform=invalid` still returns 400.
- No custom domain is attached.

Because the Site is public, the API is anonymously callable, which is what publisher automation
needs. Two consequences to respect:

- The 502 branch in `app/api/compatibility/route.ts` returns `error.message` as `detail`. Every
  current throw site in `lib/compatibility.ts` is free of the upstream URL. Keep it that way; a new
  error string there is now publicly visible.
- Any route added to this Site is public by default. Gate anything non-public server-side with the
  helpers in `app/chatgpt-auth.ts`.

Reverting to owner-only or an invite list is a Sites access change, and still requires explicit user
authorization in either direction.

For `compatibility.appharbr.com`:

1. Require an explicit request to attach that exact hostname.
2. Call `mcp__codex_apps__sites_add_custom_domain` with the existing project ID.
3. Return the exact CNAME and validation records supplied by Sites.
4. The user's AppHarbr DNS administrator must add those records.
5. Use `mcp__codex_apps__sites_refresh_custom_domain_status` after DNS changes.
6. Wait for both routing and SSL to become active.

Attaching a custom domain does not make a private Site public. External automated publisher access still requires suitable access settings.

Once active, the intended URLs would be:

```text
https://compatibility.appharbr.com
https://compatibility.appharbr.com/api/compatibility?platform=android
```

## Guardrails for future agents

- Preserve the existing project ID and Site source history.
- Do not expose the upstream config URLs in publisher-facing JSON or UI.
- Do not reintroduce Android SDK `2.90.0`.
- Do not change sharing, invite users, attach a domain, or publish to a different audience without explicit user authorization.
- Treat the version number, deployment ID, access mode, and domain status as live state; verify them before acting.
- Keep the API platform-only request supported. `sdk` and `network` remain optional filters.
- Preserve the official branding assets and approved table semantics unless the user requests a change.
