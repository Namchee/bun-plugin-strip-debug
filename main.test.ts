import { expect, test } from 'bun:test';

import { stripDebuggers } from './main';

test('should strip console patterns', async () => {
  const text = `import ts from 'typescript';

  function add(a: number, b: number): number {
    console.log('this should be erased');
    return a + b;
  }
  
  console['error']('this should also be erased');`;

  const path = '/a/sample.ts';
  const result = await stripDebuggers(text, path, {});

  expect(/console/.test(result)).toBeFalse();
});

test('should strip console patterns from JavaScript files', async () => {
  const text = `import ts from 'typescript';
  
    function add(a, b): number {
      console.log('this should be erased');
      return a + b;
    }
    
    console['error']('this should also be erased');`;

  const path = '/a/sample.mjs';
  const result = await stripDebuggers(text, path, {});

  expect(/console/.test(result)).toBeFalse();
});

test('should strip console statement from jsx files', async () => {
  const text = `export default function TodoList() {
      console.log('this should be erased');
      
      return (
        <>
          <h1>Hedy Lamarr's Todos</h1>
          <img 
            src="https://i.imgur.com/yXOvdOSs.jpg" 
            alt="Hedy Lamarr" 
            className="photo" 
          />
          <ul>
            <li>Invent new traffic lights</li>
            <li>Rehearse a movie scene</li>
            <li>Improve the spectrum technology</li>
          </ul>
        </>
      );`;

  const path = '/a/sample.tsx';
  const result = await stripDebuggers(text, path, {});

  expect(/console/.test(result)).toBeFalse();
});

test('should not strip methods that are excluded', async () => {
  const text = `export default function TodoList() {
    console.log('this should be erased');
    console.error('this should not be erased');

    console['error']('this should also not be erased');

    console.table('this can go');
    
    return (
      <>
        <h1>Hedy Lamarr's Todos</h1>
        <img 
          src="https://i.imgur.com/yXOvdOSs.jpg" 
          alt="Hedy Lamarr" 
          className="photo" 
        />
        <ul>
          <li>Invent new traffic lights</li>
          <li>Rehearse a movie scene</li>
          <li>Improve the spectrum technology</li>
        </ul>
      </>
    );`;

  const path = '/a/sample.tsx';
  const result = await stripDebuggers(text, path, { exclude: ['error'] });

  expect(/console\.log/.test(result)).toBeFalse();
  expect(/console\.error/.test(result)).toBeTrue();
});

test('corner case - inline if', async () => {
  const text = `if (DEBUG) console.log('am debuggin')`;

  const path = '/a/sample.ts';
  const result = await stripDebuggers(text, path, {});

  expect(/console\.log/.test(result)).toBeFalse();
});
