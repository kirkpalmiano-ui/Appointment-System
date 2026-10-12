import 'package:flutter/material.dart';
import 'package:cliniquick/theme.dart';
import 'package:cliniquick/utils/format.dart';
import 'package:cliniquick/widgets/ui.dart';
import 'package:cliniquick/widgets/book/selectable.dart';

// "Mon, Tue, Wed" (Monday first). workingDays uses 0 = Sunday.
String workingDaysLabel(Map staff) {
  final days = List<int>.from(staff["workingDays"] ?? [])..sort((a, b) => ((a + 6) % 7).compareTo((b + 6) % 7));
  return days.map((d) => dayNames[(d + 6) % 7]).join(", ");
}

// A specialist as a radio option. `compact` is the slim version used on the date & time step.
// TODO(backend): "Next available" would need a slots request per specialist (or a summary endpoint).
class StaffCard extends StatelessWidget {
  final Map staff;
  final bool selected;
  final VoidCallback onTap;
  final bool compact;

  const StaffCard({super.key, required this.staff, required this.selected, required this.onTap, this.compact = false});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final name = (staff["name"] ?? "").toString();
    final specialization = (staff["specialization"] ?? "").toString();
    // Profile photo the specialist uploaded on their account (initials if none).
    final photoUrl = (staff["photoUrl"] ?? "").toString();

    if (compact) {
      return SelectableCard(
        selected: selected,
        onTap: onTap,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        child: Row(
          children: [
            InitialsAvatar(name, size: 40, imageUrl: photoUrl),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14.5, color: c.text)),
                  if (specialization.isNotEmpty)
                    Text(specialization, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 13, color: c.muted)),
                ],
              ),
            ),
            const SizedBox(width: 8),
            SelectCircle(selected: selected),
          ],
        ),
      );
    }

    Widget infoRow(IconData icon, String text) => Row(
          children: [
            Icon(icon, size: 16, color: c.muted),
            const SizedBox(width: 8),
            Expanded(child: Text(text, style: TextStyle(fontSize: 13.5, color: c.muted))),
          ],
        );

    return SelectableCard(
      selected: selected,
      onTap: onTap,
      padding: const EdgeInsets.all(19),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              InitialsAvatar(name, size: 56, imageUrl: photoUrl),
              const Spacer(),
              SelectCircle(selected: selected),
            ],
          ),
          const SizedBox(height: 14),
          Text(name, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 17, height: 1.3, color: c.text)),
          if (specialization.isNotEmpty) Text(specialization, style: TextStyle(fontSize: 14, color: c.muted)),
          const SizedBox(height: 14),
          const DashedLine(),
          const SizedBox(height: 12),
          infoRow(Icons.calendar_today_outlined, workingDaysLabel(staff)),
          const SizedBox(height: 6),
          infoRow(Icons.schedule_rounded, formatTimeRange(staff["startTime"] ?? "", staff["endTime"] ?? "")),
        ],
      ),
    );
  }
}
