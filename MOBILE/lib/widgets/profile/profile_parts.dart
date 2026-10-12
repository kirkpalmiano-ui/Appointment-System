import 'package:flutter/material.dart';
import 'package:cliniquick/theme.dart';
import 'package:cliniquick/widgets/motion.dart';
import 'package:cliniquick/widgets/ui.dart';

// Building blocks for the Profile screen (same look as the website's mobile profile).

// Sub-screens opened from the settings list.
enum ProfileSection { personal, email, security, notifications, danger }

const Map<ProfileSection, String> profileSectionTitles = {
  ProfileSection.personal: "Personal info",
  ProfileSection.email: "Email address",
  ProfileSection.security: "Security & password",
  ProfileSection.notifications: "Notifications",
  ProfileSection.danger: "Danger zone",
};

const Map<String, String> roleLabels = {"admin": "Admin", "staff": "Staff"};

// Brand gradient used by the banner and the completeness bar (light / dark).
LinearGradient profileGradient(BuildContext context) {
  final dark = isDark(context);
  return LinearGradient(
    begin: const Alignment(-1, -0.4),
    end: const Alignment(1, 0.4),
    colors: dark
        ? const [Color(0xFF312E81), Color(0xFF5B21B6), Color(0xFF831843), Color(0xFF78350F)]
        : const [Color(0xFF6D63F0), Color(0xFFA78BFA), Color(0xFFF9A8D4), Color(0xFFFDE68A)],
    stops: dark ? const [0, 0.45, 0.8, 1] : const [0, 0.45, 0.75, 1],
  );
}

// First / last name from the user JSON (older accounts only have `name`).
(String, String) splitUserName(Map<String, dynamic> user) {
  final parts = (user["name"] ?? "").toString().split(" ");
  return ((user["firstName"] ?? parts.first).toString(), (user["lastName"] ?? parts.skip(1).join(" ")).toString());
}

// A missing item: the hint text, the sub-screen to open, and which field to focus ("firstName", "lastName", "phone").
typedef CompletenessHint = ({String hint, ProfileSection section, String? focus});

// Only fields the app can actually store count towards completeness.
(int, CompletenessHint?) profileCompleteness(Map<String, dynamic> user) {
  final (first, last) = splitUserName(user);
  final items = <(bool, CompletenessHint)>[
    (first.trim().isNotEmpty, (hint: "Add your first name to finish", section: ProfileSection.personal, focus: "firstName")),
    (last.trim().isNotEmpty, (hint: "Add your last name to finish", section: ProfileSection.personal, focus: "lastName")),
    ((user["phone"] ?? "").toString().trim().isNotEmpty, (hint: "Add your phone number to finish", section: ProfileSection.personal, focus: "phone")),
    (user["isVerified"] == true, (hint: "Verify your email address to finish", section: ProfileSection.email, focus: null)),
  ];
  final done = items.where((item) => item.$1).length;
  final missing = items.where((item) => !item.$1);
  return ((done * 100 / items.length).round(), missing.isEmpty ? null : missing.first.$2);
}

// Gradient banner, avatar with a page-coloured ring overlapping it, and "Edit profile".
class ProfileHeader extends StatelessWidget {
  final String? name;
  final VoidCallback onEdit;
  const ProfileHeader({super.key, required this.name, required this.onEdit});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return SizedBox(
      height: 120 + 44,
      child: Stack(
        children: [
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: 120,
            child: ExcludeSemantics(child: DecoratedBox(decoration: BoxDecoration(gradient: profileGradient(context)))),
          ),
          Positioned(
            left: 16,
            right: 16,
            bottom: 0,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Container(
                  width: 88,
                  height: 88,
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(color: c.page, shape: BoxShape.circle),
                  child: InitialsAvatar(name, size: 80),
                ),
                const Spacer(),
                OutlinedButton(
                  onPressed: onEdit,
                  style: OutlinedButton.styleFrom(minimumSize: const Size(0, 44), padding: const EdgeInsets.symmetric(horizontal: 18)),
                  child: const Text("Edit profile"),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// "Profile X% complete" with a gradient bar and a link to the first missing item.
class CompletenessCard extends StatelessWidget {
  final int percent;
  final CompletenessHint? next;
  final ValueChanged<CompletenessHint> onHint;
  const CompletenessCard({super.key, required this.percent, required this.next, required this.onHint});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final gradient = profileGradient(context);
    Widget bar(double value) => Container(
          height: 8,
          decoration: BoxDecoration(color: c.border.withValues(alpha: 0.7), borderRadius: BorderRadius.circular(999)),
          alignment: Alignment.centerLeft,
          child: FractionallySizedBox(
            widthFactor: value.clamp(0.0, 1.0),
            child: DecoratedBox(decoration: BoxDecoration(gradient: gradient, borderRadius: BorderRadius.circular(999))),
          ),
        );
    final target = percent / 100;
    return FrostedCard(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text("Profile $percent% complete", style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Semantics(
            label: "Profile completeness",
            value: "$percent%",
            child: reduceMotion(context)
                ? bar(target)
                : TweenAnimationBuilder<double>(
                    tween: Tween(begin: 0, end: target),
                    duration: const Duration(milliseconds: 700),
                    curve: Curves.easeOutCubic,
                    builder: (context, v, _) => bar(v),
                  ),
          ),
          if (next != null)
            InkWell(
              onTap: () => onHint(next!),
              borderRadius: BorderRadius.circular(8),
              child: ConstrainedBox(
                constraints: const BoxConstraints(minHeight: 44),
                child: Align(
                  alignment: Alignment.centerLeft,
                  widthFactor: 1,
                  child: Text("${next!.hint} →", style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: c.primary)),
                ),
              ),
            )
          else
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Text("Your profile is complete", style: TextStyle(fontSize: 14, color: c.muted)),
            ),
        ],
      ),
    );
  }
}

// Settings list row: icon tile, label (+ muted value) and a trailing chevron or widget.
class SettingsRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String? value;
  final bool danger;
  final Widget? trailing;
  final VoidCallback? onTap;
  const SettingsRow({super.key, required this.icon, required this.label, this.value, this.danger = false, this.trailing, this.onTap});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return Semantics(
      button: trailing == null,
      child: InkWell(
        onTap: onTap,
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 60),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                IconTile(icon, size: 38, bg: danger ? c.danger.withValues(alpha: 0.12) : null, fg: danger ? c.danger : null),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(label, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: danger ? c.danger : c.text)),
                      if (value != null && value!.isNotEmpty)
                        Text(value!, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 13, color: c.muted)),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                trailing ?? Icon(Icons.chevron_right_rounded, color: c.muted),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// Real light/dark switch. While following the system theme it reflects the current brightness.
