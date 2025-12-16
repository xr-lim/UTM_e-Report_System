import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

const _primaryColor = Color(0xFF42A5F5);
const _backgroundColor = Color(0xFFFFFFFF);
const _accentColor = Color(0xFF1B56FD);
const _defaultPusatName = 'Pusat Kesihatan Universiti';
const _defaultSecurityName = 'Bahagian Keselamatan UTM';

class EmergencyScreen extends StatefulWidget {
  const EmergencyScreen({super.key});

  @override
  State<EmergencyScreen> createState() => _EmergencyScreenState();
}

class _EmergencyScreenState extends State<EmergencyScreen> {
  late Future<_EmergencyContacts> _contactsFuture;

  @override
  void initState() {
    super.initState();
    _contactsFuture = _fetchContacts();
  }

  Future<_EmergencyContacts> _fetchContacts() async {
    try {
      final contactsCollection =
          FirebaseFirestore.instance.collection('contact_list');
      final results = await Future.wait([
        contactsCollection.doc('PKU').get(),
        contactsCollection.doc('Security').get(),
      ]);

      final pkuDoc = results[0];
      final securityDoc = results[1];

      final pkuData = pkuDoc.data();
      final securityData = securityDoc.data();

      debugPrint('PKU doc exists: ${pkuDoc.exists}, data: $pkuData');
      debugPrint('Security doc exists: ${securityDoc.exists}, data: $securityData');

      return _EmergencyContacts(
        pusatName: (pkuData?['name'] as String?)?.trim(),
        pusatPhone: (pkuData?['phone'] as String?)?.trim(),
        securityName: (securityData?['name'] as String?)?.trim(),
        securityPhone: (securityData?['phone'] as String?)?.trim(),
      );
    } catch (error) {
      debugPrint('Emergency contact fetch failed: $error');
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
        SnackBar(content: Text('Phone number for $label is not available yet.')),
      );
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Confirm Call'),
        content: Text('Do you want to call $label at $phoneNumber?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            style: TextButton.styleFrom(
              foregroundColor: _primaryColor,
            ),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            style: FilledButton.styleFrom(
              backgroundColor: _primaryColor,
              foregroundColor: Colors.white,
            ),
            child: const Text('Call'),
          ),
        ],
      ),
    );

    if (confirmed != true) {
      return;
    }

    final uri = Uri(scheme: 'tel', path: phoneNumber);
    if (!await canLaunchUrl(uri)) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Unable to initiate call to $phoneNumber.')),
      );
      return;
    }

    await launchUrl(uri);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _backgroundColor,
      appBar: AppBar(
        backgroundColor: _primaryColor,
        foregroundColor: Colors.white,
        title: const Text('Emergency Assistance'),
      ),
      body: FutureBuilder<_EmergencyContacts>(
        future: _contactsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return _EmergencyError(
              onRetry: () {
                setState(() {
                  _contactsFuture = _fetchContacts();
                });
              },
            );
          }

          final contacts = snapshot.data ?? const _EmergencyContacts();

          return ListView(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 32),
            children: [
              Text(
                'Reach out to UTM emergency contacts immediately.',
                style: Theme.of(context)
                    .textTheme
                    .bodyMedium
                    ?.copyWith(color: Colors.grey[600]),
              ),
              const SizedBox(height: 24),
              _EmergencyContactCard(
                title: contacts.pusatName,
                description:
                    'Medical emergencies and urgent healthcare support for campus community.',
                icon: Icons.local_hospital,
                phoneNumber: contacts.pusatPhone,
                onTap: () => _handleCallRequest(
                  label: contacts.pusatName,
                  phoneNumber: contacts.pusatPhone,
                ),
              ),
              const SizedBox(height: 16),
              _EmergencyContactCard(
                title: contacts.securityName,
                description:
                    'Security emergencies, incidents, and campus safety assistance.',
                icon: Icons.shield,
                phoneNumber: contacts.securityPhone,
                onTap: () => _handleCallRequest(
                  label: contacts.securityName,
                  phoneNumber: contacts.securityPhone,
                ),
              ),
            ],
          );
        },
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

class _EmergencyContactCard extends StatelessWidget {
  const _EmergencyContactCard({
    required this.title,
    required this.description,
    required this.icon,
    required this.phoneNumber,
    required this.onTap,
  });

  final String title;
  final String description;
  final IconData icon;
  final String? phoneNumber;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: _backgroundColor,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: _primaryColor.withOpacity(0.12),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: _primaryColor.withOpacity(0.08),
            blurRadius: 18,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 28,
            backgroundColor: _accentColor.withOpacity(0.16),
            child: Icon(
              icon,
              size: 28,
              color: _primaryColor,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            title,
            style: Theme.of(context)
                .textTheme
                .titleMedium
                ?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 8),
          Text(
            description,
            style: Theme.of(context)
                .textTheme
                .bodyMedium
                ?.copyWith(color: Colors.grey[600]),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Icon(
                Icons.phone,
                size: 20,
                color: Colors.grey[700],
              ),
              const SizedBox(width: 8),
              Text(
                phoneNumber?.isNotEmpty == true
                    ? phoneNumber!
                    : 'Phone number not available',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: phoneNumber?.isNotEmpty == true
                          ? Colors.black87
                          : Colors.grey[500],
                      fontWeight: FontWeight.w600,
                    ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: onTap,
              style: FilledButton.styleFrom(
                backgroundColor: _primaryColor,
                foregroundColor: Colors.white,
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                textStyle: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
              icon: const Icon(Icons.call),
              label: const Text('Call now'),
            ),
          ),
        ],
      ),
    );
  }
}

class _EmergencyError extends StatelessWidget {
  const _EmergencyError({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.wifi_off,
              size: 48,
              color: _primaryColor,
            ),
            const SizedBox(height: 16),
            Text(
              'We could not load emergency contacts.',
              textAlign: TextAlign.center,
              style: Theme.of(context)
                  .textTheme
                  .bodyMedium
                  ?.copyWith(color: Colors.grey[700]),
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: onRetry,
              style: FilledButton.styleFrom(
                backgroundColor: _accentColor,
                foregroundColor: Colors.white,
              ),
              child: const Text('Try again'),
            ),
          ],
        ),
      ),
    );
  }
}

