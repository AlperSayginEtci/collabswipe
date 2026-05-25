import { createAuthClient } from "better-auth/react";

const authClient = createAuthClient({
  baseURL: "http://localhost:3001",
});

async function run() {
  const loginRes = await fetch('http://localhost:3001/api/auth/sign-in/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:5173' },
    body: JSON.stringify({
      email: 'test_company_2@test.com',
      password: 'password123',
    })
  });
  const cookie = loginRes.headers.get('set-cookie');
  
  const { data } = await authClient.getSession({
    fetchOptions: {
      headers: {
        'Cookie': cookie || '',
        'Origin': 'http://localhost:5173'
      }
    }
  });
  console.log('Session User:', data?.user);
}
run();
