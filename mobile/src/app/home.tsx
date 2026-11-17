import { Redirect, router, type Href } from "expo-router";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar, Hint, ListItem, Notice } from "@/components/ui";
import { roleLabel } from "@/features/auth/api";
import { useSession } from "@/features/auth/use-session";
import { useProfileGate } from "@/features/profile/profile-gate";
import { listNotifications } from "@/features/notifications/api";
import { useResource } from "@/lib/use-resource";
import { colors, radius, shadow } from "@/theme";

interface MenuItem {
  title: string;
  description: string;
  icon: string;
  href: Href;
  /** Acțiune care cere profil complet; textul completează „Completează-ți profilul pentru a …”. */
  feature?: string;
}

const playerMenu: MenuItem[] = [
  { icon: "⚽", title: "Meciuri", description: "Găsește un meci și înscrie-te", href: "/matches" },
  { icon: "➕", title: "Creează meci", description: "Pe o rezervare aprobată", href: "/matches/new", feature: "crea un meci" },
  { icon: "🏟️", title: "Terenuri", description: "Rezervă un interval liber", href: "/fields" },
  { icon: "📅", title: "Rezervările mele", description: "Vezi dacă s-au aprobat", href: "/reservations" },
];

const fieldAdminMenu: MenuItem[] = [
  { icon: "🏟️", title: "Terenurile mele", description: "Program, intervale, cereri", href: "/my-fields" },
  { icon: "➕", title: "Adaugă teren", description: "Apare imediat în aplicație", href: "/fields/new", feature: "adăuga un teren" },
];

const adminMenu: MenuItem[] = [
  { icon: "🏟️", title: "Terenuri", description: "Toate terenurile", href: "/fields" },
  { icon: "⚽", title: "Meciuri", description: "Meciurile viitoare", href: "/matches" },
];

// Ecranul principal după autentificare. Meniul depinde de perspectiva activă (`activeRole`).
export default function HomeScreen() {
  const session = useSession();
  const { requireProfile } = useProfileGate();
  const notifications = useResource(
    () => (session ? listNotifications(session.token) : Promise.resolve(null)),
    [session?.token],
  );

  if (!session) return <Redirect href="/" />;

  const menu = session.isPlayer ? playerMenu : session.isFieldAdmin ? fieldAdminMenu : adminMenu;
  const unread = notifications.data?.unreadCount ?? 0;
  const name = session.user.email.split("@")[0];

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.hero} edges={["top"]}>
        <View style={styles.heroInner}>
          <View style={styles.heroTop}>
            <Text style={styles.brand}>⚽ Sintetico</Text>
            <View style={styles.heroActions}>
              <Pressable
                onPress={() => router.push("/notifications")}
                accessibilityRole="button"
                accessibilityLabel={unread > 0 ? `Notificări, ${unread} noi` : "Notificări"}
                style={styles.iconButton}
              >
                <Text style={styles.iconButtonText}>🔔</Text>
                {unread > 0 && (
                  <View style={styles.dot}>
                    <Text style={styles.dotText}>{unread > 9 ? "9+" : unread}</Text>
                  </View>
                )}
              </Pressable>
              <Pressable onPress={() => router.push("/account")} accessibilityRole="button" accessibilityLabel="Contul meu">
                <Avatar name={name} size={40} />
              </Pressable>
            </View>
          </View>

          <Text style={styles.greeting}>Salut, {name}!</Text>
          <View style={styles.rolePill}>
            <Text style={styles.roleText}>{roleLabel(session.activeRole)}</Text>
          </View>
        </View>
      </SafeAreaView>

      <SafeAreaView style={styles.flex} edges={["bottom"]}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={false} onRefresh={notifications.reload} tintColor={colors.primary} />}
        >
          {session.activeRole === "ADMIN" && (
            <Hint>Ca să folosești aplicația ca un anumit tip de cont, alege perspectiva din „Contul meu”.</Hint>
          )}

          {session.mustCompleteProfile && (
            <View style={styles.incomplete}>
              <Notice
                message={
                  <>
                    <Text style={styles.link} onPress={() => router.push("/profile")} accessibilityRole="link">
                      Profilul tău
                    </Text>{" "}
                    nu e complet. Adaugă numele și numărul de telefon ca să poți folosi aplicația.
                  </>
                }
                tone="warning"
              />
            </View>
          )}

          <Text style={styles.sectionTitle}>Ce vrei să faci?</Text>
          <View style={styles.grid}>
            {menu.map((item) => (
              <Pressable
                key={item.title}
                onPress={() =>
                  item.feature ? requireProfile(item.feature, () => router.push(item.href)) : router.push(item.href)
                }
                accessibilityRole="button"
                style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
              >
                <View style={styles.tileIcon}>
                  <Text style={styles.tileIconText}>{item.icon}</Text>
                </View>
                <Text style={styles.tileTitle}>{item.title}</Text>
                <Text style={styles.tileText}>{item.description}</Text>
              </Pressable>
            ))}
          </View>

          {/* Notificările și „Contul meu” se deschid din clopoțelul și bulina din antet. */}
          <Text style={styles.sectionTitle}>Contul tău</Text>
          <ListItem
            icon="👤"
            title="Profilul meu"
            subtitle={session.isPlayer ? "Nume, telefon, dată de naștere, poziție, categorie" : "Nume și telefon"}
            onPress={() => router.push("/profile")}
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  hero: { backgroundColor: colors.primary, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  heroInner: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24, width: "100%", maxWidth: 520, alignSelf: "center" },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brand: { fontSize: 18, fontWeight: "800", color: "#FFFFFF" },
  heroActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonText: { fontSize: 18 },
  dot: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 4,
    backgroundColor: colors.error,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  dotText: { color: "#FFFFFF", fontSize: 10, fontWeight: "800" },
  greeting: { fontSize: 28, fontWeight: "800", color: "#FFFFFF", marginTop: 22, letterSpacing: -0.3 },
  rolePill: {
    alignSelf: "flex-start",
    marginTop: 8,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  roleText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },

  incomplete: { marginBottom: 20 },
  link: { textDecorationLine: "underline", fontWeight: "700" },
  content: { padding: 20, paddingBottom: 40, width: "100%", maxWidth: 520, alignSelf: "center" },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 12, marginTop: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 },
  tile: {
    flexBasis: "47%",
    flexGrow: 1,
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 16,
    minHeight: 140,
    ...shadow,
  },
  tilePressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  tileIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  tileIconText: { fontSize: 22 },
  tileTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  tileText: { fontSize: 13, color: colors.textMuted, marginTop: 4, lineHeight: 18 },
});
