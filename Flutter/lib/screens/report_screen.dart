import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:utm_report_system/screens/traffic_report_screen.dart';
import 'package:utm_report_system/screens/suspicious_report_screen.dart';

class ReportScreen extends StatelessWidget {
  const ReportScreen({super.key});

  void signUserOut() {
    FirebaseAuth.instance.signOut();
  }

  void _handleReportTap(BuildContext context, String type) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$type reporting coming soon'),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;

    final options = [
      _ReportOption(
        title: 'Report Traffic Incident',
        description:
            'Report traffic violations, accidents, or parking issues on campus.',
        assetPath: 'assets/images/car.png',
        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => TrafficReportScreen())),
      ),
      _ReportOption(
        title: 'Report Suspicious Activity',
        description:
            'Report any suspicious behavior, security concerns, or policy violations.',
        assetPath: 'assets/images/sus.png',
        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => SuspiciousReportScreen())),
      ),
    ];

    return Scaffold(
      backgroundColor: const Color(0xFFF6F7FB),
      appBar: AppBar(
        actions: [
          IconButton(
            onPressed: () {
              signUserOut();
            },
            icon: const Icon(Icons.logout),
            tooltip: 'Sign out',
          ),
        ],
        title: const Text('UTM Report System'),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: [
          if (user != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Text(
                'Logged in as ${user.email ?? 'Unknown email'}',
                style: Theme.of(context)
                    .textTheme
                    .bodyMedium
                    ?.copyWith(color: Colors.grey[700]),
              ),
            ),
          for (final option in options) ...[
            _ReportCard(option: option),
            const SizedBox(height: 20),
          ],
        ],
      ),
    );
  }
}

class _ReportOption {
  const _ReportOption({
    required this.title,
    required this.description,
    required this.assetPath,
    required this.onTap,
  });

  final String title;
  final String description;
  final String assetPath;
  final VoidCallback onTap;
}

class _ReportCard extends StatelessWidget {
  const _ReportCard({required this.option});

  final _ReportOption option;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: option.onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 12,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(18),
                topRight: Radius.circular(18),
              ),
              child: AspectRatio(
                aspectRatio: 16 / 9,
                child: Image.asset(
                  option.assetPath,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(
                    color: Colors.grey.shade200,
                    child: const Center(
                      child: Icon(
                        Icons.image_not_supported,
                        size: 48,
                        color: Colors.grey,
                      ),
                    ),
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    option.title,
                    style: Theme.of(context)
                        .textTheme
                        .titleMedium
                        ?.copyWith(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    option.description,
                    style: Theme.of(context)
                        .textTheme
                        .bodyMedium
                        ?.copyWith(color: Colors.grey[600]),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}