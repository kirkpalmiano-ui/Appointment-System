import 'package:flutter_test/flutter_test.dart';

import 'package:cliniquick/main.dart';

void main() {
  testWidgets('App opens on the login screen', (WidgetTester tester) async {
    await tester.pumpWidget(const MyApp());

    expect(find.text('CliniQuick'), findsOneWidget);
    expect(find.text('Log in'), findsOneWidget);
  });
}
