async function test() {
  const loginRes = await fetch('http://localhost:3001/api/auth/sign-in/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:5173' },
    body: JSON.stringify({
      email: 'test_company_2@test.com',
      password: 'password123',
    })
  });
  const cookie = loginRes.headers.get('set-cookie');
  console.log('Cookie:', cookie);

  const sessionRes = await fetch('http://localhost:3001/api/auth/get-session', {
    headers: { 'Cookie': cookie || '', 'Origin': 'http://localhost:5173' }
  });
  console.log(await sessionRes.json());
}
test();
