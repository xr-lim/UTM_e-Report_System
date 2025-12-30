import 'package:flutter/material.dart';
import 'package:google_nav_bar/google_nav_bar.dart';
import 'package:utm_report_system/screens/report_screen.dart';
import 'package:utm_report_system/screens/emergency_screen.dart';
import 'package:utm_report_system/screens/status_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;

  final List<Widget> _pages = [
    const ReportScreen(),
    const EmergencyScreen(),
    const StatusScreen(),
    const ReportScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _pages[_selectedIndex],
      bottomNavigationBar: Container(
        color: Colors.blue[50],
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 15.0, vertical: 20),
          child: GNav(
            backgroundColor: Colors.blue[50] ?? Colors.blue,
            activeColor: Colors.white,
            tabBackgroundColor: Colors.blue[150] ?? Colors.blue,
            gap: 8,
            iconSize: 24,
            padding: const EdgeInsets.all(14),
            tabs: const [
              GButton(
                icon: Icons.report,
                text: 'Report'
              ),
              GButton(
                icon: Icons.shield,
                text: 'Emergency'
              ),
              GButton(
                icon: Icons.list_alt,
                text: 'Status'
              ),
              GButton(
                icon: Icons.feedback,
                text: 'Feedback'
              ),
            ],
            onTabChange: (index) {
              setState(() {
                _selectedIndex = index;
              });
            },
          ),
        ),
      ),
    );
  }
}