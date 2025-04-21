// dashboard.js
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  increment,
  serverTimestamp
} from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDTokmcW4mkKaSz6qeaMonlmjHM2wKTb6c",
  authDomain: "skillppe.firebaseapp.com",
  projectId: "skillppe",
  storageBucket: "skillppe.appspot.com",
  messagingSenderId: "714570952768",
  appId: "1:714570952768:web:bbe41cc6091a3a838defa5",
  measurementId: "G-D8YHKMY104"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

// Instamojo configuration
const instamojoConfig = {
  apiKey: '2c5fc27cf1f7639922fe058d2256d211',
  authToken: 'cf41aeaddb9bd47d45fe8513ef52642e',
  salt: 'ebcc7943bd634ac8bf2144729737c97b',
  endpoint: 'https://test.instamojo.com/api/1.1/' // Change to production URL when live
};

// Package commission structure
const packages = {
  '29': { direct: 18, team: 2, owner: 9 }, // After Instamojo fees (~3%)
  '99': { direct: 58, team: 20, owner: 21 },
  '299': { direct: 200, team: 79, owner: 20 },
  '499': { direct: 390, team: 89, owner: 20 },
  '699': { direct: 500, team: 150, owner: 49 },
  '999': { direct: 700, team: 250, owner: 49 },
  '2999': { direct: 2000, team: 899, owner: 100 }
};

// Global variables
let currentUser = null;
let userData = null;

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initAuthState();
  setupEventListeners();
});

// Initialize auth state listener
function initAuthState() {
  auth.onAuthStateChanged((user) => {
    if (user) {
        const displayName = user.displayName || user.email.split('@')[0];
        const initial = displayName.charAt(0).toUpperCase();

        // Update UI
        userAvatar.textContent = initial;
        userName.textContent = displayName;
        userEmail.textContent = user.email;

        // Load user data and check payment status
        loadUserData(user.uid);
        checkPaymentStatus(user.uid);
    } else {
        window.location.href = 'login.html';
    }
});
}

// Load user data from Firestore
async function loadUserData(userId) {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      userData = userDoc.data();
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error loading user data:", error);
    return false;
  }
}

function loadUserData(userId) {
    db.collection("users").doc(userId).get().then((doc) => {
        if (doc.exists) {
            const userData = doc.data();

            // Update referral link
            if (userData.referralLink) {
                generateReferralLink(userId);
            }

            // Update earnings summary
            document.getElementById('totalEarnings').textContent = `₹${userData.totalEarnings || 0}`;
            document.getElementById('directEarnings').textContent = `₹${userData.directEarnings || 0}`;
            document.getElementById('teamEarnings').textContent = `₹${userData.teamEarnings || 0}`;
            document.getElementById('availableBalance').textContent = `₹${userData.availableBalance || 0}`;
            document.getElementById('withdrawnAmount').textContent = `₹${userData.withdrawnAmount || 0}`;
            document.getElementById('pendingPayout').textContent = `₹${userData.pendingPayout || 0}`;

            // Load earnings history
            loadEarningsHistory(userId);

            // Load withdrawal history
            loadWithdrawalHistory(userId);
        }
    }).catch((error) => {
        console.error("Error loading user data:", error);
    });
}

// Setup UI based on user data
function setupUI() {
  // Set user profile info
  document.getElementById('userAvatar').textContent = currentUser.displayName?.charAt(0) || currentUser.email.charAt(0).toUpperCase();
  document.getElementById('userName').textContent = currentUser.displayName || currentUser.email.split('@')[0];
  document.getElementById('userEmail').textContent = currentUser.email;

  // Show referral section if user has paid
  if (userData?.hasPaid) {
    showReferralSection();
    updateDashboardStats();
    loadEarningsHistory();
    loadTeamMembers();
  } else {
    showPaymentSection();
  }
}

// Show payment section for unpaid users
function showPaymentSection() {
  document.getElementById('payNowBtn').style.display = 'block';
  document.getElementById('referralSection').style.display = 'none';
  
  // Setup package buttons
  document.querySelectorAll('.course-card .btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const price = btn.closest('.course-card').querySelector('.course-price').textContent.match(/\d+/)[0];
      initiatePayment(price);
    });
  });
}

