import 'package:flutter/cupertino.dart' show CupertinoPageTransitionsBuilder;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// Brand colours (same as the website). Kept as constants for code that predates dark mode;
// new code should read colours from `AppColors.of(context)` so it works in both themes.
const Color brandBlue = Color(0xFF4F46E5);
const Color brandIndigo = Color(0xFF3730A3);
const Color brandLavender = Color(0xFFEEF2FF);
const Color slate = Color(0xFF0F1222);
const Color slateMuted = Color(0xFF5B6078);
const Color borderGray = Color(0xFFE6E6F2);
const Color pageGray = Color(0xFFFBFAFF);

// Light / dark mode for the whole app. Profile → "Dark mode" flips it.
final ValueNotifier<ThemeMode> themeMode = ValueNotifier(ThemeMode.system);

bool isDark(BuildContext context) => Theme.of(context).brightness == Brightness.dark;

// Design tokens shared with the website (light / dark).
@immutable
class AppColors extends ThemeExtension<AppColors> {
  final Color text, muted, border, card, field, page;
  final Color primary, onPrimary, chipBg, chipText;
  final Color pendingBg, pendingText, successBg, successText, infoBg, infoText, danger;
  final List<Color> glows; // soft background blobs
  final double glowOpacity;

  const AppColors({
    required this.text,
    required this.muted,
    required this.border,
    required this.card,
    required this.field,
    required this.page,
    required this.primary,
    required this.onPrimary,
    required this.chipBg,
    required this.chipText,
    required this.pendingBg,
    required this.pendingText,
    required this.successBg,
    required this.successText,
    required this.infoBg,
    required this.infoText,
    required this.danger,
    required this.glows,
    required this.glowOpacity,
  });

  static const light = AppColors(
    text: Color(0xFF0F1222),
    muted: Color(0xFF5B6078),
    border: Color(0xFFE6E6F2),
    card: Color(0xD1FFFFFF), // white @ 82%
    field: Color(0xFFFFFFFF),
    page: Color(0xFFFBFAFF),
    primary: Color(0xFF4F46E5),
    onPrimary: Color(0xFFFFFFFF),
    chipBg: Color(0xFFEEF0FF),
    chipText: Color(0xFF4338CA),
    pendingBg: Color(0xFFFFF1E6),
    pendingText: Color(0xFFC2410C),
    successBg: Color(0xFFE7F7EE),
    successText: Color(0xFF15803D),
    infoBg: Color(0xFFE3F3FC),
    infoText: Color(0xFF0369A1),
    danger: Color(0xFFDC2626),
    // Shades of the logo's indigo (like the website's light mode).
    glows: [Color(0xFFA5B4FC), Color(0xFFC7D2FE), Color(0xFFB4ADFB), Color(0xFFDFE3FF)],
    glowOpacity: 0.85,
  );

  static const dark = AppColors(
    text: Color(0xFFF3F4FF),
    muted: Color(0xFFA3A8C7),
    border: Color(0xFF252C4D),
    card: Color(0xBD141A36), // rgba(20,26,54,.74)
    field: Color(0xFF0F1530),
    page: Color(0xFF0B1024),
    primary: Color(0xFF818CF8),
    onPrimary: Color(0xFF0B1024),
    chipBg: Color(0xFF1A2147),
    chipText: Color(0xFFC7CCFF),
    pendingBg: Color(0xFF3A2412),
    pendingText: Color(0xFFFDBA74),
    successBg: Color(0xFF12321F),
    successText: Color(0xFF86EFAC),
    infoBg: Color(0xFF0E2A3D),
    infoText: Color(0xFF7DD3FC),
    danger: Color(0xFFF87171),
    // Soft whites (like the website's dark mode), kept faint.
    glows: [Color(0xFFFFFFFF), Color(0xFFF4F6FF), Color(0xFFFAFBFF), Color(0xFFEEF1FF)],
    glowOpacity: 0.16,
  );

  static AppColors of(BuildContext context) => Theme.of(context).extension<AppColors>()!;

  @override
  AppColors copyWith() => this;

  @override
  AppColors lerp(ThemeExtension<AppColors>? other, double t) => t < 0.5 || other is! AppColors ? this : other;
}

