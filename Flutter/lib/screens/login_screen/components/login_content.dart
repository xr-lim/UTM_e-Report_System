

import 'dart:async';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:ionicons/ionicons.dart';
import 'package:utm_report_system/utils/helper_functions.dart';
import '../../../utils/constants.dart';
import '../animations/change_screen_animation.dart';
import 'bottom_text.dart';
import 'top_text.dart';
import '../../../services/auth_service.dart';
import 'package:firebase_auth/firebase_auth.dart';

enum Screens {
  createAccount,
  welcomeBack,
}

class LoginContent extends StatefulWidget {
  const LoginContent({Key? key}) : super(key: key);

  @override
  State<LoginContent> createState() => _LoginContentState();
}

class _LoginContentState extends State<LoginContent>
    with TickerProviderStateMixin {
  final TextEditingController _signUpEmailController = TextEditingController();
  final TextEditingController _signUpPasswordController = TextEditingController();
  final TextEditingController _signUpConfirmPasswordController =
      TextEditingController();
  final TextEditingController _loginEmailController = TextEditingController();
  final TextEditingController _loginPasswordController = TextEditingController();
  late final List<Widget> createAccountContent;
  late final List<Widget> loginContent;

  // Beautiful gradient colors matching the theme
  static const Color _gradientStart = Color(0xFF4A90E2);
  static const Color _gradientMid = Color(0xFF50C9C3);
  static const Color _gradientEnd = Color(0xFF5FB3D5);

  Future<void> signUserIn() async {
    final navigator = Navigator.of(context);

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) {
        return Center(
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.95),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: _gradientStart.withOpacity(0.3),
                  blurRadius: 30,
                  spreadRadius: 5,
                ),
              ],
            ),
            child: const CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(_gradientStart),
              strokeWidth: 3,
            ),
          ),
        );
      },
    );

    try {
      final userCredential = await FirebaseAuth.instance
          .signInWithEmailAndPassword(
        email: _loginEmailController.text.trim(),
        password: _loginPasswordController.text,
      );

      final isVerified = userCredential.user?.emailVerified ?? false;

      if (!isVerified) {
        navigator.pop();
        if (!mounted) return;

        await FirebaseAuth.instance.signOut();
        _showErrorDialog(
          'Email not verified',
          'Please verify your email before logging in. Check your inbox for the verification link.',
        );
        return;
      }

      navigator.pop();
      if (!mounted) return;
    } on FirebaseAuthException catch (e) {
      if (!mounted) return;

      navigator.pop();
      _handleAuthError(e);
    } catch (_) {
      if (!mounted) return;

      navigator.pop();
      _showErrorDialog('Login failed', 'Something went wrong. Please try again.');
    }
  }

  void _handleAuthError(FirebaseAuthException exception) {
    if (exception.code == 'invalid-credential') {
      _showErrorDialog('Incorrect email or password', 'Please double-check your email and password and try again.');
    } else {
      _showErrorDialog('Login failed', exception.message ?? 'Please try again.');
    }
  }

  void _showErrorDialog(String title, String message) {
    showDialog(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          title: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [_gradientStart, _gradientMid],
                  ),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Ionicons.alert_circle_outline,
                  color: Colors.white,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF2D3436),
                  ),
                ),
              ),
            ],
          ),
          content: Text(
            message,
            style: TextStyle(
              fontSize: 15,
              color: Colors.grey[700],
              height: 1.5,
            ),
          ),
          actions: [
            Container(
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [_gradientStart, _gradientMid],
                ),
                borderRadius: BorderRadius.circular(25),
              ),
              child: TextButton(
                onPressed: () => Navigator.of(dialogContext).pop(),
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
                ),
                child: const Text(
                  'OK',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }


  Widget inputField(
    String hint,
    IconData iconData, {
    TextEditingController? controller,
    bool obscureText = false,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 10),
      child: Container(
        height: 56,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: _gradientStart.withOpacity(0.15),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
            BoxShadow(
              color: Colors.white.withOpacity(0.8),
              blurRadius: 20,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Colors.white.withOpacity(0.9),
                    Colors.white.withOpacity(0.7),
                  ],
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: Colors.white.withOpacity(0.5),
                  width: 1.5,
                ),
              ),
              child: TextField(
                controller: controller,
                textAlignVertical: TextAlignVertical.center,
                obscureText: obscureText,
                obscuringCharacter: '•',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF2D3436),
                ),
                decoration: InputDecoration(
                  border: InputBorder.none,
                  hintText: hint,
                  hintStyle: TextStyle(
                    color: Colors.grey[400],
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                  ),
                  prefixIcon: Container(
                    margin: const EdgeInsets.only(left: 12, right: 8),
                    child: ShaderMask(
                      shaderCallback: (bounds) => const LinearGradient(
                        colors: [_gradientStart, _gradientMid],
                      ).createShader(bounds),
                      child: Icon(
                        iconData,
                        color: Colors.white,
                        size: 22,
                      ),
                    ),
                  ),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 18,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget loginButton(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 80, vertical: 20),
      child: Container(
        height: 56,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(28),
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [_gradientStart, _gradientMid, _gradientEnd],
          ),
          boxShadow: [
            BoxShadow(
              color: _gradientStart.withOpacity(0.4),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
            BoxShadow(
              color: _gradientMid.withOpacity(0.3),
              blurRadius: 30,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: signUserIn,
            borderRadius: BorderRadius.circular(28),
            splashColor: Colors.white.withOpacity(0.2),
            highlightColor: Colors.white.withOpacity(0.1),
            child: Center(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                      letterSpacing: 1.2,
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Icon(
                    Ionicons.arrow_forward,
                    color: Colors.white,
                    size: 20,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget signUpButton(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 80, vertical: 20),
      child: Container(
        height: 56,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(28),
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [_gradientStart, _gradientMid, _gradientEnd],
          ),
          boxShadow: [
            BoxShadow(
              color: _gradientStart.withOpacity(0.4),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
            BoxShadow(
              color: _gradientMid.withOpacity(0.3),
              blurRadius: 30,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: signUserUp,
            borderRadius: BorderRadius.circular(28),
            splashColor: Colors.white.withOpacity(0.2),
            highlightColor: Colors.white.withOpacity(0.1),
            child: Center(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                      letterSpacing: 1.2,
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Icon(
                    Ionicons.person_add_outline,
                    color: Colors.white,
                    size: 20,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Future<void> signUserUp() async {
    if (_signUpPasswordController.text !=
        _signUpConfirmPasswordController.text) {
      _showErrorDialog(
        'Passwords do not match',
        'Please make sure your password and confirmation match.',
      );
      return;
    }

    final navigator = Navigator.of(context);

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) {
        return Center(
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.95),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: _gradientStart.withOpacity(0.3),
                  blurRadius: 30,
                  spreadRadius: 5,
                ),
              ],
            ),
            child: const CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(_gradientStart),
              strokeWidth: 3,
            ),
          ),
        );
      },
    );

    try {
      final userCredential = await FirebaseAuth.instance
          .createUserWithEmailAndPassword(
        email: _signUpEmailController.text.trim(),
        password: _signUpPasswordController.text,
      );

      await AuthService().ensureUserDocument(userCredential.user);

      navigator.pop();
      if (!mounted) return;

      await userCredential.user?.sendEmailVerification();

      await FirebaseAuth.instance.signOut();
      if (!mounted) return;

      await showDialog(
        context: context,
        builder: (dialogContext) {
          return AlertDialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
            ),
            title: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [_gradientStart, _gradientMid],
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Ionicons.mail_outline,
                    color: Colors.white,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Text(
                    'Email Verification Required',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF2D3436),
                    ),
                  ),
                ),
              ],
            ),
            content: Text(
              'A verification link has been sent to your email address. Please check your inbox and verify your email before logging in.\n\nNote: You will be signed out until you verify your email.',
              style: TextStyle(
                fontSize: 15,
                color: Colors.grey[700],
                height: 1.5,
              ),
            ),
            actions: [
              Container(
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [_gradientStart, _gradientMid],
                  ),
                  borderRadius: BorderRadius.circular(25),
                ),
                child: TextButton(
                  onPressed: () => Navigator.of(dialogContext).pop(),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
                  ),
                  child: const Text(
                    'OK',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      );

      if (!mounted) return;
      ChangeScreenAnimation.currentScreen = Screens.welcomeBack;
      ChangeScreenAnimation.reverse();
    } on FirebaseAuthException catch (e) {
      navigator.pop();
      if (!mounted) return;
      _handleSignUpError(e);
    } catch (_) {
      navigator.pop();
      if (!mounted) return;
      _showErrorDialog('Sign up failed', 'Something went wrong. Please try again.');
    }
  }

  void _handleSignUpError(FirebaseAuthException exception) {
    switch (exception.code) {
      case 'email-already-in-use':
        _showErrorDialog('Email already in use', 'Try signing in or use another email.');
        break;
      case 'invalid-email':
        _showErrorDialog('Invalid email', 'Please enter a valid email address.');
        break;
      case 'weak-password':
        _showErrorDialog('Weak password', 'Please choose a stronger password.');
        break;
      case 'operation-not-allowed':
        _showErrorDialog('Sign up disabled', 'Email sign-up is currently unavailable.');
        break;
      default:
        _showErrorDialog('Sign up failed', exception.message ?? 'Please try again.');
    }
  }

  Widget orDivider() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 60, vertical: 16),
      child: Row(
        children: [
          Expanded(
            child: Container(
              height: 1.5,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.transparent,
                    _gradientStart.withOpacity(0.3),
                  ],
                ),
                borderRadius: BorderRadius.circular(1),
              ),
            ),
          ),
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 20),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  _gradientStart.withOpacity(0.1),
                  _gradientMid.withOpacity(0.1),
                ],
              ),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: _gradientStart.withOpacity(0.2),
                width: 1,
              ),
            ),
            child: const Text(
              'or continue with',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: Color(0xFF636E72),
                letterSpacing: 0.5,
              ),
            ),
          ),
          Expanded(
            child: Container(
              height: 1.5,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    _gradientMid.withOpacity(0.3),
                    Colors.transparent,
                  ],
                ),
                borderRadius: BorderRadius.circular(1),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget logos() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          GestureDetector(
            onTap: () async {
              try {
                final result = await AuthService().signInWithGoogle();
                if (result == null) {
                  _showErrorDialog(
                    'Sign-in cancelled',
                    'Google sign-in was cancelled by the user.',
                  );
                }
              } catch (error) {
                _showErrorDialog(
                  'Sign-in failed',
                  'Unable to sign in with Google. Please try again later.',
                );
              }
            },
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: _gradientStart.withOpacity(0.15),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                  BoxShadow(
                    color: Colors.white.withOpacity(0.8),
                    blurRadius: 10,
                    offset: const Offset(0, -2),
                  ),
                ],
                border: Border.all(
                  color: Colors.grey.withOpacity(0.1),
                  width: 1,
                ),
              ),
              child: Image.asset(
                'assets/images/google.png',
                width: 28,
                height: 28,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget forgotPassword() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 60, vertical: 8),
      child: TextButton(
        onPressed: _showForgotPasswordDialog,
        style: TextButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 12),
        ),
        child: ShaderMask(
          shaderCallback: (bounds) => const LinearGradient(
            colors: [Color.fromARGB(255, 79, 226, 74), Color.fromARGB(255, 80, 201, 130)],
          ).createShader(bounds),
          child: const Text(
            'Forgot Password?',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: Colors.white,
              letterSpacing: 0.5,
            ),
          ),
        ),
      ),
    );
  }

  void _showForgotPasswordDialog() {
    final controller = TextEditingController(text: _loginEmailController.text);

    showDialog(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          title: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [_gradientStart, _gradientMid],
                  ),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Ionicons.key_outline,
                  color: Colors.white,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              const Text(
                'Reset password',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF2D3436),
                ),
              ),
            ],
          ),
          content: TextField(
            controller: controller,
            keyboardType: TextInputType.emailAddress,
            decoration: InputDecoration(
              labelText: 'Email',
              hintText: 'Enter your email address',
              labelStyle: const TextStyle(color: _gradientStart),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: _gradientStart, width: 2),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: Colors.grey.shade300),
              ),
              prefixIcon: ShaderMask(
                shaderCallback: (bounds) => const LinearGradient(
                  colors: [_gradientStart, _gradientMid],
                ).createShader(bounds),
                child: const Icon(
                  Ionicons.mail_outline,
                  color: Colors.white,
                ),
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: Text(
                'Cancel',
                style: TextStyle(
                  color: Colors.grey[600],
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            Container(
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [_gradientStart, _gradientMid],
                ),
                borderRadius: BorderRadius.circular(25),
              ),
              child: TextButton(
                onPressed: () async {
                  final email = controller.text.trim();
                  if (email.isEmpty) {
                    _showErrorDialog('Email required', 'Please enter your email address.');
                    return;
                  }

                  Navigator.of(dialogContext).pop();

                  final navigator = Navigator.of(context);

                  showDialog(
                    context: context,
                    barrierDismissible: false,
                    builder: (loadingContext) {
                      return Center(
                        child: Container(
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.95),
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [
                              BoxShadow(
                                color: _gradientStart.withOpacity(0.3),
                                blurRadius: 30,
                                spreadRadius: 5,
                              ),
                            ],
                          ),
                          child: const CircularProgressIndicator(
                            valueColor: AlwaysStoppedAnimation<Color>(_gradientStart),
                            strokeWidth: 3,
                          ),
                        ),
                      );
                    },
                  );

                  try {
                    await FirebaseAuth.instance
                        .sendPasswordResetEmail(email: email)
                        .timeout(const Duration(seconds: 20));
                    navigator.pop();
                    if (!mounted) return;
                    _showErrorDialog(
                      'Reset email sent',
                      'We sent a password reset link to $email.',
                    );
                  } on TimeoutException {
                    navigator.pop();
                    if (!mounted) return;
                    _showErrorDialog(
                      'Request timed out',
                      'Unable to reach the server. Please check your internet connection or try again shortly.',
                    );
                  } on FirebaseAuthException catch (exception) {
                    navigator.pop();
                    if (!mounted) return;
                    _handleForgotPasswordError(exception);
                  } catch (_) {
                    navigator.pop();
                    if (!mounted) return;
                    _showErrorDialog('Request failed', 'Something went wrong. Please try again later.');
                  }
                },
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
                ),
                child: const Text(
                  'Send',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ],
        );
      },
    ).whenComplete(controller.dispose);
  }

  void _handleForgotPasswordError(FirebaseAuthException exception) {
    switch (exception.code) {
      case 'invalid-email':
        _showErrorDialog('Invalid email', 'Please enter a valid email address.');
        break;
      case 'user-not-found':
        _showErrorDialog('Email not found', 'We could not find an account for that email.');
        break;
      default:
        _showErrorDialog('Request failed', exception.message ?? 'Please try again later.');
    }
  }

  @override
  void initState() {
    createAccountContent = [
      inputField(
        'Email',
        Ionicons.mail_outline,
        controller: _signUpEmailController,
      ),
      inputField(
        'Password',
        Ionicons.lock_closed_outline,
        controller: _signUpPasswordController,
        obscureText: true,
      ),
      inputField(
        'Confirm Password',
        Ionicons.lock_closed_outline,
        controller: _signUpConfirmPasswordController,
        obscureText: true,
      ),
      signUpButton('Sign Up'),
    ];

    loginContent = [
      inputField(
        'Email',
        Ionicons.mail_outline,
        controller: _loginEmailController,
      ),
      inputField(
        'Password',
        Ionicons.lock_closed_outline,
        controller: _loginPasswordController,
        obscureText: true,
      ),
      loginButton('Log In'),
      orDivider(),
      logos(),
      forgotPassword(),
    ];

    ChangeScreenAnimation.initialize(
      vsync: this,
      createAccountItems: createAccountContent.length,
      loginItems: loginContent.length,
    );

    for (var i = 0; i < createAccountContent.length; i++) {
      createAccountContent[i] = HelperFunctions.wrapWithAnimatedBuilder(
        animation: ChangeScreenAnimation.createAccountAnimations[i],
        child: createAccountContent[i],
      );
    }

    for (var i = 0; i < loginContent.length; i++) {
      loginContent[i] = HelperFunctions.wrapWithAnimatedBuilder(
        animation: ChangeScreenAnimation.loginAnimations[i],
        child: loginContent[i],
      );
    }

    super.initState();
  }

  @override
  void dispose() {
    ChangeScreenAnimation.dispose();
    _signUpEmailController.dispose();
    _signUpPasswordController.dispose();
    _signUpConfirmPasswordController.dispose();
    _loginEmailController.dispose();
    _loginPasswordController.dispose();

    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        const Positioned(
          top: 136,
          left: 24,
          child: TopText(),
        ),
        Padding(
          padding: const EdgeInsets.only(top: 100),
          child: Stack(
            children: [
              Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: createAccountContent,
              ),
              Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: loginContent,
              ),
            ],
          ),
        ),
        const Align(
          alignment: Alignment.bottomCenter,
          child: Padding(
            padding: EdgeInsets.only(bottom: 50),
            child: BottomText(),
          ),
        ),
      ],
    );
  }
}