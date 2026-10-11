import 'package:flutter/material.dart';
import 'package:cliniquick/services/api.dart';
import 'package:cliniquick/utils/format.dart';
import 'package:cliniquick/widgets/common.dart';

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
    return Scaffold(
      appBar: AppBar(title: const Text("Time Off")),
      drawer: const AppDrawer(),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: addTimeOff,
        icon: const Icon(Icons.add),
        label: const Text("Add time off"),
      ),
      body: RefreshIndicator(
        onRefresh: loadTimeOff,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const Text("Clients can't book you during these times. Existing appointments are not cancelled automatically.",
                style: TextStyle(color: Colors.black54)),
            const SizedBox(height: 12),
            if (error.isNotEmpty) errorBox(error),
            if (loading)
              const Padding(padding: EdgeInsets.all(40), child: Center(child: CircularProgressIndicator()))
            else if (items.isEmpty)
              emptyState(Icons.beach_access, "No upcoming time off", "Tap Add time off to block a day or a few hours.")
            else
              for (final entry in items)
                Card(
                  margin: const EdgeInsets.only(bottom: 10),
                  child: ListTile(
                    leading: const Icon(Icons.beach_access, color: Colors.amber),
                    title: Text(formatDate(entry["date"]), style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text([
                      entry["allDay"] == true ? "All day" : formatTimeRange(entry["startTime"], entry["endTime"]),
                      if ((entry["reason"] ?? "").isNotEmpty) entry["reason"],
                    ].join(" • ")),
                    trailing: IconButton(
                      icon: const Icon(Icons.delete_outline),
                      tooltip: "Remove",
                      onPressed: () => removeTimeOff(entry),
                    ),
                  ),
                ),
            const SizedBox(height: 60),
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
    return AlertDialog(
      title: const Text("Add time off"),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (error.isNotEmpty) errorBox(error),
            OutlinedButton.icon(
              onPressed: pickDate,
              icon: const Icon(Icons.calendar_today),
              label: Text(date.isEmpty ? "Choose a date" : formatDate(date)),
            ),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text("All day"),
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
            const SizedBox(height: 12),
            TextField(
              controller: reasonController,
              maxLength: 100,
              decoration: const InputDecoration(labelText: "Reason (optional, private)", border: OutlineInputBorder()),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context, false), child: const Text("Cancel")),
        FilledButton(onPressed: saving ? null : save, child: Text(saving ? "Saving..." : "Add")),
      ],
    );
  }
}
