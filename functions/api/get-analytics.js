function generateSampleData() {
  const now = Date.now();
  const todayStart = (/* @__PURE__ */ new Date()).setHours(0, 0, 0, 0);
  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    let baseViews = 20;
    if (i >= 8 && i <= 10) baseViews = 120;
    if (i >= 12 && i <= 14) baseViews = 150;
    if (i >= 18 && i <= 22) baseViews = 180;
    if (i < 6 || i >= 23) baseViews = 5;
    return {
      hour: `${String(i).padStart(2, "0")}:00`,
      views: baseViews + Math.floor(Math.random() * 40)
    };
  });
  const weeklyData = [
    { day: "Mon", views: Math.floor(Math.random() * 300) + 800, visitors: Math.floor(Math.random() * 120) + 250 },
    { day: "Tue", views: Math.floor(Math.random() * 320) + 820, visitors: Math.floor(Math.random() * 130) + 260 },
    { day: "Wed", views: Math.floor(Math.random() * 310) + 810, visitors: Math.floor(Math.random() * 125) + 255 },
    { day: "Thu", views: Math.floor(Math.random() * 290) + 790, visitors: Math.floor(Math.random() * 115) + 245 },
    { day: "Fri", views: Math.floor(Math.random() * 400) + 900, visitors: Math.floor(Math.random() * 150) + 300 },
    { day: "Sat", views: Math.floor(Math.random() * 450) + 950, visitors: Math.floor(Math.random() * 170) + 350 },
    { day: "Sun", views: Math.floor(Math.random() * 380) + 880, visitors: Math.floor(Math.random() * 140) + 280 }
  ];
  return {
    todayViews: Math.floor(Math.random() * 800) + 1200,
    todayVisitors: Math.floor(Math.random() * 300) + 400,
    totalViews: Math.floor(Math.random() * 5e4) + 25e3,
    uniqueVisitors: Math.floor(Math.random() * 8e3) + 5e3,
    topPages: [
      { path: "/", views: Math.floor(Math.random() * 2e3) + 3500 },
      { path: "/shop", views: Math.floor(Math.random() * 1800) + 2800 },
      { path: "/categories", views: Math.floor(Math.random() * 1200) + 1800 },
      { path: "/cart", views: Math.floor(Math.random() * 800) + 1200 },
      { path: "/checkout", views: Math.floor(Math.random() * 600) + 900 }
    ],
    topCountries: [
      { country: "IN", visits: Math.floor(Math.random() * 8e3) + 12e3, flag: "\u{1F1EE}\u{1F1F3}" },
      { country: "US", visits: Math.floor(Math.random() * 2e3) + 3e3, flag: "\u{1F1FA}\u{1F1F8}" },
      { country: "GB", visits: Math.floor(Math.random() * 1500) + 2e3, flag: "\u{1F1EC}\u{1F1E7}" },
      { country: "CA", visits: Math.floor(Math.random() * 1e3) + 1500, flag: "\u{1F1E8}\u{1F1E6}" },
      { country: "AU", visits: Math.floor(Math.random() * 800) + 1200, flag: "\u{1F1E6}\u{1F1FA}" }
    ],
    hourlyData,
    weeklyData,
    browserData: [
      { browser: "Chrome", percentage: 55 },
      { browser: "Safari", percentage: 25 },
      { browser: "Firefox", percentage: 12 },
      { browser: "Edge", percentage: 5 },
      { browser: "Other", percentage: 3 }
    ],
    deviceData: [
      { device: "Mobile", percentage: 65 },
      { device: "Desktop", percentage: 30 },
      { device: "Tablet", percentage: 5 }
    ]
  };
}
const onRequest = async (context) => {
  const { request, env } = context;
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }
  try {
    if (!env.ANALYTICS_KV) {
      const sampleData = generateSampleData();
      return new Response(JSON.stringify(sampleData), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "X-Dev-Mode": "true"
        }
      });
    }
    const list = await env.ANALYTICS_KV.list({ prefix: "view:" });
    const viewKeys = list.keys.map((k) => k.name);
    const views = [];
    for (const key of viewKeys) {
      const data = await env.ANALYTICS_KV.get(key);
      if (data) {
        views.push(JSON.parse(data));
      }
    }
    if (views.length === 0) {
      const sampleData = generateSampleData();
      return new Response(JSON.stringify(sampleData), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "X-Dev-Mode": "true"
        }
      });
    }
    const now = Date.now();
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const todayStart = new Date(today).getTime();
    const todayViews = views.filter((v) => v.timestamp >= todayStart);
    const todayVisitors = new Set(todayViews.map((v) => v.sessionId)).size;
    const uniqueVisitors = new Set(views.map((v) => v.sessionId)).size;
    const pageCounts = views.reduce((acc, view) => {
      acc[view.path] = (acc[view.path] || 0) + 1;
      return acc;
    }, {});
    const topPages = Object.entries(pageCounts).map(([path, views2]) => ({ path, views: views2 })).sort((a, b) => b.views - a.views).slice(0, 5);
    const countryCounts = views.reduce((acc, view) => {
      if (view.country && view.country !== "Unknown") {
        acc[view.country] = (acc[view.country] || 0) + 1;
      }
      return acc;
    }, {});
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
      "MX": "\u{1F1F2}\u{1F1FD}",
      "SG": "\u{1F1F8}\u{1F1EC}",
      "NL": "\u{1F1F3}\u{1F1F1}",
      "SE": "\u{1F1F8}\u{1F1EA}",
      "NO": "\u{1F1F3}\u{1F1F4}",
      "DK": "\u{1F1E9}\u{1F1F0}"
    };
    const topCountries = Object.entries(countryCounts).map(([country, visits]) => ({
      country,
      visits,
      flag: countryFlags[country] || "\u{1F30D}"
    })).sort((a, b) => b.visits - a.visits).slice(0, 5);
    const hourlyCounts = Array(24).fill(0);
    todayViews.forEach((view) => {
      const hour = new Date(view.timestamp).getHours();
      hourlyCounts[hour]++;
    });
    const hourlyData = hourlyCounts.map((views2, hour) => ({
      hour: `${hour}:00`,
      views: views2
    }));
    const weekAgo = now - 7 * 24 * 60 * 60 * 1e3;
    const weeklyViews = views.filter((v) => v.timestamp >= weekAgo);
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyStats = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date(now - i * 24 * 60 * 60 * 1e3);
      const dayName = dayNames[date.getDay()];
      weeklyStats[dayName] = { views: 0, sessions: /* @__PURE__ */ new Set() };
    }
    weeklyViews.forEach((view) => {
      const date = new Date(view.timestamp);
      const dayName = dayNames[date.getDay()];
      if (weeklyStats[dayName]) {
        weeklyStats[dayName].views++;
        weeklyStats[dayName].sessions.add(view.sessionId);
      }
    });
    const weeklyArray = Object.entries(weeklyStats).map(([day, stats]) => ({
      day,
      views: stats.views,
      visitors: stats.sessions.size
    })).sort((a, b) => {
      const order = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      return order.indexOf(a.day) - order.indexOf(b.day);
    });
    const browserCounts = views.reduce((acc, view) => {
      if (view.browser) {
        acc[view.browser] = (acc[view.browser] || 0) + 1;
      }
      return acc;
    }, {});
    const totalBrowserViews = views.length || 1;
    const browserData = Object.entries(browserCounts).map(([browser, count]) => ({
      browser,
      percentage: Math.round(count / totalBrowserViews * 100)
    })).sort((a, b) => b.percentage - a.percentage);
    const deviceCounts = views.reduce((acc, view) => {
      if (view.deviceType) {
        acc[view.deviceType] = (acc[view.deviceType] || 0) + 1;
      }
      return acc;
    }, {});
    const totalDeviceViews = views.length || 1;
    const deviceData = Object.entries(deviceCounts).map(([device, count]) => ({
      device,
      percentage: Math.round(count / totalDeviceViews * 100)
    })).sort((a, b) => b.percentage - a.percentage);
    const analyticsData = {
      todayViews: todayViews.length,
      todayVisitors,
      totalViews: views.length,
      uniqueVisitors,
      topPages,
      topCountries,
      hourlyData,
      weeklyData: weeklyArray,
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
    console.error("Failed to get analytics:", error);
    const sampleData = generateSampleData();
    return new Response(JSON.stringify(sampleData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "X-Dev-Mode": "true",
        "X-Error-Fallback": "true"
      }
    });
  }
};
export {
  onRequest
};
