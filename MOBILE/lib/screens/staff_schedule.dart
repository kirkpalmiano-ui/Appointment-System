import 'package:flutter/material.dart';
import 'package:cliniquick/services/api.dart';
import 'package:cliniquick/tempstore/activesession.dart';
import 'package:cliniquick/theme.dart';
import 'package:cliniquick/utils/format.dart';
import 'package:cliniquick/widgets/appointment_card.dart';
import 'package:cliniquick/widgets/common.dart';
import 'package:cliniquick/widgets/motion.dart';
import 'package:cliniquick/widgets/ui.dart';

// Staff home: summary counts and one day's appointments and time off.
class StaffScheduleState extends StatefulWidget {
  const StaffScheduleState({super.key});
  @override
  State<StaffScheduleState> createState() => StaffSchedulePage();
}

class StaffSchedulePage extends State<StaffScheduleState> {
  String date = todayString();
  Map<String, dynamic> summary = {};
  List appointments = [];
  List timeOff = [];
  bool loading = true;
  String error = "";

  @override
  void initState() {
    super.initState();
    loadData();
  }

  Future<void> loadData() async {
    setState(() {
      loading = true;
      error = "";
    });
    try {
      final results = await Future.wait([
        Api.get("/staff-portal/summary"),
        Api.get("/staff-portal/day", query: {"date": date}),
      ]);
      setState(() {
        summary = Map<String, dynamic>.from(results[0]);
        appointments = results[1]["appointments"];
        timeOff = results[1]["timeOff"];
      });
    } on ApiException catch (e) {
      setState(() => error = e.message);
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  void changeDay(int days) {
    date = toDateString(parseDate(date).add(Duration(days: days)));
    loadData();
  }

  Future<void> pickDay() async {
    final today = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: parseDate(date),
      firstDate: today.subtract(const Duration(days: 365)),
      lastDate: today.add(const Duration(days: 365)),
    );
    if (picked == null) return;
    date = toDateString(picked);
    loadData();
  }

  Future<void> openAppointment(Map<String, dynamic> appointment) async {
    final changed = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * 0.9, maxWidth: 640),
      sheetAnimationStyle: reduceMotion(context) ? AnimationStyle.noAnimation : null,
      builder: (context) => AppointmentSheet(appointment: appointment),
    );
    if (changed == true) loadData();
  }

  // Count tile: soft icon square, the number, and a muted label.
  Widget statBox(String label, dynamic value, IconData icon, ChipTone tone) {
    final c = AppColors.of(context);
    final count = (value as num?)?.toInt() ?? 0;
    final (bg, fg) = switch (tone) {
      ChipTone.info => (c.infoBg, c.infoText),
      ChipTone.pending => (c.pendingBg, c.pendingText),
      ChipTone.success => (c.successBg, c.successText),
      _ => (c.chipBg, c.chipText),
    };
    return Expanded(
      child: Semantics(
        label: "$label: $count",
        excludeSemantics: true,
        child: FrostedCard(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              IconTile(icon, bg: bg, fg: fg, size: 38),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    CountUp(value: count, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, height: 1.1, color: c.text)),
                    Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12.5, color: c.muted)),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final name = (Activesession.user["firstName"] ?? Activesession.user["name"] ?? "").toString();
    final isToday = date == todayString();
    return AppScaffold(
      tab: AppTab.schedule,
      body: RefreshIndicator(
        onRefresh: loadData,
        color: c.primary,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: EdgeInsets.fromLTRB(18, 18, 18, tabBarSpace(context)),
          children: [
            PageTitle("My schedule.", subtitle: "${name.isEmpty ? "Hi!" : "Hi, $name!"} Your appointments and time off by day."),
            const SizedBox(height: 18),
            Row(
              children: [
                statBox("Today", summary["today"], Icons.today_rounded, ChipTone.accent),
                const SizedBox(width: 10),
                statBox("Next 7 days", summary["next7Days"], Icons.date_range_rounded, ChipTone.info),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                statBox("Pending", summary["pending"], Icons.hourglass_empty_rounded, ChipTone.pending),
                const SizedBox(width: 10),
                statBox("Completed", summary["completed"], Icons.task_alt_rounded, ChipTone.success),
              ],
            ),
            const SizedBox(height: 18),
            // Day switcher: previous · date (tap to pick) · next.
            FrostedCard(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
              child: Row(
                children: [
                  IconButton(
                    tooltip: "Previous day",
                    onPressed: () => changeDay(-1),
                    icon: Icon(Icons.chevron_left_rounded, color: c.text),
                  ),
                  Expanded(
                    child: Semantics(
                      button: true,
                      label: "${isToday ? "Today, " : ""}${formatDate(date)}. Choose a day",
                      excludeSemantics: true,
                      child: InkWell(
                        onTap: pickDay,
                        borderRadius: BorderRadius.circular(14),
                        child: ConstrainedBox(
                          constraints: const BoxConstraints(minHeight: 48),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 6),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Eyebrow(["Today", "Tomorrow"].contains(relativeDay(date)) ? relativeDay(date) : "Selected day"),
                                const SizedBox(height: 2),
                                Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.calendar_today_outlined, size: 14, color: c.primary),
                                    const SizedBox(width: 6),
                                    Flexible(
                                      child: Text(
                                        formatDate(date),
                                        overflow: TextOverflow.ellipsis,
                                        style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: c.text),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  IconButton(
                    tooltip: "Next day",
                    onPressed: () => changeDay(1),
                    icon: Icon(Icons.chevron_right_rounded, color: c.text),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),
            if (error.isNotEmpty) _ErrorBanner(error),
            if (loading)
              Padding(padding: const EdgeInsets.all(40), child: Center(child: CircularProgressIndicator(color: c.primary)))
            else ...[
              for (final entry in timeOff)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: FrostedCard(
                    padding: const EdgeInsets.all(14),
                    child: Row(
                      children: [
                        IconTile(Icons.beach_access_rounded, bg: c.pendingBg, fg: c.pendingText),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                entry["allDay"] == true ? "Time off (all day)" : "Time off ${formatTimeRange(entry["startTime"], entry["endTime"])}",
                                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: c.text),
                              ),
                              if ((entry["reason"] ?? "").isNotEmpty) ...[
                                const SizedBox(height: 2),
                                Text(entry["reason"], style: TextStyle(fontSize: 13, color: c.muted)),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              if (appointments.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.fromLTRB(4, 4, 4, 10),
                  child: Eyebrow("${appointments.length} ${appointments.length == 1 ? "appointment" : "appointments"}"),
                ),
              if (appointments.isEmpty)
                const _EmptyState(Icons.free_breakfast_outlined, "No appointments", "Nothing booked with you on this day.")
              else
                for (var i = 0; i < appointments.length; i++)
                  FadeSlideIn(
                    delay: Duration(milliseconds: 40 * (i < 6 ? i : 6)),
                    child: AppointmentCard(
                      appointment: Map<String, dynamic>.from(appointments[i]),
                      showClient: true,
                      onTap: () => openAppointment(Map<String, dynamic>.from(appointments[i])),
                    ),
                  ),
            ],
          ],
        ),
      ),
    );
  }
}

// Server error message in the soft danger colours.
class _ErrorBanner extends StatelessWidget {
  final String message;
  const _ErrorBanner(this.message);

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return Semantics(
      liveRegion: true,
      child: Container(
        width: double.infinity,
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: c.danger.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: c.danger.withValues(alpha: 0.3)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(Icons.error_outline_rounded, size: 20, color: c.danger),
            const SizedBox(width: 10),
            Expanded(child: Text(message, style: TextStyle(color: c.danger, fontWeight: FontWeight.w600))),
          ],
        ),
      ),
    );
  }
}

// Centred icon, title and hint for an empty day.
class _EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  const _EmptyState(this.icon, this.title, this.subtitle);

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return FrostedCard(
      padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 20),
      child: Column(
        children: [
          IconTile(icon, size: 52),
          const SizedBox(height: 12),
          Text(title, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: c.text)),
          const SizedBox(height: 4),
          Text(subtitle, textAlign: TextAlign.center, style: TextStyle(color: c.muted)),
        ],
      ),
    );
  }
}

