const { spawn } = require('child_process');
const fs = require('fs');

const b64 = fs.readFileSync('public/products/matta-rice.png').toString('base64');
console.log('Sending base64 of size:', b64.length);

const py = spawn('python', ['scripts/ai_remove_bg.py']);
let out = '';
let err = '';

py.stdout.on('data', (d) => out += d.toString());
py.stderr.on('data', (d) => err += d.toString());

py.on('close', (code) => {
  console.log('Exited with code:', code);
  if (err) console.error('Stderr:', err);
  try {
    const res = JSON.parse(out);
    console.log('Success:', res.success);
    console.log('Transparent length:', res.transparent?.length);
    console.log('Packshot length:', res.packshot?.length);
  } catch (e) {
    console.log('Raw output:', out.slice(0, 500));
  }
});

py.stdin.write(JSON.stringify({ imageBase64: b64 }));
py.stdin.end();
