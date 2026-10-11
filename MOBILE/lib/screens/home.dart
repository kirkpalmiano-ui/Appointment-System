import 'package:flutter/material.dart';
import 'package:cliniquick/services/api.dart';
import 'package:cliniquick/tempstore/activesession.dart';
import 'package:cliniquick/widgets/appointment_card.dart';
import 'package:cliniquick/widgets/common.dart';

// Client dashboard: appointment counts and the next upcoming appointments.
class HomeState extends StatefulWidget {
  const HomeState({super.key});
  @override
  State<HomeState> createState() => HomePage();
}

class HomePage extends State<HomeState> {
  Map<String, dynamic> stats = {};
  List upcoming = [];
  bool loading = true;
  String error = "";

  @override
  void initState() {
    super.initState();
    loadData();
  }

  Future<void> loadData() async {
    setState(() => error = "");
    try {
      final results = await Future.wait([
        Api.get("/appointments/stats"),
        Api.get("/appointments", query: {"scope": "upcoming", "status": "active", "limit": "5"}),
      ]);
      setState(() {
        stats = Map<String, dynamic>.from(results[0]);
        upcoming = results[1]["items"];
      });
    } on ApiException catch (e) {
      setState(() => error = e.message);
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Widget statBox(String label, dynamic value, IconData icon, Color color) {
    return Expanded(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            children: [
              Icon(icon, color: color),
              const SizedBox(height: 4),
              Text("${value ?? 0}", style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
              Text(label, textAlign: TextAlign.center, style: const TextStyle(fontSize: 12, color: Colors.black54)),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final firstName = Activesession.user["firstName"] ?? Activesession.user["name"] ?? "";
    final byStatus = stats["byStatus"] ?? {};

    return Scaffold(
      appBar: AppBar(title: const Text("Dashboard")),
      drawer: const AppDrawer(),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.pushNamed(context, "/book").then((_) => loadData()),
        icon: const Icon(Icons.add),
        label: const Text("Book"),
      ),
      body: RefreshIndicator(
        onRefresh: loadData,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text("Hi, $firstName!", style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            const Text("Here's what's coming up.", style: TextStyle(color: Colors.black54)),
            const SizedBox(height: 16),
            if (error.isNotEmpty) errorBox(error),
            if (loading)
              const Padding(padding: EdgeInsets.all(40), child: Center(child: CircularProgressIndicator()))
            else ...[
              Row(
                children: [
                  statBox("Upcoming", stats["upcoming"], Icons.event, Colors.indigo),
                  statBox("Today", stats["today"], Icons.today, Colors.teal),
                ],
              ),
              Row(
                children: [
                  statBox("Pending", byStatus["pending"], Icons.hourglass_top, Colors.orange),
                  statBox("Completed", byStatus["completed"], Icons.check_circle, Colors.blueGrey),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  const Expanded(child: Text("Upcoming appointments", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold))),
                  TextButton(
                    onPressed: () => Navigator.pushReplacementNamed(context, "/appointments"),
                    child: const Text("View all"),
                  ),
                ],
              ),
              if (upcoming.isEmpty)
                emptyState(Icons.event_available, "No upcoming appointments", "Tap Book to schedule your next visit.")
              else
                for (final appointment in upcoming)
                  AppointmentCard(
                    appointment: Map<String, dynamic>.from(appointment),
                    onTap: () => Navigator.pushReplacementNamed(context, "/appointments"),
                  ),
              const SizedBox(height: 60),
            ],
          ],
        ),
      ),
    );
  }
}
