import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, onAuthStateChanged };
import { auth, db } from './firebase.js';
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { FieldValue } from "firebase/firestore";

let currentUser = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      initializeDashboard(user.uid);
    } else {
      window.location.href = 'login.html';
    }
  });
});

async function initializeDashboard(userId) {
  await checkPaymentStatus(userId);
  setupRealtimeUpdates(userId);
  loadWithdrawalHistory(userId);
  setupEventListeners();
}

// Payment and Referral System
async function checkPaymentStatus(userId) {
  const userDoc = await getDoc(doc(db, "users", userId));
  
  if (userDoc.exists() && userDoc.data().hasPaid) {
    showReferralSection(userDoc.data().referralCode);
    updateDashboardStats(userDoc.data());
  } else {
    document.getElementById('payNowBtn').style.display = 'block';
    document.getElementById('referralSection').style.display = 'none';
  }
}

function showReferralSection(referralCode) {
  document.getElementById('payNowBtn').style.display = 'none';
  const referralSection = document.getElementById('referralSection');
  referralSection.style.display = 'block';
  
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;
  document.getElementById('referralLink').textContent = referralLink;
  document.getElementById('referralLink').href = referralLink;
}

function updateDashboardStats(userData) {
  document.getElementById('totalEarnings').textContent = `₹${userData.totalEarnings || 0}`;
  document.getElementById('directEarnings').textContent = `₹${userData.directEarnings || 0}`;
  document.getElementById('teamEarnings').textContent = `₹${userData.teamEarnings || 0}`;
  document.getElementById('availableBalance').textContent = `₹${userData.availableBalance || 0}`;
  document.getElementById('withdrawnAmount').textContent = `₹${userData.withdrawnAmount || 0}`;
  document.getElementById('pendingPayout').textContent = `₹${userData.pendingPayout || 0}`;
}

// Real-time Updates
function setupRealtimeUpdates(userId) {
  onSnapshot(doc(db, "users", userId), (doc) => {
    const userData = doc.data();
    updateDashboardStats(userData);
    
    if (userData.hasPaid && document.getElementById('referralSection').style.display === 'none') {
      showReferralSection(userData.referralCode);
    }
  });
}

// Payment Integration
function setupEventListeners() {
  document.getElementById('payNowBtn').addEventListener('click', initiatePayment);
  document.getElementById('copyReferralBtn').addEventListener('click', copyReferralLink);
  document.getElementById('whatsappShareBtn').addEventListener('click', shareViaWhatsapp);
  document.getElementById('telegramShareBtn').addEventListener('click', shareViaTelegram);
  document.getElementById('requestWithdrawalBtn').addEventListener('click', requestWithdrawal);
}

async function initiatePayment() {
  try {
    // Replace with actual Razorpay integration
    const paymentResult = await mockPaymentProcessor(currentUser.uid);
    
    if (paymentResult.success) {
      const referralCode = generateReferralCode();
      
      await setDoc(doc(db, "users", currentUser.uid), {
        hasPaid: true,
        referralCode: referralCode,
        paymentDate: new Date(),
        packagePurchased: "Basic",
        accountBalance: 0,
        totalEarnings: 0,
        directEarnings: 0,
        teamEarnings: 0
      }, { merge: true });
      
      await addDoc(collection(db, "transactions"), {
        userId: currentUser.uid,
        type: "purchase",
        amount: 2999,
        status: "completed",
        timestamp: new Date(),
        details: "Initial affiliate package purchase"
      });
      
      showReferralSection(referralCode);
    }
  } catch (error) {
    console.error("Payment failed:", error);
    alert("Payment failed. Please try again.");
  }
}

// Referral Sharing Functions
function copyReferralLink() {
  const referralLink = document.getElementById('referralLink').textContent;
  navigator.clipboard.writeText(referralLink);
  alert('Referral link copied to clipboard!');
}

function shareViaWhatsapp() {
  const link = document.getElementById('referralLink').textContent;
  window.open(`https://wa.me/?text=Join%20SkillPe%20Affiliate%20Program%20${encodeURIComponent(link)}`);
}

