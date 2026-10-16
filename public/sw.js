self.addEventListener("push", (event) => {
  let message = {};
  try {
    message = event.data ? event.data.json() : {};
  } catch {
    message = { body: event.data ? event.data.text() : "A customer placed an order." };
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const dashboardWindows = windows.filter((client) => {
        const url = new URL(client.url);
        return url.origin === self.location.origin && url.pathname.startsWith("/business-admin");
      });
      const visibleDashboard = dashboardWindows.filter((client) => client.visibilityState === "visible");

      if (visibleDashboard.length) {
        visibleDashboard.forEach((client) => client.postMessage({ type: "QTOO_NEW_ORDER_PAID" }));
        return;
      }

      return self.registration.showNotification(message.title || "New Qtoo order", {
        body: message.body || "Open the dashboard to review the order.",
        icon: "/icon.png",
        badge: "/icon.png",
        tag: message.tag || "streeto-new-order",
        renotify: true,
        requireInteraction: true,
        silent: false,
        vibrate: [800, 200, 800, 200, 1200, 250, 1200],
        timestamp: Date.now(),
        data: message.data || { url: "/business-admin" },
      });
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destination = new URL(event.notification.data?.url || "/business-admin", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const existing = windows.find((client) => new URL(client.url).origin === self.location.origin);
      if (existing) return existing.focus().then(() => existing.navigate(destination));
      return self.clients.openWindow(destination);
    })
  );
});
