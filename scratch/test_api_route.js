const fs = require('fs');

async function testApi() {
  const b64 = fs.readFileSync('public/products/matta-rice.png').toString('base64');
  console.log('Sending request to http://localhost:3000/api/admin/remove-bg ...');
  const res = await fetch('http://localhost:3000/api/admin/remove-bg', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: 'data:image/png;base64,' + b64 })
  });
  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Success:', data.success);
  console.log('Source:', data.source);
  console.log('Transparent preview:', data.transparent?.slice(0, 50));
  console.log('Packshot preview:', data.packshot?.slice(0, 50));
}

testApi();
