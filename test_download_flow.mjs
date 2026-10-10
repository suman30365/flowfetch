import fs from 'fs';
import { pipeline } from 'stream/promises';

const API_BASE = 'http://localhost:3000';
const TEST_URL = 'https://www.youtube.com/watch?v=jNQXAC9IVRw'; // "Me at the zoo", 18 seconds, good for testing

async function runTest() {
  console.log(`Analyzing URL: ${TEST_URL}`);
  
  // 1. Analyze
  const analyzeRes = await fetch(`${API_BASE}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: TEST_URL })
  });
  
  if (!analyzeRes.ok) {
    console.error('Analyze failed:', await analyzeRes.text());
    return;
  }
  
  const analyzeData = await analyzeRes.json();
  if (!analyzeData.success) {
    console.error('Analyze response not successful:', analyzeData);
    return;
  }
  
  const analysisId = analyzeData.data.analysisId;
  const formats = analyzeData.data.formats;
  console.log(`Analysis successful. Found ${formats.length} formats. Analysis ID: ${analysisId}`);
  
  // Pick the smallest video format for testing
  const format = formats.find(f => f.type === 'video' || f.type === 'video+audio') || formats[0];
  console.log(`Selected format: ${format.resolution} (${format.ext}) - ID: ${format.id}`);
  
  // 2. Start Download
  console.log('Starting download job...');
  const downloadRes = await fetch(`${API_BASE}/api/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analysisId, formatId: format.id })
  });
  
  if (!downloadRes.ok) {
    console.error('Start download failed:', await downloadRes.text());
    return;
  }
  
  const downloadData = await downloadRes.json();
  if (!downloadData.success) {
    console.error('Start download response not successful:', downloadData);
    return;
  }
  
  const jobId = downloadData.jobId;
  console.log(`Download job started successfully. Job ID: ${jobId}, Stream Mode: ${downloadData.streamMode}`);
  
  // 3. Stream File
  console.log('Fetching stream...');
  const streamRes = await fetch(`${API_BASE}/api/download/${jobId}`);
  
  if (!streamRes.ok) {
    console.error('Stream failed:', await streamRes.text());
    return;
  }
  
  console.log('Stream headers:');
  for (const [key, val] of streamRes.headers.entries()) {
    console.log(`  ${key}: ${val}`);
  }
  
  // Read a chunk to verify content
  if (streamRes.body) {
    const reader = streamRes.body.getReader();
    const { value, done } = await reader.read();
    if (value) {
      console.log(`Successfully read first chunk of ${value.length} bytes.`);
    } else if (done) {
      console.log('Stream finished immediately.');
    }
    
    // Stop reading and cancel
    await reader.cancel();
  } else {
    console.log('No body in response.');
  }
  
  console.log('Test completed successfully.');
}

runTest().catch(console.error);
