import 'package:flutter/material.dart';
import 'package:cliniquick/theme.dart';
import 'package:cliniquick/utils/format.dart';
import 'package:cliniquick/widgets/ui.dart';
import 'package:cliniquick/widgets/book/selectable.dart';

const _periods = [
  ("Morning", 0, 12),
  ("Afternoon", 12, 17),
  ("Evening", 17, 24),
];

const _reasons = {"booked": "Already booked", "unavailable": "Not available", "past": "This time has passed"};

int _hourOf(String time) => int.tryParse(time.split(":").first) ?? 0;

// Time slots grouped into morning / afternoon / evening, 3 per row.
// Taken or past slots are dashed, struck through and disabled.
class TimeSlotGrid extends StatelessWidget {
  final List slots;
  final String value;
  final ValueChanged<String> onChange;

  const TimeSlotGrid({super.key, required this.slots, required this.value, required this.onChange});

  @override
  Widget build(BuildContext context) {
    final groups = <Widget>[];
    for (final (label, from, to) in _periods) {
      final group = slots.where((s) {
        final hour = _hourOf((s["startTime"] ?? "").toString());
        return hour >= from && hour < to;
      }).toList();
      if (group.isEmpty) continue;
      final rows = <Widget>[];
      for (var i = 0; i < group.length; i += 3) {
        rows.add(Padding(
          padding: EdgeInsets.only(top: i == 0 ? 0 : 8),
          child: Row(
            children: [
              for (var j = i; j < i + 3; j++) ...[
                if (j > i) const SizedBox(width: 8),
                Expanded(
                  child: j < group.length
                      ? _SlotButton(
                          slot: group[j],
                          selected: value == group[j]["startTime"],
                          onTap: () => onChange(group[j]["startTime"]),
                        )
                      : const SizedBox(),
                ),
              ],
            ],
          ),
        ));
      }
      groups.add(Padding(
        padding: EdgeInsets.only(top: groups.isEmpty ? 0 : 22),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [Eyebrow(label), const SizedBox(height: 10), ...rows],
        ),
      ));
    }
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: groups);
  }
}

class _SlotButton extends StatelessWidget {
  final Map slot;
  final bool selected;
  final VoidCallback onTap;

  const _SlotButton({required this.slot, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final time = formatTime((slot["startTime"] ?? "").toString());
    final available = slot["available"] == true;
    final radius = BorderRadius.circular(12);

    if (!available) {
      final reason = _reasons[slot["reason"]] ?? capitalize((slot["reason"] ?? "not available").toString());
      return Tooltip(
        message: reason,
        child: Semantics(
          label: "$time, $reason",
          enabled: false,
          excludeSemantics: true,
          child: CustomPaint(
            painter: DashedBorderPainter(c.border, radius: 12),
            child: SizedBox(
              height: 44,
              child: Center(
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Text(
                    time,
                    style: TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w700,
                      color: c.muted,
                      decoration: TextDecoration.lineThrough,
                      decorationColor: c.muted,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      );
    }

    return Semantics(
      button: true,
      selected: selected,
      inMutuallyExclusiveGroup: true,
      label: time,
      excludeSemantics: true,
      child: Material(
        color: selected ? c.primary : c.chipBg,
        borderRadius: radius,
        child: InkWell(
          onTap: onTap,
          borderRadius: radius,
          child: SizedBox(
            height: 44,
            child: Center(
              child: FittedBox(
                fit: BoxFit.scaleDown,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: Text(time, style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700, color: selected ? c.onPrimary : c.chipText)),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// Key under the slots: what the two looks mean and which clock the times follow.
class SlotLegend extends StatelessWidget {
  const SlotLegend({super.key});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final style = TextStyle(fontSize: 13.5, color: c.muted);
    return Wrap(
      spacing: 18,
      runSpacing: 8,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 14,
              height: 14,
              decoration: BoxDecoration(color: c.chipBg, borderRadius: BorderRadius.circular(4), border: Border.all(color: c.chipText)),
            ),
            const SizedBox(width: 8),
            Text("Available", style: style),
          ],
        ),
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            CustomPaint(painter: DashedBorderPainter(c.muted, radius: 4), child: const SizedBox(width: 14, height: 14)),
            const SizedBox(width: 8),
            Text("Booked", style: style),
          ],
        ),
        Text("Times shown in Manila (GMT+8)", style: style),
      ],
    );
  }
}
