import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:cliniquick/theme.dart';
import 'package:cliniquick/utils/format.dart';

const List<String> _longDayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// "This week" row: today + the next 6 days. Today is filled, days with an active visit
// get an amber outline. `marked` holds "YYYY-MM-DD" strings. Scrolls if the screen is narrow.
class WeekStrip extends StatelessWidget {
  final Set<String> marked;
  const WeekStrip({super.key, required this.marked});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final days = [for (var i = 0; i < 7; i++) DateTime(today.year, today.month, today.day + i)];
    const gap = 6.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Semantics(
          header: true,
          child: Text("This week", style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18, letterSpacing: -0.2, color: c.text)),
        ),
        const SizedBox(height: 10),
        LayoutBuilder(
          builder: (context, constraints) {
            final width = math.max(40.0, (constraints.maxWidth - gap * 6) / 7);
            return SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  for (final (i, d) in days.indexed) ...[
                    if (i > 0) const SizedBox(width: gap),
                    _DayChip(date: d, width: width, isToday: i == 0, hasVisit: marked.contains(toDateString(d))),
                  ],
                ],
              ),
            );
          },
        ),
      ],
    );
  }
}

class _DayChip extends StatelessWidget {
  final DateTime date;
  final double width;
  final bool isToday;
  final bool hasVisit;
  const _DayChip({required this.date, required this.width, required this.isToday, required this.hasVisit});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final fg = isToday ? c.onPrimary : c.text;
    final extra = [if (isToday) "today", if (hasVisit) "appointment"];
    return Semantics(
      label: "${_longDayNames[date.weekday - 1]} ${monthNames[date.month - 1]} ${date.day}${extra.isEmpty ? "" : ", ${extra.join(", ")}"}",
      excludeSemantics: true,
      child: Container(
        width: width,
        height: 60,
        decoration: BoxDecoration(
          color: isToday ? c.primary : c.field,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: hasVisit ? c.pendingText : (isToday ? c.primary : c.border), width: 2),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              dayNames[date.weekday - 1],
              style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: isToday ? fg.withValues(alpha: 0.9) : c.muted),
            ),
            const SizedBox(height: 2),
            Text(
              "${date.day}",
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, height: 1.1, color: fg, fontFeatures: const [FontFeature.tabularFigures()]),
            ),
          ],
        ),
      ),
    );
  }
}