class DarkModeRow extends StatelessWidget {
  const DarkModeRow({super.key});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<ThemeMode>(
      valueListenable: themeMode,
      builder: (context, mode, _) {
        final dark = isDark(context);
        void set(bool value) => themeMode.value = value ? ThemeMode.dark : ThemeMode.light;
        return MergeSemantics(
          child: SettingsRow(
            icon: Icons.dark_mode_outlined,
            label: "Dark mode",
            value: mode == ThemeMode.system ? "Following your device" : null,
            onTap: () => set(!dark),
            trailing: Switch(value: dark, onChanged: set),
          ),
        );
      },
    );
  }
}

// Sub-screen top row: back button and centred title.
class SubScreenTopBar extends StatelessWidget {
  final String title;
  final VoidCallback onBack;
  const SubScreenTopBar({super.key, required this.title, required this.onBack});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 4, 4, 4),
      child: Row(
        children: [
          IconButton(
            tooltip: "Back",
            onPressed: onBack,
            constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
            icon: const Icon(Icons.arrow_back_rounded),
          ),
          Expanded(
            child: Semantics(
              header: true,
              child: Text(
                title,
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
              ),
            ),
          ),
          const SizedBox(width: 48),
        ],
      ),
    );
  }
}

// Card title + optional muted subtitle used inside sub-screens.
class SectionHeading extends StatelessWidget {
  final String title;
  final String? subtitle;
  final Widget? action;
  const SectionHeading(this.title, {super.key, this.subtitle, this.action});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(child: Text(title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800))),
            ?action,
          ],
        ),
        if (subtitle != null) ...[
          const SizedBox(height: 4),
          Text(subtitle!, style: TextStyle(fontSize: 14, color: c.muted)),
        ],
      ],
    );
  }
}

// Same defaults as the server (User.notificationPrefs) for accounts saved before it existed.
const Map<String, bool> notificationDefaults = {"emailReminders": true, "statusUpdates": true, "healthTips": false};

Map<String, bool> notificationPrefsOf(Map<String, dynamic> user) {
  final saved = user["notificationPrefs"];
  return {
    for (final entry in notificationDefaults.entries)
      entry.key: saved is Map && saved[entry.key] is bool ? saved[entry.key] as bool : entry.value,
  };
}

const List<(String, String, String)> _notificationRows = [
  ("emailReminders", "Email reminder", "An email about 24 hours before each appointment."),
  ("statusUpdates", "Booking status updates", "An email when the clinic confirms, reschedules or cancels your booking."),
  ("healthTips", "Health tips & promos", "Occasional tips and offers from the clinic. We'll only email these if you turn this on."),
];

// Email preference switches; each flip is saved right away by the parent.
class NotificationsCard extends StatelessWidget {
  final Map<String, bool> prefs;
  final String saving; // key being saved, or ""
  final void Function(String key, bool value) onChanged;
  const NotificationsCard({super.key, required this.prefs, required this.saving, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return FrostedCard(
      padding: const EdgeInsets.fromLTRB(20, 20, 16, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SectionHeading("Appointment reminders", subtitle: "Choose which emails we send you about your visits."),
          const SizedBox(height: 8),
          for (final (index, (key, title, description)) in _notificationRows.indexed) ...[
            if (index > 0) const Divider(height: 1),
            MergeSemantics(
              child: InkWell(
                onTap: saving == key ? null : () => onChanged(key, !(prefs[key] ?? false)),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                            const SizedBox(height: 2),
                            Text(description, style: TextStyle(fontSize: 13, color: c.muted)),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Switch(value: prefs[key] ?? false, onChanged: saving == key ? null : (value) => onChanged(key, value)),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// Self-service deletion has no API yet, so the button stays disabled.
class DangerZoneCard extends StatelessWidget {
  const DangerZoneCard({super.key});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return FrostedCard(
      padding: const EdgeInsets.all(20),
      borderColor: c.danger.withValues(alpha: 0.35),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SectionHeading("Danger zone", action: SoftChip("Coming soon", tone: ChipTone.neutral)),
          const SizedBox(height: 14),
          const Text("Delete account", style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Text(
            "Permanently removes your account and appointment history. Self-service deletion is coming soon; until then, contact the clinic.",
            style: TextStyle(fontSize: 14, color: c.muted),
          ),
          const SizedBox(height: 14),
          OutlinedButton(
            onPressed: null,
            style: OutlinedButton.styleFrom(
              disabledForegroundColor: c.danger.withValues(alpha: 0.5),
              side: BorderSide(color: c.danger.withValues(alpha: 0.3)),
            ),
            child: const Text("Delete account"),
          ),
        ],
      ),
    );
  }
}
