import 'package:flutter/material.dart';
import 'package:cliniquick/theme.dart';
import 'package:cliniquick/widgets/motion.dart';
import 'package:cliniquick/widgets/ui.dart';

// Compact number card: soft icon tile + label, a big count and a muted helper line.
// `value == null` shows a dash (e.g. the stats failed to load).
class StatCard extends StatelessWidget {
  final IconData icon;
  final Color tileBg;
  final Color tileFg;
  final String label;
  final int? value;
  final String helper;
  final Color? valueColor;

  const StatCard({
    super.key,
    required this.icon,
    required this.tileBg,
    required this.tileFg,
    required this.label,
    required this.value,
    required this.helper,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final numberStyle = TextStyle(
      fontSize: 28,
      fontWeight: FontWeight.w800,
      height: 1.1,
      letterSpacing: -0.84,
      color: valueColor ?? c.text,
      fontFeatures: const [FontFeature.tabularFigures()],
    );
    return Semantics(
      label: "$label: ${value ?? "unavailable"}. $helper",
      excludeSemantics: true,
      child: FrostedCard(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                IconTile(icon, bg: tileBg, fg: tileFg, size: 32),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5, color: c.text)),
                ),
              ],
            ),
            const SizedBox(height: 10),
            value == null ? Text("—", style: numberStyle) : CountUp(value: value!, style: numberStyle),
            const SizedBox(height: 4),
            Text(helper, style: TextStyle(fontSize: 12.5, height: 1.35, color: c.muted)),
          ],
        ),
      ),
    );
  }
}
