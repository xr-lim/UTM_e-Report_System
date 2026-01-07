import 'dart:ui';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

// Theme colors (keeps existing functionality intact)
const _primaryColor = Color(0xFF0118D8);
const _accentColor = Color(0xFF1B56FD);
const _backgroundColor = Color(0xFFF6F7FB);

class FeedbackScreen extends StatefulWidget {
  const FeedbackScreen({super.key});

  @override
  State<FeedbackScreen> createState() => _FeedbackScreenState();
}

class _FeedbackScreenState extends State<FeedbackScreen> {
  final _formKey = GlobalKey<FormState>();
  final _subjectController = TextEditingController();
  final _messageController = TextEditingController();

  String _selectedType = _feedbackTypes.first;
  bool _isSubmitting = false;
  int _rating = 5; // 1..5 where 5 is best

  static const List<String> _feedbackTypes = [
    'General Feedback',
    'Bug Report',
    'Feature Request',
    'Other',
  ];

  @override
  void dispose() {
    _subjectController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _submitFeedback() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() => _isSubmitting = true);

    final user = FirebaseAuth.instance.currentUser;
    final userRef = user != null
        ? FirebaseFirestore.instance.collection('users').doc(user.uid)
        : null;

    final payload = {
      'subject': _subjectController.text.trim(),
      'type': _selectedType,
      'rating': _rating,
      'message': _messageController.text.trim(),
      'userRef': userRef,
      'userEmail': user?.email,
      'createdAt': FieldValue.serverTimestamp(),
    };

    try {
      await FirebaseFirestore.instance.collection('feedback').add(payload);
      if (!mounted) return;

      _subjectController.clear();
      _messageController.clear();
      setState(() => _selectedType = _feedbackTypes.first);

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Thank you! Your feedback has been sent.'),
        ),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to submit feedback. Please try again. $error'),
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Modern, widely-used layout: gradient header + glass form card
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Stack(
        children: [
          // Gradient background (uses the project's theme colors)
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFFFFFFFF),
                  Color(0xFF1B56FD),
                  Color(0xFF0118D8),
                ],
              ),
            ),
          ),
          // Slight blur to soften background
          BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
            child: Container(color: Colors.transparent),
          ),

          SafeArea(
            child: Column(
              children: [
                // Header area
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.12),
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: Colors.white.withOpacity(0.18),
                          ),
                        ),
                        child: const Icon(
                          Icons.feedback_outlined,
                          color: Colors.white,
                          size: 26,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: const [
                            Text(
                              'Send Feedback',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 20,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            SizedBox(height: 4),
                            Text(
                              'Help us improve UTM by sharing your thoughts.',
                              style: TextStyle(
                                color: Colors.white70,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 10),

                // Main content: glass card
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(20),
                      child: BackdropFilter(
                        filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.92),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: Colors.white.withOpacity(0.14),
                            ),
                          ),
                          child: Form(
                            key: _formKey,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Rating row (emoji style)
                                const Text(
                                  'How would you rate your experience?',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(height: 10),
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: List.generate(5, (i) {
                                    const emojis = [
                                      '😡',
                                      '😕',
                                      '😐',
                                      '🙂',
                                      '😍',
                                    ];
                                    const labels = [
                                      'Terrible',
                                      'Bad',
                                      'Okay',
                                      'Good',
                                      'Excellent',
                                    ];
                                    final selected = _rating == i + 1;
                                    return GestureDetector(
                                      onTap:
                                          () => setState(() => _rating = i + 1),
                                      child: Column(
                                        children: [
                                          Container(
                                            width: 48,
                                            height: 48,
                                            decoration: BoxDecoration(
                                              color:
                                                  selected
                                                      ? _accentColor
                                                          .withOpacity(0.12)
                                                      : Colors.white,
                                              shape: BoxShape.circle,
                                              border: Border.all(
                                                color:
                                                    selected
                                                        ? _accentColor
                                                        : Colors.grey
                                                            .withOpacity(0.2),
                                                width: selected ? 2.2 : 1,
                                              ),
                                            ),
                                            child: Center(
                                              child: Text(
                                                emojis[i],
                                                style: const TextStyle(
                                                  fontSize: 20,
                                                ),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    );
                                  }),
                                ),
                                const SizedBox(height: 8),
                                Center(
                                  child: Text(
                                    [
                                      'Terrible',
                                      'Bad',
                                      'Okay',
                                      'Good',
                                      'Excellent',
                                    ][_rating - 1],
                                    style: TextStyle(
                                      color: _primaryColor,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 12),
                                DropdownButtonFormField<String>(
                                  value: _selectedType,
                                  decoration: _inputDecoration('Feedback Type'),
                                  items:
                                      _feedbackTypes
                                          .map(
                                            (item) => DropdownMenuItem(
                                              value: item,
                                              child: Text(item),
                                            ),
                                          )
                                          .toList(),
                                  onChanged: (value) {
                                    if (value != null)
                                      setState(() => _selectedType = value);
                                  },
                                ),
                                const SizedBox(height: 12),
                                TextFormField(
                                  controller: _subjectController,
                                  decoration: _inputDecoration('Subject'),
                                  textInputAction: TextInputAction.next,
                                  validator: (value) {
                                    if (value == null || value.trim().isEmpty)
                                      return 'Please enter a subject.';
                                    return null;
                                  },
                                ),
                                const SizedBox(height: 12),
                                TextFormField(
                                  controller: _messageController,
                                  decoration: _inputDecoration('Message'),
                                  maxLines: 6,
                                  validator: (value) {
                                    if (value == null || value.trim().isEmpty)
                                      return 'Please share your feedback.';
                                    if (value.trim().length < 20)
                                      return 'Feedback should be at least 20 characters.';
                                    return null;
                                  },
                                ),
                                const SizedBox(height: 18),
                                SizedBox(
                                  width: double.infinity,
                                  child: FilledButton.icon(
                                    onPressed:
                                        _isSubmitting ? null : _submitFeedback,
                                    style: FilledButton.styleFrom(
                                      backgroundColor: _accentColor,
                                      foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(
                                        vertical: 14,
                                        horizontal: 20,
                                      ),
                                      textStyle: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w700,
                                      ),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(16),
                                      ),
                                    ),
                                    icon:
                                        _isSubmitting
                                            ? const SizedBox(
                                              width: 20,
                                              height: 20,
                                              child: CircularProgressIndicator(
                                                strokeWidth: 2,
                                                valueColor:
                                                    AlwaysStoppedAnimation<
                                                      Color
                                                    >(Colors.white),
                                              ),
                                            )
                                            : const Icon(
                                              Icons.send_rounded,
                                              size: 20,
                                            ),
                                    label: Text(
                                      _isSubmitting ? 'Sending...' : 'Submit',
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  InputDecoration _inputDecoration(String label) {
    return InputDecoration(
      labelText: label,
      filled: true,
      fillColor: Colors.grey[50],
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: Colors.grey.shade300),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: Colors.grey.shade300),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: _primaryColor, width: 1.6),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
    );
  }
}
