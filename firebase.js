const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Referral Tracking
exports.trackReferral = functions.firestore
  .document('referrals/{referralId}')
  .onCreate(async (snap, context) => {
    const referral = snap.data();
    
    // Update referrer's team count
    const referrerQuery = await admin.firestore().collection('users')
      .where('referralCode', '==', referral.referrerCode)
      .limit(1)
      .get();
      
    if (!referrerQuery.empty) {
      await referrerQuery.docs[0].ref.update({
        teamCount: admin.firestore.FieldValue.increment(1)
      });
    }
  });

// Commission Processing
exports.processCommissions = functions.firestore
  .document('payments/{paymentId}')
  .onCreate(async (snap, context) => {
    const payment = snap.data();
    
    // Find who referred this user
    const referral = await admin.firestore().collection('referrals')
      .where('newUserId', '==', payment.userId)
      .where('status', '==', 'pending')
      .limit(1)
      .get();
      
    if (referral.empty) return;
    
    const referralData = referral.docs[0].data();
    const directCommission = payment.amount * 0.2; // 20%
    
    // Update referrer's earnings
    await admin.firestore().collection('users').doc(referralData.referrerId).update({
      directEarnings: admin.firestore.FieldValue.increment(directCommission),
      totalEarnings: admin.firestore.FieldValue.increment(directCommission),
      accountBalance: admin.firestore.FieldValue.increment(directCommission)
    });
    
    // Mark referral as completed
    await referral.docs[0].ref.update({
      status: 'completed',
      commissionAmount: directCommission
    });
    
    // Create transaction record
    await admin.firestore().collection('transactions').add({
      userId: referralData.referrerId,
      type: 'commission',
      amount: directCommission,
      status: 'completed',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: `Commission from ${payment.userEmail}`
    });
  });

// Automatic Withdrawal Processing
exports.processWithdrawals = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  const pendingWithdrawals = await admin.firestore()
    .collection('withdrawals')
    .where('status', '==', 'pending')
    .get();

  const batch = admin.firestore().batch();
  
  for (const doc of pendingWithdrawals.docs) {
    const withdrawal = doc.data();
    
    try {
      // In a real implementation, this would call Razorpay API
      const payoutId = 'P' + Date.now().toString(36);
      
      batch.update(doc.ref, {
        status: 'completed',
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        payoutId: payoutId
      });

      const userRef = admin.firestore().collection('users').doc(withdrawal.userId);
      batch.update(userRef, {
        pendingPayout: admin.firestore.FieldValue.increment(-withdrawal.amount),
        withdrawnAmount: admin.firestore.FieldValue.increment(withdrawal.amount)
      });

      const transactionRef = admin.firestore()
        .collection('transactions')
        .doc();
      
      batch.set(transactionRef, {
        userId: withdrawal.userId,
        type: 'withdrawal',
        amount: withdrawal.amount,
        status: 'completed',
        payoutId: payoutId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        details: `Withdrawal processed to ${withdrawal.bankDetails.bankName}`
      });

    } catch (error) {
      console.error(`Failed to process withdrawal ${doc.id}:`, error);
      batch.update(doc.ref, { 
        status: 'failed',
        error: error.message,
        failedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  }

  await batch.commit();
  console.log(`Processed ${pendingWithdrawals.size} withdrawals`);
  return null;
});