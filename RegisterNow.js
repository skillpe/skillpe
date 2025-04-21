import { initializeApp } from "./images/node_modules/firebase/app/dist/app";
// Form Submission Handler
document.getElementById('registrationForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form values
    const formData = {
        name: document.getElementById('fullName').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        password: document.getElementById('password').value,
        referral: document.getElementById('referralCode').value.trim(),
        package: document.querySelector('input[name="package"]:checked').value
    };
        
    
    // Validate inputs
    if (!validateForm(formData)) {
        return;
    }
    
    // Process registration
    processRegistration(formData);
});

// Form Validation
function validateForm(data) {
    // Name validation
    if (data.name.length < 3) {
        alert('Please enter your full name');
        return false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        alert('Please enter a valid email address');
        return false;
    }
    
    // Phone validation
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(data.phone)) {
        alert('Please enter a valid 10-digit WhatsApp number');
        return false;
    }
    
    // Password validation
    if (data.password.length < 8) {
        alert('Password must be at least 8 characters long');
        return false;
    }
    
    return true;
}

// Registration Processing
function processRegistration(data) {
    // Show loading state
    const submitBtn = document.querySelector('#registrationForm button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    submitBtn.disabled = true;
    
    // Simulate API call (replace with actual Firebase auth)
    setTimeout(() => {
        // Reset button state
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
        
        // Show success message
        if (data.package === "50") {
            alert(`Basic registration successful ${data.name}! You can now access courses. Upgrade to affiliate package to start earning.`);
        } else {
            alert(`Affiliate registration successful ${data.name}! You will be redirected to payment gateway to complete your ₹${data.package} package purchase.`);
            // In real implementation, redirect to payment page
            // window.location.href = `payment.html?package=${data.package}&name=${encodeURIComponent(data.name)}&email=${encodeURIComponent(data.email)}&phone=${data.phone}&referral=${data.referral}`;
        }
        
        // Here you would typically send the data to your backend
        console.log('Registration data:', data);
        
        // In a real app, you would:
        // 1. Create user in Firebase Auth
        // 2. Save user data to Firestore
        // 3. Handle referral tracking if applicable
        // 4. Redirect to appropriate page
        
    }, 1500);
}

// Firebase implementation (uncomment when you have firebase-config.js setup)
/*
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { app } from './firebase-config.js';

const auth = getAuth(app);
const db = getFirestore(app);

const registrationForm = document.getElementById('registrationForm');

registrationForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('password').value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Save additional data to Firestore
        await setDoc(doc(db, "users", user.uid), {
            fullName,
            email,
            phone,
            package: document.querySelector('input[name="package"]:checked').value,
            referral: document.getElementById('referralCode').value.trim(),
            createdAt: new Date(),
            isAffiliate: document.querySelector('input[name="package"]:checked').value !== "50"
        });

        alert('Registration successful!');
        window.location.href = "dashboard.html";
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
});
*/
//inputs

import { getAuth, createUserWithEmailAndPassword } from "./images/node_modules/firebase/auth/dist/auth";
