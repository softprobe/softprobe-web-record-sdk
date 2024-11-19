### AREX RECORD SDK

This is the official SDK for the Arex Frontend Record API.

#### Installation

```bash
npm install @arextest/arex-record-sdk
```

#### Basic Usage

##### CDN

```html
<script>
  (function (w, d, c) {
    var s = document.createElement('script');
    s.src = c;
    s.onload = function () {
      new w.AREX_RECORD_SDK({
        appId: '<appId>',
        tenantCode: '<tenantCode>',
        serverUrl: '<serverUrl>'
      });
    };
    d.body.appendChild(s);
  })(window, document, 'https://unpkg.com/@arextest/arex-record-sdk');
</script>
```

##### npm

```javascript
import ArexRecordSdk from '@arextest/arex-record-sdk';

new ArexRecordSdk({
  appId: '<appId>',
  tenantCode: '<tenantCode>',
  serverUrl: '<serverUrl>'
});
```

#### Advanced Usage

```javascript
import ArexRecordSdk from '@arextest/arex-record-sdk';

const skd = new ArexRecordSdk({
  appId: '<appId>',
  tenantCode: '<tenantCode>',
  serverUrl: '<serverUrl>',
  timeout: 1000, // interval time for sending data to server, default 5000ms
  manual: true, // manual control record start and stop
  tags: {
    userId: '<userId>',
    clientId: '<clientId>',
    mobileNo: '<mobileNo>'
  },
  // other configurations refer to rrweb record documentation  https://github.com/rrweb-io/rrweb/blob/master/guide.md#options
  maskAllInputs: true
});

// set extra tags, also can be set in skd.record method
skd.setTags({
  ext: {
      extKey: 'extValue'
  }
});

const { stop } = skd.record();

// stop record after 10s
setTimeout(() => {
  stop();
  console.log('Stop record!');
}, 10000);
```

#### Development

```bash
pnpm install
pnpm run dev
pnpm run build # build sdk
pnpm run build:demo # build demo project
pnpm run build:dem-cdn # build demo project for cdn usage
pnpm run preview # preview demo project
```
