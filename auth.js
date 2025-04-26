import { auth } from './firebase.js';

// Common authentication functions
export function checkAuthState() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

export function redirectIfNotLoggedIn() {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = 'login.html';
    }
  });
}

export function redirectIfLoggedIn() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      window.location.href = 'dashboard.html';
    }
  });
}
// New User Sign-Up
async function signUp(email, password, referralCode = null) {
  try {
    // 1. Create Auth Account
    const userCred = await auth.createUserWithEmailAndPassword(email, password);
    
    // 2. Generate Referral Code
    const code = await setupUserReferral(userCred.user.uid);
    
    // 3. If came via referral, track referrer
    if (referralCode) {
      await trackReferral(userCred.user.uid, referralCode);
    }
    
    return { success: true, code: code };
    
  } catch (error) {
    return { error: error.message };
  }
}

// Track Referral Relationship
async function trackReferral(newUserId, referralCode) {
  // Find who referred this user
  const snapshot = await db.collection('users')
                          .where('referralCode', '==', referralCode)
                          .limit(1)
                          .get();

  if (!snapshot.empty) {
    const referrerId = snapshot.docs[0].id;
    
    // Update both users
    await db.collection('users').doc(newUserId).update({
      referredBy: referrerId
    });
    
    await db.collection('users').doc(referrerId).update({
      teamCount: firebase.firestore.FieldValue.increment(1)
    });
  }
}
