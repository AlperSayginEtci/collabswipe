async function test() {
  const loginRes = await fetch('http://localhost:3001/api/auth/sign-in/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:5173' },
    body: JSON.stringify({
      email: 'test_company_2@test.com',
      password: 'password123',
    })
  });
  const data = await loginRes.json();
  console.log(data);
}
test();
