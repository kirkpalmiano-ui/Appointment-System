import 'package:flutter/material.dart';
import 'package:cliniquick/services/api.dart';
import 'package:cliniquick/tempstore/activesession.dart';
import 'package:cliniquick/theme.dart';
import 'package:cliniquick/utils/calendar.dart';
import 'package:cliniquick/utils/format.dart';
import 'package:cliniquick/widgets/common.dart';
import 'package:cliniquick/widgets/home/next_visit_card.dart';
import 'package:cliniquick/widgets/home/quick_actions.dart';
import 'package:cliniquick/widgets/home/recent_activity.dart';
import 'package:cliniquick/widgets/home/stat_card.dart';
import 'package:cliniquick/widgets/home/week_strip.dart';
import 'package:cliniquick/widgets/motion.dart';
import 'package:cliniquick/widgets/ui.dart';

String _plural(int n, String word) => "$n $word${n == 1 ? "" : "s"}";

// Greeting from the device's local time.
String _greetingFor(int hour) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// Client dashboard: next visit, this week, counts, recent activity and shortcuts (like the website's mobile dashboard).
class HomeState extends StatefulWidget {
  const HomeState({super.key});
  @override
  State<HomeState> createState() => HomePage();
}

class HomePage extends State<HomeState> {
  Map<String, dynamic> stats = {};
  List upcoming = []; // active upcoming visits (up to 50), soonest first
  List recent = []; // latest bookings, for the activity timeline
  bool loading = true;
  String error = "";
  final String greeting = _greetingFor(DateTime.now().hour);

  @override
  void initState() {
    super.initState();
    loadData();
  }

