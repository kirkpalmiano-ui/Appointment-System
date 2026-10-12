import 'package:flutter/material.dart';
import 'package:cliniquick/theme.dart';
import 'package:cliniquick/utils/format.dart';
import 'package:cliniquick/widgets/motion.dart';

const List<String> _fullMonths = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// One week of days at a time (starting today), with previous/next week buttons.
// Days the specialist can't be booked are faded and disabled. Pages to the selected day by itself.
class WeekDatePicker extends StatefulWidget {
  final List<DateTime> dates; // every bookable-range day, in order
  final String value; // "YYYY-MM-DD" or ""
  final ValueChanged<DateTime> onChange;
  final bool Function(DateTime) isDisabled;

  const WeekDatePicker({super.key, required this.dates, required this.value, required this.onChange, required this.isDisabled});

  @override
  State<WeekDatePicker> createState() => _WeekDatePickerState();
}

class _WeekDatePickerState extends State<WeekDatePicker> {
  int page = 0;

  int get pageCount => (widget.dates.length / 7).ceil();

  int weekOf(String value) {
    final index = widget.dates.indexWhere((d) => toDateString(d) == value);
    return index < 0 ? -1 : index ~/ 7;
  }

  @override
  void initState() {
    super.initState();
    page = weekOf(widget.value).clamp(0, 999);
  }

  @override
  void didUpdateWidget(covariant WeekDatePicker oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Jump to the selected day's week when it changes (e.g. picked automatically).
    if (widget.value != oldWidget.value) {
      final week = weekOf(widget.value);
      if (week >= 0) page = week;
    }
  }

  String weekLabel(List<DateTime> week) {
    if (page == 0) return "This week";
    if (page == 1) return "Next week";
    String short(DateTime d) => "${monthNames[d.month - 1]} ${d.day}";
    return "${short(week.first)} – ${short(week.last)}";
  }

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final start = page * 7;
    final week = widget.dates.sublist(start.clamp(0, widget.dates.length), (start + 7).clamp(0, widget.dates.length));
    if (week.isEmpty) return const SizedBox.shrink();
    final duration = reduceMotion(context) ? Duration.zero : const Duration(milliseconds: 150);

    Widget pager(IconData icon, String tooltip, VoidCallback? onPressed) => IconButton(
          tooltip: tooltip,
          onPressed: onPressed,
          icon: Icon(icon),
          style: IconButton.styleFrom(
            fixedSize: const Size(44, 44),
            backgroundColor: c.field,
            foregroundColor: c.text,
            disabledForegroundColor: c.muted.withValues(alpha: 0.4),
            side: BorderSide(color: c.border),
          ),
        );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Expanded(
              child: Semantics(
                liveRegion: true,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "${_fullMonths[week.first.month - 1]} ${week.first.year}",
                      style: TextStyle(fontWeight: FontWeight.w800, fontSize: 20, letterSpacing: -0.2, color: c.text),
                    ),
                    Text(weekLabel(week), style: TextStyle(fontSize: 14, color: c.muted)),
                  ],
                ),
              ),
            ),
            pager(Icons.chevron_left_rounded, "Previous week", page > 0 ? () => setState(() => page--) : null),
            const SizedBox(width: 8),
            pager(Icons.chevron_right_rounded, "Next week", page < pageCount - 1 ? () => setState(() => page++) : null),
          ],
        ),
        const SizedBox(height: 14),
        Row(
          children: [
            for (var i = 0; i < 7; i++) ...[
              if (i > 0) const SizedBox(width: 5),
              Expanded(
                child: i < week.length
                    ? _DayChip(
                        day: week[i],
                        selected: toDateString(week[i]) == widget.value,
                        disabled: widget.isDisabled(week[i]),
                        duration: duration,
                        onTap: () => widget.onChange(week[i]),
                      )
                    : const SizedBox(),
              ),
            ],
          ],
        ),
      ],
    );
  }
}

class _DayChip extends StatelessWidget {
  final DateTime day;
  final bool selected;
  final bool disabled;
  final Duration duration;
  final VoidCallback onTap;

  const _DayChip({required this.day, required this.selected, required this.disabled, required this.duration, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final fg = selected ? c.onPrimary : c.text;
    final label = "${dayNames[day.weekday - 1]}, ${_fullMonths[day.month - 1]} ${day.day}";
    return Semantics(
      button: true,
      selected: selected,
      enabled: !disabled,
      label: disabled ? "$label, unavailable" : label,
      excludeSemantics: true,
      child: Opacity(
        opacity: disabled ? 0.4 : 1,
        child: AnimatedContainer(
          duration: duration,
          decoration: BoxDecoration(
            color: selected ? c.primary : c.field,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: selected ? c.primary : c.border, width: 1.5),
            boxShadow: selected ? [BoxShadow(color: c.primary.withValues(alpha: 0.35), blurRadius: 16, offset: const Offset(0, 8))] : const [],
          ),
          child: Material(
            type: MaterialType.transparency,
            child: InkWell(
              onTap: disabled ? null : onTap,
              borderRadius: BorderRadius.circular(14),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 9),
                child: Column(
                  children: [
                    Text(
                      dayNames[day.weekday - 1].toUpperCase(),
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 0.4, color: fg.withValues(alpha: selected ? 0.9 : 0.7)),
                    ),
                    const SizedBox(height: 2),
                    Text("${day.day}", style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, height: 1.2, color: fg)),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
