import 'package:flutter/material.dart';
import 'package:cliniquick/services/api.dart';
import 'package:cliniquick/tempstore/activesession.dart';
import 'package:cliniquick/utils/format.dart';
import 'package:cliniquick/widgets/appointment_card.dart';
import 'package:cliniquick/widgets/common.dart';

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
      builder: (context) => AppointmentSheet(appointment: appointment),
    );
    if (changed == true) loadData();
  }

  Widget statBox(String label, dynamic value, Color color) {
    return Expanded(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: Column(
            children: [
              Text("${value ?? 0}", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color)),
              Text(label, style: const TextStyle(fontSize: 11, color: Colors.black54)),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final name = Activesession.user["firstName"] ?? Activesession.user["name"] ?? "";
    return Scaffold(
      appBar: AppBar(title: const Text("My Schedule")),
      drawer: const AppDrawer(),
      body: RefreshIndicator(
        onRefresh: loadData,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text("Hi, $name!", style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Row(
              children: [
                statBox("Today", summary["today"], Colors.indigo),
                statBox("Next 7 days", summary["next7Days"], Colors.teal),
                statBox("Pending", summary["pending"], Colors.orange),
                statBox("Completed", summary["completed"], Colors.blueGrey),
              ],
            ),
            const SizedBox(height: 12),
            Card(
              child: Row(
                children: [
                  IconButton(onPressed: () => changeDay(-1), icon: const Icon(Icons.chevron_left)),
                  Expanded(
                    child: TextButton(
                      onPressed: pickDay,
                      child: Text(
                        "${date == todayString() ? "Today • " : ""}${formatDate(date)}",
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                  IconButton(onPressed: () => changeDay(1), icon: const Icon(Icons.chevron_right)),
                ],
              ),
            ),
            const SizedBox(height: 8),
            if (error.isNotEmpty) errorBox(error),
            if (loading)
              const Padding(padding: EdgeInsets.all(40), child: Center(child: CircularProgressIndicator()))
            else ...[
              for (final entry in timeOff)
                Card(
                  color: Colors.amber.shade50,
                  margin: const EdgeInsets.only(bottom: 10),
                  child: ListTile(
                    leading: const Icon(Icons.beach_access, color: Colors.amber),
                    title: Text(entry["allDay"] == true ? "Time off (all day)" : "Time off ${formatTimeRange(entry["startTime"], entry["endTime"])}"),
                    subtitle: (entry["reason"] ?? "").isNotEmpty ? Text(entry["reason"]) : null,
                  ),
                ),
              if (appointments.isEmpty)
                emptyState(Icons.free_breakfast, "No appointments", "Nothing booked with you on this day.")
              else
                for (final appointment in appointments)
                  AppointmentCard(
                    appointment: Map<String, dynamic>.from(appointment),
                    showClient: true,
                    onTap: () => openAppointment(Map<String, dynamic>.from(appointment)),
                  ),
            ],
          ],
        ),
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

    Widget row(IconData icon, String text) => ListTile(dense: true, contentPadding: EdgeInsets.zero, leading: Icon(icon), title: Text(text));

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) Navigator.pop(context, changed);
      },
      child: Padding(
        padding: EdgeInsets.fromLTRB(16, 16, 16, MediaQuery.of(context).viewInsets.bottom + 16),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Expanded(child: Text(service["name"] ?? "Removed service", style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold))),
                  statusChip(status),
                ],
              ),
              row(Icons.event, formatDate(appointment["date"])),
              row(Icons.schedule, formatTimeRange(appointment["startTime"], appointment["endTime"])),
              const Divider(),
              const Text("Client", style: TextStyle(fontWeight: FontWeight.bold)),
              row(Icons.person, client["name"] ?? "Deleted client"),
              if ((client["email"] ?? "").isNotEmpty) row(Icons.email, client["email"]),
              if ((client["phone"] ?? "").isNotEmpty) row(Icons.phone, client["phone"]),
              if ((appointment["notes"] ?? "").isNotEmpty) row(Icons.notes, "Client notes: ${appointment["notes"]}"),
              const Divider(),
              if (error.isNotEmpty) errorBox(error),
              TextField(
                controller: notesController,
                maxLength: 500,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: "Staff notes (only staff and admins see these)",
                  border: OutlineInputBorder(),
                ),
              ),
              OutlinedButton(
                onPressed: saving ? null : () => update({"staffNotes": notesController.text.trim()}, "Notes saved."),
                child: const Text("Save notes"),
              ),
              const SizedBox(height: 8),
              if (status == "pending")
                FilledButton.icon(
                  icon: const Icon(Icons.check),
                  label: const Text("Confirm appointment"),
                  onPressed: saving ? null : () => update({"status": "confirmed"}, "Appointment confirmed."),
                ),
              if (isActive(appointment))
                FilledButton.tonalIcon(
                  icon: const Icon(Icons.done_all),
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
