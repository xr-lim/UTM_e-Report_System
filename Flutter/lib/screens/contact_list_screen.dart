import 'package:characters/characters.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

const _primaryColor = Color(0xFF42A5F5);
const _accentColor = Color(0xFF1B56FD);
const _backgroundColor = Color(0xFFF6F7FB);

class ContactListScreen extends StatelessWidget {
  const ContactListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final contactsStream = FirebaseFirestore.instance.collection('contact_list').snapshots();
    return Scaffold(
      backgroundColor: _backgroundColor,
      appBar: AppBar(
        backgroundColor: _primaryColor,
        foregroundColor: Colors.white,
        title: const Text('Emergency Contacts'),
      ),
      body: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
        stream: contactsStream,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return const _ContactListError();
          }

          final docs = snapshot.data?.docs ?? [];

          if (docs.isEmpty) {
            return const _ContactListEmpty();
          }

          return ListView.builder(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 36),
            itemCount: docs.length,
            itemBuilder: (context, index) {
              final data = docs[index].data();
              final name = (data['name'] as String?)?.trim();
              final phone = (data['phone'] as String?)?.trim();

              final displayName =
                  name?.isNotEmpty == true ? name! : docs[index].id;

              return Padding(
                padding: const EdgeInsets.only(bottom: 18),
                child: _ContactCard(
                  title: displayName,
                  phoneNumber: phone,
                  docId: docs[index].id,
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class _ContactCard extends StatelessWidget {
  const _ContactCard({
    required this.title,
    required this.phoneNumber,
    required this.docId,
  });

  final String title;
  final String? phoneNumber;
  final String docId;

  @override
  Widget build(BuildContext context) {
    final phoneAvailable = phoneNumber?.isNotEmpty == true;
    final subtitle = phoneAvailable ? phoneNumber! : 'Phone number not available';

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            _primaryColor.withOpacity(0.12),
            _accentColor.withOpacity(0.12),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: _primaryColor.withOpacity(0.08),
            blurRadius: 18,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: _primaryColor.withOpacity(0.1),
                      blurRadius: 12,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                padding: const EdgeInsets.all(12),
                child: Text(
                  title.characters.first.toUpperCase(),
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: _primaryColor,
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF1F2937),
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: phoneAvailable
                                ? Colors.black87
                                : Colors.grey[600],
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Ref: $docId',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.grey[600],
                          ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
        ],
      ),
    );
  }
}

class _ContactListError extends StatelessWidget {
  const _ContactListError();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.wifi_off, size: 52, color: _primaryColor),
            const SizedBox(height: 16),
            Text(
              'Unable to load contacts right now.',
              textAlign: TextAlign.center,
              style: Theme.of(context)
                  .textTheme
                  .bodyMedium
                  ?.copyWith(color: Colors.grey[600]),
            ),
          ],
        ),
      ),
    );
  }
}

class _ContactListEmpty extends StatelessWidget {
  const _ContactListEmpty();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.contact_page, size: 52, color: _primaryColor),
            const SizedBox(height: 16),
            Text(
              'No contacts available yet.',
              textAlign: TextAlign.center,
              style: Theme.of(context)
                  .textTheme
                  .bodyMedium
                  ?.copyWith(color: Colors.grey[600]),
            ),
          ],
        ),
      ),
    );
  }
}