ThemeData buildTheme([Brightness brightness = Brightness.light]) {
  final c = brightness == Brightness.dark ? AppColors.dark : AppColors.light;
  // Set explicitly (fromSeed only fills the roles we don't use) so every colour matches the website.
  final dark = brightness == Brightness.dark;
  final scheme = ColorScheme.fromSeed(seedColor: brandBlue, brightness: brightness).copyWith(
    primary: c.primary,
    onPrimary: c.onPrimary,
    primaryContainer: c.chipBg,
    onPrimaryContainer: c.chipText,
    secondary: brandIndigo,
    onSecondary: Colors.white,
    surface: dark ? const Color(0xFF141A36) : Colors.white,
    onSurface: c.text,
    onSurfaceVariant: c.muted,
    outline: c.border,
    outlineVariant: c.border,
    error: c.danger,
    onError: dark ? const Color(0xFF0B1024) : Colors.white,
  );
  final rounded = BorderRadius.circular(14);
  // Plus Jakarta Sans, like the website (set as the app-wide font family).
  final base = ThemeData(
    brightness: brightness,
    colorScheme: scheme,
    useMaterial3: true,
    fontFamily: GoogleFonts.plusJakartaSans().fontFamily,
  );
  final textTheme = base.textTheme.apply(bodyColor: c.text, displayColor: c.text);
  OutlineInputBorder outline(Color color, [double width = 1.5]) =>
      OutlineInputBorder(borderRadius: rounded, borderSide: BorderSide(color: color, width: width));

  return base.copyWith(
    extensions: [c],
    textTheme: textTheme,
    scaffoldBackgroundColor: c.page,
    dividerColor: c.border,
    dividerTheme: DividerThemeData(color: c.border, space: 1),
    appBarTheme: AppBarTheme(
      backgroundColor: Colors.transparent,
      foregroundColor: c.text,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: true,
      titleTextStyle: GoogleFonts.plusJakartaSans(fontSize: 17, fontWeight: FontWeight.w700, color: c.text),
    ),
    // Frosted cards: translucent surface, 1px border, 22px radius, no shadow.
    cardTheme: CardThemeData(
      color: c.card,
      elevation: 0,
      shadowColor: Colors.transparent,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22), side: BorderSide(color: c.border)),
    ),
    // Notched-label inputs: 1.5px border, 14px radius, primary border on focus. 16px text avoids iOS zoom.
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: c.field,
      floatingLabelBehavior: FloatingLabelBehavior.always,
      // Label sits on the top border: 12px semibold, muted → primary when focused → red when invalid.
      labelStyle: TextStyle(color: c.muted, fontSize: 12, fontWeight: FontWeight.w600),
      floatingLabelStyle: WidgetStateTextStyle.resolveWith((states) {
        final color = states.contains(WidgetState.error)
            ? c.danger
            : states.contains(WidgetState.focused)
            ? c.primary
            : c.muted;
        return TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600);
      }),
      hintStyle: TextStyle(color: c.muted.withValues(alpha: 0.8)),
      prefixIconColor: c.muted,
      suffixIconColor: c.muted,
      errorStyle: TextStyle(color: c.danger, fontWeight: FontWeight.w600),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
      border: outline(c.border),
      enabledBorder: outline(c.border),
      disabledBorder: outline(c.border.withValues(alpha: 0.6)),
      focusedBorder: outline(c.primary, 2),
      errorBorder: outline(c.danger, 2),
      focusedErrorBorder: outline(c.danger, 2),
    ),
    // Pill buttons: 54px primary (16px bold), ghost outlined on the field colour.
    // Width is left to each screen (full-width buttons wrap themselves in a SizedBox).
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: c.primary,
        foregroundColor: c.onPrimary,
        minimumSize: const Size(0, 54),
        shape: const StadiumBorder(),
        textStyle: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700, fontSize: 16),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: c.text,
        backgroundColor: c.field,
        minimumSize: const Size(0, 48),
        side: BorderSide(color: c.border),
        shape: const StadiumBorder(),
        textStyle: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: c.primary,
        minimumSize: const Size(44, 44),
        textStyle: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700),
      ),
    ),
    floatingActionButtonTheme: FloatingActionButtonThemeData(
      backgroundColor: c.primary,
      foregroundColor: c.onPrimary,
      elevation: 0,
      shape: const StadiumBorder(),
    ),
    chipTheme: ChipThemeData(
      side: BorderSide(color: c.border),
      backgroundColor: c.field,
      selectedColor: c.primary,
      labelStyle: TextStyle(color: c.text, fontWeight: FontWeight.w600),
      secondaryLabelStyle: TextStyle(color: c.onPrimary, fontWeight: FontWeight.w600),
      checkmarkColor: c.onPrimary,
      shape: const StadiumBorder(),
    ),
    // Rounded-square checkboxes filled with the primary colour.
    checkboxTheme: CheckboxThemeData(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
      side: WidgetStateBorderSide.resolveWith(
        (states) => BorderSide(color: states.contains(WidgetState.selected) ? c.primary : c.muted, width: 1.5),
      ),
      fillColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? c.primary : Colors.transparent),
      checkColor: WidgetStatePropertyAll(c.onPrimary),
    ),
    switchTheme: SwitchThemeData(
      trackColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? c.primary : c.border),
      thumbColor: const WidgetStatePropertyAll(Colors.white),
      trackOutlineColor: const WidgetStatePropertyAll(Colors.transparent),
    ),
    bottomSheetTheme: BottomSheetThemeData(
      backgroundColor: dark ? const Color(0xFF141A36) : Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(30))),
      showDragHandle: true,
      dragHandleColor: c.border,
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: brightness == Brightness.dark ? const Color(0xFF141A36) : Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: brightness == Brightness.dark ? const Color(0xFF252C4D) : slate,
      shape: RoundedRectangleBorder(borderRadius: rounded),
    ),
    pageTransitionsTheme: const PageTransitionsTheme(
      builders: {
        TargetPlatform.android: FadeForwardsPageTransitionsBuilder(),
        TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
        TargetPlatform.windows: FadeForwardsPageTransitionsBuilder(),
        TargetPlatform.macOS: CupertinoPageTransitionsBuilder(),
        TargetPlatform.linux: FadeForwardsPageTransitionsBuilder(),
      },
    ),
  );
}