  Future<void> loadData() async {
    setState(() => error = "");
    try {
      final results = await Future.wait([
        Api.get("/appointments/stats"),
        Api.get("/appointments", query: {"scope": "upcoming", "status": "active", "limit": "50"}),
        Api.get("/appointments", query: {"limit": "20"}),
      ]);
      if (!mounted) return;
      setState(() {
        stats = Map<String, dynamic>.from(results[0]);
        upcoming = List.of(results[1]["items"] ?? [])
          ..sort((a, b) => "${a["date"]} ${a["startTime"]}".compareTo("${b["date"]} ${b["startTime"]}"));
        recent = List.of(results[2]["items"] ?? []);
      });
    } on ApiException catch (e) {
      if (mounted) setState(() => error = e.message);
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> book() async {
    await Navigator.pushNamed(context, "/book");
    await loadData();
  }

  Future<void> reschedule(Map<String, dynamic> appointment) async {
    await Navigator.pushNamed(context, "/book", arguments: appointment);
    await loadData();
  }

  Future<void> calendar(Map<String, dynamic> appointment) async {
    final ok = await addToCalendar(appointment);
    if (!ok && mounted) showMessage(context, "Couldn't open your calendar.", error: true);
  }

  Future<void> cancelAppointment(Map<String, dynamic> appointment) async {
    final ok = await confirmDialog(
        context,
        "Cancel this appointment?",
        "Your ${appointment["service"]?["name"] ?? ""} appointment on ${formatDate(appointment["date"])} at "
            "${formatTimeRange(appointment["startTime"], appointment["endTime"])} will be cancelled and the time slot released.",
        "Cancel appointment");
    if (!ok) return;
    try {
      await Api.put("/appointments/${appointment["_id"]}", {"status": "cancelled"});
      if (!mounted) return;
      showMessage(context, "Appointment cancelled.");
      loadData();
    } on ApiException catch (e) {
      if (mounted) showMessage(context, e.message, error: true);
    }
  }

  // Active visits within the next 7 days (today included).
  int get thisWeek {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    return upcoming.where((a) {
      final date = (a["date"] ?? "").toString();
      if (!RegExp(r"^\d{4}-\d{2}-\d{2}$").hasMatch(date)) return false;
      final days = parseDate(date).difference(today).inDays;
      return days >= 0 && days < 7;
    }).length;
  }

  List<Widget> statCards(AppColors c, bool hasNext) {
    final byStatus = stats["byStatus"] is Map ? stats["byStatus"] : const {};
    int? count(dynamic v) => stats.isEmpty ? null : (v as num?)?.toInt() ?? 0;
    final today = count(stats["today"]);
    final pending = count(byStatus["pending"]);
    final confirmed = count(byStatus["confirmed"]);
    final completed = count(byStatus["completed"]);
    return [
      StatCard(
        label: "Today",
        icon: Icons.today_rounded,
        tileBg: c.chipBg,
        tileFg: c.chipText,
        value: today,
        helper: (today ?? 0) > 0 ? "${_plural(today!, "visit")} today" : "Free day, nothing scheduled",
      ),
      StatCard(
        label: "Pending",
        icon: Icons.hourglass_top_rounded,
        tileBg: c.pendingBg,
        tileFg: c.pendingText,
        value: pending,
        valueColor: (pending ?? 0) > 0 ? c.pendingText : null,
        helper: (pending ?? 0) > 0 ? "Waiting for clinic confirmation" : "Nothing waiting",
      ),
      StatCard(
        label: "Confirmed",
        icon: Icons.check_circle_rounded,
        tileBg: c.successBg,
        tileFg: c.successText,
        value: confirmed,
        helper: (confirmed ?? 0) > 0 ? "Ready to go" : "None confirmed yet",
      ),
      StatCard(
        label: "Completed",
        icon: Icons.task_alt_rounded,
        tileBg: c.infoBg,
        tileFg: c.infoText,
        value: completed,
        helper: (completed ?? 0) > 0
            ? "$completed completed so far"
            : hasNext
                ? "Your first visit is coming up"
                : "No completed visits yet",
      ),
    ];
  }

  // Wraps a section in the staggered entrance animation.
  Widget section(int index, Widget child) =>
      FadeSlideIn(delay: Duration(milliseconds: 60 * index), child: Padding(padding: const EdgeInsets.only(bottom: 20), child: child));

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final user = Activesession.user;
    final fullName = (user["name"] ?? "").toString();
    final firstName = (user["firstName"] ?? (fullName.isEmpty ? "" : fullName.split(" ").first)).toString();
    final next = upcoming.isEmpty ? null : Map<String, dynamic>.from(upcoming.first);
    final subtitle = loading
        ? "Here is a summary of your appointments."
        : thisWeek > 0
            ? "You have ${_plural(thisWeek, "upcoming visit")} this week."
            : "You have no visits this week.";
    final cards = statCards(c, next != null);

    return AppScaffold(
      tab: AppTab.home,
      onBook: loadData,
      body: RefreshIndicator(
        onRefresh: loadData,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: EdgeInsets.fromLTRB(18, 12, 18, tabBarSpace(context)),
          children: [
            // Header: avatar, greeting + name, notifications bell.
            Row(
              children: [
                InitialsAvatar(fullName.isEmpty ? firstName : fullName, size: 40, imageUrl: Activesession.user["avatarUrl"]?.toString()),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(greeting, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12.5, height: 1.3, color: c.muted)),
                      Text(
                        fullName.isEmpty ? firstName : fullName,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 15, height: 1.3, fontWeight: FontWeight.w800, color: c.text),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  tooltip: "Notifications",
                  onPressed: () => showNotificationsSheet(context),
                  style: IconButton.styleFrom(
                    fixedSize: const Size(44, 44),
                    backgroundColor: c.field,
                    side: BorderSide(color: c.border),
                  ),
                  icon: Icon(Icons.notifications_none_rounded, color: c.text),
                ),
              ],
            ),
            const SizedBox(height: 18),
            FadeSlideIn(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          "Hello, $firstName.",
                          style: TextStyle(fontSize: 32, fontWeight: FontWeight.w800, letterSpacing: -1.6, height: 1.05, color: c.text),
                        ),
                      ),
                      const SizedBox(width: 10),
                      // Minimal outlined wave icon in a soft tile (decorative).
                      ExcludeSemantics(
                        child: Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(color: c.chipBg, borderRadius: BorderRadius.circular(10)),
                          child: Icon(Icons.waving_hand_outlined, size: 18, color: c.primary),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(subtitle, style: TextStyle(color: c.muted, fontSize: 15)),
                ],
              ),
            ),
            const SizedBox(height: 20),
            if (error.isNotEmpty) errorBox(error),
            if (loading)
              const Padding(padding: EdgeInsets.all(40), child: Center(child: CircularProgressIndicator()))
            else ...[
              section(
                1,
                NextVisitCard(
                  appointment: next,
                  onBook: book,
                  onAddToCalendar: () => calendar(next!),
                  onReschedule: () => reschedule(next!),
                  onCancel: () => cancelAppointment(next!),
                ),
              ),
              section(2, WeekStrip(marked: {for (final a in upcoming) (a["date"] ?? "").toString()})),
              section(
                3,
                Semantics(
                  label: "Appointment stats",
                  container: true,
                  child: Column(
                    children: [
                      IntrinsicHeight(
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [Expanded(child: cards[0]), const SizedBox(width: 12), Expanded(child: cards[1])],
                        ),
                      ),
                      const SizedBox(height: 12),
                      IntrinsicHeight(
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [Expanded(child: cards[2]), const SizedBox(width: 12), Expanded(child: cards[3])],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              section(4, RecentActivity(items: buildActivity(recent, user))),
              section(
                5,
                QuickActions(
                  onBook: book,
                  onAppointments: () => Navigator.pushReplacementNamed(context, "/appointments"),
                  onProfile: () => Navigator.pushReplacementNamed(context, "/profile"),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
