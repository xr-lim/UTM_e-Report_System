import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';

class AuthService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Google Sign In 
  Future<UserCredential?> signInWithGoogle() async {
    final googleSignIn = GoogleSignIn();

    // ensure the account picker shows by clearing any cached account
    await googleSignIn.signOut();

    // begin interactive sign-in process
    final GoogleSignInAccount? gUser = await googleSignIn.signIn();

    if (gUser == null) {
      return null;
    }

    // obtain auth details from request
    final GoogleSignInAuthentication gAuth = await gUser.authentication;

    // create a new credential for user
    final credential = GoogleAuthProvider.credential(
      accessToken: gAuth.accessToken,
      idToken: gAuth.idToken,
    );

    // finally, lets sign in
    final userCredential =
        await FirebaseAuth.instance.signInWithCredential(credential);

    await ensureUserDocument(userCredential.user);

    return userCredential;
  }

  Future<void> ensureUserDocument(User? user) async {
    if (user == null) return;

    final userDoc = _firestore.collection('users').doc(user.uid);
    final snapshot = await userDoc.get();

    if (snapshot.exists) return;

    final displayName = user.displayName?.trim();

    await userDoc.set({
      'created_at': FieldValue.serverTimestamp(),
      'email': user.email ?? '',
      'name': (displayName != null && displayName.isNotEmpty)
          ? displayName
          : 'Unknown',
      'role': 'student',
    });
  }
}

