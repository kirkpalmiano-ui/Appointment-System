import 'dart:async';

import 'package:flutter/material.dart';
import 'package:cliniquick/services/api.dart';
import 'package:cliniquick/theme.dart';
import 'package:cliniquick/utils/calendar.dart';
import 'package:cliniquick/utils/format.dart';
import 'package:cliniquick/widgets/common.dart';
import 'package:cliniquick/widgets/ui.dart';
import 'package:cliniquick/widgets/visits/visit_details.dart';
import 'package:cliniquick/widgets/visits/visit_helpers.dart';
import 'package:cliniquick/widgets/visits/visit_widgets.dart';

// The client's appointments ("My visits."), split into Upcoming, Past and Cancelled tabs.
class AppointmentsState extends StatefulWidget {
  const AppointmentsState({super.key});
  @override
  State<AppointmentsState> createState() => AppointmentsPage();
}

const List<ScopeTab> visitTabs = [
  ScopeTab("upcoming", "Upcoming"),
  ScopeTab("past", "Past"),
  ScopeTab("cancelled", "Cancelled"),
];

const Map<String, String> statusLabels = {
  "pending": "Pending",
  "confirmed": "Confirmed",
  "completed": "Completed",
  "cancelled": "Cancelled",
};

class AppointmentsPage extends State<AppointmentsState> {
  TextEditingController searchController = TextEditingController();
  Timer? searchDelay;
  bool searchOpen = false;

  String scope = "upcoming"; // upcoming | past | cancelled
  String status = ""; // extra status filter (not used on the Cancelled tab)
  String sort = ""; // "" = default (upcoming soonest first, others latest first), or asc / desc
  List items = [];
  int page = 1;
  int totalPages = 1;
  bool loading = true;
  bool loadingMore = false;
  String error = "";
  Map<String, int?> counts = {"upcoming": null, "past": null, "cancelled": null};
  int requestId = 0; // ignores responses from an older request (fast tab switching)

  @override
  void initState() {
    super.initState();
    loadAppointments();
    loadCounts();
  }

  @override
  void dispose() {
    searchDelay?.cancel();
    searchController.dispose();
    super.dispose();
  }

  Future<void> reload() => Future.wait([loadAppointments(), loadCounts()]);

  Map<String, String> listQuery(int nextPage) {
    final query = <String, String>{"page": "$nextPage", "limit": "10"};
    if (scope == "cancelled") {
      query["status"] = "cancelled";
    } else {
      query["scope"] = scope;
      // Cancelled visits have their own tab, so Upcoming shows only active ones unless a status is picked.
      final effectiveStatus = status.isNotEmpty ? status : (scope == "upcoming" ? "active" : "");
      if (effectiveStatus.isNotEmpty) query["status"] = effectiveStatus;
    }
    final search = searchController.text.trim();
    if (search.isNotEmpty) query["search"] = search;
    if (sort.isNotEmpty) query["sort"] = sort;
    return query;
  }

