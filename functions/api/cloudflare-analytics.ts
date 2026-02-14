import type { RequestContext } from '@cloudflare/workers-types';

interface Env {
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_ANALYTICS_TOKEN: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context as RequestContext<Env>;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const accountId = env.CLOUDFLARE_ACCOUNT_ID || '06733e3098d1ab1474045b028939f839';
    const token = env.CLOUDFLARE_ANALYTICS_TOKEN || '8LxUm7_Bu8oZPq0qjMZdACpJeCNxtgasw8OOv0PR';

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // GraphQL query for Cloudflare Web Analytics
    const query = `
      query {
        viewer {
          accounts(filter: {accountTag: "${accountId}"}) {
            rumPageloadEventsAdaptiveGroups(
              filter: {
                date_geq: "${weekAgo.toISOString().split('T')[0]}"
                date_leq: "${now.toISOString().split('T')[0]}"
              }
              limit: 10000
            ) {
              count
              dimensions {
                date
                requestPath
                requestCountry
                userAgentBrowser
                deviceType
              }
            }
          }
        }
      }
    `;

    const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`Cloudflare API error: ${response.status}`);
    }

    const data = await response.json();

    // Process the raw data into the format expected by the frontend
    const events = data.data?.viewer?.accounts?.[0]?.rumPageloadEventsAdaptiveGroups || [];

    // Calculate aggregated metrics
    let todayViews = 0;
    let totalViews = 0;
    const visitors = new Set();
    const todayVisitors = new Set();
    const pageViews: { [key: string]: number } = {};
    const countryViews: { [key: string]: number } = {};
    const browserViews: { [key: string]: number } = {};
    const deviceViews: { [key: string]: number } = {};
    const hourlyViews: { [key: string]: number } = {};
    const dailyViews: { [key: string]: { views: number; visitors: Set<string> } } = {};

    events.forEach((event: any) => {
      const count = event.count;
      const date = event.dimensions?.date;
      const path = event.dimensions?.requestPath || '/';
      const country = event.dimensions?.requestCountry || 'Unknown';
      const browser = event.dimensions?.userAgentBrowser || 'Unknown';
      const device = event.dimensions?.deviceType || 'Desktop';

      totalViews += count;

      // Today's stats
      if (date === today.toISOString().split('T')[0]) {
        todayViews += count;
        todayVisitors.add(`${date}-${country}-${browser}`);
      }

      visitors.add(`${date}-${country}-${browser}`);

      // Aggregate by page
      pageViews[path] = (pageViews[path] || 0) + count;

      // Aggregate by country
      countryViews[country] = (countryViews[country] || 0) + count;

      // Aggregate by browser
      browserViews[browser] = (browserViews[browser] || 0) + count;

      // Aggregate by device
      deviceViews[device] = (deviceViews[device] || 0) + count;

      // Daily views for weekly chart
      if (date) {
        if (!dailyViews[date]) {
          dailyViews[date] = { views: 0, visitors: new Set() };
        }
        dailyViews[date].views += count;
        dailyViews[date].visitors.add(`${country}-${browser}`);
      }
    });

    // Format top pages
    const topPages = Object.entries(pageViews)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([path, views]) => ({ path, views }));

    // Format top countries with flags
    const countryFlags: { [key: string]: string } = {
      'IN': '🇮🇳', 'US': '🇺🇸', 'GB': '🇬🇧', 'CA': '🇨🇦', 'AU': '🇦🇺',
      'DE': '🇩🇪', 'FR': '🇫🇷', 'JP': '🇯🇵', 'BR': '🇧🇷', 'SG': '🇸🇬'
    };

    const topCountries = Object.entries(countryViews)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([code, visits]) => ({
        country: code,
        visits,
        flag: countryFlags[code] || '🌍'
      }));

    // Format hourly data (last 24 hours)
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      views: hourlyViews[i] || 0
    }));

    // Format weekly data
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekAgo.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = dailyViews[dateStr] || { views: 0, visitors: new Set() };
      return {
        day: daysOfWeek[date.getDay()],
        views: dayData.views,
        visitors: dayData.visitors.size
      };
    });

    // Calculate browser percentages
    const totalBrowserViews = Object.values(browserViews).reduce((a, b) => a + b, 0);
    const browserData = Object.entries(browserViews)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([browser, views]) => ({
        browser,
        percentage: Math.round((views / totalBrowserViews) * 100)
      }));

    // Calculate device percentages
    const totalDeviceViews = Object.values(deviceViews).reduce((a, b) => a + b, 0);
    const deviceData = Object.entries(deviceViews)
      .map(([device, views]) => ({
        device,
        percentage: Math.round((views / totalDeviceViews) * 100)
      }));

    const analyticsData = {
      todayViews,
      todayVisitors: todayVisitors.size,
      totalViews,
      uniqueVisitors: visitors.size,
      topPages,
      topCountries,
      hourlyData,
      weeklyData,
      browserData,
      deviceData
    };

    return new Response(JSON.stringify(analyticsData), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch analytics' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
};