// Show referral section for paid users
function showReferralSection() {
  document.getElementById('payNowBtn').style.display = 'none';
  document.getElementById('referralSection').style.display = 'block';
  
  const referralLink = `${window.location.origin}/register.html?ref=${userData.referralCode}`;
  document.getElementById('referralLink').textContent = referralLink;
}

// Update dashboard stats
function updateDashboardStats() {
  if (!userData) return;
  
  document.getElementById('totalEarnings').textContent = `₹${userData.totalEarnings || 0}`;
  document.getElementById('directEarnings').textContent = `₹${userData.directEarnings || 0}`;
  document.getElementById('teamEarnings').textContent = `₹${userData.teamEarnings || 0}`;
  document.getElementById('availableBalance').textContent = `₹${userData.availableBalance || 0}`;
  document.getElementById('withdrawnAmount').textContent = `₹${userData.withdrawnAmount || 0}`;
  document.getElementById('pendingPayout').textContent = `₹${userData.pendingPayout || 0}`;
}

// Setup event listeners
function setupEventListeners() {
  // Navigation tabs
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(navItem => navItem.classList.remove('active'));
      document.querySelectorAll('.dashboard-content').forEach(content => content.classList.remove('active'));
      
      item.classList.add('active');
      const target = item.getAttribute('data-target');
      document.getElementById(target).classList.add('active');
    });
  });

  // Logout button
  document.getElementById('logoutBtn').addEventListener('click', () => {
    signOut(auth).then(() => {
      window.location.href = 'login.html';
    });
  });

  // Referral actions
  document.getElementById('copyReferralBtn').addEventListener('click', copyReferralLink);
  document.getElementById('whatsappShareBtn').addEventListener('click', shareViaWhatsapp);
  document.getElementById('telegramShareBtn').addEventListener('click', shareViaTelegram);

  // Withdrawal request
  document.getElementById('requestWithdrawalBtn').addEventListener('click', requestWithdrawal);

  // Bank details form
  document.getElementById('bankDetailsForm').addEventListener('submit', saveBankDetails);

  // Earnings calculator
  document.getElementById('package').addEventListener('change', calculateEarnings);
  document.getElementById('directSales').addEventListener('input', calculateEarnings);
  document.getElementById('teamMembers').addEventListener('input', calculateEarnings);
  document.getElementById('teamSales').addEventListener('input', calculateEarnings);
}

// Copy referral link to clipboard
function copyReferralLink() {
    const referralLink = document.getElementById('referralLink').textContent;
    navigator.clipboard.writeText(referralLink).then(() => {
        alert('Referral link copied to clipboard!');
    }).catch((error) => {
        console.error('Error copying referral link:', error);
    });
}

// Share via WhatsApp
function shareViaWhatsapp() {
  const link = document.getElementById('referralLink').textContent;
  const message = `Join SkillPe Affiliate Program and start earning! ${link}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
}

// Share via Telegram
function shareViaTelegram() {
  const link = document.getElementById('referralLink').textContent;
  const message = `Join SkillPe Affiliate Program and start earning! ${link}`;
  window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(message)}`);
}

// Initiate payment with Instamojo
async function initiatePayment(amount) {
  if (!currentUser) return;

  try {
    // Generate transaction ID
    const transactionId = `TXN${Date.now()}`;
    
    // Create payment data
    const paymentData = {
      purpose: `SkillPe Affiliate Package (₹${amount})`,
      amount: amount,
      buyer_name: currentUser.displayName || currentUser.email.split('@')[0],
      email: currentUser.email,
      phone: userData?.phone || '',
      redirect_url: `${window.location.origin}/payment-success.html`,
      webhook_url: 'https://your-webhook-url.com/instamojo', // Replace with your webhook URL
      allow_repeated_payments: false,
      send_email: true,
      send_sms: true,
      metadata: {
        userId: currentUser.uid,
        transactionId: transactionId,
        package: amount
      }
    };

    // Create Instamojo payment request
    const response = await createInstamojoPayment(paymentData);
    
    if (response.success && response.payment_request.longurl) {
      // Redirect to Instamojo payment page
      window.location.href = response.payment_request.longurl;
    } else {
      throw new Error('Failed to create payment request');
    }
  } catch (error) {
    console.error('Payment initiation failed:', error);
    alert('Payment initiation failed. Please try again.');
  }
}

