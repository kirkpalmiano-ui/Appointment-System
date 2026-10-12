import 'package:flutter/material.dart';
import 'package:cliniquick/theme.dart';
import 'package:cliniquick/utils/format.dart';
import 'package:cliniquick/widgets/ui.dart';

// One timeline event.
class ActivityItem {
  final String title;
  final String detail;
  final IconData icon;
  final ChipTone tone;
  final DateTime at;
  const ActivityItem({required this.title, required this.detail, required this.icon, required this.tone, required this.at});
}

const Map<String, (String, IconData, ChipTone)> _types = {
  "pending": ("Booking request sent", Icons.send_rounded, ChipTone.accent),
  "confirmed": ("Appointment confirmed", Icons.event_available_rounded, ChipTone.success),
  "cancelled": ("Appointment cancelled", Icons.event_busy_rounded, ChipTone.danger),
  "completed": ("Visit completed", Icons.task_alt_rounded, ChipTone.info),
};

// "Just now", "5m ago", "2h ago", "3d ago", then a short date.
String timeAgo(DateTime then) {
  final seconds = DateTime.now().difference(then).inSeconds.clamp(0, 1 << 31);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return "${seconds ~/ 60}m ago";
  if (seconds < 86400) return "${seconds ~/ 3600}h ago";
  if (seconds < 86400 * 30) return "${seconds ~/ 86400}d ago";
  final local = then.toLocal();
  return "${monthNames[local.month - 1]} ${local.day}, ${local.year}";
}

// Appointments (+ the account's creation) -> the newest 5 events.
// Pending = when the request was made; other statuses = their last change.
// TODO(backend): a per-appointment status history would let us show every step.
List<ActivityItem> buildActivity(List appointments, Map<String, dynamic> user) {
  final items = <ActivityItem>[];
  for (final raw in appointments) {
    if (raw is! Map) continue;
    final type = _types[raw["status"]];
    if (type == null) continue;
    final at = DateTime.tryParse((raw["status"] == "pending" ? raw["createdAt"] : raw["updatedAt"])?.toString() ?? "");
    if (at == null) continue;
    final service = raw["service"] is Map ? raw["service"]["name"] : null;
    final staff = raw["staff"] is Map ? raw["staff"]["name"] : null;
    final date = (raw["date"] ?? "").toString();
    final shortDate = RegExp(r"^\d{4}-\d{2}-\d{2}$").hasMatch(date)
        ? () {
            final d = parseDate(date);
            return "${monthNames[d.month - 1]} ${d.day}";
          }()
        : date;
    items.add(ActivityItem(
      title: type.$1,
      icon: type.$2,
      tone: type.$3,
      at: at,
      detail: "${service ?? "Appointment"} with ${staff ?? "your specialist"} · $shortDate",
    ));
  }
  final created = DateTime.tryParse(user["createdAt"]?.toString() ?? "");
  if (created != null) {
    items.add(ActivityItem(
      title: "Welcome to CliniQuick",
      detail: "Your account was created",
      icon: Icons.waving_hand_rounded,
      tone: ChipTone.pending,
      at: created,
    ));
  }
  items.sort((a, b) => b.at.compareTo(a.at));
  return items.take(5).toList();
}

// "Recent activity" card.
class RecentActivity extends StatelessWidget {
  final List<ActivityItem> items;
  const RecentActivity({super.key, required this.items});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    (Color, Color) toneColors(ChipTone tone) => switch (tone) {
          ChipTone.pending => (c.pendingBg, c.pendingText),
          ChipTone.success => (c.successBg, c.successText),
          ChipTone.info => (c.infoBg, c.infoText),
          ChipTone.danger => (c.danger.withValues(alpha: 0.12), c.danger),
          ChipTone.neutral => (c.border.withValues(alpha: 0.6), c.muted),
          ChipTone.accent => (c.chipBg, c.chipText),
        };

    return FrostedCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Semantics(
            header: true,
            child: Text("Recent activity", style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18, letterSpacing: -0.2, color: c.text)),
          ),
          const SizedBox(height: 12),
          if (items.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 28),
              child: Column(
                children: [
                  Icon(Icons.history_rounded, size: 36, color: c.muted.withValues(alpha: 0.6)),
                  const SizedBox(height: 8),
                  Text("No activity yet", style: TextStyle(fontWeight: FontWeight.w600, color: c.text)),
                  const SizedBox(height: 2),
                  Text("Bookings and updates will show up here.", textAlign: TextAlign.center, style: TextStyle(fontSize: 14, color: c.muted)),
                ],
              ),
            )
          else
            for (final item in items)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Row(
                  children: [
                    IconTile(item.icon, bg: toneColors(item.tone).$1, fg: toneColors(item.tone).$2, size: 40),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(item.title, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14.5, color: c.text)),
                          Text(item.detail, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 14, color: c.muted)),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Align(
                      alignment: Alignment.topCenter,
                      child: Text(timeAgo(item.at), style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: c.muted)),
                    ),
                  ],
                ),
              ),
        ],
      ),
    );
  }
}
