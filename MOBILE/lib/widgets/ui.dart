import 'package:flutter/material.dart';
import 'package:cliniquick/tempstore/activesession.dart';
import 'package:cliniquick/theme.dart';
import 'package:cliniquick/utils/format.dart';
import 'package:cliniquick/widgets/motion.dart';

// Shared building blocks for the redesigned screens (same look as the website's mobile layout).
// Colours come from AppColors.of(context), so everything works in light and dark mode.

// ---------- Background ----------

// Soft colour glows behind a screen (indigo shades in light mode, faint white in dark mode).
// Radial gradients rather than blur filters, so it stays cheap on phones.
class GlowBackground extends StatelessWidget {
  final Widget child;
  const GlowBackground({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    Widget glow(Color color, double size) => IgnorePointer(
          child: Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(colors: [color.withValues(alpha: c.glowOpacity), color.withValues(alpha: 0)]),
            ),
          ),
        );
    return ColoredBox(
      color: c.page,
      child: Stack(
        children: [
          Positioned(top: -120, left: -110, child: glow(c.glows[0], 340)),
          Positioned(top: -140, right: -120, child: glow(c.glows[2], 320)),
          Positioned(top: 260, right: -150, child: glow(c.glows[1], 300)),
          Positioned(bottom: -140, left: -120, child: glow(c.glows[3], 340)),
          Positioned.fill(child: child),
        ],
      ),
    );
  }
}

// ---------- Cards, labels, chips ----------

// Frosted card: translucent surface, 1px border, 22px radius.
class FrostedCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;
  final Color? borderColor;
  final double borderWidth;

  const FrostedCard({super.key, required this.child, this.padding = const EdgeInsets.all(16), this.onTap, this.borderColor, this.borderWidth = 1});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final radius = BorderRadius.circular(22);
    return Material(
      color: c.card,
      shape: RoundedRectangleBorder(borderRadius: radius, side: BorderSide(color: borderColor ?? c.border, width: borderWidth)),
      clipBehavior: Clip.antiAlias,
      child: InkWell(onTap: onTap, child: Padding(padding: padding, child: child)),
    );
  }
}

// Small uppercase muted label ("YOUR NEXT VISIT", "MORNING").
class Eyebrow extends StatelessWidget {
  final String text;
  const Eyebrow(this.text, {super.key});

  @override
  Widget build(BuildContext context) => Text(
        text.toUpperCase(),
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 0.8, color: AppColors.of(context).muted),
      );
}

// Big page title ("My visits."), 32px / 800 / tight tracking.
class PageTitle extends StatelessWidget {
  final String text;
  final String? subtitle;
  const PageTitle(this.text, {super.key, this.subtitle});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(text, style: TextStyle(fontSize: 32, fontWeight: FontWeight.w800, letterSpacing: -1.6, height: 1.05, color: c.text)),
        if (subtitle != null) ...[
          const SizedBox(height: 6),
          Text(subtitle!, style: TextStyle(fontSize: 15, color: c.muted)),
        ],
      ],
    );
  }
}

enum ChipTone { accent, pending, success, info, danger, neutral }

