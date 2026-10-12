import 'dart:ui' show PathMetric;
import 'package:flutter/material.dart';
import 'package:cliniquick/theme.dart';
import 'package:cliniquick/widgets/motion.dart';
import 'package:cliniquick/widgets/ui.dart';

// Shared pieces for the booking wizard: selectable cards, radio circle, dashed lines.

// Frosted card that acts as a radio option. Selected: 2px primary border.
class SelectableCard extends StatelessWidget {
  final bool selected;
  final VoidCallback onTap;
  final Widget child;
  final EdgeInsetsGeometry padding;

  const SelectableCard({super.key, required this.selected, required this.onTap, required this.child, this.padding = const EdgeInsets.all(16)});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return Semantics(
      button: true,
      selected: selected,
      inMutuallyExclusiveGroup: true,
      child: PressScale(
        onTap: onTap,
        child: FrostedCard(
          onTap: onTap,
          // Keep the content still when the border thickens.
          padding: padding.add(EdgeInsets.all(selected ? 0 : 1)),
          borderColor: selected ? c.primary : null,
          borderWidth: selected ? 2 : 1,
          child: child,
        ),
      ),
    );
  }
}

// Round radio with a check when selected.
class SelectCircle extends StatelessWidget {
  final bool selected;
  const SelectCircle({super.key, required this.selected});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final duration = reduceMotion(context) ? Duration.zero : const Duration(milliseconds: 200);
    return AnimatedContainer(
      duration: duration,
      width: 22,
      height: 22,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: selected ? c.primary : Colors.transparent,
        border: Border.all(color: selected ? c.primary : c.muted.withValues(alpha: 0.5), width: 1.5),
      ),
      child: AnimatedScale(
        scale: selected ? 1 : 0,
        duration: duration,
        curve: Curves.easeOutBack,
        child: Icon(Icons.check_rounded, size: 14, color: c.onPrimary),
      ),
    );
  }
}

// Horizontal dashed divider.
class DashedLine extends StatelessWidget {
  final Color? color;
  const DashedLine({super.key, this.color});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 1,
      width: double.infinity,
      child: CustomPaint(painter: _DashedLinePainter(color ?? AppColors.of(context).border)),
    );
  }
}

class _DashedLinePainter extends CustomPainter {
  final Color color;
  _DashedLinePainter(this.color);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 1;
    for (double x = 0; x < size.width; x += 8) {
      canvas.drawLine(Offset(x, 0.5), Offset((x + 4).clamp(0, size.width), 0.5), paint);
    }
  }

  @override
  bool shouldRepaint(_DashedLinePainter old) => old.color != color;
}

// Dashed rounded-rectangle border (taken time slots).
class DashedBorderPainter extends CustomPainter {
  final Color color;
  final double radius;
  DashedBorderPainter(this.color, {this.radius = 12});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    final rect = RRect.fromRectAndRadius(Offset.zero & size, Radius.circular(radius)).deflate(0.75);
    final path = Path()..addRRect(rect);
    for (final PathMetric metric in path.computeMetrics()) {
      for (double d = 0; d < metric.length; d += 8) {
        canvas.drawPath(metric.extractPath(d, d + 4.5), paint);
      }
    }
  }

  @override
  bool shouldRepaint(DashedBorderPainter old) => old.color != color || old.radius != radius;
}
