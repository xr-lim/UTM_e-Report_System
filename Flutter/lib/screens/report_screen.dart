import 'package:flutter/material.dart';
import 'dart:ui';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:utm_report_system/screens/traffic_report_screen.dart';
import 'package:utm_report_system/screens/suspicious_report_screen.dart';

class ReportScreen extends StatelessWidget {
  const ReportScreen({super.key});

  static const _primaryColor = Color(0xFF0118D8);
  static const _accentColor = Color(0xFF1B56FD);
  static const _whiteColor = Color(0xFFFFFFFF);

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
        onTap:
            () => Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => TrafficReportScreen()),
            ),
      ),
      _ReportOption(
        title: 'Report Suspicious Activity',
        description:
            'Report any suspicious behavior, security concerns, or policy violations.',
        assetPath: 'assets/images/sus.png',
        onTap:
            () => Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => SuspiciousReportScreen()),
            ),
      ),
    ];

    return Scaffold(
      backgroundColor: Colors.transparent,
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: _primaryColor,
        elevation: 0,
        actions: [
          IconButton(
            onPressed: () {
              signUserOut();
            },
            icon: const Icon(Icons.logout, color: _whiteColor),
            tooltip: 'Sign out',
          ),
        ],
        title: const Text(
          'UTM Report System',
          style: TextStyle(color: _whiteColor, fontWeight: FontWeight.w600),
        ),
      ),
      body: Stack(
        children: [
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [_primaryColor, _accentColor, _primaryColor],
              ),
            ),
          ),
          SafeArea(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
              children: [
                if (user != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: Text(
                      'Logged in as ${user.email ?? 'Unknown email'}',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: _whiteColor.withOpacity(0.9),
                      ),
                    ),
                  ),
                for (final option in options) ...[
                  _ReportCard(option: option),
                  const SizedBox(height: 20),
                ],
              ],
            ),
          ),
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
      child: ClipRRect(
        borderRadius: BorderRadius.circular(18),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
          child: Container(
            decoration: BoxDecoration(
              color: const Color(0xFFFFFFFF).withOpacity(0.95),
              border: Border.all(
                color: const Color(0xFFFFFFFF).withOpacity(0.2),
              ),
              borderRadius: BorderRadius.circular(18),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 16,
                  offset: const Offset(0, 8),
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
                      errorBuilder:
                          (_, __, ___) => Container(
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
                        style: Theme.of(
                          context,
                        ).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF0118D8),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        option.description,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
