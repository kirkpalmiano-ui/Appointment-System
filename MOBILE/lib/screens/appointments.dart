import 'dart:async';

import 'package:flutter/material.dart';
import 'package:cliniquick/services/api.dart';
import 'package:cliniquick/utils/format.dart';
import 'package:cliniquick/widgets/appointment_card.dart';
import 'package:cliniquick/widgets/common.dart';

// The client's appointments, split into Upcoming and Past tabs.
class AppointmentsState extends StatefulWidget {
  const AppointmentsState({super.key});
  @override
  State<AppointmentsState> createState() => AppointmentsPage();
}

class AppointmentsPage extends State<AppointmentsState> {
  TextEditingController searchController = TextEditingController();
  Timer? searchDelay;

  String scope = "upcoming";
  String status = "";
  List items = [];
  int page = 1;
  int totalPages = 1;
  bool loading = true;
  bool loadingMore = false;
  String error = "";

  @override
  void initState() {
    super.initState();
    loadAppointments();
  }

  @override
  void dispose() {
    searchDelay?.cancel();
    searchController.dispose();
    super.dispose();
  }

  Future<void> loadAppointments({bool more = false}) async {
    setState(() {
      error = "";
      if (more) {
        loadingMore = true;
      } else {
        loading = true;
      }
    });
    try {
      final nextPage = more ? page + 1 : 1;
      final data = await Api.get("/appointments", query: {
        "scope": scope,
        "status": status,
        "search": searchController.text.trim(),
        "page": "$nextPage",
        "limit": "10",
      });
      setState(() {
        items = more ? [...items, ...data["items"]] : data["items"];
        page = nextPage;
        totalPages = data["pagination"]["totalPages"];
      });
    } on ApiException catch (e) {
      setState(() => error = e.message);
    } finally {
      if (mounted) {
        setState(() {
          loading = false;
          loadingMore = false;
        });
      }
    }
  }

  // Wait until the user stops typing before searching.
  void onSearch(String _) {
    searchDelay?.cancel();
    searchDelay = Timer(const Duration(milliseconds: 400), () => loadAppointments());
  }

  Future<void> cancelAppointment(Map<String, dynamic> appointment) async {
    final ok = await confirmDialog(context, "Cancel appointment?",
        "Your ${appointment["service"]?["name"] ?? ""} appointment on ${formatDate(appointment["date"])} will be cancelled.", "Cancel appointment");
    if (!ok) return;
    try {
      await Api.put("/appointments/${appointment["_id"]}", {"status": "cancelled"});
      if (!mounted) return;
      showMessage(context, "Appointment cancelled.");
      loadAppointments();
    } on ApiException catch (e) {
      if (mounted) showMessage(context, e.message, error: true);
    }
  }

  Future<void> removeFromHistory(Map<String, dynamic> appointment) async {
    final ok = await confirmDialog(context, "Remove from history?", "This appointment will no longer appear in your list.", "Remove");
    if (!ok) return;
    try {
      await Api.delete("/appointments/${appointment["_id"]}");
      if (!mounted) return;
      showMessage(context, "Appointment removed from your history.");
      loadAppointments();
    } on ApiException catch (e) {
      if (mounted) showMessage(context, e.message, error: true);
    }
  }