// Create Instamojo payment request
async function createInstamojoPayment(paymentData) {
  // Generate signature
  const signature = generateInstamojoSignature(paymentData);
  
  const formData = new FormData();
  for (const key in paymentData) {
    formData.append(key, paymentData[key]);
  }
  formData.append('signature', signature);

  const response = await fetch(`${instamojoConfig.endpoint}payment-requests/`, {
    method: 'POST',
    headers: {
      'X-Api-Key': instamojoConfig.apiKey,
      'X-Auth-Token': instamojoConfig.authToken
    },
    body: formData
  });

  return await response.json();
}

// Generate Instamojo signature
function generateInstamojoSignature(data) {
  // Sort data keys alphabetically
  const sortedKeys = Object.keys(data).sort();
  let message = '';
  
  // Concatenate key-value pairs
  sortedKeys.forEach(key => {
    message += `${key}|${data[key]}`;
  });
  
  // Add salt at the end
  message += instamojoConfig.salt;
  
  // Calculate SHA-256 hash
  // Note: In a real implementation, use a proper SHA-256 library
  // This is a simplified version for demonstration
  return sha256(message);
}

// Simplified SHA-256 function (replace with a proper implementation)
function sha256(message) {
  // In a real app, use a library like crypto-js or the Web Crypto API
  return 'generated_signature_here';
}

// Process payment success (to be called from payment-success.html)
async function processPaymentSuccess(paymentId, paymentRequestId) {
  try {
    // Verify payment with Instamojo
    const paymentDetails = await verifyInstamojoPayment(paymentId);
    
    if (paymentDetails.success && paymentDetails.payment_request.status === "Completed") {
      const amount = paymentDetails.payment_request.amount;
      const userId = paymentDetails.payment_request.metadata.userId;
      
      // Generate referral code
      const referralCode = generateReferralCode();
      
      // Update user data
      await setDoc(doc(db, "users", userId), {
        hasPaid: true,
        referralCode: referralCode,
        paymentDate: serverTimestamp(),
        packagePurchased: amount,
        totalEarnings: 0,
        directEarnings: 0,
        teamEarnings: 0,
        availableBalance: 0,
        withdrawnAmount: 0,
        pendingPayout: 0,
        lastUpdated: serverTimestamp()
      }, { merge: true });
      
      // Record transaction
      await addDoc(collection(db, "transactions"), {
        userId: userId,
        type: "purchase",
        amount: amount,
        status: "completed",
        timestamp: serverTimestamp(),
        paymentId: paymentId,
        details: `Purchased ₹${amount} package`
      });
      
      // If this user was referred by someone, process referral
      const urlParams = new URLSearchParams(window.location.search);
      const referrerCode = urlParams.get('ref');
      
      if (referrerCode) {
        await processReferral(referrerCode, userId, amount);
      }
      
      return true;
    }
    return false;
  } catch (error) {
    console.error("Payment processing failed:", error);
    return false;
  }
}

// Verify payment with Instamojo
async function verifyInstamojoPayment(paymentId) {
  const response = await fetch(`${instamojoConfig.endpoint}payments/${paymentId}/`, {
    headers: {
      'X-Api-Key': instamojoConfig.apiKey,
      'X-Auth-Token': instamojoConfig.authToken
    }
  });
  return await response.json();
}

// Process referral commission
async function processReferral(referrerCode, referredUserId, amount) {
  try {
    // Find referrer by code
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("referralCode", "==", referrerCode));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const referrerDoc = querySnapshot.docs[0];
      const referrerId = referrerDoc.id;
      const referrerData = referrerDoc.data();
      
      // Get package details
      const packageDetails = packages[amount];
      if (!packageDetails) return;
      
      // Calculate commissions
      const directCommission = packageDetails.direct;
      const teamCommission = packageDetails.team;
      
      // Update referrer's earnings
      await updateDoc(doc(db, "users", referrerId), {
        totalEarnings: increment(directCommission),
        directEarnings: increment(directCommission),
        availableBalance: increment(directCommission),
        lastUpdated: serverTimestamp()
      });
      
      // Record transaction for referrer
      await addDoc(collection(db, "transactions"), {
        userId: referrerId,
        type: "direct_commission",
        amount: directCommission,
        status: "completed",
        timestamp: serverTimestamp(),
        referredUserId: referredUserId,
        details: `Direct commission from ${amount} package`
      });
      
      // If referrer has an upline, process team commission
      if (referrerData.referredBy) {
        await updateDoc(doc(db, "users", referrerData.referredBy), {
          totalEarnings: increment(teamCommission),
          teamEarnings: increment(teamCommission),
          availableBalance: increment(teamCommission),
          lastUpdated: serverTimestamp()
        });
        
        // Record transaction for upline
        await addDoc(collection(db, "transactions"), {
          userId: referrerData.referredBy,
          type: "team_commission",
          amount: teamCommission,
          status: "completed",
          timestamp: serverTimestamp(),
          referredUserId: referredUserId,
          details: `Team commission from ${amount} package`
        });
      }
      
      // Update referred user's document with referrer info
      await updateDoc(doc(db, "users", referredUserId), {
        referredBy: referrerId,
        joinedThrough: referrerCode,
        lastUpdated: serverTimestamp()
      });
      
      return true;
    }
    return false;
  } catch (error) {
    console.error("Referral processing failed:", error);
    return false;
  }
}

