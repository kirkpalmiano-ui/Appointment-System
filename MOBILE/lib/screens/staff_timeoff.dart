import 'package:flutter/material.dart';
import 'package:cliniquick/services/api.dart';
import 'package:cliniquick/theme.dart';
import 'package:cliniquick/utils/format.dart';
import 'package:cliniquick/widgets/common.dart';
import 'package:cliniquick/widgets/motion.dart';
import 'package:cliniquick/widgets/ui.dart';

// Staff time off: upcoming days or hours when clients can't book them.
class StaffTimeOffState extends StatefulWidget {
  const StaffTimeOffState({super.key});
  @override
  State<StaffTimeOffState> createState() => StaffTimeOffPage();
}

class StaffTimeOffPage extends State<StaffTimeOffState> {
  List items = [];
  bool loading = true;
  String error = "";

  @override
  void initState() {
    super.initState();
    loadTimeOff();
  }

  Future<void> loadTimeOff() async {
    setState(() => error = "");
    try {
      final data = await Api.get("/time-off", query: {"limit": "50"});
      setState(() => items = data["items"]);
    } on ApiException catch (e) {
      setState(() => error = e.message);
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> addTimeOff() async {
    final added = await showDialog<bool>(context: context, builder: (context) => const AddTimeOffDialog());
    if (added == true) {
      if (mounted) showMessage(context, "Time off added.");
      loadTimeOff();
    }
  }

  Future<void> removeTimeOff(Map entry) async {
    final ok = await confirmDialog(context, "Remove time off?", "Clients will be able to book you again on ${formatDate(entry["date"])}.", "Remove");
    if (!ok) return;
    try {
      await Api.delete("/time-off/${entry["_id"]}");
      if (mounted) showMessage(context, "Time off removed.");
      loadTimeOff();
    } on ApiException catch (e) {
      if (mounted) showMessage(context, e.message, error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return AppScaffold(
      tab: AppTab.timeOff,
      body: RefreshIndicator(
        onRefresh: loadTimeOff,
        color: c.primary,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: EdgeInsets.fromLTRB(18, 18, 18, tabBarSpace(context)),
          children: [
            const PageTitle(
              "Time off.",
              subtitle: "Clients can't book you during these times. Existing appointments are not cancelled automatically.",
            ),
            const SizedBox(height: 18),
            SizedBox(
              height: 52,
              child: FilledButton.icon(
                onPressed: addTimeOff,
                icon: const Icon(Icons.add_rounded),
                label: const Text("Add time off"),
              ),
            ),
            const SizedBox(height: 20),
            if (error.isNotEmpty) _ErrorBanner(error),
            if (loading)
              Padding(padding: const EdgeInsets.all(40), child: Center(child: CircularProgressIndicator(color: c.primary)))
            else if (items.isEmpty)
              FrostedCard(
                padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 20),
                child: Column(
                  children: [
                    IconTile(Icons.beach_access_rounded, size: 52, bg: c.pendingBg, fg: c.pendingText),
                    const SizedBox(height: 12),
                    Text("No upcoming time off", style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: c.text)),
                    const SizedBox(height: 4),
                    Text("Tap Add time off to block a day or a few hours.", textAlign: TextAlign.center, style: TextStyle(color: c.muted)),
                  ],
                ),
              )
            else ...[
              Padding(
                padding: const EdgeInsets.fromLTRB(4, 0, 4, 10),
                child: Eyebrow("Upcoming · ${items.length}"),
              ),
              for (var i = 0; i < items.length; i++)
                FadeSlideIn(
                  delay: Duration(milliseconds: 40 * (i < 6 ? i : 6)),
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: _TimeOffCard(entry: items[i], onRemove: () => removeTimeOff(items[i])),
                  ),
                ),
            ],
          ],
        ),
      ),
    );
  }
}

