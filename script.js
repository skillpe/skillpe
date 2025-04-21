// ======================
// Firebase Configuration
// ======================
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();
  const storage = firebase.storage();
  
  // ======================
  // Helper Functions
  // ======================
  
  /**
   * Generates a unique referral code (format: REF12345)
   */
  function generateReferralCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = 'REF';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  /**
   * Finds user ID from referral code
   */
  async function getUserIdFromReferralCode(referralCode) {
    if (!referralCode || typeof referralCode !== 'string') {
      throw new Error('Invalid referral code format');
    }
  
    const snapshot = await db.collection('users')
      .where('referralCode', '==', referralCode)
      .limit(1)
      .get();
  
    if (snapshot.empty) {
      throw new Error('Referral code not found');
    }
  
    return snapshot.docs[0].id;
  }
  
  /**
   * Validates email format
   */
  function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }
  
  /**
   * Validates password strength
   */
  function isValidPassword(password) {
    return password.length >= 8;
  }
  
  // ======================
  // Core Functions
  // ======================
  
  /**
   * Registers a new user with referral system
   */
  async function registerUser(email, password, name, referralCode = null) {
    try {
      // Input validation
      if (!email || !password || !name) {
        throw new Error('All fields are required');
      }
      if (!isValidEmail(email)) {
        throw new Error('Invalid email format');
      }
      if (!isValidPassword(password)) {
        throw new Error('Password must be at least 8 characters');
      }
  
      // Create auth user
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const userId = userCredential.user.uid;
  
      // Generate unique referral code
      const refCode = generateReferralCode();
  
      // Prepare user data
      const userData = {
        email: email,
        name: name.trim(),
        referralCode: refCode,
        joinDate: firebase.firestore.FieldValue.serverTimestamp(),
        balance: 0,
        verified: false
      };
  
      // Add referredBy if valid referral code provided
      if (referralCode) {
        try {
          const referrerId = await getUserIdFromReferralCode(referralCode);
          userData.referredBy = referrerId;
        } catch (error) {
          console.warn('Invalid referral code:', error.message);
        }
      }
  
      // Save to Firestore
      await db.collection('users').doc(userId).set(userData);
  
      // Send verification email
      await userCredential.user.sendEmailVerification();
  
      return { success: true, userId, referralCode: refCode };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }
  
  /**
   * Logs in a user
   */
  async function loginUser(email, password) {
    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
  
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      
      // Check if email is verified
      if (!userCredential.user.emailVerified) {
        await auth.signOut();
        throw new Error('Please verify your email before logging in');
      }
  
      return { success: true, userId: userCredential.user.uid };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }
  
  /**
   * Checks if user has purchased any package
   */
  async function checkPackagePurchase(userId) {
    try {
      if (!userId) throw new Error('User ID is required');
  
      const snapshot = await db.collection('transactions')
        .where('userId', '==', userId)
        .where('status', '==', 'complete')
        .limit(1)
        .get();
  
      return !snapshot.empty;
    } catch (error) {
      console.error('Package check error:', error);
      throw error;
    }
  }
  
  /**
   * Gets user's referral link
   */
  async function getReferralLink(userId) {
    try {
      if (!userId) throw new Error('User ID is required');
  
      const doc = await db.collection('users').doc(userId).get();
      if (!doc.exists) throw new Error('User not found');
  
      return `https://yourwebsite.com/register?ref=${doc.data().referralCode}`;
    } catch (error) {
      console.error('Referral link error:', error);
      throw error;
    }
  }
  
  /**
   * Handles package purchase
   */
  async function purchasePackage(userId, packageId) {
    try {
      // Validate inputs
      if (!userId || !packageId) {
        throw new Error('User ID and Package ID are required');
      }
  
      // Run in transaction
      return await db.runTransaction(async (transaction) => {
        // Get package details
        const packageRef = db.collection('packages').doc(packageId);
        const packageDoc = await transaction.get(packageRef);
        
        if (!packageDoc.exists) {
          throw new Error('Package not found');
        }
  
        const packageData = packageDoc.data();
  
        // Create transaction record
        const transactionRef = db.collection('transactions').doc();
        transaction.set(transactionRef, {
          userId,
          packageId,
          amount: packageData.price,
          date: firebase.firestore.FieldValue.serverTimestamp(),
          status: 'pending',
          commissionEarned: 0
        });
  
        return { 
          transactionId: transactionRef.id, 
          amount: packageData.price,
          packageName: packageData.name
        };
      });
    } catch (error) {
      console.error('Purchase error:', error);
      throw error;
    }
  }
  
  /**
   * Handles successful payment and commission distribution
   */
  async function handlePaymentSuccess(transactionId) {
    try {
      if (!transactionId) throw new Error('Transaction ID is required');
  
      await db.runTransaction(async (transaction) => {
        // Get transaction details
        const txnRef = db.collection('transactions').doc(transactionId);
        const txnDoc = await transaction.get(txnRef);
        
        if (!txnDoc.exists) throw new Error('Transaction not found');
        if (txnDoc.data().status === 'complete') {
          throw new Error('Transaction already processed');
        }
  
        const txnData = txnDoc.data();
        const userId = txnData.userId;
  
        // Get package details
        const packageRef = db.collection('packages').doc(txnData.packageId);
        const packageDoc = await transaction.get(packageRef);
        const packageData = packageDoc.data();
  
        // Get user details
        const userRef = db.collection('users').doc(userId);
        const userDoc = await transaction.get(userRef);
        const userData = userDoc.data();
  
        // Calculate commissions
        const directCommission = packageData.directCommission || 0;
        const teamCommission = packageData.teamCommission || 0;
  
        // Update transaction status
        transaction.update(txnRef, {
          status: 'complete',
          commissionEarned: directCommission
        });
  
        // Update buyer's balance
        transaction.update(userRef, {
          balance: firebase.firestore.FieldValue.increment(directCommission)
        });
  
        // Handle referral commission if applicable
        if (userData.referredBy) {
          const referrerRef = db.collection('users').doc(userData.referredBy);
          
          // Update referrer's balance
          transaction.update(referrerRef, {
            balance: firebase.firestore.FieldValue.increment(teamCommission)
          });
  
          // Create referral transaction record
          const referralTxnRef = db.collection('transactions').doc();
          transaction.set(referralTxnRef, {
            userId: userData.referredBy,
            packageId: txnData.packageId,
            amount: txnData.amount,
            date: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'complete',
            commissionEarned: teamCommission,
            referredUserId: userId,
            isReferralCommission: true
          });
        }
      });
  
      return { success: true };
    } catch (error) {
      console.error('Payment processing error:', error);
      throw error;
    }
  }
  
  /**
   * Handles withdrawal requests
   */
  async function requestWithdrawal(userId, amount, method = 'bank') {
    try {
      // Validate inputs
      if (!userId) throw new Error('User ID is required');
      if (isNaN(amount) || amount < 500) {
        throw new Error('Minimum withdrawal amount is 500');
      }
      if (!['bank', 'upi'].includes(method)) {
        throw new Error('Invalid withdrawal method');
      }
  
      const payoutData = await db.runTransaction(async (transaction) => {
        // Check user balance
        const userRef = db.collection('users').doc(userId);
        const userDoc = await transaction.get(userRef);
        
        if (!userDoc.exists) throw new Error('User not found');
        
        const userData = userDoc.data();
        if (userData.balance < amount) {
          throw new Error('Insufficient balance');
        }
  
        // Deduct from balance
        transaction.update(userRef, {
          balance: firebase.firestore.FieldValue.increment(-amount)
        });
  
        // Create payout record
        const payoutRef = db.collection('payouts').doc();
        const payoutData = {
          userId,
          amount,
          method,
          date: firebase.firestore.FieldValue.serverTimestamp(),
          status: 'pending',
          processedAt: null
        };
  
        transaction.set(payoutRef, payoutData);
        return { ...payoutData, id: payoutRef.id };
      });
  
      // Here you would typically call your payment processor API (Instamojo, Razorpay, etc.)
      // await processPayout(payoutData.id, userId, amount, method);
  
      return { 
        success: true, 
        payoutId: payoutData.id,
        amount: payoutData.amount
      };
    } catch (error) {
      console.error('Withdrawal error:', error);
      throw error;
    }
  }
  
  /**
   * Gets comprehensive earnings data for a user
   */
  async function getUserEarnings(userId) {
    try {
      if (!userId) throw new Error('User ID is required');
  
      const earnings = {
        total: 0,
        direct: 0,
        team: 0,
        available: 0,
        pendingWithdrawals: 0,
        withdrawn: 0
      };
  
      // Get user balance
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) throw new Error('User not found');
      
      earnings.available = userDoc.data().balance || 0;
  
      // Get all completed transactions (direct earnings)
      const directTxns = await db.collection('transactions')
        .where('userId', '==', userId)
        .where('status', '==', 'complete')
        .where('isReferralCommission', '==', false)
        .get();
  
      directTxns.forEach(doc => {
        earnings.direct += doc.data().commissionEarned || 0;
      });
  
      // Get team earnings (referral commissions)
      const teamTxns = await db.collection('transactions')
        .where('userId', '==', userId)
        .where('isReferralCommission', '==', true)
        .where('status', '==', 'complete')
        .get();
  
      teamTxns.forEach(doc => {
        earnings.team += doc.data().commissionEarned || 0;
      });
  
      // Get pending payouts
      const pendingPayouts = await db.collection('payouts')
        .where('userId', '==', userId)
        .where('status', '==', 'pending')
        .get();
  
      pendingPayouts.forEach(doc => {
        earnings.pendingWithdrawals += doc.data().amount || 0;
      });
  
      // Get completed payouts
      const completedPayouts = await db.collection('payouts')
        .where('userId', '==', userId)
        .where('status', '==', 'completed')
        .get();
  
      completedPayouts.forEach(doc => {
        earnings.withdrawn += doc.data().amount || 0;
      });
  
      // Calculate totals
      earnings.total = earnings.direct + earnings.team;
  
      return earnings;
    } catch (error) {
      console.error('Earnings calculation error:', error);
      throw error;
    }
  }
  
  // ======================
  // Additional Utility Functions
  // ======================
  
  /**
   * Gets user profile data
   */
  async function getUserProfile(userId) {
    try {
      if (!userId) throw new Error('User ID is required');
  
      const doc = await db.collection('users').doc(userId).get();
      if (!doc.exists) throw new Error('User not found');
  
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Profile fetch error:', error);
      throw error;
    }
  }
  
  /**
   * Updates user profile
   */
  async function updateProfile(userId, updateData) {
    try {
      if (!userId) throw new Error('User ID is required');
      if (!updateData || typeof updateData !== 'object') {
        throw new Error('Invalid update data');
      }
  
      // Remove protected fields
      const protectedFields = ['balance', 'referralCode', 'joinDate', 'verified'];
      protectedFields.forEach(field => delete updateData[field]);
  
      await db.collection('users').doc(userId).update(updateData);
      return { success: true };
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }
  
  /**
   * Gets user's downline (referrals)
   */
  async function getUserDownline(userId, level = 1, maxLevel = 3) {
    try {
      if (!userId) throw new Error('User ID is required');
  
      const downline = [];
      const queue = [{ userId, level: 1 }];
      const processed = new Set();
  
      while (queue.length > 0) {
        const current = queue.shift();
        if (processed.has(current.userId) continue;
        if (current.level > maxLevel) continue;
  
        processed.add(current.userId);
  
        // Get users who were referred by current user
        const snapshot = await db.collection('users')
          .where('referredBy', '==', current.userId)
          .get();
  
        for (const doc of snapshot.docs) {
          const userData = doc.data();
          downline.push({
            id: doc.id,
            name: userData.name,
            email: userData.email,
            joinDate: userData.joinDate?.toDate(),
            level: current.level
          });
  
          // Add to queue for next level processing
          if (current.level < maxLevel) {
            queue.push({ userId: doc.id, level: current.level + 1 });
          }
        }
      }
  
      return downline;
    } catch (error) {
      console.error('Downline fetch error:', error);
      throw error;
    }
  }
  
  // ======================
  // Exports (if using Node.js)
  // ======================
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      registerUser,
      loginUser,
      checkPackagePurchase,
      getReferralLink,
      purchasePackage,
      handlePaymentSuccess,
      requestWithdrawal,
      getUserEarnings,
      getUserProfile,
      updateProfile,
      getUserDownline
    };
  }
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDTokmcW4mkKaSz6qeaMonlmjHM2wKTb6c",
    authDomain: "skillppe.firebaseapp.com",
    projectId: "skillppe",
    storageBucket: "skillppe.firebasestorage.app",
    messagingSenderId: "714570952768",
    appId: "1:714570952768:web:bbe41cc6091a3a838defa5",
    measurementId: "G-D8YHKMY104"
  };