// Generate random referral code
function generateReferralCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Load earnings history
async function loadEarningsHistory() {
  if (!currentUser) return;
  
  const earningsTableBody = document.getElementById('earningsTableBody');
  earningsTableBody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';
  
  try {
    const q = query(
      collection(db, "transactions"),
      where("userId", "==", currentUser.uid),
      orderBy("timestamp", "desc"),
      limit(10)
    );
    
    const snapshot = await getDocs(q);
    earningsTableBody.innerHTML = '';
    
    if (snapshot.empty) {
      earningsTableBody.innerHTML = '<tr><td colspan="4">No transactions found</td></tr>';
      return;
    }
    
    snapshot.forEach(doc => {
      const transaction = doc.data();
      const date = transaction.timestamp.toDate();
      const formattedDate = date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      
      const statusColor = transaction.status === 'completed' ? 'var(--success)' : 
                         transaction.status === 'failed' ? 'var(--danger)' : 'var(--info)';
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${formattedDate}</td>
        <td>${transaction.type.replace('_', ' ')}</td>
        <td>₹${transaction.amount}</td>
        <td><span style="color: ${statusColor}">${transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}</span></td>
      `;
      earningsTableBody.appendChild(row);
    });
  } catch (error) {
    console.error("Error loading earnings history:", error);
    earningsTableBody.innerHTML = '<tr><td colspan="4">Error loading history</td></tr>';
  }
}

// Load team members
async function loadTeamMembers() {
  if (!currentUser) return;
  
  const teamTableBody = document.getElementById('teamTableBody');
  if (!teamTableBody) return;
  
  teamTableBody.innerHTML = '<tr><td colspan="3">Loading...</td></tr>';
  
  try {
    const q = query(
      collection(db, "users"),
      where("referredBy", "==", currentUser.uid),
      orderBy("paymentDate", "desc")
    );
    
    const snapshot = await getDocs(q);
    teamTableBody.innerHTML = '';
    
    if (snapshot.empty) {
      teamTableBody.innerHTML = '<tr><td colspan="3">No team members found</td></tr>';
      return;
    }
    
    snapshot.forEach(doc => {
      const member = doc.data();
      const date = member.paymentDate?.toDate();
      const formattedDate = date ? date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }) : 'N/A';
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${member.email}</td>
        <td>₹${member.packagePurchased || '0'}</td>
        <td>${formattedDate}</td>
      `;
      teamTableBody.appendChild(row);
    });
  } catch (error) {
    console.error("Error loading team members:", error);
    teamTableBody.innerHTML = '<tr><td colspan="3">Error loading team</td></tr>';
  }
}

// Request withdrawal
async function requestWithdrawal() {
    const amount = parseFloat(document.getElementById('withdrawAmount').value);

    if (isNaN(amount) || amount < 500) {
        alert('Minimum withdrawal amount is ₹500');
        return;
    }

    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    const availableBalance = userDoc.data().availableBalance || 0;

    if (amount > availableBalance) {
        alert('Insufficient balance for withdrawal');
        return;
    }

    // Create withdrawal request
    await addDoc(collection(db, "withdrawals"), {
        userId: currentUser.uid,
        amount: amount,
        status: "Pending",
        createdAt: serverTimestamp()
    });

    // Update user's balance
    await updateDoc(doc(db, "users", currentUser.uid), {
        availableBalance: increment(-amount),
        pendingPayout: increment(amount)
    });

    alert('Withdrawal request submitted successfully!');
}

