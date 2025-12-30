import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

const _primaryColor = Color(0xFF42A5F5);
const _accentColor = Color(0xFF1B56FD);
const _dangerColor = Color(0xFFE53935);
const _backgroundColor = Color(0xFFF5F7FB);

const _defaultPusatName = 'Pusat Kesihatan Universiti';
const _defaultSecurityName = 'Bahagian Keselamatan UTM';

class EmergencyScreen extends StatefulWidget {
  const EmergencyScreen({super.key});

  @override
  State<EmergencyScreen> createState() => _EmergencyScreenState();
}

class _EmergencyScreenState extends State<EmergencyScreen>
    with SingleTickerProviderStateMixin {
  late Future<_EmergencyContacts> _contactsFuture;
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _contactsFuture = _fetchContacts();

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  Future<_EmergencyContacts> _fetchContacts() async {
    try {
      final col = FirebaseFirestore.instance.collection('contact_list');
      final results = await Future.wait([
        col.doc('PKU').get(),
        col.doc('Security').get(),
      ]);

      return _EmergencyContacts(
        pusatName: (results[0].data()?['name'] as String?)?.trim(),
        pusatPhone: (results[0].data()?['phone'] as String?)?.trim(),
        securityName: (results[1].data()?['name'] as String?)?.trim(),
        securityPhone: (results[1].data()?['phone'] as String?)?.trim(),
      );
    } catch (_) {
      return const _EmergencyContacts();
    }
  }

  Future<void> _handleCallRequest({
    required String label,
    required String? phoneNumber,
  }) async {
    if (phoneNumber == null || phoneNumber.isEmpty) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Phone number for $label is not available')),
      );
      return;
    }

    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Confirm Call'),
        content: Text('Do you want to call $label now?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Call'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    final uri = Uri(scheme: 'tel', path: phoneNumber);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _backgroundColor,
      body: SafeArea(
        child: FutureBuilder<_EmergencyContacts>(
          future: _contactsFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }

            final contacts = snapshot.data ?? const _EmergencyContacts();

            return Column(
              children: [
                // 🚨 HEADER
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.fromLTRB(24, 30, 24, 36),
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [_dangerColor, Color(0xFFB71C1C)],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
                    borderRadius:
                        BorderRadius.vertical(bottom: Radius.circular(32)),
                  ),
                  child: Column(
                    children: const [
                      Icon(Icons.warning_amber_rounded,
                          size: 54, color: Colors.white),
                      SizedBox(height: 10),
                      Text(
                        'Emergency',
                        style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      SizedBox(height: 6),
                      Text(
                        'Get help immediately',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 14.5,
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                // 🆘 SOS BUTTON
                AnimatedBuilder(
                  animation: _pulseController,
                  builder: (_, __) {
                    final scale = 1 + (_pulseController.value * 0.06);
                    return Transform.scale(
                      scale: scale,
                      child: Container(
                        width: 150,
                        height: 150,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: const LinearGradient(
                            colors: [_dangerColor, Color(0xFFD32F2F)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: _dangerColor.withOpacity(0.35),
                              blurRadius: 28,
                              spreadRadius: 6,
                            ),
                          ],
                        ),
                        child: const Center(
                          child: Text(
                            'SOS',
                            style: TextStyle(
                              fontSize: 42,
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                              letterSpacing: 3,
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),

                const SizedBox(height: 22),

                // 📞 CONTACTS
                Expanded(
                  child: ListView(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                    children: [
                      _FancyContactCard(
                        title: contacts.pusatName,
                        icon: Icons.local_hospital,
                        phone: contacts.pusatPhone,
                        color: _primaryColor,
                        onTap: () => _handleCallRequest(
                          label: contacts.pusatName,
                          phoneNumber: contacts.pusatPhone,
                        ),
                      ),
                      const SizedBox(height: 18),
                      _FancyContactCard(
                        title: contacts.securityName,
                        icon: Icons.shield,
                        phone: contacts.securityPhone,
                        color: _accentColor,
                        onTap: () => _handleCallRequest(
                          label: contacts.securityName,
                          phoneNumber: contacts.securityPhone,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _FancyContactCard extends StatelessWidget {
  const _FancyContactCard({
    required this.title,
    required this.icon,
    required this.phone,
    required this.color,
    required this.onTap,
  });

  final String title;
  final IconData icon;
  final String? phone;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 24,
            offset: const Offset(0, 14),
          ),
        ],
      ),
      padding: const EdgeInsets.fromLTRB(22, 20, 22, 22),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 22,
                backgroundColor: color.withOpacity(0.12),
                child: Icon(icon, color: color),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16.5,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            phone?.isNotEmpty == true ? phone! : 'Phone not available',
            style: TextStyle(
              fontSize: 14.5,
              fontWeight: FontWeight.w600,
              color: phone?.isNotEmpty == true
                  ? Colors.grey[800]
                  : Colors.grey[400],
            ),
          ),
          const SizedBox(height: 18),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: onTap,
              icon: const Icon(Icons.call, size: 18),
              label: const Text(
                'Call Now',
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
              style: FilledButton.styleFrom(
                backgroundColor: color,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _EmergencyContacts {
  const _EmergencyContacts({
    String? pusatName,
    this.pusatPhone,
    String? securityName,
    this.securityPhone,
  })  : pusatName = pusatName ?? _defaultPusatName,
        securityName = securityName ?? _defaultSecurityName;

  final String pusatName;
  final String? pusatPhone;
  final String securityName;
  final String? securityPhone;
}
