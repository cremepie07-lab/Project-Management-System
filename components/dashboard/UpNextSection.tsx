import { getActiveNotifications } from "@/app/actions/notifications";
import { getSession } from "@/lib/session";
import { Clock } from "lucide-react";
import NotificationCard from "./NotificationCard";
import UpNextIntroCard from "./UpNextIntroCard";

/**
 * UpNextSection — Server Component
 *
 * Fetches active (non-dismissed) notifications for the current user
 * and renders them as a vertical feed of NotificationCards.
 * Shows an intro card when there are no active notifications.
 *
 * Placed above the "Xem gần đây" section on the Dashboard.
 */
export default async function UpNextSection() {
  const session = await getSession();
  if (!session) return null;

  const notifications = await getActiveNotifications();

  return (
    <section>
      {/* Header — same style as "Xem gần đây" */}
      <div className="flex items-center gap-2.5 mb-3.5 px-1">
        <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sắp tới</h2>
      </div>

      {notifications.length === 0 ? (
        <div className="max-w-xl">
          <UpNextIntroCard />
        </div>
      ) : (
        /* Vertical card feed */
        <div className="flex flex-col gap-4 max-w-xl">
          {notifications.map((n) => (
            <NotificationCard
              key={n.id}
              notification={n}
              userAvatar={session.avatarUrl ?? null}
              userName={session.name}
            />
          ))}
        </div>
      )}
    </section>
  );
}