function shareViaTelegram() {
  const link = document.getElementById('referralLink').textContent;
  window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=Join%20SkillPe%20Affiliate%20Program`);
}

// Withdrawal System
async function requestWithdrawal() {
  const amount = parseFloat(document.getElementById('withdrawAmount').value);
  const statusDiv = document.getElementById('withdrawalStatus');
  
  if (isNaN(amount) {
    showWithdrawalError('Please enter a valid amount');
    return;
  }
  
  if (amount < 500) {
    showWithdrawalError('Minimum withdrawal amount is ₹500');
    return;
  }
  
  try {
    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    const userData = userDoc.data();
    
    if (!userData.bankDetails) {
      showWithdrawalError('Please update your bank details first');
      return;
    }
    
    if (amount > (userData.availableBalance || 0)) {
      showWithdrawalError(`Insufficient balance. Available: ₹${userData.availableBalance || 0}`);
      return;
    }
    
    const withdrawalId = 'W' + Date.now().toString(36);
    
    await setDoc(doc(db, "withdrawals", withdrawalId), {
      userId: currentUser.uid,
      amount: amount,
      status: "pending",
      createdAt: new Date(),
      bankDetails: userData.bankDetails
    });
    
    await updateDoc(doc(db, "users", currentUser.uid), {
      availableBalance: FieldValue.increment(-amount),
      pendingPayout: FieldValue.increment(amount)
    });
    
    showWithdrawalSuccess(`Withdrawal request for ₹${amount} submitted successfully!`);
    document.getElementById('withdrawAmount').value = '';
    loadWithdrawalHistory(currentUser.uid);
    
  } catch (error) {
    console.error("Withdrawal error:", error);
    showWithdrawalError('Error processing withdrawal. Please try again.');
  }
}

async function loadWithdrawalHistory(userId) {
  const withdrawalHistoryBody = document.getElementById('withdrawalHistoryBody');
  withdrawalHistoryBody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';
  
  try {
    const q = query(
      collection(db, "withdrawals"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(10)
    );
    
    const snapshot = await getDocs(q);
    withdrawalHistoryBody.innerHTML = '';
    
    if (snapshot.empty) {
      withdrawalHistoryBody.innerHTML = '<tr><td colspan="4">No withdrawal history found</td></tr>';
      return;
    }
    
    snapshot.forEach(doc => {
      const withdrawal = doc.data();
      const row = document.createElement('tr');
      
      const date = withdrawal.createdAt.toDate();
      const formattedDate = date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      
      const statusColor = withdrawal.status === 'completed' ? 'var(--success)' : 
                         withdrawal.status === 'failed' ? 'var(--danger)' : 'var(--info)';
      
      row.innerHTML = `
        <td>${formattedDate}</td>
        <td>₹${withdrawal.amount}</td>
        <td>${withdrawal.bankDetails?.accountType || 'Bank Transfer'}</td>
        <td><span style="color: ${statusColor}">${withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}</span></td>
      `;
      withdrawalHistoryBody.appendChild(row);
    });
  } catch (error) {
    console.error("Error loading withdrawal history:", error);
    withdrawalHistoryBody.innerHTML = '<tr><td colspan="4">Error loading history</td></tr>';
  }
}

// Helper functions
function generateReferralCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function showWithdrawalError(message) {
  const statusDiv = document.getElementById('withdrawalStatus');
  statusDiv.style.display = 'block';
  statusDiv.innerHTML = `<p style="color:var(--danger)">${message}</p>`;
}

function showWithdrawalSuccess(message) {
  const statusDiv = document.getElementById('withdrawalStatus');
  statusDiv.style.display = 'block';
  statusDiv.innerHTML = `<p style="color:var(--success)">${message}</p>`;
}

// Mock payment processor (replace with actual implementation)
async function mockPaymentProcessor(userId) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ success: true, transactionId: 'TXN' + Date.now() });
    }, 1000);
  });
}
db.collection("payments").add({
    userId: "REFERRED_USER_ID",
    amount: 1000,
    userEmail: "test@example.com"
  });