import 'package:flutter/material.dart';
import 'package:cliniquick/config.dart';
import 'package:cliniquick/tempstore/activesession.dart';

// Countries offered for phone numbers (ISO code, label).
const List<List<String>> phoneCountries = [
  ["PH", "Philippines (+63)"],
  ["US", "United States (+1)"],
  ["SG", "Singapore (+65)"],
  ["JP", "Japan (+81)"],
  ["KR", "South Korea (+82)"],
  ["AU", "Australia (+61)"],
  ["GB", "United Kingdom (+44)"],
  ["AE", "United Arab Emirates (+971)"],
  ["SA", "Saudi Arabia (+966)"],
  ["CA", "Canada (+1)"],
];

// Shows a short message at the bottom of the screen.
void showMessage(BuildContext context, String message, {bool error = false}) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(message),
      backgroundColor: error ? Colors.red.shade700 : null,
    ),
  );
}

// "Are you sure?" dialog. Returns true when the user confirms.
Future<bool> confirmDialog(BuildContext context, String title, String message, String confirmText) async {
  final result = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      title: Text(title),
      content: Text(message),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context, false), child: const Text("Go back")),
        FilledButton(onPressed: () => Navigator.pop(context, true), child: Text(confirmText)),
      ],
    ),
  );
  return result ?? false;
}

void logout(BuildContext context) {
  Activesession.clear();
  Navigator.pushNamedAndRemoveUntil(context, "/login", (route) => false);
}

// Colored label for an appointment status.
Widget statusChip(String status) {
  final colors = {
    "pending": Colors.orange,
    "confirmed": Colors.green,
    "completed": Colors.blueGrey,
    "cancelled": Colors.red,
  };
  final color = colors[status] ?? Colors.grey;
  return Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
    decoration: BoxDecoration(
      color: color.withValues(alpha: 0.15),
      borderRadius: BorderRadius.circular(20),
    ),
    child: Text(
      status[0].toUpperCase() + status.substring(1),
      style: TextStyle(color: color.shade800, fontWeight: FontWeight.bold, fontSize: 12),
    ),
  );
}

// Red message box for errors returned by the server.
Widget errorBox(String message) {
  return Container(
    width: double.infinity,
    margin: const EdgeInsets.only(bottom: 12),
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(
      color: Colors.red.shade50,
      border: Border.all(color: Colors.red.shade200),
      borderRadius: BorderRadius.circular(10),
    ),
    child: Text(message, style: TextStyle(color: Colors.red.shade800)),
  );
}

// Big centered message for empty lists.
Widget emptyState(IconData icon, String title, String subtitle) {
  return Padding(
    padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 16),
    child: Column(
      children: [
        Icon(icon, size: 48, color: Colors.deepPurple.shade200),
        const SizedBox(height: 12),
        Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        Text(subtitle, textAlign: TextAlign.center, style: const TextStyle(color: Colors.black54)),
      ],
    ),
  );
}

// Side menu. Clients and staff see different pages.
class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    final user = Activesession.user;
    final current = ModalRoute.of(context)?.settings.name;

    Widget link(IconData icon, String label, String route) {
      return ListTile(
        leading: Icon(icon),
        title: Text(label),
        selected: current == route,
        onTap: () {
          Navigator.pop(context);
          if (current != route) Navigator.pushReplacementNamed(context, route);
        },
      );
    }

    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          UserAccountsDrawerHeader(
            accountName: Text(user["name"] ?? appName),
            accountEmail: Text(user["email"] ?? ""),
            currentAccountPicture: CircleAvatar(
              backgroundColor: Colors.white,
              child: Text(
                (user["name"] ?? "?").toString().substring(0, 1).toUpperCase(),
                style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
            ),
          ),
          if (Activesession.isStaff) ...[
            link(Icons.calendar_month, "My Schedule", "/staff"),
            link(Icons.beach_access, "Time Off", "/staff/time-off"),
          ] else ...[
            link(Icons.dashboard, "Dashboard", "/home"),
            link(Icons.add_circle_outline, "Book Appointment", "/book"),
            link(Icons.event_note, "My Appointments", "/appointments"),
          ],
          link(Icons.person_outline, "My Profile", "/profile"),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.logout),
            title: const Text("Log out"),
            onTap: () => logout(context),
          ),
        ],
      ),
    );
  }
}
