/**
 * Simple test function to validate API structure
 * This can be run locally to test the backend without deployment
 */

async function testAPI() {
  console.log('🧪 Testing API structure...');
  
  try {
    // Test handler import
    const handler = await import('./handler');
    console.log('✅ Handler imported successfully');
    
    // Test service import
    const { analyzeCSVWithAI } = await import('./services/financial-analyzer');
    console.log('✅ Financial analyzer service imported successfully');
    
    console.log('🎉 All imports working correctly!');
    console.log('📝 Ready for deployment to Vercel');
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Export for potential use in other tests
export { testAPI };

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testAPI();
}