requestWithdrawalBtn.addEventListener('click', () => {
    const amount = parseFloat(withdrawAmountInput.value);
    const userId = auth.currentUser.uid;

    if (isNaN(amount) || amount < 500) {
        alert('Minimum withdrawal amount is ₹500');
        return;
    }

    // Check available balance
    db.collection("users").doc(userId).get().then((doc) => {
        if (doc.exists) {
            const availableBalance = doc.data().availableBalance || 0;

            if (amount > availableBalance) {
                alert('Insufficient balance for withdrawal');
                return;
            }

            // Create withdrawal request
            db.collection("users").doc(userId).update({
                withdrawals: admin.firestore.FieldValue.arrayUnion({
                    date: new Date().toISOString(),
                    amount: amount,
                    method: 'Bank Transfer',
                    status: 'Pending'
                }),
                availableBalance: availableBalance - amount
            }).then(() => {
                alert('Withdrawal request submitted successfully!');
                withdrawAmountInput.value = '';
                loadWithdrawalHistory(userId);
            }).catch((error) => {
                console.error("Error submitting withdrawal request:", error);
                alert('Error submitting withdrawal request. Please try again.');
            });
        }
    });
});

// Show withdrawal status message
function showWithdrawalStatus(message, type) {
  const statusDiv = document.getElementById('withdrawalStatus');
  statusDiv.style.display = 'block';
  statusDiv.innerHTML = `<p style="color: var(--${type})">${message}</p>`;
  setTimeout(() => statusDiv.style.display = 'none', 5000);
}

