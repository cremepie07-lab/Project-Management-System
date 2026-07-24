import Pusher from "pusher";

let _pusherServer: Pusher | undefined;

export function getPusherServer(): Pusher {
  if (!_pusherServer) {
    if (
      !process.env.PUSHER_APP_ID ||
      !process.env.PUSHER_KEY ||
      !process.env.PUSHER_SECRET ||
      !process.env.PUSHER_CLUSTER
    ) {
      throw new Error("Missing Pusher environment variables");
    }
    _pusherServer = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER,
      useTLS: true,
    });
  }
  return _pusherServer;
}

/**
 * Trigger a board event to all clients subscribed to the board channel.
 * Channel: board-{boardId}
 */
export async function triggerBoardEvent(
  boardId: string,
  eventName: string,
  data: Record<string, unknown>
) {
  try {
    await getPusherServer().trigger(`board-${boardId}`, eventName, data);
  } catch (err) {
    console.error(`Pusher board event failed (${eventName}):`, err);
  }
}

/**
 * Trigger a notification event to a specific user's private channel.
 * Channel: private-user-{userId}
 */
export async function triggerUserNotification(
  userId: string,
  notification: Record<string, unknown>
) {
  try {
    await getPusherServer().trigger(
      `private-user-${userId}`,
      "notification:new",
      { notification }
    );
  } catch (err) {
    console.error("Pusher notification event failed:", err);
  }
}
