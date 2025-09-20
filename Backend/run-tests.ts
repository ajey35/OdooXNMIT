#!/usr/bin/env bun

import { spawn } from 'bun';

console.log('🚀 Starting Shiv Accounts Cloud Test Suite');
console.log('=' .repeat(60));

// Function to run tests with detailed logging
async function runTests() {
  console.log('\n📋 Available Test Suites:');
  console.log('1. 🔐 Authentication Tests (auth.test.ts)');
  console.log('2. 👥 Contact Management Tests (contact.test.ts)');
  console.log('3. 🚀 Complete Test Suite (test-runner.ts)');
  console.log('4. 🧪 All Tests');
  
  console.log('\n🔧 Running tests with detailed logging...\n');

  try {
    // Run the comprehensive test suite
    const testProcess = spawn([
      'bun',
      'test',
      'src/tests/test-runner.ts',
      '--verbose'
    ], {
      stdio: ['inherit', 'pipe', 'pipe']
    });

    // Capture and display output in real-time
    for await (const chunk of testProcess.stdout) {
      const output = new TextDecoder().decode(chunk);
      process.stdout.write(output);
    }

    for await (const chunk of testProcess.stderr) {
      const output = new TextDecoder().decode(chunk);
      process.stderr.write(output);
    }

    const exitCode = await testProcess.exited;
    
    console.log('\n' + '='.repeat(60));
    if (exitCode === 0) {
      console.log('🎉 All tests completed successfully!');
    } else {
      console.log('❌ Some tests failed. Check the output above for details.');
    }
    console.log('='.repeat(60));
    
    process.exit(exitCode);
    
  } catch (error) {
    console.error('❌ Error running tests:', error);
    process.exit(1);
  }
}

// Run the tests
runTests();
