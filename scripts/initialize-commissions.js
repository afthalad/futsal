// Script to initialize commission records for all ground owners
// Run this script to create commission records for existing bookings

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');

// Firebase configuration (replace with your config)
const firebaseConfig = {
  // Add your Firebase config here
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function initializeAllCommissions() {
  try {
    console.log('Starting commission initialization...');
    
    // Get all ground owners
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const groundOwners = [];
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      if (userData.role === 'GROUND_OWNER') {
        groundOwners.push({ id: doc.id, ...userData });
      }
    });
    
    console.log(`Found ${groundOwners.length} ground owners`);
    
    // For each ground owner, initialize their commissions
    for (const owner of groundOwners) {
      console.log(`Processing owner: ${owner.name || owner.phone}`);
      
      try {
        // Call the API endpoint to initialize commissions
        const response = await fetch('http://localhost:3000/api/payments/initialize-commissions', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${owner.token || 'dummy-token'}` // You might need to handle auth differently
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log(`  Created ${result.created.length} commission records`);
        } else {
          console.log(`  Failed to initialize commissions for ${owner.name || owner.phone}`);
        }
      } catch (error) {
        console.error(`  Error processing ${owner.name || owner.phone}:`, error.message);
      }
    }
    
    console.log('Commission initialization completed!');
  } catch (error) {
    console.error('Error initializing commissions:', error);
  }
}

// Run the script
initializeAllCommissions();
