import { validateIdea } from '../lib/gemini';

async function test() {
  console.log('Testing Gemini Validation...');
  try {
    const result = await validateIdea("A SaaS for managing remote team watercooler conversations using AI avatars.");
    console.log('✅ Gemini Success!');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Gemini Error:', error);
  }
}

test();