// Soft rounded chip with a dot or check ("● Pending", "✓ Completed"). Never a solid fill.
class SoftChip extends StatelessWidget {
  final String label;
  final ChipTone tone;
  final bool check;
  final bool dot;
  const SoftChip(this.label, {super.key, this.tone = ChipTone.accent, this.check = false, this.dot = true});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final (bg, fg) = switch (tone) {
      ChipTone.pending => (c.pendingBg, c.pendingText),
      ChipTone.success => (c.successBg, c.successText),
      ChipTone.info => (c.infoBg, c.infoText),
      ChipTone.danger => (c.danger.withValues(alpha: 0.12), c.danger),
      ChipTone.neutral => (c.border.withValues(alpha: 0.6), c.muted),
      ChipTone.accent => (c.chipBg, c.chipText),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(999)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (check)
            Icon(Icons.check_rounded, size: 14, color: fg)
          else if (dot)
            Container(width: 6, height: 6, decoration: BoxDecoration(color: fg, shape: BoxShape.circle)),
          if (check || dot) const SizedBox(width: 6),
          Text(label, style: TextStyle(color: fg, fontSize: 12, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}

// Status chip for an appointment status (soft colours, like the website).
class StatusChip extends StatelessWidget {
  final String status;
  final String? label;
  const StatusChip(this.status, {super.key, this.label});

  @override
  Widget build(BuildContext context) {
    final tone = switch (status) {
      "pending" => ChipTone.pending,
      "confirmed" || "completed" => ChipTone.success,
      "cancelled" => ChipTone.danger,
      _ => ChipTone.neutral,
    };
    return SoftChip(label ?? capitalize(status), tone: tone, check: status == "completed");
  }
}

// Rounded date square: month, big day number, weekday.
class DateBox extends StatelessWidget {
  final String date;
  final ChipTone tone;
  const DateBox(this.date, {super.key, this.tone = ChipTone.accent});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final d = parseDate(date);
    final (bg, fg) = switch (tone) {
      ChipTone.success => (c.successBg, c.successText),
      ChipTone.neutral || ChipTone.danger => (c.border.withValues(alpha: 0.6), c.muted),
      _ => (c.chipBg, c.chipText),
    };
    return Container(
      width: 58,
      height: 64,
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(16)),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(monthNames[d.month - 1].toUpperCase(), style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: fg, letterSpacing: 0.6)),
          Text("${d.day}", style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: fg, height: 1.1)),
          Text(dayNames[d.weekday - 1].toUpperCase(), style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: fg.withValues(alpha: 0.75))),
        ],
      ),
    );
  }
}

// Soft rounded square holding an icon.
class IconTile extends StatelessWidget {
  final IconData icon;
  final Color? bg;
  final Color? fg;
  final double size;
  const IconTile(this.icon, {super.key, this.bg, this.fg, this.size = 40});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(color: bg ?? c.chipBg, borderRadius: BorderRadius.circular(size * 0.32)),
      child: Icon(icon, size: size * 0.5, color: fg ?? c.chipText),
    );
  }
}

// Initials avatar in the soft accent colours.
class InitialsAvatar extends StatelessWidget {
  final String? name;
  final double size;
  const InitialsAvatar(this.name, {super.key, this.size = 44});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final initials = (name ?? "").trim().split(RegExp(r"\s+")).where((p) => p.isNotEmpty).take(2).map((p) => p[0].toUpperCase()).join();
    return CircleAvatar(
      radius: size / 2,
      backgroundColor: c.chipBg,
      child: Text(initials.isEmpty ? "?" : initials, style: TextStyle(color: c.chipText, fontWeight: FontWeight.w700, fontSize: size * 0.34)),
    );
  }
}

// ---------- Bottom sheet ----------

// Bottom sheet: 30px top radius, drag handle, max ~85% of the screen, scrolls inside,
// safe-area padding. Closes on scrim tap / swipe down / back.
Future<T?> showAppSheet<T>(BuildContext context, {required Widget Function(BuildContext) builder, String? title}) {
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * 0.85, maxWidth: 640),
    sheetAnimationStyle: reduceMotion(context) ? AnimationStyle.noAnimation : null,
    builder: (sheetContext) => SafeArea(
      top: false,
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (title != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
              ),
            builder(sheetContext),
          ],
        ),
      ),
    ),
  );
}

// Notifications sheet (bell / Alerts tab).
// TODO(backend): there's no notifications API yet, so this shows an honest empty state.
void showNotificationsSheet(BuildContext context) {
  showAppSheet<void>(
    context,
    title: "Notifications",
    builder: (ctx) {
      final c = AppColors.of(ctx);
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 28),
        child: Column(
          children: [
            Icon(Icons.notifications_none_rounded, size: 40, color: c.muted.withValues(alpha: 0.6)),
            const SizedBox(height: 8),
            const Text("No notifications yet", style: TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            Text("Booking updates will show up here.", style: TextStyle(color: c.muted)),
          ],
        ),
      );
    },
  );
}

// ---------- Page scaffold with the bottom tab bar ----------

enum AppTab { home, visits, profile, schedule, timeOff, none }

// Signed-in screen: glow background, safe area, content, and the floating bottom tab bar
// (Home · Visits · raised Book · Alerts · Profile; staff: Schedule · Time off · Alerts · Profile).
// Pass `showTabBar: false` for flows with their own bottom bar (booking).
class AppScaffold extends StatelessWidget {
  final AppTab tab;
  final Widget body;
  final bool showTabBar;
  final Widget? bottomBar;
  final Future<void> Function()? onBook; // refresh hook after returning from /book

