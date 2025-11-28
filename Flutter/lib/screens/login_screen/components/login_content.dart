import 'dart:async';

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

  Future<void> signUserIn() async {
    final navigator = Navigator.of(context);

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) {
        return const Center(
          child: CircularProgressIndicator(),
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
          title: Text(title),
          content: Text(message),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: const Text('OK'),
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
      padding: const EdgeInsets.symmetric(horizontal: 36, vertical: 8),
      child: SizedBox(
        height: 50,
        child: Material(
          elevation: 8,
          shadowColor: Colors.black87,
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(30),
          child: TextField(
            controller: controller,
            textAlignVertical: TextAlignVertical.bottom,
            obscureText: obscureText,
            obscuringCharacter: '•',
            decoration: InputDecoration(
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(30),
                borderSide: BorderSide.none,
              ),
              filled: true,
              fillColor: Colors.white,
              hintText: hint,
              prefixIcon: Icon(iconData),
            ),
          ),
        ),
      ),
    );
  }

  Widget loginButton(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 135, vertical: 16),
      child: ElevatedButton(
        onPressed: () {
          signUserIn();
        },
        style: ElevatedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: const StadiumBorder(),
          backgroundColor: kSecondaryColor,
          elevation: 8,
          shadowColor: Colors.black87,
        ),
        child: Text(
          title,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  Widget signUpButton(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 135, vertical: 16),
      child: ElevatedButton(
        onPressed: () {
          signUserUp();
        },
        style: ElevatedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: const StadiumBorder(),
          backgroundColor: kSecondaryColor,
          elevation: 8,
          shadowColor: Colors.black87,
        ),
        child: Text(
          title,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
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
        return const Center(
          child: CircularProgressIndicator(),
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
            title: const Text('Email Verification Required'),
            content: const Text(
                'A verification link has been sent to your email address. Please check your inbox and verify your email before logging in.\n\nNote: You will be signed out until you verify your email.'),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(dialogContext).pop(),
                child: const Text('OK'),
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
      padding: const EdgeInsets.symmetric(horizontal: 130, vertical: 8),
      child: Row(
        children: [
          Flexible(
            child: Container(
              height: 1,
              color: kPrimaryColor,
            ),
          ),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              'or',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          Flexible(
            child: Container(
              height: 1,
              color: kPrimaryColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget logos() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
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
            child: Image.asset('assets/images/google.png'),
          ),
        ],
      ),
    );
  }

  Widget forgotPassword() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 110),
      child: TextButton(
        onPressed: _showForgotPasswordDialog,
        child: const Text(
          'Forgot Password?',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: kSecondaryColor,
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
          title: const Text('Reset password'),
          content: TextField(
            controller: controller,
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(
              labelText: 'Email',
              hintText: 'Enter your email address',
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: const Text('Cancel'),
            ),
            TextButton(
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
                    return const Center(
                      child: CircularProgressIndicator(),
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
              child: const Text('Send'),
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