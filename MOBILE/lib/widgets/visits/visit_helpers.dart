import 'package:cliniquick/utils/format.dart';
import 'package:cliniquick/widgets/ui.dart';

// Small helpers for the "My visits" screen (same rules as the website's appointmentUi.js).

const List<String> fullMonthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// "CQ-A1B2C3": short reference shown to the client.
String refCode(Map<String, dynamic> appointment) {
  final id = (appointment["_id"] ?? "").toString();
  return "CQ-${(id.length > 6 ? id.substring(id.length - 6) : id).toUpperCase()}";
}

// DateBox tone: green for completed, grey for cancelled, accent otherwise.
ChipTone dateTone(Map<String, dynamic> appointment) => switch (appointment["status"]) {
      "completed" => ChipTone.success,
      "cancelled" => ChipTone.neutral,
      _ => ChipTone.accent,
    };

// "Today", "Tomorrow", "In 5 days"; empty for past dates.
String countdownLabel(String date) {
  if (!RegExp(r"^\d{4}-\d{2}-\d{2}$").hasMatch(date)) return "";
  final now = DateTime.now();
  final days = parseDate(date).difference(DateTime(now.year, now.month, now.day)).inDays;
  if (days < 0) return "";
  if (days == 0) return "Today";
  if (days == 1) return "Tomorrow";
  return "In $days days";
}

class MonthGroup {
  final String label;
  final List<Map<String, dynamic>> items;
  MonthGroup(this.label, this.items);
}

// Consecutive items of the same month under one header (keeps the list order).
List<MonthGroup> groupByMonth(List items) {
  final groups = <MonthGroup>[];
  String? lastKey;
  for (final raw in items) {
    final appointment = Map<String, dynamic>.from(raw);
    final date = (appointment["date"] ?? "").toString();
    final key = date.length >= 7 ? date.substring(0, 7) : date;
    if (key != lastKey) {
      String label = key;
      if (RegExp(r"^\d{4}-\d{2}-\d{2}$").hasMatch(date)) {
        final d = parseDate(date);
        label = "${fullMonthNames[d.month - 1]} ${d.year}";
      }
      groups.add(MonthGroup(label, []));
      lastKey = key;
    }
    groups.last.items.add(appointment);
  }
  return groups;
}
