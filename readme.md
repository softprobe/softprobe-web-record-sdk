### SOFTPROBE RECORD SDK

This is the official SDK for the Softprobe Frontend Record API.

#### Installation

```bash
npm install @softprobe/softprobe-web-record-sdk
```

#### Basic Usage

##### CDN

```html
<script>
  (function (w, d, c) {
    var s = document.createElement('script');
    s.src = c;
    s.onload = function () {
      new w.SOFTPROBE_RECORD_SDK({
        appId: '<appId>',
        tenantCode: '<tenantCode>',
      });
    };
    d.body.appendChild(s);
  })(window, document, 'https://unpkg.com/@softprobe/softprobe-web-record-sdk');
</script>
```

##### npm

```javascript
import RecordSdk from '@softprobe/softprobe-web-record-sdk';

// The only required parameter are appId and authToken
new RecordSdk({
    appId: '<appId>',
    authToken: '<authToken>'
});
```

#### Advanced Usage

Custom tags are simple key-value pairs that you can use to add additional information to the recording. 
They are useful for adding user information, or any other information that you want to record with the recording.

```javascript
import RecordSdk from '@softprobe/softprobe-web-record-sdk';

const skd = new RecordSdk({
  authToken: '<authToken>',
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

#### Sdk Options

| key                      | default            | description                                                  |
| ------------------------ |--------------------| ------------------------------------------------------------ |
| tenantCode               | required           | The code of tenant                                           |
| appId                    | required           | A unique id used to identify the application                 |
| interval                 | 5000               | Interval time for sending data to server. The minimum value is 5000 |
| manual                   | false              | Manual control record start and stop                         |
| tags                     | {}                 | A range of additional custom tags                            |
| serverUrl                | built-in           | The url of web record service                                |
| checkoutEveryNth         | -                  | take a full snapshot after every N events refer to the [checkout](https://github.com/rrweb-io/rrweb/blob/master/guide.md#checkout) chapter |
| checkoutEveryNms         | -                  | take a full snapshot after every N ms refer to the [checkout](https://github.com/rrweb-io/rrweb/blob/master/guide.md#checkout) chapter |
| blockClass               | 'rr-block'         | Use a string or RegExp to configure which elements should be blocked, refer to the [privacy](https://github.com/rrweb-io/rrweb/blob/master/guide.md#privacy) chapter |
| blockSelector            | null               | Use a string to configure which selector should be blocked, refer to the [privacy](https://github.com/rrweb-io/rrweb/blob/master/guide.md#privacy) chapter |
| ignoreClass              | 'rr-ignore'        | Use a string or RegExp to configure which elements should be ignored, refer to the [privacy](https://github.com/rrweb-io/rrweb/blob/master/guide.md#privacy) chapter |
| ignoreSelector           | null               | Use a string to configure which selector should be ignored, refer to the [privacy](https://github.com/rrweb-io/rrweb/blob/master/guide.md#privacy) chapter |
| ignoreCSSAttributes      | null               | array of CSS attributes that should be ignored               |
| maskTextClass            | 'rr-mask'          | Use a string or RegExp to configure which elements should be masked, refer to the [privacy](https://github.com/rrweb-io/rrweb/blob/master/guide.md#privacy) chapter |
| maskTextSelector         | null               | Use a string to configure which selector should be masked, refer to the [privacy](https://github.com/rrweb-io/rrweb/blob/master/guide.md#privacy) chapter |
| maskAllInputs            | false              | mask all input content as *                                  |
| maskInputOptions         | { password: true } | mask some kinds of input * refer to the [list](https://github.com/rrweb-io/rrweb/blob/588164aa12f1d94576f89ae0210b98f6e971c895/packages/rrweb-snapshot/src/types.ts#L77-L95) |
| maskInputFn              | -                  | customize mask input content recording logic                 |
| maskTextFn               | -                  | customize mask text content recording logic                  |
| slimDOMOptions           | {}                 | remove unnecessary parts of the DOM refer to the [list](https://github.com/rrweb-io/rrweb/blob/588164aa12f1d94576f89ae0210b98f6e971c895/packages/rrweb-snapshot/src/types.ts#L97-L108) |
| dataURLOptions           | {}                 | Canvas image format and quality ,This parameter will be passed to the OffscreenCanvas.convertToBlob(),Using this parameter effectively reduces the size of the recorded data |
| inlineStylesheet         | true               | whether to inline the stylesheet in the events               |
| hooks                    | {}                 | hooks for events refer to the [list](https://github.com/rrweb-io/rrweb/blob/9488deb6d54a5f04350c063d942da5e96ab74075/src/types.ts#L207) |
| packFn                   | -                  | refer to the [storage optimization recipe](https://github.com/rrweb-io/rrweb/blob/master/docs/recipes/optimize-storage.md) |
| sampling                 | -                  | refer to the [storage optimization recipe](https://github.com/rrweb-io/rrweb/blob/master/docs/recipes/optimize-storage.md) |
| recordCanvas             | false              | Whether to record the canvas element. Available options: `false`, `true` |
| recordCrossOriginIframes | false              | Whether to record cross origin iframes. rrweb has to be injected in each child iframe for this to work. Available options: `false`, `true` |
| recordAfter              | 'load'             | If the document is not ready, then the recorder will start recording after the specified event is fired. Available options: `DOMContentLoaded`, `load` |
| inlineImages             | false              | whether to record the image content                          |
| collectFonts             | false              | whether to collect fonts in the website                      |
| userTriggeredOnInput     | false              | whether to add `userTriggered` on input events that indicates if this event was triggered directly by the user or not. [What is `userTriggered`?](https://github.com/rrweb-io/rrweb/pull/495) |
| plugins                  | []                 | load plugins to provide extended record functions. [What is plugins?](https://github.com/rrweb-io/rrweb/blob/master/docs/recipes/plugin.md) |
| errorHandler             | -                  | A callback that is called if something inside of rrweb throws an error. The callback receives the error as argument. |


#### Development

```bash
npm install
npm run dev
npm run build # build sdk
npm run build:demo # build demo project
npm run build:dem-cdn # build demo project for cdn usage
npm run preview # preview demo project
```
