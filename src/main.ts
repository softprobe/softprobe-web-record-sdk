import './style.css';
import typescriptLogo from './typescript.svg';
import viteLogo from '/vite.svg';
import { setupCounter } from './counter';
import RecordSdk from './lib/sdk';


new RecordSdk({
  serverUrl: 'https://api.yunfeizuo.workers.dev/api/recordings',
  appId: 'appId123',
  authToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBJZCI6IjEyMzQ1Njc4OTAiLCJ0ZW5hbnQiOiJqb24iLCJpYXQiOjE1MTYyMzkwMjJ9.yp61mnebnorgEP3NU34E1mbFNSEqAVFgF2GVWtEk51g',
  tags: {
    userId: 'userId123',
    clientId: 'clientId1234567890',
    email: 'test@test.com',
    phoneNo: '1234567890',
  }
});

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <a href="https://vite.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://www.typescriptlang.org/" target="_blank">
      <img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />
    </a>
    <h1>Vite + TypeScript</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite and TypeScript logos to learn more
    </p>
  </div>
`;

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!);
