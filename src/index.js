
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname !== "/api/confirm") {
      return env.ASSETS.fetch(request);
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", {
        status: 405
      });
    }

    try {
      const { activity, date, time } = await request.json();

      if (
        typeof activity !== "string" ||
        typeof date !== "string" ||
        typeof time !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !/^\d{2}:\d{2}$/.test(time)
      ) {
        return new Response("Invalid details", {
          status: 400
        });
      }

      if (!env.NTFY_TOPIC) {
        return new Response("Notification not configured", {
          status: 503
        });
      }

      const message =
        `Date confirmed!\n` +
        `Activity: ${activity}\n` +
        `Date: ${date}\n` +
        `Time: ${time}`;

      const response = await fetch(
        `https://ntfy.sh/${encodeURIComponent(env.NTFY_TOPIC)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Title": "Date Invitation",
            "Tags": "heart"
          },
          body: message
        }
      );

      if (!response.ok) {
        throw new Error("Notification failed");
      }

      return Response.json({ success: true });

    } catch (error) {
      return new Response("Could not send notification", {
        status: 500
      });
    }
  }
};
  
