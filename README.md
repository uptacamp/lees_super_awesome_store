# Space Coast — Next Liftoff

A single-screen, kiosk-style Next.js dashboard for a monitor in a Space Coast, FL home.
It shows **only** the next upcoming Florida rocket launch: mission name, a big LED-style
countdown, the NET (No Earlier Than) date/time, and a mission-details panel (provider,
rocket, pad, orbit, mission type, and description) — pulled from the
[Launch Library 2 API](https://ll.thespacedevs.com/2.3.0/launch/upcoming/).

## Run it locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). For an actual wall display, open this
URL in a browser in kiosk/fullscreen mode (F11 in Chrome, or `chrome --kiosk <url>`) on the
machine driving the monitor.

## Deploy

Works out of the box on [Vercel](https://vercel.com) — just import the repo, no
environment variables required. `npm run build && npm run start` also works on any Node
host.

## How it works

- **`app/api/launches/route.js`** fetches `launch/upcoming` from Launch Library 2 with
  `mode=detailed`, filters results to pads whose location name contains `FL,` or
  `Florida` (i.e. Cape Canaveral SFS and Kennedy Space Center), sorts by NET, and returns
  only the soonest one.
- The route caches upstream responses for **4.5 minutes** (`revalidate = 270`). Launch
  Library 2's free tier is rate-limited to ~15 requests/hour, so this keeps the app well
  under that limit no matter how long the display runs.
- **`app/page.js`** is a client component that fetches `/api/launches` on load and every
  **5 minutes** after that (`REFRESH_MS`), without a jarring full-page reload.
- **`components/CountdownClock.js`** re-renders every second from the cached NET
  timestamp, so the countdown itself stays smooth between the 5-minute data refreshes. If
  the countdown reaches zero and the launch hasn't updated its NET yet, it switches to a
  "T-PLUS / HOLD" state instead of showing a nonsensical negative countdown.

## Customizing the Florida filter

The filter lives in `FLORIDA_PATTERN` in `app/api/launches/route.js`. It currently matches
any pad location name containing `, FL,` or the word `Florida`. If you only want a specific
pad (e.g. just SpaceX's SLC-40, or just KSC's LC-39A), filter on `launch.pad.name` instead.

## Notes

- If nothing is currently scheduled in Florida, the page says so and will pick up the next
  launch automatically on its next refresh.
- If the upstream API is unreachable, the last successfully loaded launch stays on screen
  and only the footer/error state changes — the display won't go blank because of a single
  failed request.
