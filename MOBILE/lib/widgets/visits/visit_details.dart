import 'package:flutter/material.dart';
import 'package:cliniquick/theme.dart';
import 'package:cliniquick/utils/format.dart';
import 'package:cliniquick/widgets/ui.dart';
import 'package:cliniquick/widgets/visits/visit_helpers.dart';

// Generic tips only (no clinic policy or medical instructions).
const List<String> beforeVisitTips = [
  "Arrive a few minutes before your time.",
  "Bring any previous results or prescriptions.",
  "Reschedule or cancel here if your plans change.",
];

// Small labelled tile ("DATE" / "Mon, Oct 5, 2026").
class InfoTile extends StatelessWidget {
  final String label;
  final String value;
  const InfoTile(this.label, this.value, {super.key});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: c.field, borderRadius: BorderRadius.circular(16), border: Border.all(color: c.border)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Eyebrow(label),
          const SizedBox(height: 4),
          Text(value, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: c.text)),
        ],
      ),
    );
  }
}

// Contents of the visit details bottom sheet (website: MobileAppointmentSheet).
class VisitDetails extends StatelessWidget {
  final Map<String, dynamic> appointment;
  final VoidCallback onClose;
  final VoidCallback onAddToCalendar;
  final VoidCallback onReschedule;
  final VoidCallback onCancel;
  final VoidCallback onBookAgain;
  final VoidCallback onRemove;

  const VisitDetails({
    super.key,
    required this.appointment,
    required this.onClose,
    required this.onAddToCalendar,
    required this.onReschedule,
    required this.onCancel,
    required this.onBookAgain,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final service = appointment["service"] ?? {};
    final staff = appointment["staff"] ?? {};
    final active = isActive(appointment);
    final started = active && hasStarted(appointment);
    final canChange = active && !started;
    final staffName = staff["name"] ?? "Former staff member";
    final specialization = (staff["specialization"] ?? "").toString();
    final notes = (appointment["notes"] ?? "").toString();
    final price = service["price"];
    final minutes = service["durationMinutes"];
    final createdAt = DateTime.tryParse((appointment["createdAt"] ?? "").toString())?.toLocal();

    Widget twoTiles(Widget a, Widget b) => IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: 10,
            children: [Expanded(child: a), Expanded(child: b)],
          ),
        );

    const big = Size(0, 48);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            StatusChip(appointment["status"] ?? ""),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                "Ref ${refCode(appointment)}",
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(color: c.muted, fontWeight: FontWeight.w600, fontSize: 13),
              ),
            ),
            IconButton(
              tooltip: "Close details",
              onPressed: onClose,
              constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
              icon: Icon(Icons.close_rounded, color: c.muted),
            ),
          ],
        ),
        const SizedBox(height: 6),
        Text(
          service["name"] ?? "Removed service",
          style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, letterSpacing: -0.6, height: 1.2, color: c.text),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            InitialsAvatar(staffName, size: 40),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(staffName, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontWeight: FontWeight.w600, color: c.text)),
                  if (specialization.isNotEmpty)
                    Text(specialization, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: c.muted, fontSize: 13)),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 18),
        // No "Where" tile: the app has no clinic location data.
        twoTiles(
          InfoTile("Date", formatDate(appointment["date"] ?? "")),
          InfoTile("Time", formatTimeRange(appointment["startTime"] ?? "", appointment["endTime"] ?? "")),
        ),
        const SizedBox(height: 10),
        twoTiles(
          InfoTile("Fee", price is num ? formatPrice(price) : "—"),
          InfoTile("Duration", minutes is num && minutes > 0 ? formatDuration(minutes.toInt()) : "—"),
        ),
        if (notes.isNotEmpty) ...[
          const SizedBox(height: 18),
          const Eyebrow("Your notes"),
          const SizedBox(height: 6),
          Text(notes, style: TextStyle(color: c.text)),
        ],
        if (appointment["status"] == "pending") ...[
          const SizedBox(height: 14),
          Text("Waiting for the clinic to confirm.", style: TextStyle(color: c.pendingText, fontWeight: FontWeight.w600)),
        ],
        if (started) ...[
          const SizedBox(height: 14),
          Text("This appointment has started and can no longer be changed.", style: TextStyle(color: c.muted)),
        ],
        if (active) ...[
          const SizedBox(height: 18),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: c.chipBg, borderRadius: BorderRadius.circular(16)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "BEFORE YOUR VISIT",
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 0.8, color: c.chipText),
                ),
                const SizedBox(height: 8),
                for (final tip in beforeVisitTips)
                  Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.check_circle_outline_rounded, size: 18, color: c.chipText),
                        const SizedBox(width: 8),
                        Expanded(child: Text(tip, style: TextStyle(color: c.chipText, fontSize: 13.5))),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        ],
        if (createdAt != null) ...[
          const SizedBox(height: 14),
          Text(
            "Booked on ${monthNames[createdAt.month - 1]} ${createdAt.day}, ${createdAt.year}",
            textAlign: TextAlign.center,
            style: TextStyle(color: c.muted, fontSize: 12),
          ),
        ],
        const SizedBox(height: 20),
        if (active) ...[
          FilledButton.icon(
            onPressed: onAddToCalendar,
            icon: const Icon(Icons.event_available_rounded),
            label: const Text("Add to calendar"),
          ),
          if (canChange) ...[
            const SizedBox(height: 10),
            Row(
              spacing: 10,
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: onReschedule,
                    style: OutlinedButton.styleFrom(minimumSize: big),
                    child: const Text("Reschedule"),
                  ),
                ),
                Expanded(
                  child: OutlinedButton(
                    onPressed: onCancel,
                    style: OutlinedButton.styleFrom(
                      minimumSize: big,
                      foregroundColor: c.danger,
                      side: BorderSide(color: c.danger.withValues(alpha: 0.5)),
                    ),
                    child: const Text("Cancel"),
                  ),
                ),
              ],
            ),
          ],
        ] else ...[
          FilledButton(onPressed: onBookAgain, child: const Text("Book again")),
          const SizedBox(height: 10),
          OutlinedButton(
            onPressed: onRemove,
            style: OutlinedButton.styleFrom(
              minimumSize: big,
              foregroundColor: c.danger,
              side: BorderSide(color: c.danger.withValues(alpha: 0.5)),
            ),
            child: const Text("Remove from history"),
          ),
        ],
      ],
    );
  }
}
