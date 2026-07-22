import Pusher from "pusher-js";

let pusherClient: Pusher | null = null;

export function getPusherClient(): Pusher {
  if (pusherClient) return pusherClient;

  pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    forceTLS: true,
    // Private channel auth — client tự gửi POST đến endpoint này
    // khi subscribe private-user-{userId}
    channelAuthorization: {
      endpoint: "/api/pusher/auth",
      transport: "ajax",
      headers: {},
    },
  });

  return pusherClient;
}
