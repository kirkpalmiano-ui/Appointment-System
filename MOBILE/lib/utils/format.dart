// Display helpers. The API uses "YYYY-MM-DD" dates and "HH:MM" (24-hour) times.

const List<String> dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const List<String> monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

String twoDigits(int n) => n.toString().padLeft(2, "0");

// DateTime -> "2026-10-05"
String toDateString(DateTime date) => "${date.year}-${twoDigits(date.month)}-${twoDigits(date.day)}";

// "2026-10-05" -> DateTime
DateTime parseDate(String value) {
  final parts = value.split("-").map(int.parse).toList();
  return DateTime(parts[0], parts[1], parts[2]);
}

String todayString() => toDateString(DateTime.now());

// "2026-10-05" -> "Mon, Oct 5, 2026"
String formatDate(String value) {
  if (!RegExp(r"^\d{4}-\d{2}-\d{2}$").hasMatch(value)) return value;
  final date = parseDate(value);
  return "${dayNames[date.weekday - 1]}, ${monthNames[date.month - 1]} ${date.day}, ${date.year}";
}

// "Today", "Tomorrow" or "Mon, Oct 5"
String relativeDay(String value) {
  if (!RegExp(r"^\d{4}-\d{2}-\d{2}$").hasMatch(value)) return value;
  final today = DateTime.now();
  final date = parseDate(value);
  final difference = date.difference(DateTime(today.year, today.month, today.day)).inDays;
  if (difference == 0) return "Today";
  if (difference == 1) return "Tomorrow";
  return "${dayNames[date.weekday - 1]}, ${monthNames[date.month - 1]} ${date.day}";
}

// "13:30" -> "1:30 PM"
String formatTime(String value) {
  // Empty or unexpected values are shown as-is instead of crashing the screen.
  if (!RegExp(r"^\d{1,2}:\d{2}$").hasMatch(value)) return value;
  final parts = value.split(":").map(int.parse).toList();
  final hour = parts[0] % 12 == 0 ? 12 : parts[0] % 12;
  final suffix = parts[0] >= 12 ? "PM" : "AM";
  return "$hour:${twoDigits(parts[1])} $suffix";
}

String formatTimeRange(String start, String end) => "${formatTime(start)} – ${formatTime(end)}";

// 1500 -> "₱1,500"
String formatPrice(num amount) {
  final whole = amount.round().toString();
  final withCommas = whole.replaceAllMapped(RegExp(r"\B(?=(\d{3})+(?!\d))"), (match) => ",");
  return "₱$withCommas";
}

String formatDuration(int minutes) {
  if (minutes < 60) return "$minutes min";
  final hours = minutes ~/ 60;
  final rest = minutes % 60;
  return rest == 0 ? "$hours hr" : "$hours hr $rest min";
}

// True once an appointment's start time has passed (it can then be completed).
bool hasStarted(Map<String, dynamic> appointment) {
  final today = todayString();
  final date = appointment["date"] as String;
  if (date != today) return date.compareTo(today) < 0;
  final parts = (appointment["startTime"] as String).split(":").map(int.parse).toList();
  final now = DateTime.now();
  return now.hour * 60 + now.minute >= parts[0] * 60 + parts[1];
}

bool isActive(Map<String, dynamic> appointment) =>
    appointment["status"] == "pending" || appointment["status"] == "confirmed";

String capitalize(String text) => text.isEmpty ? text : text[0].toUpperCase() + text.substring(1);
