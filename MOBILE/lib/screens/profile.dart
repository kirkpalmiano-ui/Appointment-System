import 'package:flutter/material.dart';
import 'package:cliniquick/services/api.dart';
import 'package:cliniquick/tempstore/activesession.dart';
import 'package:cliniquick/theme.dart';
import 'package:cliniquick/utils/validation.dart';
import 'package:cliniquick/widgets/common.dart';
import 'package:cliniquick/widgets/motion.dart';
import 'package:cliniquick/widgets/profile/profile_parts.dart';
import 'package:cliniquick/widgets/ui.dart';

// Profile: header + settings list. Each row opens an in-app sub-screen
// (personal info, email, password, notifications, danger zone); Back closes it.
class ProfileState extends StatefulWidget {
  const ProfileState({super.key});
  @override
  State<ProfileState> createState() => ProfilePage();
}

class ProfilePage extends State<ProfileState> {
  TextEditingController firstNameController = TextEditingController();
  TextEditingController lastNameController = TextEditingController();
  TextEditingController phoneController = TextEditingController();
  TextEditingController currentPasswordController = TextEditingController();
  TextEditingController newPasswordController = TextEditingController();
  TextEditingController confirmController = TextEditingController();
  final Map<String, FocusNode> focusNodes = {"firstName": FocusNode(), "lastName": FocusNode(), "phone": FocusNode()};

  String phoneCountry = "PH";
  Map<String, String?> errors = {};
  bool savingProfile = false;
  bool profileSaved = false;
  bool savingPassword = false;
  String savingPref = ""; // notification switch being saved
  ProfileSection? section; // open sub-screen, or null for the main list

  @override
  void initState() {
    super.initState();
    fillForm(Activesession.user);
    // Refresh from the server in case the profile changed on the website.
    Api.get("/users/me").then((data) {
      Activesession.user = Map<String, dynamic>.from(data["user"]);
      if (mounted) setState(() => fillForm(Activesession.user));
    }).catchError((_) {});
  }

  void fillForm(Map<String, dynamic> user) {
    final (first, last) = splitUserName(user);
    firstNameController.text = first;
    lastNameController.text = last;
    phoneController.text = user["phone"] ?? "";
    final country = (user["phoneCountry"] ?? "").toString();
    phoneCountry = phoneCountries.any((c) => c[0] == country) ? country : "PH";
  }

  @override
  void dispose() {
    for (final controller in [
      firstNameController,
      lastNameController,
      phoneController,
      currentPasswordController,
      newPasswordController,
      confirmController,
    ]) {
      controller.dispose();
    }
    for (final node in focusNodes.values) {
      node.dispose();
    }
    super.dispose();
  }

