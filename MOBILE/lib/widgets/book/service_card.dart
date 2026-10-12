import 'package:flutter/material.dart';
import 'package:cliniquick/theme.dart';
import 'package:cliniquick/utils/format.dart';
import 'package:cliniquick/widgets/ui.dart';
import 'package:cliniquick/widgets/book/selectable.dart';

// Services have no category field, so they're grouped by keywords in their name (same as the website).
// Checked in order: "Follow-up consultation" counts as a follow-up, not a consultation.
// TODO(backend): a real `category` on services would replace this guesswork.
class ServiceCategory {
  final String id;
  final String label;
  final RegExp test;
  final IconData icon;
  const ServiceCategory(this.id, this.label, this.test, this.icon);
}

final List<ServiceCategory> serviceCategories = [
  ServiceCategory("follow-up", "Follow-up", RegExp("follow", caseSensitive: false), Icons.event_repeat_outlined),
  ServiceCategory("counseling", "Counseling", RegExp("counsel|therapy", caseSensitive: false), Icons.forum_outlined),
  ServiceCategory("assessment", "Assessment", RegExp("check|exam|assess", caseSensitive: false), Icons.assignment_turned_in_outlined),
  ServiceCategory("consultation", "Consultation", RegExp("consult", caseSensitive: false), Icons.medical_services_outlined),
];

// Order of the filter chips.
const List<String> categoryChipOrder = ["consultation", "assessment", "counseling", "follow-up"];

ServiceCategory? categoryOf(Map service) {
  final name = (service["name"] ?? "").toString();
  for (final category in serviceCategories) {
    if (category.test.hasMatch(name)) return category;
  }
  return null;
}

IconData serviceIcon(Map service) => categoryOf(service)?.icon ?? Icons.monitor_heart_outlined;

// Soft tile colours, rotated by list position.
(Color, Color) tileTone(AppColors c, int index) => [
      (c.chipBg, c.chipText),
      (c.successBg, c.successText),
      (c.pendingBg, c.pendingText),
      (c.infoBg, c.infoText),
    ][index % 4];

// One service as a radio option: circle, coloured icon tile, name, description, price + duration.
class ServiceCard extends StatelessWidget {
  final Map service;
  final bool selected;
  final int index;
  final VoidCallback onTap;

  const ServiceCard({super.key, required this.service, required this.selected, required this.index, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final (bg, fg) = tileTone(c, index);
    final description = (service["description"] ?? "").toString();
    return SelectableCard(
      selected: selected,
      onTap: onTap,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(padding: const EdgeInsets.only(top: 13), child: SelectCircle(selected: selected)),
          const SizedBox(width: 12),
          IconTile(serviceIcon(service), bg: bg, fg: fg, size: 48),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(service["name"] ?? "", style: TextStyle(fontWeight: FontWeight.w700, fontSize: 17, height: 1.3, color: c.text)),
                if (description.isNotEmpty) ...[
                  const SizedBox(height: 3),
                  Text(description, style: TextStyle(fontSize: 14, color: c.muted)),
                ],
                const SizedBox(height: 10),
                Row(
                  children: [
                    Text(formatPrice(service["price"] ?? 0), style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: c.text)),
                    const SizedBox(width: 12),
                    Icon(Icons.schedule_rounded, size: 16, color: c.muted),
                    const SizedBox(width: 4),
                    Text(formatDuration(service["durationMinutes"] ?? 0), style: TextStyle(fontSize: 13.5, color: c.muted)),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// Pill used for the service filters. 44px tall touch target.
class FilterPill extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const FilterPill({super.key, required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return Semantics(
      button: true,
      selected: selected,
      child: Material(
        color: selected ? c.primary : c.field,
        shape: StadiumBorder(side: BorderSide(color: selected ? c.primary : c.border)),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Container(
            height: 44,
            padding: const EdgeInsets.symmetric(horizontal: 18),
            alignment: Alignment.center,
            child: Text(
              label,
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: selected ? c.onPrimary : c.text),
            ),
          ),
        ),
      ),
    );
  }
}
