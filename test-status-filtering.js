const googleSheetsService = require('./services/googleSheetsService');
const fs = require('fs');

/**
 * Test the status filtering functionality
 */
async function testStatusFiltering() {
  console.log('🚀 TESTING STATUS FILTERING FUNCTIONALITY');
  console.log('=========================================');
  
  try {
    // Read test CSV file
    const csvContent = fs.readFileSync('./test-status-spreadsheet.csv', 'utf8');
    
    // Parse CSV manually for this test
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',');
    const data = lines.slice(1).map(line => {
      const values = line.split(',');
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      return row;
    });
    
    console.log('📊 Original spreadsheet data:');
    console.table(data);
    
    // Test finding columns
    const linkedinColumn = googleSheetsService.findLinkedInColumn(data);
    const statusColumn = googleSheetsService.findStatusColumn(data);
    
    console.log(`\n📋 Found LinkedIn column: "${linkedinColumn}"`);
    console.log(`📊 Found status column: "${statusColumn}"`);
    
    // Test filtering "To Do" items
    const todoItems = googleSheetsService.filterToDoItems(data, statusColumn);
    
    console.log('\n🎯 Filtered "To Do" items:');
    console.table(todoItems);
    
    console.log(`\n📈 RESULTS:`);
    console.log(`   📊 Total rows: ${data.length}`);
    console.log(`   ✅ "To Do" items: ${todoItems.length}`);
    console.log(`   ✅ LinkedIn URLs to process:`);
    
    todoItems.forEach((item, index) => {
      console.log(`      ${index + 1}. ${item[linkedinColumn]}`);
    });
    
    // Test status update simulation
    console.log('\n🔄 Testing status update simulation...');
    for (let i = 0; i < todoItems.length; i++) {
      const item = todoItems[i];
      const profileUrl = item[linkedinColumn];
      
      // Find original index
      const originalIndex = data.findIndex(row => row[linkedinColumn] === profileUrl);
      
      console.log(`📝 Simulating processing: ${profileUrl}`);
      await googleSheetsService.updateRowStatus('test-url', originalIndex, statusColumn, 'Done');
    }
    
    console.log('\n🎉 STATUS FILTERING TEST COMPLETED SUCCESSFULLY!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testStatusFiltering();
