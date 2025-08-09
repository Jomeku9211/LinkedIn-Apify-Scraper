const axios = require('axios');

/**
 * Generate comment using ChatGPT Assistant API
 */
async function generateComment(firstName, postText, apiKey, assistantId) {
  try {
    console.log(`🤖 Generating comment for ${firstName} using ChatGPT...`);
    
    // Create a thread
    const threadResponse = await axios.post(
      'https://api.openai.com/v1/threads',
      {},
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        }
      }
    );

    const threadId = threadResponse.data.id;
    console.log(`📝 Created thread: ${threadId}`);

    // Add message to thread
    const messageContent = `Please generate a thoughtful, engaging comment for this LinkedIn post by ${firstName}:\n\n"${postText}"\n\nMake it personal, professional, and encouraging engagement.`;
    
    await axios.post(
      `https://api.openai.com/v1/threads/${threadId}/messages`,
      {
        role: 'user',
        content: messageContent
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        }
      }
    );

    // Run the assistant
    const runResponse = await axios.post(
      `https://api.openai.com/v1/threads/${threadId}/runs`,
      {
        assistant_id: assistantId
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        }
      }
    );

    const runId = runResponse.data.id;
    console.log(`🏃 Started run: ${runId}`);

    // Poll for completion
    let runStatus = 'queued';
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max
    
    while (runStatus !== 'completed' && runStatus !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      const statusResponse = await axios.get(
        `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'OpenAI-Beta': 'assistants=v2'
          }
        }
      );

      runStatus = statusResponse.data.status;
      attempts++;
      console.log(`⏳ Run status: ${runStatus} (attempt ${attempts}/${maxAttempts})`);
    }

    if (runStatus !== 'completed') {
      throw new Error(`ChatGPT run failed or timed out. Status: ${runStatus}`);
    }

    // Get the assistant's response
    const messagesResponse = await axios.get(
      `https://api.openai.com/v1/threads/${threadId}/messages`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      }
    );

    const messages = messagesResponse.data.data;
    const assistantMessage = messages.find(msg => msg.role === 'assistant');
    
    if (!assistantMessage) {
      throw new Error('No response from ChatGPT assistant');
    }

    const generatedComment = assistantMessage.content[0].text.value;
    console.log(`✅ Generated comment for ${firstName}: ${generatedComment.substring(0, 100)}...`);
    
    return generatedComment;

  } catch (error) {
    console.error('❌ Error generating comment with ChatGPT:', error.message);
    
    if (error.response) {
      console.error('❌ Status Code:', error.response.status);
      console.error('❌ OpenAI error response:', JSON.stringify(error.response.data, null, 2));
    }
    
    throw error;
  }
}

module.exports = {
  generateComment
};
