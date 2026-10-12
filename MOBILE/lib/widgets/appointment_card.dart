import 'package:flutter/material.dart';
import 'package:cliniquick/theme.dart';
import 'package:cliniquick/utils/format.dart';
import 'package:cliniquick/widgets/ui.dart';

// One appointment in a list: avatar, service, specialist, date/time and status.
// Set `showClient` on the staff side to show the client's name instead.
class AppointmentCard extends StatelessWidget {
  final Map<String, dynamic> appointment;
  final VoidCallback? onTap;
  final bool showClient;

  const AppointmentCard({super.key, required this.appointment, this.onTap, this.showClient = false});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final service = appointment["service"] ?? {};
    final staff = appointment["staff"] ?? {};
    final client = appointment["user"] ?? {};
    final person = showClient ? (client["name"] ?? "Deleted client") : (staff["name"] ?? "a former staff member");
    final who = showClient ? person : "with $person";
    final when = "${showClient ? "" : "${relativeDay(appointment["date"])} · "}"
        "${formatTimeRange(appointment["startTime"], appointment["endTime"])}";
    final cancelled = appointment["status"] == "cancelled";

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: FrostedCard(
        onTap: onTap,
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            InitialsAvatar(person, size: 44),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    service["name"] ?? "Removed service",
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 15.5,
                      color: c.text,
                      decoration: cancelled ? TextDecoration.lineThrough : null,
                      decorationColor: c.text,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(who, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: c.muted, fontSize: 13)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      StatusChip(appointment["status"] ?? ""),
                      SoftChip(when, tone: ChipTone.neutral, dot: false),
                    ],
                  ),
                ],
              ),
            ),
            if (onTap != null) ...[
              const SizedBox(width: 6),
              Icon(Icons.chevron_right_rounded, color: c.muted),
            ],
          ],
        ),
      ),
    );
  }
}
