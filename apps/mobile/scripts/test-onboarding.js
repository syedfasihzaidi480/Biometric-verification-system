#!/usr/bin/env node

/**
 * Test Onboarding Script
 * 
 * This script helps test the onboarding flow by providing utilities
 * to check and reset the onboarding status.
 * 
 * Usage:
 *   node scripts/test-onboarding.js [command]
 * 
 * Commands:
 *   status  - Check current onboarding status
 *   reset   - Reset onboarding (clear the flag)
 *   help    - Show this help message
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const commands = {
  status: () => {
    console.log('\n📊 Checking Onboarding Status\n');
    console.log('To check the status in your app:');
    console.log('1. Open React Native Debugger');
    console.log('2. Go to AsyncStorage tab');
    console.log('3. Look for key: @onboarding_completed');
    console.log('   - If value is "true": User has seen onboarding');
    console.log('   - If key is missing: User has NOT seen onboarding\n');
    console.log('Or run this in your app\'s JS console:');
    console.log('  AsyncStorage.getItem("@onboarding_completed").then(console.log)\n');
  },

  reset: () => {
    console.log('\n🔄 How to Reset Onboarding\n');
    console.log('Method 1: Via Code (Temporary)');
    console.log('---------------------------------');
    console.log('1. Edit apps/mobile/src/app/index.jsx');
    console.log('2. Uncomment this line:');
    console.log('   await resetOnboarding();');
    console.log('3. Reload your app');
    console.log('4. REMEMBER to comment it out again!\n');
    
    console.log('Method 2: Via React Native Debugger');
    console.log('------------------------------------');
    console.log('1. Shake device or press Cmd+D (iOS) / Cmd+M (Android)');
    console.log('2. Enable "Debug JS Remotely"');
    console.log('3. Open React Native Debugger');
    console.log('4. Go to AsyncStorage tab');
    console.log('5. Delete key: @onboarding_completed\n');
    
    console.log('Method 3: Via Dev Console');
    console.log('-------------------------');
    console.log('1. In Chrome DevTools console, run:');
    console.log('   require("@react-native-async-storage/async-storage").default.removeItem("@onboarding_completed")\n');
    
    console.log('Method 4: Reinstall App');
    console.log('-----------------------');
    console.log('1. Uninstall the app from device/simulator');
    console.log('2. Run: npx expo run:ios or npx expo run:android\n');
  },

  help: () => {
    console.log('\n📚 Onboarding Test Helper\n');
    console.log('Available Commands:');
    console.log('  status  - Check how to verify onboarding status');
    console.log('  reset   - Show methods to reset onboarding');
    console.log('  help    - Show this help message\n');
    console.log('Test Flow:');
    console.log('1. Reset onboarding using one of the methods above');
    console.log('2. Launch the app');
    console.log('3. Should see onboarding screens');
    console.log('4. Complete or skip onboarding');
    console.log('5. Kill and relaunch app');
    console.log('6. Should go directly to main tabs (no onboarding)\n');
  },

  verify: () => {
    console.log('\n✅ Verification Checklist\n');
    console.log('[ ] First install shows onboarding');
    console.log('[ ] Can swipe through all 4 slides');
    console.log('[ ] Skip button works on slides 1-3');
    console.log('[ ] "Get Started" button appears on slide 4');
    console.log('[ ] After completion, navigates to main tabs');
    console.log('[ ] Subsequent launches skip onboarding');
    console.log('[ ] No console errors during flow\n');
    
    console.log('Expected Flow:');
    console.log('First Launch → Loading → Onboarding → Tabs');
    console.log('Next Launch  → Loading → Tabs (direct)\n');
  },

  debug: () => {
    console.log('\n🐛 Debug Checklist\n');
    console.log('If onboarding shows every time:');
    console.log('  ❌ Check: resetOnboarding() is commented out in index.jsx');
    console.log('  ❌ Check: setOnboardingCompleted() is called after completion');
    console.log('  ❌ Check: AsyncStorage permissions are granted\n');
    
    console.log('If onboarding never shows:');
    console.log('  ❌ Check: @onboarding_completed key in AsyncStorage');
    console.log('  ❌ Check: Clear AsyncStorage and try again');
    console.log('  ❌ Check: Navigation paths are correct\n');
    
    console.log('If app crashes:');
    console.log('  ❌ Check console for error messages');
    console.log('  ❌ Check AsyncStorage is properly imported');
    console.log('  ❌ Check Expo modules are installed\n');
    
    console.log('Useful Commands:');
    console.log('  npx react-devtools  - Launch React DevTools');
    console.log('  npx react-native log-android  - Android logs');
    console.log('  npx react-native log-ios      - iOS logs\n');
  }
};

function runCommand(cmd) {
  const command = (cmd || '').trim().toLowerCase();
  
  if (commands[command]) {
    commands[command]();
  } else if (!command || command === '') {
    commands.help();
  } else {
    console.log(`\n❌ Unknown command: "${cmd}"\n`);
    commands.help();
  }
  
  process.exit(0);
}

// Get command from args
const args = process.argv.slice(2);
const command = args[0];

// If no command provided, show help
if (!command) {
  commands.help();
  
  // Interactive mode
  rl.question('\nEnter a command (or press Enter to exit): ', (answer) => {
    rl.close();
    if (answer.trim()) {
      runCommand(answer);
    }
  });
} else {
  runCommand(command);
}

