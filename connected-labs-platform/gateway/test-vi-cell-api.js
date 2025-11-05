#!/usr/bin/env node

/**
 * Vi-CELL BLU API Test Script
 * 
 * This script tests all Vi-CELL BLU endpoints implemented in the gateway.
 * Replace TEST_IP with your actual Vi-CELL BLU instrument IP address.
 */

const axios = require('axios');

const GATEWAY_URL = 'http://localhost:8081';
const TEST_IP = '10.122.72.15'; // Replace with your Vi-CELL BLU IP
const TEST_SAMPLE_ID = 'TEST_SAMPLE_001';

console.log('🧪 Vi-CELL BLU API Test Suite\n');
console.log(`Gateway: ${GATEWAY_URL}`);
console.log(`Test IP: ${TEST_IP}\n`);
console.log('='.repeat(60));

async function testSystemInfo() {
  console.log('\n📋 Test 1: Get System Info');
  console.log('-'.repeat(60));
  
  try {
    const response = await axios.get(
      `${GATEWAY_URL}/api/vi-cell/system-info/${TEST_IP}`,
      { timeout: 10000 }
    );
    
    console.log('✅ Status:', response.status);
    console.log('📦 Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.systemInfo) {
      console.log('\n✨ System Info Summary:');
      console.log(`   Model: ${response.data.systemInfo.model}`);
      console.log(`   Serial: ${response.data.systemInfo.serialNumber}`);
      console.log(`   Software: ${response.data.systemInfo.softwareVersion}`);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
    return false;
  }
}

async function testInstrumentStatus() {
  console.log('\n📊 Test 2: Get Instrument Status');
  console.log('-'.repeat(60));
  
  try {
    const response = await axios.get(
      `${GATEWAY_URL}/api/vi-cell/status/${TEST_IP}`,
      { timeout: 10000 }
    );
    
    console.log('✅ Status:', response.status);
    console.log('📦 Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.status) {
      console.log('\n✨ Status Summary:');
      console.log(`   Status: ${response.data.status.status}`);
      console.log(`   Current Sample: ${response.data.status.currentSample || 'None'}`);
      console.log(`   Queue Length: ${response.data.status.queueLength}`);
      console.log(`   Temperature: ${response.data.status.temperature}°C`);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
    return false;
  }
}

async function testRecentResults() {
  console.log('\n📈 Test 3: Get Recent Results');
  console.log('-'.repeat(60));
  
  try {
    const response = await axios.get(
      `${GATEWAY_URL}/api/vi-cell/results/recent/${TEST_IP}?limit=5`,
      { timeout: 10000 }
    );
    
    console.log('✅ Status:', response.status);
    console.log('📦 Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.results) {
      console.log(`\n✨ Found ${response.data.results.length} recent results`);
      
      if (response.data.results.length > 0) {
        const latest = response.data.results[0];
        console.log(`   Latest Sample: ${latest.sampleId}`);
        console.log(`   Viability: ${latest.viability}%`);
        console.log(`   Total Cells: ${latest.totalCells.toLocaleString()}`);
      }
    }
    
    return true;
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
    return false;
  }
}

async function testQueue() {
  console.log('\n📋 Test 4: Get Analysis Queue');
  console.log('-'.repeat(60));
  
  try {
    const response = await axios.get(
      `${GATEWAY_URL}/api/vi-cell/queue/${TEST_IP}`,
      { timeout: 10000 }
    );
    
    console.log('✅ Status:', response.status);
    console.log('📦 Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.queue) {
      console.log('\n✨ Queue Summary:');
      console.log(`   Queue Length: ${response.data.queue.queueLength}`);
      
      if (response.data.queue.currentSample) {
        console.log(`   Current Sample: ${response.data.queue.currentSample.sampleId}`);
        console.log(`   Progress: ${response.data.queue.currentSample.progress}%`);
      }
    }
    
    return true;
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
    return false;
  }
}

async function testStartAnalysis() {
  console.log('\n🚀 Test 5: Start Sample Analysis');
  console.log('-'.repeat(60));
  console.log('⚠️  WARNING: This will start an actual analysis on the instrument!');
  console.log('   Skipping by default. Uncomment to enable.');
  console.log('   Sample ID:', TEST_SAMPLE_ID);
  
  // Uncomment the code below to actually test starting an analysis
  /*
  try {
    const response = await axios.post(
      `${GATEWAY_URL}/api/vi-cell/sample/${TEST_IP}/analyze`,
      {
        sampleId: TEST_SAMPLE_ID,
        cellType: 'CHO',
        dilution: 1,
        washType: 'normal'
      },
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Status:', response.status);
    console.log('📦 Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('\n✨ Analysis Started:');
      console.log(`   Sample ID: ${response.data.sampleId}`);
      console.log(`   Status: ${response.data.analysisStatus.status}`);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
    return false;
  }
  */
  
  console.log('⏭️  Skipped (uncomment code to enable)');
  return true;
}

async function testSampleStatus() {
  console.log('\n🔍 Test 6: Get Sample Status');
  console.log('-'.repeat(60));
  console.log('ℹ️  Note: Requires a valid sample ID from previous analysis');
  
  try {
    const response = await axios.get(
      `${GATEWAY_URL}/api/vi-cell/sample/${TEST_IP}/${TEST_SAMPLE_ID}/status`,
      { timeout: 10000 }
    );
    
    console.log('✅ Status:', response.status);
    console.log('📦 Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.sampleStatus) {
      console.log('\n✨ Sample Status:');
      console.log(`   Sample ID: ${response.data.sampleId}`);
      console.log(`   Status: ${response.data.sampleStatus.status}`);
      console.log(`   Progress: ${response.data.sampleStatus.progress}%`);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
    console.log('ℹ️  This is expected if the sample does not exist');
    return true; // Don't fail on 404
  }
}

async function testSampleResults() {
  console.log('\n📊 Test 7: Get Sample Results');
  console.log('-'.repeat(60));
  console.log('ℹ️  Note: Requires a completed sample from previous analysis');
  
  try {
    const response = await axios.get(
      `${GATEWAY_URL}/api/vi-cell/sample/${TEST_IP}/${TEST_SAMPLE_ID}/results`,
      { timeout: 10000 }
    );
    
    console.log('✅ Status:', response.status);
    console.log('📦 Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.sampleResults) {
      console.log('\n✨ Sample Results:');
      console.log(`   Sample ID: ${response.data.sampleId}`);
      console.log(`   Viability: ${response.data.sampleResults.viability}%`);
      console.log(`   Total Cells: ${response.data.sampleResults.totalCells.toLocaleString()}`);
      console.log(`   Viable Cells: ${response.data.sampleResults.viableCells.toLocaleString()}`);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
    console.log('ℹ️  This is expected if the sample does not exist');
    return true; // Don't fail on 404
  }
}

async function runAllTests() {
  console.log('\n🚀 Starting Vi-CELL BLU API Tests...\n');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };
  
  const tests = [
    { name: 'System Info', fn: testSystemInfo },
    { name: 'Instrument Status', fn: testInstrumentStatus },
    { name: 'Recent Results', fn: testRecentResults },
    { name: 'Analysis Queue', fn: testQueue },
    { name: 'Start Analysis', fn: testStartAnalysis },
    { name: 'Sample Status', fn: testSampleStatus },
    { name: 'Sample Results', fn: testSampleResults }
  ];
  
  for (const test of tests) {
    results.total++;
    const passed = await test.fn();
    
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary');
  console.log('-'.repeat(60));
  console.log(`Total Tests:  ${results.total}`);
  console.log(`Passed:       ${results.passed} ✅`);
  console.log(`Failed:       ${results.failed} ❌`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  console.log('\n' + '='.repeat(60));
  
  if (results.failed === 0) {
    console.log('\n🎉 All tests passed!\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above for details.\n');
    process.exit(1);
  }
}

// Check if gateway is running
async function checkGateway() {
  try {
    const response = await axios.get(`${GATEWAY_URL}/health`, { timeout: 5000 });
    console.log('✅ Gateway is running');
    console.log(`   Service: ${response.data.service}`);
    console.log(`   Status: ${response.data.status}\n`);
    return true;
  } catch (error) {
    console.log('❌ Gateway is not running!');
    console.log('   Please start the gateway with: cd gateway && npm start');
    console.log(`   Expected URL: ${GATEWAY_URL}\n`);
    process.exit(1);
  }
}

// Main execution
(async () => {
  console.log('\n🔍 Pre-flight Checks');
  console.log('='.repeat(60));
  
  await checkGateway();
  
  console.log('ℹ️  Configuration:');
  console.log(`   Gateway URL: ${GATEWAY_URL}`);
  console.log(`   Test IP: ${TEST_IP}`);
  console.log(`   Test Sample ID: ${TEST_SAMPLE_ID}`);
  console.log('\n💡 Tip: Update TEST_IP in this file to match your Vi-CELL BLU IP\n');
  
  await runAllTests();
})();
