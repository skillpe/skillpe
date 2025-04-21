// DOM Ready Function
document.addEventListener('DOMContentLoaded', function() {
    // Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn && navLinks) {
      mobileMenuBtn.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        this.querySelector('i').classList.toggle('fa-times');
        this.querySelector('i').classList.toggle('fa-bars');
      });
    }
  
    // Smooth Scrolling for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          const headerHeight = document.querySelector('.header').offsetHeight;
          const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
          
          // Close mobile menu if open
          if (navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            mobileMenuBtn.querySelector('i').classList.remove('fa-times');
            mobileMenuBtn.querySelector('i').classList.add('fa-bars');
          }
        }
      });
    });
  
    // FAQ Accordion
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
      question.addEventListener('click', function() {
        this.classList.toggle('active');
        const answer = this.nextElementSibling;
        const icon = this.querySelector('i');
        
        if (this.classList.contains('active')) {
          answer.style.maxHeight = answer.scrollHeight + 'px';
          icon.classList.remove('fa-chevron-down');
          icon.classList.add('fa-chevron-up');
        } else {
          answer.style.maxHeight = '0';
          icon.classList.remove('fa-chevron-up');
          icon.classList.add('fa-chevron-down');
        }
      });
    });
  
    // Header Scroll Effect
    const header = document.querySelector('.header');
    if (header) {
      window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
      });
    }
  
    // Earnings Calculator
    const dailySalesInput = document.getElementById('daily-sales');
    const teamMembersInput = document.getElementById('team-members');
    const salesValue = document.getElementById('sales-value');
    const teamValue = document.getElementById('team-value');
    const dailyEarnings = document.getElementById('daily-earnings');
    const monthlyEarnings = document.getElementById('monthly-earnings');
    const yearlyEarnings = document.getElementById('yearly-earnings');
  
    function calculateEarnings() {
      if (!dailySalesInput || !teamMembersInput) return;
      
      const dailySales = parseInt(dailySalesInput.value);
      const teamMembers = parseInt(teamMembersInput.value);
      
      // Update displayed values
      salesValue.textContent = dailySales;
      teamValue.textContent = teamMembers;
      
      // Calculate earnings (₹20 per direct sale and ₹6 per team sale)
      const directDaily = dailySales * 20;
      const teamDaily = dailySales * teamMembers * 6;
      const totalDaily = directDaily + teamDaily;
      
      const totalMonthly = totalDaily * 30;
      const totalYearly = totalDaily * 360;
      
      // Update results with Indian rupee formatting
      dailyEarnings.textContent = '₹' + totalDaily.toLocaleString('en-IN');
      monthlyEarnings.textContent = '₹' + totalMonthly.toLocaleString('en-IN');
      yearlyEarnings.textContent = '₹' + totalYearly.toLocaleString('en-IN');
    }
  
    if (dailySalesInput && teamMembersInput) {
      dailySalesInput.addEventListener('input', calculateEarnings);
      teamMembersInput.addEventListener('input', calculateEarnings);
      calculateEarnings(); // Initialize calculator
    }
  
    // Course Tabs
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
      button.addEventListener('click', function() {
        // Remove active class from all buttons
        tabButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        this.classList.add('active');
        
        // Here you would typically show/hide different course packages
        // For this demo, we're just changing the active tab style
      });
    });
  
    // Form Submission Handling
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Basic form validation
        let isValid = true;
        const inputs = this.querySelectorAll('input[required], select[required], textarea[required]');
        
        inputs.forEach(input => {
          if (!input.value.trim()) {
            isValid = false;
            input.style.borderColor = 'var(--danger)';
          } else {
            input.style.borderColor = '';
          }
        });
        
        if (isValid) {
          // Simulate form submission
          console.log('Form submitted:', this);
          alert('Thank you for your submission! We will contact you soon.');
          this.reset();
        } else {
          alert('Please fill in all required fields.');
        }
      });
    });
  
    // Animation on Scroll
    function animateOnScroll() {
      const elements = document.querySelectorAll('.step-card, .feature-card, .testimonial-card');
      
      elements.forEach(element => {
        const elementPosition = element.getBoundingClientRect().top;
        const screenPosition = window.innerHeight / 1.3;
        
        if (elementPosition < screenPosition) {
          element.style.opacity = '1';
          element.style.transform = 'translateY(0)';
        }
      });
    }
  
    // Set initial state for animated elements
    document.querySelectorAll('.step-card, .feature-card, .testimonial-card').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'all 0.5s ease';
    });
  
    window.addEventListener('scroll', animateOnScroll);
    animateOnScroll(); // Run once on load
  });
  
  // Additional Helper Functions
  function formatIndianRupee(amount) {
    return '₹' + amount.toLocaleString('en-IN');
  }
  
  // Initialize any third-party libraries here if needed
  // Example: Google Analytics, Facebook Pixel, etc.