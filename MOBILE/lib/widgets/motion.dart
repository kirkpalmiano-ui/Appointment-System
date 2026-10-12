import 'package:flutter/material.dart';

// Small animation helpers shared by the screens. Every one of them stays still
// when the device asks for reduced motion (MediaQuery.disableAnimations).

bool reduceMotion(BuildContext context) => MediaQuery.maybeDisableAnimationsOf(context) ?? false;

// Soft ring that grows and fades out behind its child, on repeat.
class PulseRing extends StatefulWidget {
  final Widget child;
  final Color color;
  final bool active;
  final double spread; // how far the ring grows past the child, in px

  const PulseRing({super.key, required this.child, required this.color, this.active = true, this.spread = 10});

  @override
  State<PulseRing> createState() => _PulseRingState();
}

class _PulseRingState extends State<PulseRing> with SingleTickerProviderStateMixin {
  late final AnimationController controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 1800));

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _sync();
  }

  @override
  void didUpdateWidget(covariant PulseRing oldWidget) {
    super.didUpdateWidget(oldWidget);
    _sync();
  }

  void _sync() {
    if (widget.active && !reduceMotion(context)) {
      if (!controller.isAnimating) controller.repeat();
    } else {
      controller.stop();
      controller.value = 0;
    }
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: controller,
      child: widget.child,
      builder: (context, child) {
        final t = Curves.easeOut.transform(controller.value);
        return Stack(
          alignment: Alignment.center,
          clipBehavior: Clip.none,
          children: [
            if (controller.isAnimating)
              Positioned.fill(
                left: -widget.spread * t,
                right: -widget.spread * t,
                top: -widget.spread * t,
                bottom: -widget.spread * t,
                child: IgnorePointer(
                  child: DecoratedBox(
                    // Fully rounded corners: a circle around round children, a pill around wide ones.
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(color: widget.color.withValues(alpha: 0.45 * (1 - t)), width: 2),
                    ),
                  ),
                ),
              ),
            child!,
          ],
        );
      },
    );
  }
}

// Number that counts up from 0 when first shown (and to the new value when it changes).
class CountUp extends StatelessWidget {
  final int value;
  final TextStyle? style;

  const CountUp({super.key, required this.value, this.style});

  @override
  Widget build(BuildContext context) {
    if (reduceMotion(context)) return Text("$value", style: style);
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: value.toDouble()),
      duration: const Duration(milliseconds: 700),
      curve: Curves.easeOutCubic,
      builder: (context, v, _) => Text("${v.round()}", style: style),
    );
  }
}

// Fades and slides its child up a little when it first appears. `delay` staggers lists.
class FadeSlideIn extends StatelessWidget {
  final Widget child;
  final Duration delay;

  const FadeSlideIn({super.key, required this.child, this.delay = Duration.zero});

  @override
  Widget build(BuildContext context) {
    if (reduceMotion(context)) return child;
    final total = const Duration(milliseconds: 380) + delay;
    final start = delay.inMilliseconds / total.inMilliseconds;
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: total,
      child: child,
      builder: (context, v, child) {
        final t = Curves.easeOutCubic.transform(((v - start) / (1 - start)).clamp(0.0, 1.0));
        return Opacity(
          opacity: t,
          child: Transform.translate(offset: Offset(0, 12 * (1 - t)), child: child),
        );
      },
    );
  }
}

// Shrinks slightly while pressed, for a tactile tap on cards.
class PressScale extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;

  const PressScale({super.key, required this.child, this.onTap});

  @override
  State<PressScale> createState() => _PressScaleState();
}

class _PressScaleState extends State<PressScale> {
  bool pressed = false;

  void _set(bool value) {
    if (widget.onTap != null && pressed != value) setState(() => pressed = value);
  }

  @override
  Widget build(BuildContext context) {
    return Listener(
      onPointerDown: (_) => _set(true),
      onPointerUp: (_) => _set(false),
      onPointerCancel: (_) => _set(false),
      child: AnimatedScale(
        scale: pressed && !reduceMotion(context) ? 0.97 : 1,
        duration: const Duration(milliseconds: 120),
        curve: Curves.easeOut,
        child: widget.child,
      ),
    );
  }
}

// Arrow that nudges forward on repeat, used on "Continue" buttons.
class NudgingArrow extends StatefulWidget {
  final bool active;
  final Color? color;

  const NudgingArrow({super.key, this.active = true, this.color});

  @override
  State<NudgingArrow> createState() => _NudgingArrowState();
}

class _NudgingArrowState extends State<NudgingArrow> with SingleTickerProviderStateMixin {
  late final AnimationController controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 1100));

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _sync();
  }

  @override
  void didUpdateWidget(covariant NudgingArrow oldWidget) {
    super.didUpdateWidget(oldWidget);
    _sync();
  }

  void _sync() {
    if (widget.active && !reduceMotion(context)) {
      if (!controller.isAnimating) controller.repeat(reverse: true);
    } else {
      controller.stop();
      controller.value = 0;
    }
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: controller,
      builder: (context, child) => Transform.translate(
        offset: Offset(4 * Curves.easeInOut.transform(controller.value), 0),
        child: child,
      ),
      child: Icon(Icons.arrow_forward_rounded, size: 18, color: widget.color),
    );
  }
}
