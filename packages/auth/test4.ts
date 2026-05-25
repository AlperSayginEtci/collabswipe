import { authClient } from './src/client';

async function test() {
  const res = await authClient.signUp.email({
    email: 'test_client_signup@test.com',
    password: 'password123',
    name: 'Client Company',
    role: 'company',
    sector: 'Tech',
    surname: '',
    callbackURL: '/'
  } as any);
  console.log(res);
}
test();
