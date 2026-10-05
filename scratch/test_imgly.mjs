import fs from 'fs';
import { removeBackground } from '@imgly/background-removal';

async function test() {
  console.log('Testing removeBackground in node...');
  try {
    const buffer = fs.readFileSync('public/products/matta-rice.png');
    const blob = new Blob([buffer], { type: 'image/png' });
    console.log('Blob size:', blob.size);
    const result = await removeBackground(blob, {
      model: 'isnet_quint8',
      output: { format: 'image/png' },
      progress: (key, cur, tot) => console.log(key, cur, tot)
    });
    console.log('Success, result size:', result.size);
  } catch (err) {
    console.error('Error in removeBackground:', err);
  }
}

test();