  const AppScaffold({super.key, required this.tab, required this.body, this.showTabBar = true, this.bottomBar, this.onBook});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      extendBody: true,
      body: GlowBackground(child: SafeArea(bottom: false, child: body)),
      bottomNavigationBar: bottomBar ?? (showTabBar ? _BottomTabBar(tab: tab, onBook: onBook) : null),
    );
  }
}

// Space to leave at the bottom of scrolling content so nothing hides behind the tab bar.
double tabBarSpace(BuildContext context) => 70 + 14 + 24 + MediaQuery.paddingOf(context).bottom;

class _BottomTabBar extends StatelessWidget {
  final AppTab tab;
  final Future<void> Function()? onBook;
  const _BottomTabBar({required this.tab, this.onBook});

  void _go(BuildContext context, String route) {
    if (ModalRoute.of(context)?.settings.name != route) Navigator.pushReplacementNamed(context, route);
  }

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final staff = Activesession.isStaff;

    Widget item(String label, IconData icon, IconData activeIcon, bool active, VoidCallback onTap) {
      return Expanded(
        child: Semantics(
          button: true,
          selected: active,
          label: label,
          excludeSemantics: true,
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(18),
            child: SizedBox(
              height: 70,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(active ? activeIcon : icon, size: 24, color: active ? c.primary : c.muted),
                  const SizedBox(height: 2),
                  Text(label, style: TextStyle(fontSize: 11, fontWeight: active ? FontWeight.w700 : FontWeight.w600, color: active ? c.primary : c.muted)),
                ],
              ),
            ),
          ),
        ),
      );
    }

    final bar = Container(
      height: 70,
      padding: const EdgeInsets.symmetric(horizontal: 6),
      decoration: BoxDecoration(
        color: isDark(context) ? const Color(0xE0141A36) : const Color(0xDBFFFFFF),
        borderRadius: BorderRadius.circular(26),
        border: Border.all(color: c.border),
        boxShadow: [BoxShadow(color: (isDark(context) ? Colors.black : const Color(0xFF281E78)).withValues(alpha: 0.18), blurRadius: 30, offset: const Offset(0, 14))],
      ),
      child: Row(
        children: staff
            ? [
                item("Schedule", Icons.calendar_month_outlined, Icons.calendar_month, tab == AppTab.schedule, () => _go(context, "/staff")),
                item("Time off", Icons.beach_access_outlined, Icons.beach_access, tab == AppTab.timeOff, () => _go(context, "/staff/time-off")),
                item("Alerts", Icons.notifications_none_rounded, Icons.notifications, false, () => showNotificationsSheet(context)),
                item("Profile", Icons.person_outline_rounded, Icons.person, tab == AppTab.profile, () => _go(context, "/profile")),
              ]
            : [
                item("Home", Icons.home_outlined, Icons.home_rounded, tab == AppTab.home, () => _go(context, "/home")),
                item("Visits", Icons.event_note_outlined, Icons.event_note, tab == AppTab.visits, () => _go(context, "/appointments")),
                Expanded(
                  // Centre "Book" button, sitting inside the bar like the other tabs.
                  child: Semantics(
                    button: true,
                    label: "Book an appointment",
                    excludeSemantics: true,
                    child: InkWell(
                      borderRadius: BorderRadius.circular(18),
                      onTap: () async {
                        await Navigator.pushNamed(context, "/book");
                        await onBook?.call();
                      },
                      child: SizedBox(
                        height: 70,
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              width: 44,
                              height: 30,
                              decoration: BoxDecoration(
                                color: c.primary,
                                borderRadius: BorderRadius.circular(12),
                                boxShadow: [BoxShadow(color: c.primary.withValues(alpha: 0.35), blurRadius: 12, offset: const Offset(0, 4))],
                              ),
                              child: Icon(Icons.add_rounded, size: 22, color: c.onPrimary),
                            ),
                            const SizedBox(height: 3),
                            Text("Book", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: c.primary)),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
                item("Alerts", Icons.notifications_none_rounded, Icons.notifications, false, () => showNotificationsSheet(context)),
                item("Profile", Icons.person_outline_rounded, Icons.person, tab == AppTab.profile, () => _go(context, "/profile")),
              ],
      ),
    );

    return Padding(
      padding: EdgeInsets.fromLTRB(14, 0, 14, 14 + MediaQuery.paddingOf(context).bottom),
      child: bar,
    );
  }
}
