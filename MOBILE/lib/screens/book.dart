import 'package:flutter/material.dart';
import 'package:cliniquick/services/api.dart';
import 'package:cliniquick/utils/format.dart';
import 'package:cliniquick/widgets/common.dart';

// Book a new appointment, or reschedule one when an appointment is passed
// as the route argument. Steps: Service -> Specialist -> Date & Time -> Confirm.
class BookState extends StatefulWidget {
  const BookState({super.key});
  @override
  State<BookState> createState() => BookPage();
}

class BookPage extends State<BookState> {
  static const int maxDaysAhead = 60;

  TextEditingController notesController = TextEditingController();

  Map<String, dynamic>? rescheduling; // the appointment being moved, if any
  int step = 0;
  List services = [];
  List staffList = [];
  List slots = [];
  List<String> unavailableDates = [];
  Map<String, dynamic>? service;
  Map<String, dynamic>? staff;
  String date = "";
  String startTime = "";
  String slotMessage = "";
  String error = "";
  bool loading = true;
  bool saving = false;
  bool started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (started) return;
    started = true;
    final args = ModalRoute.of(context)?.settings.arguments;
    if (args is Map) {
      rescheduling = Map<String, dynamic>.from(args);
      notesController.text = rescheduling!["notes"] ?? "";
    }
    loadServices();
  }

  @override
  void dispose() {
    notesController.dispose();
    super.dispose();
  }

  Future<void> loadServices() async {
    try {
      final data = await Api.get("/services", query: {"limit": "50"});
      setState(() => services = data["items"]);
      // Rescheduling starts with the current service and specialist selected.
      final current = rescheduling?["service"];
      if (current != null) {
        final match = services.where((s) => s["_id"] == current["_id"]);
        if (match.isNotEmpty) await pickService(Map<String, dynamic>.from(match.first), keepStaff: true);
      }
    } on ApiException catch (e) {
      setState(() => error = e.message);
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> pickService(Map<String, dynamic> picked, {bool keepStaff = false}) async {
    setState(() {
      service = picked;
      staff = null;
      date = "";
      startTime = "";
      staffList = [];
      error = "";
    });
    try {
      final data = await Api.get("/staff", query: {"service": picked["_id"], "limit": "50"});
      setState(() => staffList = data["items"]);
      final current = rescheduling?["staff"];
      if (keepStaff && current != null) {
        final match = staffList.where((s) => s["_id"] == current["_id"]);
        if (match.isNotEmpty) await pickStaff(Map<String, dynamic>.from(match.first));
      }
    } on ApiException catch (e) {
      setState(() => error = e.message);
    }
  }

  Future<void> pickStaff(Map<String, dynamic> picked) async {
    setState(() {
      staff = picked;
      date = "";
      startTime = "";
      slots = [];
      unavailableDates = [];
    });
    try {
      final today = DateTime.now();
      final data = await Api.get("/staff/${picked["_id"]}/unavailable", query: {
        "from": toDateString(today),
        "to": toDateString(today.add(const Duration(days: maxDaysAhead))),
      });
      setState(() => unavailableDates = List<String>.from(data["dates"]));
    } on ApiException catch (_) {
      // Not critical: the slot list still reports days off.
    }
  }

  // Days the specialist works (0 = Sunday) and that aren't marked as time off.
  bool isBookableDay(DateTime day) {
    final workingDays = List<int>.from(staff?["workingDays"] ?? [1, 2, 3, 4, 5]);
    return workingDays.contains(day.weekday % 7) && !unavailableDates.contains(toDateString(day));
  }

  Future<void> chooseDate() async {
    final today = DateTime.now();
    final first = DateTime(today.year, today.month, today.day);
    final last = first.add(const Duration(days: maxDaysAhead));
    // The picker needs a selectable starting day.
    DateTime initial = date.isNotEmpty ? parseDate(date) : first;
    while (!isBookableDay(initial) && initial.isBefore(last)) {
      initial = initial.add(const Duration(days: 1));
    }
    if (!isBookableDay(initial)) {
      showMessage(context, "${staff?["name"]} has no open days in the next $maxDaysAhead days.", error: true);
      return;
    }
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: first,
      lastDate: last,
      selectableDayPredicate: isBookableDay,
      helpText: "Choose a date",
    );
    if (picked == null) return;
    setState(() {
      date = toDateString(picked);
      startTime = "";
    });
    await loadSlots();
  }

  Future<void> loadSlots() async {
    setState(() {
      slots = [];
      slotMessage = "Loading times...";
    });
    try {
      final data = await Api.get("/appointments/available-slots", query: {
        "service": service!["_id"],
        "staff": staff!["_id"],
        "date": date,
        "exclude": rescheduling?["_id"] ?? "",
      });
      setState(() {
        slots = data["slots"];
        slotMessage = data["message"] ?? (slots.any((s) => s["available"] == true) ? "" : "No open times on this day. Try another date.");
      });
    } on ApiException catch (e) {
      setState(() => slotMessage = e.message);
    }
  }

  Future<void> submit() async {
    setState(() {
      saving = true;
      error = "";
    });
    final body = {
      "service": service!["_id"],
      "staff": staff!["_id"],
      "date": date,
      "startTime": startTime,
      "notes": notesController.text.trim(),
    };
    try {
      if (rescheduling != null) {
        await Api.put("/appointments/${rescheduling!["_id"]}", body);
      } else {
        await Api.post("/appointments", body);
      }
      if (!mounted) return;
      showMessage(context, rescheduling != null ? "Appointment rescheduled. It's pending approval again." : "Appointment booked! We'll confirm it soon.");
      Navigator.pushNamedAndRemoveUntil(context, "/appointments", (route) => false);
    } on ApiException catch (e) {
      setState(() {
        error = e.message;
        saving = false;
      });
      // Someone else just took that time: refresh the list and pick again.
      if (e.status == 409) {
        setState(() {
          startTime = "";
          step = 2;
        });
        await loadSlots();
      }
    }
  }

  bool canContinue() {
    if (step == 0) return service != null;
    if (step == 1) return staff != null;
    if (step == 2) return date.isNotEmpty && startTime.isNotEmpty;
    return !saving;
  }

  Widget serviceStep() {
    if (services.isEmpty) return const Text("No services are available right now.");
    return Column(
      children: [
        for (final s in services)
          Card(
            color: service?["_id"] == s["_id"] ? Colors.deepPurple.shade50 : null,
            child: ListTile(
              title: Text(s["name"], style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text("${formatDuration(s["durationMinutes"])} • ${formatPrice(s["price"])}"
                  "${(s["description"] ?? "").isNotEmpty ? "\n${s["description"]}" : ""}"),
              trailing: service?["_id"] == s["_id"] ? const Icon(Icons.check_circle, color: Colors.deepPurple) : null,
              onTap: () => pickService(Map<String, dynamic>.from(s)),
            ),
          ),
      ],
    );
  }

  Widget staffStep() {
    if (staffList.isEmpty) return const Text("No specialists offer this service yet.");
    return Column(
      children: [
        for (final s in staffList)
          Card(
            color: staff?["_id"] == s["_id"] ? Colors.deepPurple.shade50 : null,
            child: ListTile(
              leading: CircleAvatar(child: Text(s["name"].toString().substring(0, 1))),
              title: Text(s["name"], style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text("${s["specialization"] ?? ""}\n"
                  "${(List<int>.from(s["workingDays"] ?? [])..sort((a, b) => ((a + 6) % 7).compareTo((b + 6) % 7))).map((d) => dayNames[(d + 6) % 7]).join(", ")} • "
                  "${formatTimeRange(s["startTime"], s["endTime"])}"),
              isThreeLine: true,
              trailing: staff?["_id"] == s["_id"] ? const Icon(Icons.check_circle, color: Colors.deepPurple) : null,
              onTap: () => pickStaff(Map<String, dynamic>.from(s)),
            ),
          ),
      ],
    );
  }

  Widget dateStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        OutlinedButton.icon(
          onPressed: chooseDate,
          icon: const Icon(Icons.calendar_today),
          label: Text(date.isEmpty ? "Choose a date" : formatDate(date)),
        ),
        const SizedBox(height: 12),
        if (slotMessage.isNotEmpty) Text(slotMessage, style: const TextStyle(color: Colors.black54)),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final slot in slots)
              ChoiceChip(
                label: Text(formatTime(slot["startTime"])),
                selected: startTime == slot["startTime"],
                onSelected: slot["available"] == true ? (_) => setState(() => startTime = slot["startTime"]) : null,
                tooltip: slot["available"] == true ? null : capitalize(slot["reason"] ?? "unavailable"),
              ),
          ],
        ),
      ],
    );
  }

  Widget confirmStep() {
    Widget row(String label, String value) => Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(width: 100, child: Text(label, style: const TextStyle(color: Colors.black54))),
              Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.bold))),
            ],
          ),
        );
    final endSlot = slots.where((s) => s["startTime"] == startTime);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        row("Service", service?["name"] ?? ""),
        row("Specialist", staff?["name"] ?? ""),
        row("Date", date.isEmpty ? "" : formatDate(date)),
        row("Time", startTime.isEmpty ? "" : (endSlot.isEmpty ? formatTime(startTime) : formatTimeRange(startTime, endSlot.first["endTime"]))),
        row("Price", service == null ? "" : formatPrice(service!["price"])),
        const SizedBox(height: 12),
        TextField(
          controller: notesController,
          maxLength: 250,
          maxLines: 3,
          decoration: const InputDecoration(
            labelText: "Notes for the clinic (optional)",
            border: OutlineInputBorder(),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(rescheduling != null ? "Reschedule" : "Book Appointment")),
      drawer: rescheduling != null ? null : const AppDrawer(),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                if (error.isNotEmpty) Padding(padding: const EdgeInsets.fromLTRB(16, 16, 16, 0), child: errorBox(error)),
                Expanded(
                  child: Stepper(
                    currentStep: step,
                    onStepTapped: (index) {
                      // Only go back, or forward to steps already completed.
                      if (index < step) setState(() => step = index);
                    },
                    onStepContinue: canContinue()
                        ? () {
                            if (step < 3) {
                              setState(() => step++);
                              if (step == 2 && date.isEmpty) chooseDate();
                            } else {
                              submit();
                            }
                          }
                        : null,
                    onStepCancel: step > 0 ? () => setState(() => step--) : null,
                    controlsBuilder: (context, details) => Padding(
                      padding: const EdgeInsets.only(top: 16),
                      child: Row(
                        spacing: 8,
                        children: [
                          FilledButton(
                            onPressed: details.onStepContinue,
                            child: Text(step < 3 ? "Continue" : (saving ? "Saving..." : (rescheduling != null ? "Reschedule" : "Book appointment"))),
                          ),
                          if (step > 0) TextButton(onPressed: details.onStepCancel, child: const Text("Back")),
                        ],
                      ),
                    ),
                    steps: [
                      Step(title: const Text("Service"), subtitle: service != null ? Text(service!["name"]) : null, content: serviceStep(), isActive: step >= 0),
                      Step(title: const Text("Specialist"), subtitle: staff != null ? Text(staff!["name"]) : null, content: staffStep(), isActive: step >= 1),
                      Step(
                        title: const Text("Date & Time"),
                        subtitle: startTime.isNotEmpty ? Text("${formatDate(date)}, ${formatTime(startTime)}") : null,
                        content: dateStep(),
                        isActive: step >= 2,
                      ),
                      Step(title: const Text("Confirm"), content: confirmStep(), isActive: step >= 3),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}