// Load withdrawal history
async function loadWithdrawalHistory() {
  if (!currentUser) return;
  
  const withdrawalHistoryBody = document.getElementById('withdrawalHistoryBody');
  withdrawalHistoryBody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';
  
  try {
    const q = query(
      collection(db, "withdrawals"),
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc"),
      limit(10)
    );
    
    const snapshot = await getDocs(q);
    withdrawalHistoryBody.innerHTML = '';
    
    if (snapshot.empty) {
      withdrawalHistoryBody.innerHTML = '<tr><td colspan="4">No withdrawals found</td></tr>';
      return;
    }
    
    snapshot.forEach(doc => {
      const withdrawal = doc.data();
      const date = withdrawal.createdAt.toDate();
      const formattedDate = date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      
      const statusColor = withdrawal.status === 'completed' ? 'var(--success)' : 
                         withdrawal.status === 'failed' ? 'var(--danger)' : 'var(--info)';
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${formattedDate}</td>
        <td>₹${withdrawal.amount}</td>
        <td>${withdrawal.bankDetails?.accountType === 'upi' ? 'UPI' : 'Bank Transfer'}</td>
        <td><span style="color: ${statusColor}">${withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}</span></td>
      `;
      withdrawalHistoryBody.appendChild(row);
    });
  } catch (error) {
    console.error("Error loading withdrawal history:", error);
    withdrawalHistoryBody.innerHTML = '<tr><td colspan="4">Error loading history</td></tr>';
  }
}

// Save bank details
async function saveBankDetails(e) {
  e.preventDefault();
  
  if (!currentUser) return;
  
  const accountName = document.getElementById('accountName').value;
  const bankName = document.getElementById('bankName').value;
  const accountNumber = document.getElementById('accountNumber').value;
  const accountType = document.getElementById('accountType').value;
  const ifscCode = document.getElementById('ifscCode').value;
  const upiId = document.getElementById('upiId').value;
  
  if (!accountName || !bankName || !accountNumber || !accountType || !ifscCode) {
    alert('Please fill all required fields');
    return;
  }
  
  try {
    const bankDetails = {
      accountName,
      bankName,
      accountNumber,
      accountType,
      ifscCode,
      upiId: upiId || null,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(doc(db, "users", currentUser.uid), {
      bankDetails,
      lastUpdated: serverTimestamp()
    });
    
    alert('Bank details saved successfully!');
  } catch (error) {
    console.error("Error saving bank details:", error);
    alert('Error saving bank details. Please try again.');
  }
}

// Calculate potential earnings
function calculateEarnings() {
  const selectedPackage = document.getElementById('package').value;
  const directSales = parseInt(document.getElementById('directSales').value) || 0;
  const teamMembers = parseInt(document.getElementById('teamMembers').value) || 0;
  const teamSales = parseInt(document.getElementById('teamSales').value) || 0;
  
  const packageDetails = packages[selectedPackage];
  if (!packageDetails) return;
  
  const directEarnings = directSales * packageDetails.direct;
  const teamEarnings = teamMembers * teamSales * packageDetails.team;
  const totalEarnings = directEarnings + teamEarnings;
  
  // Update results
  document.getElementById('calcDirectEarnings').textContent = `₹${directEarnings.toLocaleString('en-IN')}`;
  document.getElementById('calcTeamEarnings').textContent = `₹${teamEarnings.toLocaleString('en-IN')}`;
  document.getElementById('calcTotalEarnings').textContent = `₹${totalEarnings.toLocaleString('en-IN')}`;
}

function generateReferralLink(userId) {
    const referralLink = `https://yourdomain.com/register?ref=${userId}`;
    document.getElementById('referralLink').textContent = referralLink;
    document.getElementById('referralSection').style.display = 'block';
}

function generateReferralCode(userId) {
    const referralCode = `https://yourdomain.com/register?ref=${userId}`;
    document.getElementById('referralLink').textContent = referralCode;
    document.getElementById('referralSection').style.display = 'block';
    document.getElementById('payNowBtn').style.display = 'none';
    document.getElementById('paymentHeading').textContent = 'Congratulations!';
    document.getElementById('paymentDescription').textContent = 'Your affiliate account is now active. Share your referral code to start earning!';
}

function checkPaymentStatus(userId) {
    db.collection("users").doc(userId).get().then((doc) => {
        if (doc.exists) {
            const userData = doc.data();
            if (userData.hasPaid) {
                generateReferralCode(userId);
            }
        }
    }).catch((error) => {
        console.error("Error checking payment status:", error);
    });
}

// Express server for Instamojo webhook
const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');

const app = express();
app.use(bodyParser.json());

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(require('./path-to-service-account.json')),
    databaseURL: 'https://skillppe.firebaseio.com'
});

const dbAdmin = admin.firestore();

// Instamojo webhook endpoint
app.post('/instamojo-webhook', async (req, res) => {
    const paymentData = req.body;

    try {
        const userId = paymentData.buyer_id; // Replace with actual field
        await db.collection('users').doc(userId).update({
            hasPaid: true,
            referralLink: `https://yourdomain.com/register?ref=${userId}`
        });

        res.status(200).send('Payment processed successfully');
    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).send('Error processing payment');
    }
});

function getPackageDetails(packageName) {
    const packages = {
        '29': { name: 'SkillPe Starter', directCommission: 18, teamCommission: 2 },
        '99': { name: 'Mini Boost', directCommission: 58, teamCommission: 20 },
        '299': { name: 'Mini Boost Plus', directCommission: 200, teamCommission: 79 },
        '499': { name: 'Power Learn', directCommission: 390, teamCommission: 89 },
        '699': { name: 'Pro Affiliate', directCommission: 500, teamCommission: 150 },
        '999': { name: 'Elite Package', directCommission: 700, teamCommission: 250 },
        '2999': { name: 'Master Bundle', directCommission: 2000, teamCommission: 899 }
    };
    return packages[packageName];
}

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

async function updateEarnings(userId, packageName) {
    const packageDetails = getPackageDetails(packageName);

    // Update user's earnings
    await db.collection('users').doc(userId).update({
        totalEarnings: admin.firestore.FieldValue.increment(packageDetails.directCommission),
        directEarnings: admin.firestore.FieldValue.increment(packageDetails.directCommission),
        availableBalance: admin.firestore.FieldValue.increment(packageDetails.directCommission)
    });

    // If referred by someone, update their team earnings
    const userDoc = await db.collection('users').doc(userId).get();
    const referredBy = userDoc.data().referredBy;

    if (referredBy) {
        await db.collection('users').doc(referredBy).update({
            totalEarnings: admin.firestore.FieldValue.increment(packageDetails.teamCommission),
            teamEarnings: admin.firestore.FieldValue.increment(packageDetails.teamCommission),
            availableBalance: admin.firestore.FieldValue.increment(packageDetails.teamCommission)
        });
    }
}