import 'package:flutter/material.dart';
import 'package:cliniquick/theme.dart';

// Soft pastel blobs behind the auth screens, like the web app.
// Each blob is a radial gradient (colour → transparent) instead of a blur filter,
// which keeps it cheap to draw on low-end Android phones.
class GradientBackground extends StatelessWidget {
  final Widget child;
  const GradientBackground({super.key, required this.child});

  // [light, dark] colour per blob: lavender, pink, pale yellow, mint.
  static const _blobs = [
    (Color(0xFFD6D0FF), Color(0xFF3B1F7A)),
    (Color(0xFFFFDCEC), Color(0xFF4A1F4F)),
    (Color(0xFFFFF3C9), Color(0xFF4A3416)),
    (Color(0xFFCDF5EA), Color(0xFF0E4A45)),
  ];

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final dark = isDark(context);
    Color color(int i) => dark ? _blobs[i].$2 : _blobs[i].$1;

    return ColoredBox(
      color: c.page,
      child: LayoutBuilder(
        builder: (context, box) {
          final size = box.maxWidth * 1.15;
          Widget blob(int i, {double? top, double? left, double? right, double? bottom, double scale = 1}) => Positioned(
            top: top,
            left: left,
            right: right,
            bottom: bottom,
            child: IgnorePointer(
              child: Container(
                width: size * scale,
                height: size * scale,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      color(i).withValues(alpha: dark ? 0.55 : 0.9),
                      color(i).withValues(alpha: 0),
                    ],
                  ),
                ),
              ),
            ),
          );

          return Stack(
            children: [
              blob(0, top: -size * 0.45, left: -size * 0.45), // lavender, top-left
              blob(1, top: -size * 0.5, right: -size * 0.5, scale: 0.95), // pink, top-right
              blob(2, top: box.maxHeight * 0.32, right: -size * 0.55, scale: 0.9), // yellow, right middle
              blob(3, bottom: -size * 0.45, left: -size * 0.5), // mint, bottom-left
              Positioned.fill(child: child),
            ],
          );
        },
      ),
    );
  }
}
