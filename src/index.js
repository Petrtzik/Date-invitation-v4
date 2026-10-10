
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Serve the invitation website
    if (url.pathname !== "/api/confirm") {
      return env.ASSETS.fetch(request);
    }

    // Only POST requests are allowed
    if (request.method !== "POST") {
      return new Response("Method not allowed", {
        status: 405
      });
    }

    // Check notification configuration
    if (!env.NTFY_TOPIC || !env.NTFY_TOPIC.trim()) {
      return new Response("Notification not configured", {
        status: 503
      });
    }

    // Read and validate the request
    let details;

    try {
      details = await request.json();
    } catch {
      return new Response("Invalid JSON", {
        status: 400
      });
    }

    const { activity, date, time } = details || {};

    if (
      typeof activity !== "string" ||
      !activity.trim() ||
      typeof date !== "string" ||
      typeof time !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !/^\d{2}:\d{2}$/.test(time)
    ) {
      return new Response("Invalid date details", {
        status: 400
      });
    }

    const message =
      `Date confirmed! 💖\n` +
      `Activity: ${activity}\n` +
      `Date: ${date}\n` +
      `Time: ${time}`;

    try {
      const response = await fetch(
        `https://ntfy.sh/${encodeURIComponent(
          env.NTFY_TOPIC.trim()
        )}`,
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
        console.error(
          "ntfy rejected request:",
          response.status
        );

        return new Response(
          `Notification service error: ${response.status}`,
          { status: 502 }
        );
      }

      return Response.json({
        success: true,
        message: "Date notification sent successfully"
      });

    } catch (error) {
      console.error(
        "Notification delivery error:",
        error
      );

      return new Response(
        "Could not connect to notification service",
        { status: 502 }
      );
    }
  }
};
