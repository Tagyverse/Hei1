const onRequest = async (context) => {
  const { request, env } = context;
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
  }
  try {
    const accountId = env.CLOUDFLARE_ACCOUNT_ID || "06733e3098d1ab1474045b028939f839";
    const token = env.CLOUDFLARE_ANALYTICS_TOKEN || "8LxUm7_Bu8oZPq0qjMZdACpJeCNxtgasw8OOv0PR";
    const now = /* @__PURE__ */ new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1e3);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1e3);
    const query = `
      query {
        viewer {
          accounts(filter: {accountTag: "${accountId}"}) {
            rumPageloadEventsAdaptiveGroups(
              filter: {
                date_geq: "${weekAgo.toISOString().split("T")[0]}"
                date_leq: "${now.toISOString().split("T")[0]}"
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
    const response = await fetch("https://api.cloudflare.com/client/v4/graphql", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query })
    });
    if (!response.ok) {
      throw new Error(`Cloudflare API error: ${response.status}`);
    }
    const data = await response.json();
    const events = data.data?.viewer?.accounts?.[0]?.rumPageloadEventsAdaptiveGroups || [];
    let todayViews = 0;
    let totalViews = 0;
    const visitors = /* @__PURE__ */ new Set();
    const todayVisitors = /* @__PURE__ */ new Set();
    const pageViews = {};
    const countryViews = {};
    const browserViews = {};
    const deviceViews = {};
    const hourlyViews = {};
    const dailyViews = {};
    events.forEach((event) => {
      const count = event.count;
      const date = event.dimensions?.date;
      const path = event.dimensions?.requestPath || "/";
      const country = event.dimensions?.requestCountry || "Unknown";
      const browser = event.dimensions?.userAgentBrowser || "Unknown";
      const device = event.dimensions?.deviceType || "Desktop";
      totalViews += count;
      if (date === today.toISOString().split("T")[0]) {
        todayViews += count;
        todayVisitors.add(`${date}-${country}-${browser}`);
      }
      visitors.add(`${date}-${country}-${browser}`);
      pageViews[path] = (pageViews[path] || 0) + count;
      countryViews[country] = (countryViews[country] || 0) + count;
      browserViews[browser] = (browserViews[browser] || 0) + count;
      deviceViews[device] = (deviceViews[device] || 0) + count;
      if (date) {
        if (!dailyViews[date]) {
          dailyViews[date] = { views: 0, visitors: /* @__PURE__ */ new Set() };
        }
        dailyViews[date].views += count;
        dailyViews[date].visitors.add(`${country}-${browser}`);
      }
    });
    const topPages = Object.entries(pageViews).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([path, views]) => ({ path, views }));
    const countryFlags = {
      "IN": "\u{1F1EE}\u{1F1F3}",
      "US": "\u{1F1FA}\u{1F1F8}",
      "GB": "\u{1F1EC}\u{1F1E7}",
      "CA": "\u{1F1E8}\u{1F1E6}",
      "AU": "\u{1F1E6}\u{1F1FA}",
      "DE": "\u{1F1E9}\u{1F1EA}",
      "FR": "\u{1F1EB}\u{1F1F7}",
      "JP": "\u{1F1EF}\u{1F1F5}",
      "BR": "\u{1F1E7}\u{1F1F7}",
      "SG": "\u{1F1F8}\u{1F1EC}"
    };
    const topCountries = Object.entries(countryViews).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([code, visits]) => ({
      country: code,
      visits,
      flag: countryFlags[code] || "\u{1F30D}"
    }));
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      views: hourlyViews[i] || 0
    }));
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekAgo.getTime() + i * 24 * 60 * 60 * 1e3);
      const dateStr = date.toISOString().split("T")[0];
      const dayData = dailyViews[dateStr] || { views: 0, visitors: /* @__PURE__ */ new Set() };
      return {
        day: daysOfWeek[date.getDay()],
        views: dayData.views,
        visitors: dayData.visitors.size
      };
    });
    const totalBrowserViews = Object.values(browserViews).reduce((a, b) => a + b, 0);
    const browserData = Object.entries(browserViews).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([browser, views]) => ({
      browser,
      percentage: Math.round(views / totalBrowserViews * 100)
    }));
    const totalDeviceViews = Object.values(deviceViews).reduce((a, b) => a + b, 0);
    const deviceData = Object.entries(deviceViews).map(([device, views]) => ({
      device,
      percentage: Math.round(views / totalDeviceViews * 100)
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
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error) {
    console.error("Analytics fetch error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch analytics" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
};
export {
  onRequest
};
