import 'package:flutter/material.dart';
import 'package:cliniquick/config.dart';
import 'package:cliniquick/tempstore/activesession.dart';
import 'package:cliniquick/theme.dart';
import 'package:cliniquick/widgets/motion.dart';
import 'package:cliniquick/widgets/ui.dart';

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
      // Theme's danger red (a deeper red in light mode, softer in dark) for errors.
      backgroundColor: error ? (isDark(context) ? const Color(0xFF7F1D1D) : const Color(0xFFB91C1C)) : null,
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

// Soft status chip for an appointment status (see widgets/ui.dart).
Widget statusChip(String status) => StatusChip(status);

// Red message box for errors returned by the server (theme-aware).
Widget errorBox(String message) => _ErrorBox(message);

class _ErrorBox extends StatelessWidget {
  final String message;
  const _ErrorBox(this.message);

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: c.danger.withValues(alpha: 0.1),
        border: Border.all(color: c.danger.withValues(alpha: 0.35)),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Text(message, style: TextStyle(color: c.danger, fontWeight: FontWeight.w600)),
    );
  }
}

// Big centered message for empty lists (theme-aware).
Widget emptyState(IconData icon, String title, String subtitle) => _EmptyState(icon, title, subtitle);

class _EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  const _EmptyState(this.icon, this.title, this.subtitle);

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 16),
      child: Column(
        children: [
          Icon(icon, size: 44, color: c.muted.withValues(alpha: 0.5)),
          const SizedBox(height: 12),
          Text(title, textAlign: TextAlign.center, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: c.text)),
          const SizedBox(height: 4),
          Text(subtitle, textAlign: TextAlign.center, style: TextStyle(color: c.muted)),
        ],
      ),
    );
  }
}

// First letters of the first two words: "Maria Santos" -> "MS".
String initialsOf(String? name) {
  final parts = (name ?? "").trim().split(RegExp(r"\s+")).where((p) => p.isNotEmpty).take(2);
  final letters = parts.map((p) => p[0].toUpperCase()).join();
  return letters.isEmpty ? "?" : letters;
}

// Side menu. Clients and staff see different pages.
class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    final user = Activesession.user;
    final current = ModalRoute.of(context)?.settings.name;

    Widget link(IconData icon, String label, String route) {
      return _DrawerLink(
        icon: icon,
        label: label,
        selected: current == route,
        onTap: () {
          Navigator.pop(context);
          if (current != route) Navigator.pushReplacementNamed(context, route);
        },
      );
    }

    return Drawer(
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.horizontal(right: Radius.circular(20))),
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          Container(
            color: brandIndigo,
            padding: EdgeInsets.fromLTRB(20, MediaQuery.paddingOf(context).top + 24, 20, 22),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundColor: Colors.white.withValues(alpha: 0.16),
                  foregroundImage: (user["avatarUrl"] ?? "").toString().isNotEmpty ? NetworkImage(user["avatarUrl"].toString()) : null,
                  onForegroundImageError: (user["avatarUrl"] ?? "").toString().isNotEmpty ? (_, _) {} : null,
                  child: Text(
                    (user["name"] ?? "?").toString().substring(0, 1).toUpperCase(),
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: Colors.white),
                  ),
                ),
                const SizedBox(height: 14),
                Text(user["name"] ?? appName, style: const TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w700)),
                const SizedBox(height: 2),
                Text(user["email"] ?? "", style: TextStyle(color: Colors.white.withValues(alpha: 0.75), fontSize: 13)),
              ],
            ),
          ),
          const SizedBox(height: 10),
          if (Activesession.isStaff) ...[
            link(Icons.calendar_month_outlined, "My Schedule", "/staff"),
            link(Icons.beach_access_outlined, "Time Off", "/staff/time-off"),
          ] else ...[
            link(Icons.dashboard_outlined, "Dashboard", "/home"),
            link(Icons.add_circle_outline, "Book Appointment", "/book"),
            link(Icons.event_note_outlined, "My Appointments", "/appointments"),
          ],
          link(Icons.person_outline, "My Profile", "/profile"),
          const Padding(padding: EdgeInsets.symmetric(vertical: 8, horizontal: 16), child: Divider(height: 1)),
          _DrawerLink(icon: Icons.logout, label: "Log out", danger: true, onTap: () => logout(context)),
        ],
      ),
    );
  }
}

// Drawer row. The current page gets a lavender highlight and a blue bar that slides in from the left.
class _DrawerLink extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool selected;
  final bool danger;
  final VoidCallback onTap;

  const _DrawerLink({required this.icon, required this.label, required this.onTap, this.selected = false, this.danger = false});

  @override
  Widget build(BuildContext context) {
    final color = danger ? Colors.red.shade700 : (selected ? brandBlue : slate);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
      child: Material(
        color: selected ? brandLavender : Colors.transparent,
        borderRadius: BorderRadius.circular(12),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Row(
            children: [
              // Indicator bar: grows from nothing when the drawer opens on this page.
              TweenAnimationBuilder<double>(
                tween: Tween(begin: 0, end: selected ? 1 : 0),
                duration: reduceMotion(context) ? Duration.zero : const Duration(milliseconds: 420),
                curve: Curves.easeOutBack,
                builder: (context, t, _) => Container(
                  width: 4,
                  height: 26 * t.clamp(0.0, 1.2),
                  decoration: BoxDecoration(color: brandBlue, borderRadius: BorderRadius.circular(4)),
                ),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
                  child: Row(
                    children: [
                      Icon(icon, size: 22, color: color),
                      const SizedBox(width: 14),
                      Text(label, style: TextStyle(color: color, fontWeight: selected ? FontWeight.w700 : FontWeight.w500)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
