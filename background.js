const getStorageData = (key) =>
new Promise((resolve, reject) =>
  chrome.storage.sync.get(key, (result) => (chrome.runtime.lastError ? reject(Error(chrome.runtime.lastError.message)) : resolve(result))),
);

const setStorageData = (data) =>
new Promise((resolve, reject) =>
  chrome.storage.sync.set(data, () => (chrome.runtime.lastError ? reject(Error(chrome.runtime.lastError.message)) : resolve())),
);

chrome.runtime.onInstalled.addListener(() => 
setStorageData({ options: [{ activeProxy: {
  type: 'http',
  host: '',
  port: null,
}, proxyEnabled: false,}],}));

window.setOptions = async (options) => {
  await setStorageData({ options: [options] });
};

getStorageData('options').then((data) => {
  window.extOptions =   Object.assign(({ activeProxy = {
      type: 'http', host: '', port: null,
  }}, (data.options && data.options[0]) || data);
  
  await new Promise((resolve) => setTimeout(resolve, 100));
  
  window.disableProxy = () => {
    console.log('disable proxy');
    chrome.proxy.settings.set({ value: { mode: 'direct' }, scope: 'regular' }, function () {});
  };

  window.setProxy = (proxy=window.extOptions.activeProxy) => {
    const value = { mode: 'fixed_servers', rules: {
        singleProxy: {
          scheme: proxy.type,
          host: proxy.host,
          port: parseInt(proxy.port),
        }, bypassList: [],
      },
    };
    if (!proxy.type || !proxy.host || !proxy.port) {
      return { error: true, message: 'Invalid Proxy' };
    }
    console.log('proxy.setting.set', { value });
    chrome.proxy.settings.set({ value, scope: 'regular' }, function () {});
    chrome.proxy.onProxyError.addListener((_) => {
      console.error('Proxy error event triigerd by  chrome.proxy.onProxyError');
      chrome.extension.getViews({ type: 'popup' })[0] &&
      chrome.extension.getViews({ type: 'popup' })[0].postMessage({ action: 'proxyError' });
    });

    return { error: false, message: 'Proxy set to ' + proxy };
  };
});
