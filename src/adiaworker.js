export class ADiaWorker {
  delay = 0; // ms
  loadingProbeInterval = 300; // ms
  input;
  source;

  /* Hooks */
  onresult = null
  onsuccess = null
  onerror = null
  onstatus = null
  oninit = null

  // inititializing, processing, idle
  #_status = 'initializing';

  /* Private Fields */
  #_delayTimer;

  constructor(key) {
    this.key = key
    this.ensureADiaAPI();
  }
  
  hook(name, data) {
    let handler = this[name]
    if (handler === undefined) {
      throw `Invalid hook name: ${name}`;
    }
    if (handler == null) {
      return
    }
    
    handler(this, data);
  }

  get status() {
    return this.#_status;
  }

  set status(newValue) {
    this.#_status = newValue;
    this.hook('onstatus', newValue);
  }

  ensureADiaAPI() {
    if (window.__adia__ === undefined) {
      setTimeout(this.ensureADiaAPI.bind(this), this.loadingProbeInterval);
      return;
    }
    
    window.__adia__.registerCallback(this.key, this.onResult.bind(this))
    window.__adia__.send(this.key, '?version');
  }
  
  cleanup() {
    window.__adia__.unregisterCallback(this.key)
  }

  send() {
    if (this.input === undefined) {
      return;
    }
    let newSource = this.input();
    if (this.source == newSource) {
      /* Do Nothing */
      return;
    }
    
    this.status = 'processing';
    this.source = newSource;
    window.__adia__.send(this.key, this.source);
  }

  go() {
    if (this.status != 'idle') {
      return
    }

    if (this.delay > 0) {
      clearTimeout(this.#_delayTimer);
      this.#_delayTimer = setTimeout(this.send.bind(this), this.delay);
    }
    else {
      this.send();
    }
  }
  
  onResult(result) {
    if (result.type ==  'version') {
      this.__version__ = result.answer
      this.hook('oninit')
    }
    else {
      this.hook('onresult', result)
      if (result.error) {
        this.hook('onerror', result.error)
      }
      else {
        this.hook('onsuccess', result.answer)
      }
    }
    this.status = 'idle';
    this.go();
  }
}

//window.aDia = new ADia();
