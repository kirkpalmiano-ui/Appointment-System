import 'dart:async';

import 'package:flutter/material.dart';

// "Resend code" button that stays locked while a countdown runs.
// `onResend` returns the number of seconds to wait before the next resend.
class ResendButton extends StatefulWidget {
  final Future<int> Function() onResend;
  final int startSeconds;

  const ResendButton({super.key, required this.onResend, this.startSeconds = 60});

  @override
  State<ResendButton> createState() => ResendButtonPage();
}

class ResendButtonPage extends State<ResendButton> {
  int secondsLeft = 0;
  bool sending = false;
  Timer? timer;

  @override
  void initState() {
    super.initState();
    startCountdown(widget.startSeconds);
  }

  @override
  void dispose() {
    timer?.cancel();
    super.dispose();
  }

  void startCountdown(int seconds) {
    timer?.cancel();
    setState(() => secondsLeft = seconds);
    timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) return;
      setState(() => secondsLeft--);
      if (secondsLeft <= 0) t.cancel();
    });
  }

  Future<void> resend() async {
    setState(() => sending = true);
    final wait = await widget.onResend();
    if (!mounted) return;
    setState(() => sending = false);
    if (wait > 0) startCountdown(wait);
  }

  @override
  Widget build(BuildContext context) {
    if (secondsLeft > 0) {
      final minutes = secondsLeft ~/ 60;
      final seconds = (secondsLeft % 60).toString().padLeft(2, "0");
      return Text("Resend code in $minutes:$seconds", textAlign: TextAlign.center, style: const TextStyle(color: Colors.black54));
    }
    return TextButton(onPressed: sending ? null : resend, child: Text(sending ? "Sending..." : "Resend code"));
  }
}