  Future<void> loadAppointments({bool more = false}) async {
    final id = ++requestId;
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
      final data = await Api.get("/appointments", query: listQuery(nextPage));
      if (!mounted || id != requestId) return;
      setState(() {
        items = more ? [...items, ...data["items"]] : data["items"];
        page = nextPage;
        totalPages = data["pagination"]["totalPages"];
      });
    } on ApiException catch (e) {
      if (mounted && id == requestId) setState(() => error = e.message);
    } finally {
      if (mounted && id == requestId) {
        setState(() {
          loading = false;
          loadingMore = false;
        });
      }
    }
  }

  // Totals on the tabs (ignoring search and filters). A nicety: the tabs work without them.
  Future<void> loadCounts() async {
    try {
      final results = await Future.wait([
        Api.get("/appointments", query: {"scope": "upcoming", "status": "active", "limit": "1"}),
        Api.get("/appointments", query: {"scope": "past", "limit": "1"}),
        Api.get("/appointments", query: {"status": "cancelled", "limit": "1"}),
      ]);
      if (!mounted) return;
      setState(() {
        counts = {
          "upcoming": results[0]["pagination"]["total"],
          "past": results[1]["pagination"]["total"],
          "cancelled": results[2]["pagination"]["total"],
        };
      });
    } on ApiException catch (_) {
      // Keep the old counts.
    }
  }

  // Wait until the user stops typing before searching.
  void onSearch(String _) {
    searchDelay?.cancel();
    searchDelay = Timer(const Duration(milliseconds: 400), () => loadAppointments());
  }

  void toggleSearch() {
    // Closing the search box also clears the search.
    if (searchOpen) {
      searchDelay?.cancel();
      final hadText = searchController.text.trim().isNotEmpty;
      searchController.clear();
      setState(() => searchOpen = false);
      if (hadText) loadAppointments();
    } else {
      setState(() => searchOpen = true);
    }
  }

  void changeScope(String value) {
    if (value == scope) return;
    scope = value;
    // Cancelled has its own status, so drop any status filter there.
    if (value == "cancelled") status = "";
    loadAppointments();
  }

  int get filterCount => [status, sort].where((v) => v.isNotEmpty).length;

  Future<void> bookAppointment() async {
    await Navigator.pushNamed(context, "/book");
    await reload();
  }

  Future<void> cancelAppointment(Map<String, dynamic> appointment) async {
    final ok = await confirmDialog(context, "Cancel appointment?",
        "Your ${appointment["service"]?["name"] ?? ""} appointment on ${formatDate(appointment["date"])} will be cancelled.", "Cancel appointment");
    if (!ok) return;
    try {
      await Api.put("/appointments/${appointment["_id"]}", {"status": "cancelled"});
      if (!mounted) return;
      showMessage(context, "Appointment cancelled.");
      reload();
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
      reload();
    } on ApiException catch (e) {
      if (mounted) showMessage(context, e.message, error: true);
    }
  }

  void showDetails(Map<String, dynamic> appointment) {
    showAppSheet<void>(
      context,
      builder: (sheetContext) => VisitDetails(
        appointment: appointment,
        onClose: () => Navigator.pop(sheetContext),
        onAddToCalendar: () async {
          bool opened;
          try {
            opened = await addToCalendar(appointment);
          } catch (_) {
            opened = false;
          }
          if (!opened && mounted) showMessage(context, "Couldn't open your calendar.", error: true);
        },
        onReschedule: () {
          Navigator.pop(sheetContext);
          Navigator.pushNamed(context, "/book", arguments: appointment).then((_) => reload());
        },
        onCancel: () {
          Navigator.pop(sheetContext);
          cancelAppointment(appointment);
        },
        onBookAgain: () {
          Navigator.pop(sheetContext);
          bookAppointment();
        },
        onRemove: () {
          Navigator.pop(sheetContext);
          removeFromHistory(appointment);
        },
      ),
    );
  }

  void showFilters() {
    showAppSheet<void>(
      context,
      title: "Filter",
      builder: (sheetContext) => StatefulBuilder(
        builder: (sheetContext, setSheetState) {
          // Changes apply right away; "Done" just closes the sheet.
          void apply(VoidCallback change) {
            setState(change);
            setSheetState(() {});
            loadAppointments();
          }

          final shownSort = sort.isNotEmpty ? sort : (scope == "upcoming" ? "asc" : "desc");
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 8),
              if (scope != "cancelled") ...[
                DropdownButtonFormField<String>(
                  initialValue: status,
                  decoration: const InputDecoration(labelText: "Status"),
                  items: [
                    const DropdownMenuItem(value: "", child: Text("All statuses")),
                    for (final entry in statusLabels.entries) DropdownMenuItem(value: entry.key, child: Text(entry.value)),
                  ],
                  onChanged: (value) => apply(() => status = value ?? ""),
                ),
                const SizedBox(height: 18),
              ],
              DropdownButtonFormField<String>(
                initialValue: shownSort,
                decoration: const InputDecoration(labelText: "Sort"),
                items: const [
                  DropdownMenuItem(value: "asc", child: Text("Soonest first")),
                  DropdownMenuItem(value: "desc", child: Text("Latest first")),
                ],
                onChanged: (value) => apply(() => sort = value ?? ""),
              ),
              const SizedBox(height: 22),
              FilledButton(onPressed: () => Navigator.pop(sheetContext), child: const Text("Done")),
            ],
          );
        },
      ),
    );
  }

  Widget buildEmpty() {
    final hasFilters = status.isNotEmpty || searchController.text.trim().isNotEmpty;
    if (hasFilters) {
      return VisitEmpty(
        icon: Icons.search_off_rounded,
        title: "No matching appointments",
        text: "Try a different search or status filter.",
        action: OutlinedButton(
          onPressed: () {
            searchDelay?.cancel();
            searchController.clear();
            status = "";
            loadAppointments();
          },
          child: const Text("Clear filters"),
        ),
      );
    }
    final (title, text) = switch (scope) {
      "past" => ("No past appointments", "Visits you have had will be listed here."),
      "cancelled" => ("No cancelled appointments", "Appointments you cancel will appear here."),
      _ => ("No upcoming appointments", "When you book a visit, it will show up here."),
    };
    return VisitEmpty(
      icon: Icons.event_busy_rounded,
      title: title,
      text: text,
      action: FilledButton.icon(
        onPressed: bookAppointment,
        icon: const Icon(Icons.add_rounded),
        label: const Text("Book appointment"),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final groups = groupByMonth(items);
    final count = filterCount;

    return AppScaffold(
      tab: AppTab.visits,
      onBook: reload,
      body: RefreshIndicator(
        onRefresh: reload,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: EdgeInsets.fromLTRB(18, 18, 18, tabBarSpace(context)),
          children: [
            Row(
              children: [
                const Expanded(child: PageTitle("My visits.")),
                IconButton(
                  tooltip: searchOpen ? "Close search" : "Search",
                  onPressed: toggleSearch,
                  style: IconButton.styleFrom(
                    fixedSize: const Size(44, 44),
                    backgroundColor: c.field,
                    side: BorderSide(color: c.border),
                  ),
                  icon: Icon(searchOpen ? Icons.close_rounded : Icons.search_rounded, color: c.text),
                ),
              ],
            ),
            if (searchOpen) ...[
              const SizedBox(height: 16),
              TextField(
                controller: searchController,
                autofocus: true,
                onChanged: onSearch,
                textInputAction: TextInputAction.search,
                style: const TextStyle(fontSize: 16),
                decoration: const InputDecoration(
                  hintText: "Service, specialist or notes",
                  prefixIcon: Icon(Icons.search_rounded),
                ),
              ),
            ],
            const SizedBox(height: 20),
            ScopeSegments(tabs: visitTabs, value: scope, counts: counts, onChanged: changeScope),
            const SizedBox(height: 12),
            Align(
              alignment: Alignment.centerRight,
              child: Semantics(
                label: count > 0 ? "Filter, $count active" : "Filter",
                excludeSemantics: true,
                button: true,
                child: OutlinedButton.icon(
                  onPressed: showFilters,
                  style: OutlinedButton.styleFrom(minimumSize: const Size(44, 44)),
                  icon: const Icon(Icons.filter_list_rounded, size: 20),
                  label: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text("Filter"),
                      if (count > 0) ...[const SizedBox(width: 8), CountBadge(count)],
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 14),
            if (error.isNotEmpty) VisitError(error),
            if (loading)
              const VisitSkeleton()
            else if (items.isEmpty && error.isEmpty)
              buildEmpty()
            else ...[
              for (final group in groups) ...[
                Padding(
                  padding: const EdgeInsets.only(top: 6, bottom: 10, left: 4),
                  child: Eyebrow(group.label),
                ),
                for (final appointment in group.items)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: VisitRow(appointment: appointment, onTap: () => showDetails(appointment)),
                  ),
                const SizedBox(height: 8),
              ],
              if (page < totalPages)
                Center(
                  child: TextButton(
                    onPressed: loadingMore ? null : () => loadAppointments(more: true),
                    child: Text(loadingMore ? "Loading..." : "Load more"),
                  ),
                ),
            ],
          ],
        ),
      ),
    );
  }
}
