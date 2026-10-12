import 'dart:ui' show ImageFilter;
import 'package:flutter/material.dart';
import 'package:cliniquick/theme.dart';
import 'package:cliniquick/widgets/motion.dart';

// Height of the bar above the safe area (12 + 52px button + 12), for list padding.
const double bookingBarHeight = 76;

// Frosted bar pinned to the bottom of the booking wizard: one-line summary, total, main action.
class BookingBar extends StatelessWidget {
  final String summary;
  final String? price; // null until a service is chosen
  final String label;
  final bool showArrow;
  final bool saving;
  final VoidCallback? onPressed;

  const BookingBar({super.key, required this.summary, required this.price, required this.label, required this.onPressed, this.showArrow = true, this.saving = false});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
        child: Container(
          decoration: BoxDecoration(
            color: isDark(context) ? const Color(0xDB141A36) : const Color(0xDBFFFFFF),
            border: Border(top: BorderSide(color: c.border)),
          ),
          padding: EdgeInsets.fromLTRB(18, 12, 18, 12 + MediaQuery.paddingOf(context).bottom),
          child: Semantics(
            container: true,
            label: "Your appointment",
            child: Row(
              children: [
                // The button keeps its label; the summary shrinks (with an ellipsis) instead.
                Flexible(
                  flex: 2,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        summary.toUpperCase(),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 0.66, height: 1.4, color: c.muted),
                      ),
                      Text(
                        price ?? "—",
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                          letterSpacing: -0.4,
                          height: 1.2,
                          color: price == null ? c.muted : c.text,
                          fontFeatures: const [FontFeature.tabularFigures()],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  flex: 3,
                  child: FilledButton(
                    onPressed: onPressed,
                    style: FilledButton.styleFrom(
                      minimumSize: const Size(0, 52),
                      padding: const EdgeInsets.symmetric(horizontal: 18),
                      // While saving the button is disabled but should still look like the main action.
                      disabledBackgroundColor: saving ? c.primary.withValues(alpha: 0.75) : null,
                      disabledForegroundColor: saving ? c.onPrimary : null,
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (saving) ...[
                          SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: c.onPrimary)),
                          const SizedBox(width: 10),
                        ],
                        Flexible(child: Text(label, maxLines: 1, overflow: TextOverflow.ellipsis)),
                        if (showArrow && !saving) ...[const SizedBox(width: 8), NudgingArrow(active: onPressed != null)],
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
