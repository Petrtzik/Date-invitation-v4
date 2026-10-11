
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname !== "/api/confirm") {
      return env.ASSETS.fetch(request);
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const topic = env.NTFY_TOPIC?.trim();

    if (!topic) {
      return new Response("Notification not configured", {
        status: 503
      });
    }

    let details;

    try {
      details = await request.json();
    } catch {
      return new Response("Invalid JSON", { status: 400 });
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
        `https://ntfy.sh/${encodeURIComponent(topic)}`,
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

      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        const errorBody = (await response.text()).slice(0, 500);

        console.error("ntfy rate limit:", {
          status: 429,
          retryAfter,
          details: errorBody
        });

        return Response.json({
          success: false,
          message: "Notification temporarily unavailable. Please try later."
        }, {
          status: 503,
          headers: { "Cache-Control": "no-store" }
        });
      }

      if (!response.ok) {
        console.error("ntfy error:", response.status);

        return new Response("Notification service error", {
          status: 502
        });
      }

      return Response.json({
        success: true,
        message: "Date notification sent successfully"
      });

    } catch (error) {
      console.error("Notification delivery error:", error);

      return new Response("Notification service unavailable", {
        status: 502
      });
    }
  }
};
