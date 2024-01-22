if (process.env.NODE_ENV === 'development') {
  console.log('imma erased');
}

console.log('lorem ipsum dolor sil amet');
console.error(new Error('aaaaaaaaa'));

function add(a: number, b: number) {
  debugger;
  return a + b;
}
