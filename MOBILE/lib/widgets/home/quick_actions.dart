import 'package:flutter/material.dart';
import 'package:cliniquick/theme.dart';
import 'package:cliniquick/widgets/motion.dart';
import 'package:cliniquick/widgets/ui.dart';

// "Quick actions" card: two square tiles on top, one wide tile below.
class QuickActions extends StatelessWidget {
  final VoidCallback onBook;
  final VoidCallback onAppointments;
  final VoidCallback onProfile;

  const QuickActions({super.key, required this.onBook, required this.onAppointments, required this.onProfile});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return FrostedCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Semantics(
            header: true,
            child: Text("Quick actions", style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18, letterSpacing: -0.2, color: c.text)),
          ),
          const SizedBox(height: 14),
          IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(child: _ActionTile(label: "Book a consultation", icon: Icons.add_rounded, bg: c.chipBg, fg: c.chipText, onTap: onBook)),
                const SizedBox(width: 12),
                Expanded(child: _ActionTile(label: "My appointments", icon: Icons.list_alt_rounded, bg: c.infoBg, fg: c.infoText, onTap: onAppointments)),
              ],
            ),
          ),
          const SizedBox(height: 12),
          _ActionTile(label: "Profile & settings", icon: Icons.manage_accounts_rounded, bg: c.successBg, fg: c.successText, onTap: onProfile, wide: true),
        ],
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color bg;
  final Color fg;
  final VoidCallback onTap;
  final bool wide;

  const _ActionTile({required this.label, required this.icon, required this.bg, required this.fg, required this.onTap, this.wide = false});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final radius = BorderRadius.circular(18);
    final text = Text(label, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14.5, height: 1.3, color: c.text));
    return Semantics(
      button: true,
      label: label,
      excludeSemantics: true,
      child: PressScale(
        onTap: onTap,
        child: Material(
          color: c.field,
          shape: RoundedRectangleBorder(borderRadius: radius, side: BorderSide(color: c.border)),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: wide
                  ? Row(
                      children: [
                        IconTile(icon, bg: bg, fg: fg, size: 40),
                        const SizedBox(width: 12),
                        Expanded(child: text),
                        Icon(Icons.chevron_right_rounded, color: c.muted),
                      ],
                    )
                  : ConstrainedBox(
                      constraints: const BoxConstraints(minHeight: 64),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          IconTile(icon, bg: bg, fg: fg, size: 40),
                          const SizedBox(height: 12),
                          text,
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
