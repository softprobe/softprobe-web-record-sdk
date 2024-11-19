import './style.css';
import typescriptLogo from './typescript.svg';
import viteLogo from '/vite.svg';
import { setupCounter } from './counter';
// import ArexRecordSdk from './lib/sdk';
// import  ArexRecordSdk  from '@arextest/arex-record-sdk';

// 基础使用方式
// new ArexRecordSdk({
//   appId: 'MALL-81',
//   tenantCode: 'trip',
//   serverUrl: 'http://arex-storage.fat3.tripqate.com/api/rr/record'
// });

// 进阶使用方式
// const skd = new ArexRecordSdk({
//   appId: 'MALL-81',
//   tenantCode: 'trip',
//   serverUrl: 'http://arex-storage.fat3.tripqate.com/api/rr/record',
//   timeout: 1000, // 上报周期时间，默认5000ms
//   manual: true, // 手动控制录制，默认false
//   // 其他 rrweb record 配置项 https://github.com/rrweb-io/rrweb/blob/master/guide.md#options
//   maskAllInputs: true
// });
// const { stop } = skd.record();

// setTimeout(() => {
//   stop();
//   console.log('stop record');
// }, 10000);

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
