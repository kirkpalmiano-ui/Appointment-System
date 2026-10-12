import 'package:flutter/material.dart';
import 'package:cliniquick/services/api.dart';
import 'package:cliniquick/utils/format.dart';
import 'package:cliniquick/theme.dart';
import 'package:cliniquick/widgets/common.dart';
import 'package:cliniquick/widgets/motion.dart';
import 'package:cliniquick/widgets/ui.dart';
import 'package:cliniquick/widgets/book/booking_bar.dart';
import 'package:cliniquick/widgets/book/selectable.dart';
import 'package:cliniquick/widgets/book/service_card.dart';
import 'package:cliniquick/widgets/book/staff_card.dart';
import 'package:cliniquick/widgets/book/time_slot_grid.dart';
import 'package:cliniquick/widgets/book/week_date_picker.dart';

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
  TextEditingController searchController = TextEditingController();

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
  String query = ""; // service search
  String category = ""; // service filter chip ("" = All)
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
    searchController.dispose();
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
      slotMessage = "";
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

  // Today .. today + maxDaysAhead, shown a week at a time.
  List<DateTime> bookingDays() {
    final today = DateTime.now();
    final first = DateTime(today.year, today.month, today.day);
    return [for (var i = 0; i <= maxDaysAhead; i++) DateTime(first.year, first.month, first.day + i)];
  }

  // Entering the date step with no day chosen picks the first open day.
  Future<void> autoPickDate() async {
    if (date.isNotEmpty || staff == null) return;
    for (final day in bookingDays()) {
      if (isBookableDay(day)) return chooseDate(day);
    }
    showMessage(context, "${staff?["name"]} has no open days in the next $maxDaysAhead days.", error: true);
  }

  Future<void> chooseDate(DateTime picked) async {
    setState(() {
      date = toDateString(picked);
      startTime = "";
    });
    await loadSlots();
  }

  // Switching specialist on the date step: reload their days off, then pick a day again.
  Future<void> switchStaff(Map<String, dynamic> picked) async {
    if (staff?["_id"] == picked["_id"]) return;
    await pickStaff(picked);
    if (mounted && step == 2) await autoPickDate();
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

  void goNext() {
    if (step < 3) {
      setState(() => step++);
      if (step == 2 && date.isEmpty) autoPickDate();
    } else {
      submit();
    }
  }

  void goBack() {
    if (step > 0) {
      setState(() => step--);
    } else {
      Navigator.pop(context);
    }
  }

  // Only ask before leaving when there is something to lose.
  bool hasChoices() {
    final notes = notesController.text.trim();
    if (rescheduling != null) {
      return startTime.isNotEmpty || notes != (rescheduling!["notes"] ?? "").toString().trim();
    }
    return service != null || staff != null || startTime.isNotEmpty || notes.isNotEmpty;
  }

  Future<void> closeBooking() async {
    if (hasChoices() && !await confirmDialog(context, "Leave booking?", "Your choices won't be saved.", "Leave")) return;
    if (mounted) Navigator.pop(context);
  }

  // ---------- Steps ----------

  Widget serviceStep(AppColors c) {
    if (services.isEmpty) return Text("No services are available right now.", style: TextStyle(color: c.muted));
    // Only offer filters that match at least one service.
    final chips = [
      for (final id in categoryChipOrder)
        if (services.any((s) => categoryOf(s)?.id == id)) serviceCategories.firstWhere((cat) => cat.id == id),
    ];
    final needle = query.trim().toLowerCase();
    final shown = [
      for (var i = 0; i < services.length; i++)
        if ((category.isEmpty || categoryOf(services[i])?.id == category) &&
            (needle.isEmpty ||
                (services[i]["name"] ?? "").toString().toLowerCase().contains(needle) ||
                (services[i]["description"] ?? "").toString().toLowerCase().contains(needle)))
          i,
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        TextField(
          controller: searchController,
          onChanged: (value) => setState(() => query = value),
          textInputAction: TextInputAction.search,
          decoration: InputDecoration(
            hintText: "Search services",
            prefixIcon: Icon(Icons.search_rounded, color: c.muted),
            suffixIcon: query.isEmpty
                ? null
                : IconButton(
                    tooltip: "Clear search",
                    icon: const Icon(Icons.close_rounded),
                    onPressed: () {
                      searchController.clear();
                      setState(() => query = "");
                    },
                  ),
          ),
        ),
        if (chips.isNotEmpty) ...[
          const SizedBox(height: 12),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            clipBehavior: Clip.none,
            child: Row(
              children: [
                FilterPill(label: "All", selected: category.isEmpty, onTap: () => setState(() => category = "")),
                for (final cat in chips) ...[
                  const SizedBox(width: 8),
                  FilterPill(label: cat.label, selected: category == cat.id, onTap: () => setState(() => category = cat.id)),
                ],
              ],
            ),
          ),
        ],
        const SizedBox(height: 16),
        if (shown.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 24),
            child: Text("No services match your search.", textAlign: TextAlign.center, style: TextStyle(color: c.muted)),
          ),
        for (final i in shown)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: ServiceCard(
              service: services[i],
              index: i,
              selected: service?["_id"] == services[i]["_id"],
              onTap: () => pickService(Map<String, dynamic>.from(services[i])),
            ),
          ),
      ],
    );
  }

  Widget staffStep(AppColors c) {
    if (staffList.isEmpty) return Text("No specialists offer this service yet.", style: TextStyle(color: c.muted));
    Widget card(dynamic s) => StaffCard(
          staff: s,
          selected: staff?["_id"] == s["_id"],
          onTap: () => pickStaff(Map<String, dynamic>.from(s)),
        );
    // One specialist: a full-width card. More: a horizontally scrolling row.
    if (staffList.length < 2) return card(staffList.first);
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      clipBehavior: Clip.none,
      physics: const BouncingScrollPhysics(),
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            for (var i = 0; i < staffList.length; i++) ...[
              if (i > 0) const SizedBox(width: 12),
              SizedBox(width: 220, child: card(staffList[i])),
            ],
          ],
        ),
      ),
    );
  }

  Widget dateStep(AppColors c) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (staffList.isNotEmpty) ...[
          const Eyebrow("Specialist"),
          const SizedBox(height: 10),
          SizedBox(
            height: 70,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              clipBehavior: Clip.none,
              physics: const BouncingScrollPhysics(),
              itemCount: staffList.length,
              separatorBuilder: (_, _) => const SizedBox(width: 10),
              itemBuilder: (context, i) => SizedBox(
                width: 220,
                child: StaffCard(
                  staff: staffList[i],
                  compact: true,
                  selected: staff?["_id"] == staffList[i]["_id"],
                  onTap: () => switchStaff(Map<String, dynamic>.from(staffList[i])),
                ),
              ),
            ),
          ),
          const SizedBox(height: 22),
        ],
        WeekDatePicker(
          dates: bookingDays(),
          value: date,
          isDisabled: (day) => !isBookableDay(day),
          onChange: chooseDate,
        ),
        const SizedBox(height: 22),
        const DashedLine(),
        const SizedBox(height: 22),
        if (slotMessage.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: Text(slotMessage, style: TextStyle(color: c.muted)),
          ),
        TimeSlotGrid(slots: slots, value: startTime, onChange: (time) => setState(() => startTime = time)),
        const SizedBox(height: 20),
        const SlotLegend(),
      ],
    );
  }

  Widget confirmStep(AppColors c) {
    final endSlot = slots.where((s) => s["startTime"] == startTime);
    final rows = [
      (service == null ? Icons.medical_services_outlined : serviceIcon(service!), "Service", service?["name"] ?? ""),
      (Icons.person_outline_rounded, "Specialist", staff?["name"] ?? ""),
      (Icons.calendar_today_outlined, "Date", date.isEmpty ? "" : formatDate(date)),
      (Icons.schedule_rounded, "Time", startTime.isEmpty ? "" : (endSlot.isEmpty ? formatTime(startTime) : formatTimeRange(startTime, endSlot.first["endTime"]))),
      (Icons.payments_outlined, "Price", service == null ? "" : formatPrice(service!["price"])),
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        FrostedCard(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          child: Column(
            children: [
              for (var i = 0; i < rows.length; i++) ...[
                if (i > 0) const DashedLine(),
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  child: Row(
                    children: [
                      IconTile(rows[i].$1, bg: tileTone(c, i).$1, fg: tileTone(c, i).$2),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Eyebrow(rows[i].$2),
                            const SizedBox(height: 3),
                            Text(
                              rows[i].$3,
                              style: TextStyle(fontWeight: FontWeight.w700, fontSize: i == rows.length - 1 ? 18 : 15.5, color: c.text),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 20),
        TextField(
          controller: notesController,
          maxLength: 250,
          maxLines: 3,
          decoration: const InputDecoration(labelText: "Notes for the clinic (optional)"),
        ),
      ],
    );
  }

  // ---------- Layout ----------

  static const stepTitles = ["Choose a service.", "Choose a specialist.", "Pick a time.", "Confirm."];

  String stepSubtitle() {
    final serviceContext = service == null ? "" : "${service!["name"]} · ${formatDuration(service!["durationMinutes"])}";
    if (step == 0) {
      return rescheduling != null
          ? "Pick a new time. You can also change the service or specialist."
          : "Choose a service, a specialist and a time that works for you.";
    }
    if (step == 3) return "Check the details, add a note if you like, then confirm.";
    if (serviceContext.isNotEmpty) return serviceContext;
    return step == 1 ? "Pick who you would like to see." : "Live availability for the next $maxDaysAhead days.";
  }

  Widget topBar(AppColors c) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 4, 4, 0),
      child: Row(
        children: [
          IconButton(tooltip: "Back", icon: const Icon(Icons.arrow_back_rounded), color: c.text, onPressed: goBack),
          Expanded(
            child: Text(
              "Step ${step + 1} of 4",
              textAlign: TextAlign.center,
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: c.muted),
            ),
          ),
          IconButton(tooltip: "Close booking", icon: const Icon(Icons.close_rounded), color: c.text, onPressed: closeBooking),
        ],
      ),
    );
  }

  Widget progressBar(AppColors c) {
    final duration = reduceMotion(context) ? Duration.zero : const Duration(milliseconds: 300);
    return Semantics(
      label: "Step ${step + 1} of 4",
      excludeSemantics: true,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 6, 16, 0),
        child: Row(
          children: [
            for (var i = 0; i < 4; i++) ...[
              if (i > 0) const SizedBox(width: 6),
              Expanded(
                child: AnimatedContainer(
                  duration: duration,
                  height: 5,
                  decoration: BoxDecoration(
                    color: i <= step ? c.primary : c.border,
                    borderRadius: BorderRadius.circular(999),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget bookingBar() {
    String summary;
    if (date.isNotEmpty && startTime.isNotEmpty) {
      final d = parseDate(date);
      summary = "${dayNames[d.weekday - 1]}, ${monthNames[d.month - 1]} ${d.day} · ${formatTime(startTime)}";
    } else {
      summary = service?["name"] ?? "Choose a service";
    }
    final label = step < 2
        ? "Continue"
        : step == 2
            ? "Review & confirm"
            : (saving ? "Saving..." : (rescheduling != null ? "Reschedule" : "Book appointment"));
    return BookingBar(
      summary: summary,
      price: service == null ? null : formatPrice(service!["price"]),
      label: label,
      showArrow: step < 3,
      saving: saving,
      onPressed: canContinue() ? goNext : null,
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final bottomSpace = bookingBarHeight + 24 + MediaQuery.paddingOf(context).bottom;
    return PopScope(
      // System back steps back through the wizard first.
      canPop: step == 0,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop && step > 0) setState(() => step--);
      },
      child: AppScaffold(
        tab: AppTab.none,
        showTabBar: false,
        bottomBar: bookingBar(),
        body: Column(
          children: [
            topBar(c),
            progressBar(c),
            Expanded(
              child: loading
                  ? const Center(child: CircularProgressIndicator())
                  : AnimatedSwitcher(
                      duration: reduceMotion(context) ? Duration.zero : const Duration(milliseconds: 280),
                      switchInCurve: Curves.easeOutCubic,
                      switchOutCurve: Curves.easeInCubic,
                      transitionBuilder: (child, animation) => FadeTransition(
                        opacity: animation,
                        child: SlideTransition(
                          position: Tween(begin: const Offset(0.06, 0), end: Offset.zero).animate(animation),
                          child: child,
                        ),
                      ),
                      child: ListView(
                        key: ValueKey(step),
                        padding: EdgeInsets.fromLTRB(16, 20, 16, bottomSpace),
                        children: [
                          PageTitle(stepTitles[step], subtitle: stepSubtitle()),
                          const SizedBox(height: 20),
                          if (error.isNotEmpty) _ErrorBanner(error),
                          [serviceStep, staffStep, dateStep, confirmStep][step](c),
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

// Server error message, in the theme's danger colour (light and dark).
class _ErrorBanner extends StatelessWidget {
  final String message;
  const _ErrorBanner(this.message);

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: c.danger.withValues(alpha: 0.1),
        border: Border.all(color: c.danger.withValues(alpha: 0.35)),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.error_outline_rounded, size: 20, color: c.danger),
          const SizedBox(width: 10),
          Expanded(child: Text(message, style: TextStyle(color: c.danger))),
        ],
      ),
    );
  }
}