  void showDetails(Map<String, dynamic> appointment) {
    final service = appointment["service"] ?? {};
    final staff = appointment["staff"] ?? {};
    final canChange = isActive(appointment) && !hasStarted(appointment);
    final finished = !isActive(appointment);

    Widget row(IconData icon, String text) => ListTile(dense: true, leading: Icon(icon), title: Text(text));

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (sheetContext) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Expanded(child: Text(service["name"] ?? "Removed service", style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold))),
                  statusChip(appointment["status"]),
                ],
              ),
              const SizedBox(height: 8),
              row(Icons.event, formatDate(appointment["date"])),
              row(Icons.schedule, formatTimeRange(appointment["startTime"], appointment["endTime"])),
              row(Icons.person, "${staff["name"] ?? "Former staff member"}${(staff["specialization"] ?? "").isNotEmpty ? " • ${staff["specialization"]}" : ""}"),
              if (service["price"] != null) row(Icons.payments, formatPrice(service["price"])),
              if ((appointment["notes"] ?? "").isNotEmpty) row(Icons.notes, appointment["notes"]),
              if (appointment["status"] == "pending")
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 8),
                  child: Text("Waiting for the clinic to confirm.", style: TextStyle(color: Colors.orange)),
                ),
              if (isActive(appointment) && hasStarted(appointment))
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 8),
                  child: Text("This appointment has started and can no longer be changed.", style: TextStyle(color: Colors.black54)),
                ),
              const SizedBox(height: 8),
              if (canChange) ...[
                FilledButton.icon(
                  icon: const Icon(Icons.edit_calendar),
                  label: const Text("Reschedule"),
                  onPressed: () {
                    Navigator.pop(sheetContext);
                    Navigator.pushNamed(context, "/book", arguments: appointment).then((_) => loadAppointments());
                  },
                ),
                TextButton.icon(
                  icon: const Icon(Icons.cancel_outlined, color: Colors.red),
                  label: const Text("Cancel appointment", style: TextStyle(color: Colors.red)),
                  onPressed: () {
                    Navigator.pop(sheetContext);
                    cancelAppointment(appointment);
                  },
                ),
              ],
              if (finished)
                TextButton.icon(
                  icon: const Icon(Icons.delete_outline),
                  label: const Text("Remove from history"),
                  onPressed: () {
                    Navigator.pop(sheetContext);
                    removeFromHistory(appointment);
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text("My Appointments"),
          bottom: TabBar(
            onTap: (index) {
              scope = index == 0 ? "upcoming" : "past";
              loadAppointments();
            },
            tabs: const [Tab(text: "Upcoming"), Tab(text: "Past")],
          ),
        ),
        drawer: const AppDrawer(),
        floatingActionButton: FloatingActionButton(
          onPressed: () => Navigator.pushNamed(context, "/book").then((_) => loadAppointments()),
          child: const Icon(Icons.add),
        ),
        body: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
              child: Row(
                spacing: 8,
                children: [
                  Expanded(
                    child: TextField(
                      controller: searchController,
                      onChanged: onSearch,
                      decoration: const InputDecoration(
                        hintText: "Search service or specialist",
                        prefixIcon: Icon(Icons.search),
                        isDense: true,
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ),
                  DropdownButton<String>(
                    value: status,
                    items: const [
                      DropdownMenuItem(value: "", child: Text("All")),
                      DropdownMenuItem(value: "pending", child: Text("Pending")),
                      DropdownMenuItem(value: "confirmed", child: Text("Confirmed")),
                      DropdownMenuItem(value: "completed", child: Text("Completed")),
                      DropdownMenuItem(value: "cancelled", child: Text("Cancelled")),
                    ],
                    onChanged: (value) {
                      status = value ?? "";
                      loadAppointments();
                    },
                  ),
                ],
              ),
            ),
            Expanded(
              child: RefreshIndicator(
                onRefresh: loadAppointments,
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    if (error.isNotEmpty) errorBox(error),
                    if (loading)
                      const Padding(padding: EdgeInsets.all(40), child: Center(child: CircularProgressIndicator()))
                    else if (items.isEmpty)
                      emptyState(
                        Icons.event_busy,
                        scope == "upcoming" ? "No upcoming appointments" : "No past appointments",
                        scope == "upcoming" ? "Tap + to book one." : "Finished appointments will show up here.",
                      )
                    else ...[
                      for (final appointment in items)
                        AppointmentCard(
                          appointment: Map<String, dynamic>.from(appointment),
                          onTap: () => showDetails(Map<String, dynamic>.from(appointment)),
                        ),
                      if (page < totalPages)
                        Center(
                          child: TextButton(
                            onPressed: loadingMore ? null : () => loadAppointments(more: true),
                            child: Text(loadingMore ? "Loading..." : "Load more"),
                          ),
                        ),
                    ],
                    const SizedBox(height: 60),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