  // Opens a sub-screen, optionally focusing a field once it is built.
  void open(ProfileSection target, {String? focus}) {
    setState(() => section = target);
    if (focus != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) focusNodes[focus]?.requestFocus();
      });
    }
  }

  void closeSection() {
    FocusScope.of(context).unfocus();
    setState(() => section = null);
  }

  Future<void> saveProfile() async {
    final newErrors = {
      "firstName": validateName(firstNameController.text, "First name"),
      "lastName": validateName(lastNameController.text, "Last name"),
      "phone": validatePhone(phoneController.text),
    };
    setState(() => errors = newErrors);
    if (newErrors.values.any((message) => message != null)) return;

    setState(() => savingProfile = true);
    try {
      final data = await Api.put("/users/me", {
        "firstName": firstNameController.text.trim(),
        "lastName": lastNameController.text.trim(),
        "phone": phoneController.text.trim(),
        "phoneCountry": phoneCountry,
      });
      Activesession.user = Map<String, dynamic>.from(data["user"]);
      if (mounted) {
        setState(() => profileSaved = true);
        showMessage(context, "Profile saved.");
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted) setState(() => profileSaved = false);
        });
      }
    } on ApiException catch (e) {
      setState(() => errors = {...errors, ...e.fieldErrors});
      if (mounted) showMessage(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => savingProfile = false);
    }
  }

  Future<void> changePassword() async {
    final newErrors = {
      "currentPassword": currentPasswordController.text.isEmpty ? "Enter your current password." : null,
      "newPassword": validatePassword(newPasswordController.text),
      "confirm": confirmController.text != newPasswordController.text ? "Passwords do not match." : null,
    };
    setState(() => errors = newErrors);
    if (newErrors.values.any((message) => message != null)) return;

    setState(() => savingPassword = true);
    try {
      final data = await Api.put("/users/me", {
        "currentPassword": currentPasswordController.text,
        "newPassword": newPasswordController.text,
      });
      // Older sessions are signed out; keep this one with the new token.
      Activesession.start(data["token"], Map<String, dynamic>.from(data["user"]));
      currentPasswordController.clear();
      newPasswordController.clear();
      confirmController.clear();
      if (mounted) showMessage(context, "Password changed. Other devices were signed out.");
    } on ApiException catch (e) {
      setState(() => errors = {...errors, ...e.fieldErrors});
      if (mounted) showMessage(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => savingPassword = false);
    }
  }

  // Email preference switch: flip right away, save, roll back if the server says no.
  Future<void> togglePref(String key, bool value) async {
    final previous = Activesession.user;
    setState(() {
      savingPref = key;
      Activesession.user = {...previous, "notificationPrefs": {...notificationPrefsOf(previous), key: value}};
    });
    try {
      final data = await Api.put("/users/me", {key: value});
      Activesession.user = Map<String, dynamic>.from(data["user"]);
      if (mounted) showMessage(context, value ? "Turned on." : "Turned off.");
    } on ApiException catch (e) {
      if (Activesession.isLoggedIn) Activesession.user = previous;
      if (mounted) showMessage(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => savingPref = "");
    }
  }

  Widget field(
    String key,
    String label,
    TextEditingController controller, {
    bool password = false,
    TextInputType? type,
    Widget? suffix,
    ValueChanged<String>? onChanged,
    TextInputAction? action,
  }) {
    return TextField(
      controller: controller,
      focusNode: focusNodes[key],
      obscureText: password,
      keyboardType: type,
      textInputAction: action,
      onChanged: onChanged,
      style: const TextStyle(fontSize: 16),
      decoration: InputDecoration(labelText: label, errorText: errors[key], suffixIcon: suffix, errorMaxLines: 3),
    );
  }

  // Green tick once a typed phone number looks valid.
  Widget? phoneCheck() {
    final ok = phoneController.text.trim().isNotEmpty && validatePhone(phoneController.text) == null;
    return AnimatedSwitcher(
      duration: reduceMotion(context) ? Duration.zero : const Duration(milliseconds: 200),
      transitionBuilder: (child, animation) => ScaleTransition(scale: animation, child: child),
      child: ok
          ? Icon(Icons.check_circle, key: const ValueKey("ok"), color: AppColors.of(context).successText, size: 20)
          : const SizedBox.shrink(key: ValueKey("none")),
    );
  }

  // "Save changes" -> spinner while saving -> "Saved" tick for a moment.
  Widget saveLabel() {
    final c = AppColors.of(context);
    final Widget content = savingProfile
        ? Row(
            key: const ValueKey("saving"),
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: c.muted)),
              const SizedBox(width: 10),
              const Text("Saving..."),
            ],
          )
        : profileSaved
            ? const Row(
                key: ValueKey("saved"),
                mainAxisSize: MainAxisSize.min,
                children: [Icon(Icons.check_rounded, size: 18), SizedBox(width: 6), Text("Saved")],
              )
            : const Text("Save changes", key: ValueKey("idle"));
    return AnimatedSwitcher(
      duration: reduceMotion(context) ? Duration.zero : const Duration(milliseconds: 220),
      transitionBuilder: (child, animation) => FadeTransition(
        opacity: animation,
        child: SlideTransition(position: Tween(begin: const Offset(0, 0.4), end: Offset.zero).animate(animation), child: child),
      ),
      child: content,
    );
  }

  // ---------- Main view ----------

  Widget mainView() {
    final c = AppColors.of(context);
    final user = Activesession.user;
    final staff = Activesession.isStaff;
    final (percent, next) = profileCompleteness(user);
    final name = (user["name"] ?? "${firstNameController.text} ${lastNameController.text}").toString().trim();
    final email = (user["email"] ?? "").toString();

    Widget navRow(ProfileSection target, IconData icon, {String? value, bool danger = false}) => SettingsRow(
          icon: icon,
          label: profileSectionTitles[target]!,
          value: value,
          danger: danger,
          onTap: () => open(target),
        );

    final rows = <Widget>[
      navRow(ProfileSection.personal, Icons.person_outline_rounded),
      navRow(ProfileSection.email, Icons.mail_outline_rounded, value: email),
      navRow(ProfileSection.security, Icons.lock_outline_rounded),
      if (!staff) navRow(ProfileSection.notifications, Icons.notifications_none_rounded),
      const DarkModeRow(),
      if (!staff) navRow(ProfileSection.danger, Icons.delete_outline_rounded, danger: true),
    ];

    return ListView(
      key: const ValueKey("main"),
      padding: EdgeInsets.only(bottom: tabBarSpace(context)),
      children: [
        ProfileHeader(name: name, onEdit: () => open(ProfileSection.personal)),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 12),
              Semantics(
                header: true,
                child: Text(
                  name.isEmpty ? "Your profile" : name,
                  style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, letterSpacing: -0.8, height: 1.15, color: c.text),
                ),
              ),
              if (email.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(email, style: TextStyle(fontSize: 15, color: c.muted)),
              ],
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  SoftChip(roleLabels[user["role"]] ?? "Client"),
                  if (user["isVerified"] == true) const SoftChip("Email verified", tone: ChipTone.success, check: true),
                ],
              ),
              const SizedBox(height: 20),
              FadeSlideIn(
                child: CompletenessCard(
                  percent: percent,
                  next: next,
                  onHint: (hint) => open(hint.section, focus: hint.focus),
                ),
              ),
              const SizedBox(height: 16),
              FadeSlideIn(
                delay: const Duration(milliseconds: 60),
                child: FrostedCard(
                  padding: EdgeInsets.zero,
                  child: Column(
                    children: [
                      for (final (index, row) in rows.indexed) ...[
                        if (index > 0) const Divider(height: 1),
                        row,
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              TextButton.icon(
                onPressed: () => logout(context),
                style: TextButton.styleFrom(foregroundColor: c.danger, minimumSize: const Size.fromHeight(48)),
                icon: const Icon(Icons.logout_rounded),
                label: const Text("Log out", style: TextStyle(fontWeight: FontWeight.w700)),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ---------- Sub-screens ----------

  Widget personalInfo() {
    return FrostedCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: 16,
        children: [
          const SectionHeading("Personal details"),
          field("firstName", "First name", firstNameController, action: TextInputAction.next),
          field("lastName", "Last name", lastNameController, action: TextInputAction.next),
          DropdownButtonFormField<String>(
            initialValue: phoneCountry,
            isExpanded: true,
            style: TextStyle(fontSize: 16, color: AppColors.of(context).text),
            decoration: const InputDecoration(labelText: "Country"),
            items: [
              for (final country in phoneCountries)
                DropdownMenuItem(value: country[0], child: Text(country[1], overflow: TextOverflow.ellipsis)),
            ],
            onChanged: (value) => setState(() => phoneCountry = value ?? "PH"),
          ),
          field(
            "phone",
            "Phone (optional)",
            phoneController,
            type: TextInputType.phone,
            suffix: phoneCheck(),
            onChanged: (_) => setState(() {}),
            action: TextInputAction.done,
          ),
          const SizedBox(height: 4),
          FilledButton(
            onPressed: savingProfile ? null : saveProfile,
            style: profileSaved
                ? FilledButton.styleFrom(backgroundColor: AppColors.of(context).successText, foregroundColor: AppColors.of(context).page)
                : null,
            child: saveLabel(),
          ),
        ],
      ),
    );
  }

  Widget emailInfo() {
    final c = AppColors.of(context);
    final user = Activesession.user;
    final verified = user["isVerified"] == true;
    return FrostedCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: 16,
        children: [
          SectionHeading(
            "Email address",
            action: verified
                ? const SoftChip("Verified", tone: ChipTone.success, check: true)
                : const SoftChip("Not verified", tone: ChipTone.pending),
          ),
          TextFormField(
            enabled: false,
            initialValue: user["email"] ?? "",
            style: TextStyle(fontSize: 16, color: c.text),
            decoration: InputDecoration(
              labelText: "Email",
              fillColor: c.page,
              suffixIcon: Icon(Icons.lock_outline, size: 18, color: c.muted),
              helperText: Activesession.isStaff ? "Ask the clinic admin to change your email." : "Change your email on the CliniQuick website.",
              helperMaxLines: 2,
            ),
          ),
        ],
      ),
    );
  }

  Widget security() {
    return FrostedCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: 16,
        children: [
          const SectionHeading("Change password", subtitle: "Changing it signs you out on your other devices."),
          field("currentPassword", "Current password", currentPasswordController, password: true, action: TextInputAction.next),
          field("newPassword", "New password", newPasswordController, password: true, action: TextInputAction.next),
          field("confirm", "Confirm new password", confirmController, password: true, action: TextInputAction.done),
          const SizedBox(height: 4),
          FilledButton(
            onPressed: savingPassword ? null : changePassword,
            child: Text(savingPassword ? "Saving..." : "Change password"),
          ),
        ],
      ),
    );
  }

  Widget subScreen(ProfileSection current) {
    final content = switch (current) {
      ProfileSection.personal => personalInfo(),
      ProfileSection.email => emailInfo(),
      ProfileSection.security => security(),
      ProfileSection.notifications => NotificationsCard(
          prefs: notificationPrefsOf(Activesession.user),
          saving: savingPref,
          onChanged: togglePref,
        ),
      ProfileSection.danger => const DangerZoneCard(),
    };
    return Column(
      key: ValueKey(current),
      children: [
        SubScreenTopBar(title: profileSectionTitles[current]!, onBack: closeSection),
        Expanded(
          child: ListView(
            padding: EdgeInsets.fromLTRB(16, 8, 16, 24 + MediaQuery.paddingOf(context).bottom),
            keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
            children: [content],
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final current = section;
    // Android back closes an open sub-screen before leaving Profile.
    return PopScope(
      canPop: current == null,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop && section != null) closeSection();
      },
      child: AppScaffold(
        tab: AppTab.profile,
        showTabBar: current == null,
        body: AnimatedSwitcher(
          duration: reduceMotion(context) ? Duration.zero : const Duration(milliseconds: 220),
          switchInCurve: Curves.easeOutCubic,
          switchOutCurve: Curves.easeInCubic,
          transitionBuilder: (child, animation) => FadeTransition(
            opacity: animation,
            child: SlideTransition(
              position: Tween(begin: const Offset(0.04, 0), end: Offset.zero).animate(animation),
              child: child,
            ),
          ),
          child: current == null ? mainView() : subScreen(current),
        ),
      ),
    );
  }
}
