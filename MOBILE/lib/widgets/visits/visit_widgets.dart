import 'package:flutter/material.dart';
import 'package:cliniquick/theme.dart';
import 'package:cliniquick/utils/format.dart';
import 'package:cliniquick/widgets/motion.dart';
import 'package:cliniquick/widgets/ui.dart';
import 'package:cliniquick/widgets/visits/visit_helpers.dart';

// Building blocks for the "My visits" screen (website: ScopeSegments, MobileAppointmentRow).

class ScopeTab {
  final String value;
  final String label;
  const ScopeTab(this.value, this.label);
}

// Full-width segmented pill control: "Upcoming 3 | Past 12 | Cancelled 1".
class ScopeSegments extends StatelessWidget {
  final List<ScopeTab> tabs;
  final String value;
  final Map<String, int?> counts;
  final ValueChanged<String> onChanged;

  const ScopeSegments({super.key, required this.tabs, required this.value, required this.counts, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final duration = reduceMotion(context) ? Duration.zero : const Duration(milliseconds: 160);
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(color: c.field, borderRadius: BorderRadius.circular(999), border: Border.all(color: c.border)),
      child: Row(
        spacing: 4,
        children: [
          for (final tab in tabs)
            Expanded(
              child: Builder(builder: (context) {
                final selected = tab.value == value;
                final count = counts[tab.value];
                return Semantics(
                  button: true,
                  selected: selected,
                  label: "${tab.label}${count != null ? ", $count" : ""}",
                  excludeSemantics: true,
                  child: Material(
                    color: Colors.transparent,
                    borderRadius: BorderRadius.circular(999),
                    clipBehavior: Clip.antiAlias,
                    child: InkWell(
                      onTap: () => onChanged(tab.value),
                      child: AnimatedContainer(
                        duration: duration,
                        constraints: const BoxConstraints(minHeight: 44),
                        padding: const EdgeInsets.symmetric(horizontal: 6),
                        decoration: BoxDecoration(color: selected ? c.chipBg : Colors.transparent, borderRadius: BorderRadius.circular(999)),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Flexible(
                              child: Text(
                                tab.label,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700, color: selected ? c.chipText : c.muted),
                              ),
                            ),
                            if (count != null) ...[
                              const SizedBox(width: 4),
                              Container(
                                constraints: const BoxConstraints(minWidth: 20),
                                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                                decoration: BoxDecoration(
                                  color: selected ? c.field : c.border.withValues(alpha: 0.6),
                                  borderRadius: BorderRadius.circular(999),
                                ),
                                child: Text(
                                  "$count",
                                  textAlign: TextAlign.center,
                                  style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: selected ? c.chipText : c.muted),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              }),
            ),
        ],
      ),
    );
  }
}

// One visit in the list: date box, service, "{staff} · {time}", status + countdown chips, chevron.
class VisitRow extends StatelessWidget {
  final Map<String, dynamic> appointment;
  final VoidCallback onTap;
  const VisitRow({super.key, required this.appointment, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final service = appointment["service"] ?? {};
    final staff = appointment["staff"] ?? {};
    final cancelled = appointment["status"] == "cancelled";
    final countdown = isActive(appointment) ? countdownLabel(appointment["date"] ?? "") : "";
    final serviceName = service["name"] ?? "Removed service";

    return Semantics(
      button: true,
      label: "$serviceName on ${formatDate(appointment["date"] ?? "")} at ${formatTime(appointment["startTime"] ?? "")}, ${appointment["status"] ?? ""}",
      excludeSemantics: true,
      child: FrostedCard(
        onTap: onTap,
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            DateBox(appointment["date"], tone: dateTone(appointment)),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    serviceName,
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
                  Text(
                    "${staff["name"] ?? "Former staff member"} · ${formatTime(appointment["startTime"] ?? "")}",
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(color: c.muted, fontSize: 13.5),
                  ),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 6,
                    runSpacing: 4,
                    children: [
                      StatusChip(appointment["status"] ?? ""),
                      if (countdown.isNotEmpty) SoftChip(countdown, tone: ChipTone.accent, dot: false),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 4),
            Icon(Icons.chevron_right_rounded, color: c.muted),
          ],
        ),
      ),
    );
  }
}

// Placeholder rows while the list loads (static, so it respects reduced motion).
class VisitSkeleton extends StatelessWidget {
  const VisitSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return Semantics(
      label: "Loading appointments",
      child: Column(
        spacing: 10,
        children: [
          for (var i = 0; i < 3; i++)
            Container(
              height: 90,
              decoration: BoxDecoration(color: c.border.withValues(alpha: 0.45), borderRadius: BorderRadius.circular(22)),
            ),
        ],
      ),
    );
  }
}

// Themed error message (light and dark).
class VisitError extends StatelessWidget {
  final String message;
  const VisitError(this.message, {super.key});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: c.danger.withValues(alpha: 0.1),
        border: Border.all(color: c.danger.withValues(alpha: 0.35)),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.error_outline_rounded, size: 20, color: c.danger),
          const SizedBox(width: 10),
          Expanded(child: Text(message, style: TextStyle(color: c.danger, fontWeight: FontWeight.w600))),
        ],
      ),
    );
  }
}

// Empty list: icon, title, text and an action button.
class VisitEmpty extends StatelessWidget {
  final IconData icon;
  final String title;
  final String text;
  final Widget action;
  const VisitEmpty({super.key, required this.icon, required this.title, required this.text, required this.action});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 12),
      child: Column(
        children: [
          IconTile(icon, size: 60),
          const SizedBox(height: 14),
          Text(title, textAlign: TextAlign.center, style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: c.text)),
          const SizedBox(height: 4),
          Text(text, textAlign: TextAlign.center, style: TextStyle(color: c.muted)),
          const SizedBox(height: 18),
          action,
        ],
      ),
    );
  }
}

// Small count badge for the Filter button.
class CountBadge extends StatelessWidget {
  final int count;
  const CountBadge(this.count, {super.key});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return Container(
      constraints: const BoxConstraints(minWidth: 20, minHeight: 20),
      padding: const EdgeInsets.symmetric(horizontal: 6),
      alignment: Alignment.center,
      decoration: BoxDecoration(color: c.primary, borderRadius: BorderRadius.circular(999)),
      child: Text("$count", style: TextStyle(color: c.onPrimary, fontSize: 11.5, fontWeight: FontWeight.w800)),
    );
  }
}