// One time-off entry: date square, day, hours or "All day", private reason, remove button.
class _TimeOffCard extends StatelessWidget {
  final Map entry;
  final VoidCallback onRemove;
  const _TimeOffCard({required this.entry, required this.onRemove});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final allDay = entry["allDay"] == true;
    final reason = (entry["reason"] ?? "").toString();
    return FrostedCard(
      padding: const EdgeInsets.fromLTRB(12, 12, 4, 12),
      child: Row(
        children: [
          DateBox(entry["date"]),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(formatDate(entry["date"]), style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: c.text)),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    SoftChip(allDay ? "All day" : formatTimeRange(entry["startTime"], entry["endTime"]), tone: ChipTone.pending),
                  ],
                ),
                if (reason.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(reason, style: TextStyle(fontSize: 13, color: c.muted)),
                ],
              ],
            ),
          ),
          IconButton(
            icon: Icon(Icons.delete_outline_rounded, color: c.danger),
            tooltip: "Remove",
            onPressed: onRemove,
          ),
        ],
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

class AddTimeOffDialog extends StatefulWidget {
  const AddTimeOffDialog({super.key});
  @override
  State<AddTimeOffDialog> createState() => AddTimeOffDialogPage();
}

class AddTimeOffDialogPage extends State<AddTimeOffDialog> {
  TextEditingController reasonController = TextEditingController();
  String date = "";
  bool allDay = true;
  TimeOfDay startTime = const TimeOfDay(hour: 9, minute: 0);
  TimeOfDay endTime = const TimeOfDay(hour: 12, minute: 0);
  String error = "";
  bool saving = false;

  @override
  void dispose() {
    reasonController.dispose();
    super.dispose();
  }

  String hhmm(TimeOfDay time) => "${twoDigits(time.hour)}:${twoDigits(time.minute)}";

  Future<void> pickDate() async {
    final today = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: date.isEmpty ? today : parseDate(date),
      firstDate: today,
      lastDate: today.add(const Duration(days: 180)),
    );
    if (picked != null) setState(() => date = toDateString(picked));
  }

  Future<void> pickTime(bool start) async {
    final picked = await showTimePicker(context: context, initialTime: start ? startTime : endTime);
    if (picked == null) return;
    setState(() {
      if (start) {
        startTime = picked;
      } else {
        endTime = picked;
      }
    });
  }

  Future<void> save() async {
    if (date.isEmpty) {
      setState(() => error = "Choose a date.");
      return;
    }
    if (!allDay && hhmm(endTime).compareTo(hhmm(startTime)) <= 0) {
      setState(() => error = "End time must be later than start time.");
      return;
    }
    setState(() {
      saving = true;
      error = "";
    });
    try {
      await Api.post("/time-off", {
        "date": date,
        "allDay": allDay,
        if (!allDay) "startTime": hhmm(startTime),
        if (!allDay) "endTime": hhmm(endTime),
        "reason": reasonController.text.trim(),
      });
      if (mounted) Navigator.pop(context, true);
    } on ApiException catch (e) {
      setState(() {
        error = e.message;
        saving = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return AlertDialog(
      title: Text("Add time off", style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, letterSpacing: -0.6, color: c.text)),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (error.isNotEmpty) _ErrorBanner(error),
            OutlinedButton.icon(
              onPressed: pickDate,
              icon: Icon(Icons.calendar_today_outlined, size: 18, color: c.primary),
              label: Text(date.isEmpty ? "Choose a date" : formatDate(date)),
            ),
            const SizedBox(height: 4),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: Text("All day", style: TextStyle(fontWeight: FontWeight.w600, color: c.text)),
              value: allDay,
              onChanged: (value) => setState(() => allDay = value),
            ),
            if (!allDay)
              Row(
                spacing: 8,
                children: [
                  Expanded(child: OutlinedButton(onPressed: () => pickTime(true), child: Text("From ${formatTime(hhmm(startTime))}"))),
                  Expanded(child: OutlinedButton(onPressed: () => pickTime(false), child: Text("To ${formatTime(hhmm(endTime))}"))),
                ],
              ),
            const SizedBox(height: 16),
            TextField(
              controller: reasonController,
              maxLength: 100,
              style: TextStyle(fontSize: 16, color: c.text),
              decoration: const InputDecoration(labelText: "Reason (optional, private)"),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context, false), child: const Text("Cancel")),
        FilledButton(
          style: FilledButton.styleFrom(minimumSize: const Size(88, 44)),
          onPressed: saving ? null : save,
          child: Text(saving ? "Saving..." : "Add"),
        ),
      ],
    );
  }
}
