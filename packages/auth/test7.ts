import { createAuthClient } from "better-auth/react";

const authClient = createAuthClient({
  baseURL: "http://localhost:3001",
  fetchOptions: {
    customFetchImpl: async (url, options) => {
      console.log('FETCH CALLED!');
      console.log('URL:', url);
      console.log('BODY:', options?.body);
      return new Response(JSON.stringify({ user: { id: "1" }, token: "123" }));
    }
  }
});

async function run() {
  await authClient.signUp.email({
    email: 'test@test.com',
    password: 'password',
    name: 'Test',
    surname: '',
    role: 'company',
    sector: 'Tech',
    callbackURL: '/'
  } as any);
}
run();
