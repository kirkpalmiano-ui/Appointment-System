import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

import 'package:cliniquick/screens/login.dart';
import 'package:cliniquick/theme.dart';

Widget _app() => MaterialApp(theme: buildTheme(), home: const LoginState());

void main() {
  setUp(() {
    // A phone-sized screen so the layout matches what users see.
    final view = TestWidgetsFlutterBinding.instance.platformDispatcher.views.first;
    view.physicalSize = const Size(390 * 3, 844 * 3);
    view.devicePixelRatio = 3;
  });
  tearDown(() => TestWidgetsFlutterBinding.instance.platformDispatcher.views.first.reset());

  testWidgets('shows inline errors when submitting an empty form', (tester) async {
    await tester.pumpWidget(_app());

    await tester.tap(find.text('Log in'));
    await tester.pump();

    expect(find.text('Email is required.'), findsOneWidget);
    expect(find.text('Password is required.'), findsOneWidget);
  });

  testWidgets('fits a small phone at 1.3× text size, even with errors showing', (tester) async {
    final view = tester.view;
    view.physicalSize = const Size(360 * 2, 640 * 2);
    view.devicePixelRatio = 2;
    tester.platformDispatcher.textScaleFactorTestValue = 1.3;
    addTearDown(tester.platformDispatcher.clearTextScaleFactorTestValue);

    await tester.pumpWidget(_app());
    // On a 640px-tall screen the button sits below the fold: scroll to it like a user would.
    await tester.ensureVisible(find.text('Log in'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Log in'));
    await tester.pump();

    // A RenderFlex overflow would be reported as an exception here.
    expect(tester.takeException(), isNull);
    expect(find.text('Email is required.'), findsOneWidget);
    // The button is still reachable by scrolling.
    await tester.dragUntilVisible(find.text('Sign up'), find.byType(SingleChildScrollView), const Offset(0, -200));
    expect(find.text('Sign up'), findsOneWidget);
  });

  testWidgets('rejects a badly formed email', (tester) async {
    await tester.pumpWidget(_app());

    await tester.enterText(find.byType(TextField).at(0), 'not-an-email');
    await tester.enterText(find.byType(TextField).at(1), 'secret123');
    await tester.tap(find.text('Log in'));
    await tester.pump();

    expect(find.text('Enter a valid email, like name@example.com'), findsOneWidget);
    expect(find.text('Password is required.'), findsNothing);
  });

  testWidgets('shows the loading state, then the server error with the password cleared', (tester) async {
    final response = Completer<http.Response>();
    final client = MockClient((request) => response.future);

    await http.runWithClient(() async {
      await tester.pumpWidget(_app());
      await tester.enterText(find.byType(TextField).at(0), 'maria@example.com');
      await tester.enterText(find.byType(TextField).at(1), 'wrong-password');
      await tester.tap(find.text('Log in'));
      await tester.pump();

      // While the request runs: spinner + "Signing in…", fields disabled.
      expect(find.text('Signing in…'), findsOneWidget);
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      expect(tester.widget<TextField>(find.byType(TextField).at(0)).enabled, isFalse);

      response.complete(http.Response(jsonEncode({'message': 'Incorrect email or password'}), 401));
      await tester.pumpAndSettle();

      expect(find.text('Incorrect email or password'), findsOneWidget);
      // The cleared password must not also complain that it is empty.
      expect(find.text('Password is required.'), findsNothing);
      expect(find.text('Log in'), findsOneWidget);
      // Email kept, password cleared.
      expect(tester.widget<TextField>(find.byType(TextField).at(0)).controller!.text, 'maria@example.com');
      expect(tester.widget<TextField>(find.byType(TextField).at(1)).controller!.text, isEmpty);
    }, () => client);
  });
}
