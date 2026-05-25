async function test() {
  const res = await fetch('http://localhost:3001/api/auth/sign-up/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:5173' },
    body: JSON.stringify({
      email: 'test_company_2@test.com',
      password: 'password123',
      name: 'Test Company',
      role: 'company',
      sector: 'Tech'
    })
  });
  console.log(await res.json());
}
test();
