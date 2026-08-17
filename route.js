import { NextResponse } from 'next/server';

// Cache upstream responses for 4.5 minutes. The public Launch Library 2 tier
// is rate limited (15 requests/hour), so this keeps us well under that even
// if the client polls every 5 minutes and the dashboard is left running 24/7.
export const revalidate = 270;

const LL2_URL =
  'https://ll.thespacedevs.com/2.3.0/launch/upcoming/?mode=detailed&limit=60&ordering=net';

// LL2 pad location names look like "Cape Canaveral, FL, USA" or
// "Kennedy Space Center, FL, USA" — match on "FL," or the word "Florida".
const FLORIDA_PATTERN = /,\s*fl,|florida/i;

function isFloridaLaunch(launch) {
  const locationName = launch?.pad?.location?.name || '';
  return FLORIDA_PATTERN.test(locationName);
}

export async function GET() {
  try {
    const res = await fetch(LL2_URL, {
      next: { revalidate },
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Launch Library API responded with ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const results = Array.isArray(data.results) ? data.results : [];

    const floridaLaunches = results
      .filter(isFloridaLaunch)
      .sort((a, b) => new Date(a.net) - new Date(b.net));

    return NextResponse.json({
      count: floridaLaunches.length,
      next: floridaLaunches[0] || null,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch launches' },
      { status: 500 }
    );
  }
}
