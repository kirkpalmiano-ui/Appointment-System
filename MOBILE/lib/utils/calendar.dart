import 'package:url_launcher/url_launcher.dart';

// "Add to calendar": opens Google Calendar with the visit filled in (same as the website).
// Dates/times are clinic-local, so they're sent with the clinic's time zone.
const String clinicTimeZone = "Asia/Manila";

String _stamp(String date, String time) => "${date.replaceAll("-", "")}T${time.replaceAll(":", "")}00";

Uri googleCalendarUri(Map<String, dynamic> appointment) {
  final service = (appointment["service"] is Map ? appointment["service"]["name"] : null) ?? "Appointment";
  final staff = appointment["staff"] is Map ? appointment["staff"]["name"] : null;
  final notes = (appointment["notes"] ?? "").toString();
  return Uri.https("calendar.google.com", "/calendar/render", {
    "action": "TEMPLATE",
    "text": "$service${staff != null ? " with $staff" : ""} · CliniQuick",
    "dates": "${_stamp(appointment["date"], appointment["startTime"])}/${_stamp(appointment["date"], appointment["endTime"])}",
    "ctz": clinicTimeZone,
    "details": "Booked with CliniQuick.${notes.isNotEmpty ? " Notes: $notes" : ""}",
  });
}

// Returns false if nothing could open the link.
Future<bool> addToCalendar(Map<String, dynamic> appointment) =>
    launchUrl(googleCalendarUri(appointment), mode: LaunchMode.externalApplication);