// Details of one appointment for the staff member: client contact,
// private notes, and the Confirm / Mark completed actions.
class AppointmentSheet extends StatefulWidget {
  final Map<String, dynamic> appointment;
  const AppointmentSheet({super.key, required this.appointment});
  @override
  State<AppointmentSheet> createState() => AppointmentSheetPage();
}

class AppointmentSheetPage extends State<AppointmentSheet> {
  TextEditingController notesController = TextEditingController();
  late Map<String, dynamic> appointment;
  bool saving = false;
  bool changed = false;
  String error = "";

  @override
  void initState() {
    super.initState();
    appointment = widget.appointment;
    notesController.text = appointment["staffNotes"] ?? "";
  }

  @override
  void dispose() {
    notesController.dispose();
    super.dispose();
  }

  Future<void> update(Map<String, dynamic> body, String message) async {
    setState(() {
      saving = true;
      error = "";
    });
    try {
      final data = await Api.patch("/staff-portal/appointments/${appointment["_id"]}", body);
      setState(() {
        // Keep the notes we just saved; the populated reply may not include them.
        appointment = {...Map<String, dynamic>.from(data["appointment"]), "staffNotes": notesController.text.trim()};
        changed = true;
      });
      if (mounted) showMessage(context, message);
    } on ApiException catch (e) {
      setState(() => error = e.message);
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final service = appointment["service"] ?? {};
    final client = appointment["user"] ?? {};
    final status = appointment["status"];

    final c = AppColors.of(context);

    Widget row(IconData icon, String text) => Padding(
          padding: const EdgeInsets.symmetric(vertical: 5),
          child: Row(
            children: [
              IconTile(icon, size: 34),
              const SizedBox(width: 12),
              Expanded(child: Text(text, style: TextStyle(fontSize: 15, color: c.text))),
            ],
          ),
        );

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) Navigator.pop(context, changed);
      },
      child: Padding(
        padding: EdgeInsets.fromLTRB(20, 0, 20, MediaQuery.of(context).viewInsets.bottom + 20),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      service["name"] ?? "Removed service",
                      style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, letterSpacing: -0.6, color: c.text),
                    ),
                  ),
                  const SizedBox(width: 8),
                  StatusChip(status),
                ],
              ),
              const SizedBox(height: 10),
              row(Icons.event_outlined, formatDate(appointment["date"])),
              row(Icons.schedule_rounded, formatTimeRange(appointment["startTime"], appointment["endTime"])),
              const Padding(padding: EdgeInsets.symmetric(vertical: 12), child: Divider()),
              const Eyebrow("Client"),
              const SizedBox(height: 6),
              row(Icons.person_outline_rounded, client["name"] ?? "Deleted client"),
              if ((client["email"] ?? "").isNotEmpty) row(Icons.mail_outline_rounded, client["email"]),
              if ((client["phone"] ?? "").isNotEmpty) row(Icons.phone_outlined, client["phone"]),
              if ((appointment["notes"] ?? "").isNotEmpty) row(Icons.notes_rounded, "Client notes: ${appointment["notes"]}"),
              const Padding(padding: EdgeInsets.symmetric(vertical: 12), child: Divider()),
              if (error.isNotEmpty) _ErrorBanner(error),
              TextField(
                controller: notesController,
                maxLength: 500,
                maxLines: 3,
                style: TextStyle(fontSize: 16, color: c.text),
                decoration: const InputDecoration(labelText: "Staff notes (only staff and admins see these)"),
              ),
              const SizedBox(height: 4),
              OutlinedButton.icon(
                icon: const Icon(Icons.save_outlined, size: 18),
                label: const Text("Save notes"),
                onPressed: saving ? null : () => update({"staffNotes": notesController.text.trim()}, "Notes saved."),
              ),
              const SizedBox(height: 10),
              if (status == "pending") ...[
                FilledButton.icon(
                  icon: const Icon(Icons.check_rounded),
                  label: const Text("Confirm appointment"),
                  onPressed: saving ? null : () => update({"status": "confirmed"}, "Appointment confirmed."),
                ),
                const SizedBox(height: 10),
              ],
              if (isActive(appointment))
                FilledButton.tonalIcon(
                  style: FilledButton.styleFrom(backgroundColor: c.successBg, foregroundColor: c.successText),
                  icon: const Icon(Icons.done_all_rounded),
                  label: Text(hasStarted(appointment) ? "Mark completed" : "Can be completed once it starts"),
                  onPressed: saving || !hasStarted(appointment)
                      ? null
                      : () => update({"status": "completed"}, "Appointment marked completed."),
                ),
              const SizedBox(height: 8),
              TextButton(onPressed: () => Navigator.pop(context, changed), child: const Text("Close")),
            ],
          ),
        ),
      ),
    );
  }
}
