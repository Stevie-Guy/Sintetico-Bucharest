import { Redirect, router, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Card, EmptyState, ErrorState, Hint, IconBubble, LoadingState, Screen, type Tone } from "@/components/ui";
import { useSession } from "@/features/auth/use-session";
import { listNotifications, markRead, type Notification } from "@/features/notifications/api";
import { formatDateTime } from "@/lib/datetime";
import { useResource } from "@/lib/use-resource";
import { colors } from "@/theme";

const typeStyle: Record<Notification["type"], { icon: string; tone: Tone }> = {
  RESERVATION_REQUESTED: { icon: "📥", tone: "warning" },
  RESERVATION_APPROVED: { icon: "✅", tone: "success" },
  RESERVATION_REJECTED: { icon: "✖️", tone: "error" },
};

// Notificările despre rezervări (US-07). Apăsarea o marchează ca citită și deschide ecranul potrivit.
export default function NotificationsScreen() {
  const session = useSession();
  const list = useResource(
    () => (session ? listNotifications(session.token) : Promise.resolve(null)),
    [session?.token],
  );

  if (!session) return <Redirect href="/" />;
  const { token } = session;

  async function open(n: Notification) {
    if (!n.readAt) {
      // Marcăm local imediat; dacă cererea eșuează, rămâne necitită la următoarea încărcare.
      list.setData((d) =>
        d
          ? {
              ...d,
              unreadCount: Math.max(0, d.unreadCount - 1),
              notifications: d.notifications.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)),
            }
          : d,
      );
      markRead(token, n.id).catch(() => {});
    }
    if (n.type === "RESERVATION_REQUESTED" && n.reservation) {
      router.push({ pathname: "/fields/[id]/reservations", params: { id: n.reservation.fieldId } });
    } else if (n.type !== "RESERVATION_REQUESTED") {
      router.push("/reservations");
    }
  }

  const notifications = list.data?.notifications ?? [];
  const unread = list.data?.unreadCount ?? 0;

  return (
    <Screen onRefresh={list.reload} refreshing={false}>
      <Stack.Screen options={{ title: "Notificări" }} />
      {list.loading && !list.data ? (
        <LoadingState />
      ) : list.error ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : notifications.length === 0 ? (
        <EmptyState icon="🔔" title="Nicio notificare" message="Aici apar cererile și răspunsurile la rezervări." />
      ) : (
        <View>
          {unread > 0 && (
            <Text style={styles.summary}>
              {unread === 1 ? "1 notificare necitită" : `${unread} notificări necitite`}
            </Text>
          )}
          {notifications.map((n) => {
            const t = typeStyle[n.type];
            const isUnread = !n.readAt;
            return (
              <Card key={n.id} onPress={() => open(n)} highlighted={isUnread}>
                <View style={styles.row}>
                  <IconBubble icon={t.icon} tone={t.tone} size={40} />
                  <View style={styles.body}>
                    <Text style={[styles.message, isUnread && styles.messageUnread]}>{n.message}</Text>
                    <Text style={styles.date}>{formatDateTime(n.createdAt)}</Text>
                  </View>
                  {isUnread && <View style={styles.dot} accessibilityLabel="Necitită" />}
                </View>
              </Card>
            );
          })}
          {list.data?.hasMore && <Hint>Se afișează cele mai recente 30 de notificări.</Hint>}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { fontSize: 14, fontWeight: "700", color: colors.textMuted, marginBottom: 10 },
  row: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  body: { flex: 1, gap: 4 },
  message: { fontSize: 15, lineHeight: 21, color: colors.text },
  messageUnread: { fontWeight: "600" },
  date: { fontSize: 13, color: colors.textMuted },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, marginTop: 6 },
});
