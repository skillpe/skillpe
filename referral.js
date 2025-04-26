// Generate Unique Referral Code (6-digit alphanumeric)
function generateReferralCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'SP'; // SkillPe prefix
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Save Referral Code to User's Profile
async function setupUserReferral(userId) {
  const referralCode = generateReferralCode();
  
  await db.collection('users').doc(userId).update({
    referralCode: referralCode,
    referralLink: `https://skillpe.com/ref?code=${referralCode}`,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  
  return referralCode;
}
