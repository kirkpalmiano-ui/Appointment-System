import 'package:flutter/material.dart';
import 'package:cliniquick/theme.dart';
import 'package:cliniquick/utils/format.dart';
import 'package:cliniquick/widgets/ui.dart';

const List<String> _steps = ["Requested", "Clinic review", "Confirmed", "Visit"];

// "Today", "Tomorrow", "In 3 days" (same as the website's countdown label).
String countdownLabel(String date) {
  if (!RegExp(r"^\d{4}-\d{2}-\d{2}$").hasMatch(date)) return "";
  final now = DateTime.now();
  final days = parseDate(date).difference(DateTime(now.year, now.month, now.day)).inDays;
  if (days <= 0) return "Today";
  if (days == 1) return "Tomorrow";
  return "In $days days";
}

// "Your next visit" card: service + specialist, date/time/countdown tiles, a compact
// progress tracker and the actions. Pass `appointment: null` for the empty state.
class NextVisitCard extends StatelessWidget {
  final Map<String, dynamic>? appointment;
  final VoidCallback onBook;
  final VoidCallback onAddToCalendar;
  final VoidCallback onReschedule;
  final VoidCallback onCancel;

  const NextVisitCard({
    super.key,
    required this.appointment,
    required this.onBook,
    required this.onAddToCalendar,
    required this.onReschedule,
    required this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final a = appointment;

    if (a == null) {
      return FrostedCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Eyebrow("Your next visit"),
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 22),
              child: Center(
                child: Column(
                  children: [
                    Text("Nothing booked yet", style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, letterSpacing: -0.4, color: c.text)),
                    const SizedBox(height: 6),
                    ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 320),
                      child: Text(
                        "Pick a service and a time that suits you. Your upcoming visit will show up right here.",
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 14, color: c.muted, height: 1.4),
                      ),
                    ),
                    const SizedBox(height: 18),
                    FilledButton.icon(
                      onPressed: onBook,
                      style: FilledButton.styleFrom(minimumSize: const Size(0, 48), padding: const EdgeInsets.symmetric(horizontal: 22)),
                      icon: const Icon(Icons.add_rounded),
                      label: const Text("Book your first visit"),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      );
    }

    final service = a["service"] is Map ? a["service"] : const {};
    final staff = a["staff"] is Map ? a["staff"] : const {};
    final status = (a["status"] ?? "").toString();
    final date = (a["date"] ?? "").toString();
    final validDate = RegExp(r"^\d{4}-\d{2}-\d{2}$").hasMatch(date);
    final d = validDate ? parseDate(date) : null;
    final staffName = staff["name"]?.toString() ?? "a former staff member";
    final specialization = (staff["specialization"] ?? "").toString();

    return FrostedCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Wrap(
            alignment: WrapAlignment.spaceBetween,
            crossAxisAlignment: WrapCrossAlignment.center,
            spacing: 8,
            runSpacing: 8,
            children: [
              const Eyebrow("Your next visit"),
              StatusChip(status, label: status == "pending" ? "Awaiting confirmation" : "Confirmed"),
            ],
          ),
          const SizedBox(height: 14),
          // Service + specialist
          Row(
            children: [
              InitialsAvatar(staffName),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      service["name"]?.toString() ?? "Appointment",
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, letterSpacing: -0.36, height: 1.2, color: c.text),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      "with $staffName${specialization.isNotEmpty ? " · $specialization" : ""}",
                      style: TextStyle(fontSize: 14, color: c.muted),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Date, time, countdown
          IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(
                  child: _Tile(
                    label: d != null ? dayNames[d.weekday - 1] : "Date",
                    value: d != null ? "${monthNames[d.month - 1]} ${d.day}" : date,
                    highlight: true,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(child: _Tile(label: "Time", value: formatTime((a["startTime"] ?? "").toString()))),
                const SizedBox(width: 8),
                Expanded(child: _Tile(label: "Starts", value: countdownLabel(date).isEmpty ? "Today" : countdownLabel(date))),
              ],
            ),
          ),
          const SizedBox(height: 16),
          _CompactTracker(status: status),
          const SizedBox(height: 16),
          // Actions
          Row(
            children: [
              Expanded(
                child: FilledButton.icon(
                  onPressed: onAddToCalendar,
                  style: FilledButton.styleFrom(minimumSize: const Size(0, 48), padding: const EdgeInsets.symmetric(horizontal: 14)),
                  icon: const Icon(Icons.event_rounded, size: 19),
                  label: const Text("Add to calendar", maxLines: 1, overflow: TextOverflow.ellipsis),
                ),
              ),
              const SizedBox(width: 8),
              OutlinedButton(
                onPressed: onReschedule,
                style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 14)),
                child: const Text("Reschedule"),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Center(
            child: TextButton(
              onPressed: onCancel,
              style: TextButton.styleFrom(foregroundColor: c.danger, padding: const EdgeInsets.symmetric(horizontal: 16)),
              child: const Text("Cancel appointment"),
            ),
          ),
        ],
      ),
    );
  }
}

// Compact fact tile; `highlight` fills it with the brand colour.
class _Tile extends StatelessWidget {
  final String label;
  final String value;
  final bool highlight;
  const _Tile({required this.label, required this.value, this.highlight = false});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final fg = highlight ? c.onPrimary : c.text;
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: highlight ? c.primary : c.field,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: highlight ? c.primary : c.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label.toUpperCase(),
            style: TextStyle(
              fontSize: 10.5,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.8,
              color: highlight ? c.onPrimary.withValues(alpha: 0.85) : c.muted,
            ),
          ),
          const SizedBox(height: 2),
          Text(value, style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w800, height: 1.2, letterSpacing: -0.15, color: fg)),
        ],
      ),
    );
  }
}

// Four labels above a 4-segment bar: done = brand, current = amber, future = border.
class _CompactTracker extends StatelessWidget {
  final String status;
  const _CompactTracker({required this.status});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final current = status == "confirmed" ? 3 : 1;
    final summary = [
      for (final (i, label) in _steps.indexed) "$label: ${i < current ? "done" : i == current ? "current step" : "not yet"}",
    ].join(", ");

    return Semantics(
      label: "Booking progress. $summary",
      excludeSemantics: true,
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            for (final (i, label) in _steps.indexed) ...[
              if (i > 0) const SizedBox(width: 6),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Text(
                      label,
                      style: TextStyle(
                        fontSize: 11,
                        height: 1.25,
                        fontWeight: i == current ? FontWeight.w800 : FontWeight.w600,
                        color: i <= current ? c.text : c.muted,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      height: 6,
                      decoration: BoxDecoration(
                        color: i < current ? c.primary : (i == current ? c.pendingText : c.border),
                        borderRadius: BorderRadius.circular(999),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
