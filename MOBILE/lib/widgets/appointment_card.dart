import 'package:flutter/material.dart';
import 'package:cliniquick/utils/format.dart';
import 'package:cliniquick/widgets/common.dart';

// One appointment in a list: service, date/time, specialist and status.
// Set `showClient` on the staff side to show the client's name instead.
class AppointmentCard extends StatelessWidget {
  final Map<String, dynamic> appointment;
  final VoidCallback? onTap;
  final bool showClient;

  const AppointmentCard({super.key, required this.appointment, this.onTap, this.showClient = false});

  @override
  Widget build(BuildContext context) {
    final service = appointment["service"] ?? {};
    final staff = appointment["staff"] ?? {};
    final client = appointment["user"] ?? {};
    final who = showClient ? (client["name"] ?? "Deleted client") : "with ${staff["name"] ?? "a former staff member"}";

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        onTap: onTap,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        title: Text(service["name"] ?? "Removed service", style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 4),
          child: Text(
            "${showClient ? "" : "${relativeDay(appointment["date"])} • "}"
            "${formatTimeRange(appointment["startTime"], appointment["endTime"])}\n$who",
          ),
        ),
        isThreeLine: true,
        trailing: statusChip(appointment["status"]),
      ),
    );
  }
}
