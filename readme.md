### SOFTPROBE RECORD SDK

This is the official SDK for the Softprobe Frontend Record API.

#### Installation

```bash
npm install @softprobe/softprobe-web-record-sdk
```

#### Basic Usage

##### CDN

Add the following script to the head tag.

```html
  <script>
    (function (w, d, c) {
      var a = d.getElementsByTagName('head')[0];
      var s = document.createElement('script');
      s.src = c;
      s.onload = function () {
        w.SoftprobeRecordSdk.init({
          appId: 'appId123',
          tenantId: 'tenant123',
          tags: {
            userId: 'userId123',
            clientId: 'clientId1234567890',
            email: 'test@test.com',
            phoneNo: '1234567890',
          }
        });
      }
      a.appendChild(s);
    })(window, document, 'http://localhost:4173/softprobe-web-record-sdk.umd.js', 'SoftprobeRecordSdk', 'init');
    </script>
    ```

##### npm

```javascript
import RecordSdk from '@softprobe/softprobe-web-record-sdk';

// The only required parameter are appId and tenantId
new RecordSdk({
    appId: '<appId>',
    tenantId: '<tenantId>'
});
```

#### Advanced Usage

Custom tags are simple key-value pairs that you can use to add additional information to the recording. 
They are useful for adding user information, or any other information that you want to record with the recording.

```javascript
import RecordSdk from '@softprobe/softprobe-web-record-sdk';

const skd = new RecordSdk({
  tenantId: '<tenantId>',
  appId: '<appId>',
  timeout: 10000, // 10s
  manual: true, // manual control record start and stop

  // You can set custom tags here
  tags: {
    userId: '<userId>',
    clientId: '<clientId>',
    mobileNo: '<mobileNo>'
  },

  maskAllInputs: true
});

// set custom tags
skd.setTags({
  country: 'US',
  state: 'CA',
});

// or you can add tags when you record
const { stop } = skd.record({
  tags: {
    'address.street': '123 Main St',
    'address.city': 'San Francisco',
    'address.state': 'CA',
    'address.zip': '94101'
  }
});

// stop record after 10s
setTimeout(() => {
  stop();
  console.log('Stop record!');
}, 20000);
```

#### Development

```bash
npm install
npm run dev
npm run build # build sdk
npm run build:demo # build demo project
npm run build:dem-cdn # build demo project for cdn usage
npm run preview # preview demo project
```
