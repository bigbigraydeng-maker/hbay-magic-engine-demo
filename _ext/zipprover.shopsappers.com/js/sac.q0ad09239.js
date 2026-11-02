
        window.SAC_SHOP = "icelandic-glacial.myshopify.com";
        window.SAC_CAPS = {
          schema: "2025-10",
          embed: true,
          waitlist: false,
          restrictAddToCart: true,
          uiMode: "embed"
        };
        window.SAC_SETTINGS_HASH = "a4db7b41fd6562eef070fe718e36ebb1711b34f40bb47646662f420b6c80bde7";
        window.SAC_APP_URL = "https://zipprover.shopsappers.com";
        window.SAC_SCOPE_HINT = {"schema":"2025-10","global":false,"isOnlyGlobal":false,"mode":"list","products":[],"collections":["482944123163","482944090395","482943926555"],"hash":"a4db7b41fd6562eef070fe718e36ebb1711b34f40bb47646662f420b6c80bde7","caps":{"schema":"2025-10","embed":true,"waitlist":false,"restrictAddToCart":true,"showEstimates":true,"uiMode":"popup"}};
        window.SAC_DESIGN_SETTINGS = {"showAs":"embed","popupTemplate":"3","popupHeading":"Check availability in your area","popupSubtext":"We currently serve selected locations. Enter your zip code below to check if we're available in your area.","availableMsg":"Great news! We currently serve your area.","notAvailableMsg":"Sorry, we don't serve your area yet. Stay tuned!","popupWaitlistSubtext":"Drop your email below, and we'll notify you as soon as we expand to your area.","successfullySub":"Thanks for joining our waitlist! We'll let you know when we're available in your area.","alreadySubscribedMsg":"You're already on our waitlist! We'll keep you updated as soon as we expand to your area.","popupImg":"1.svg","zipcodePlaceholder":"Enter your zip code","zipCheckBtnText":"Check Availability","waitlistBtnText":"Join Waitlist","continueShoppingBtnText":"Continue Shopping","tryDifferentZipcodeBtnText":"Change zip code","preLoader":"1.svg","formFieldColor":"#444444","popupHeadingColor":"#424242","popupSubTextColor":"#788188","sacIBGColor":"#f2f2f2","serviceAvailMsgColor":"#6A6A6A","serviceNotAvailMsgColor":"#DB4437","sacCheckIcon":"1.png","customCSS":"","emailPlaceholder":"name@example.com","embedHeading":"Check availability at","zipCheckBtnTextEmbed":"Check","availableMsgEmbed":"Great news! We serve your area.","notAvailableMsgEmbed":"Sorry, we don't serve your area yet :(","successfullySubEmbed":"Thanks! You've joined our waitlist.","embedPosition":"above","embedTargetSelector":"","embedOnCollectionPage":false,"popup":{"autoOpenWhenNoZip":true},"textConfig":{"label":"Check if your shipping zip is available for delivery","placeholder":"Enter Postal Code","checkBtn":"Check","hint":"Enter zipcode","msgAvailable":"Delivering to {{zip}}","msgUnavailable":"Not available for {{zip}}","changeBtn":"Change","popupHeader":{"enabled":true,"heading":"Check availability in your area","subtext":"We currently serve selected locations. Enter your zip code below to check if we're available in your area."},"waitlist":{"cta":"Enter your email to be notified when we open in your area","button":"Join Waitlist","success":"Thanks! You're on the list.","alreadySubscribed":"Already subscribed","emailPlaceholder":"Enter your email"}}};
        window.SAC_POWERED_BY_HTML = "";

(() => {
    if (!window.SAC_CAPS || window.SAC_CAPS.schema !== "2025-10") return;

    // Determine UI mode from design settings
    const uiMode = 'embed';
    
    // Time constants for easy configuration
    const TIME_CONSTANTS = {
      COOKIE_EXPIRE_DAYS: 365,
      VERDICT_CACHE_MAX_AGE_MS: 300000, // 5 minutes
      TTL_MIN_SECONDS: 300, // 5 minutes
      TTL_MAX_SECONDS: 900, // 15 minutes
      MOUNT_CACHE_TTL_MAX_SECONDS: 1800, // 30 minutes
      MOUNT_CACHE_TTL_DEFAULT_SECONDS: 600, // 10 minutes
      DEBOUNCE_MS: 100,
      AUTO_OPEN_DELAY_MS: 1000,
      CLICK_REATTACH_DELAY_MS: 100,
      CLICK_RETRY_DELAY_MS: 10
    };
    
    const STATE = { cache:new Map(), inflight:new Map() };
    const COOK = {
      get(n){ const m=document.cookie.match(new RegExp('(?:^|; )'+n.replace(/([.$?*|{}()[\]\/+^])/g,'\$1')+'=([^;]*)')); return m?decodeURIComponent(m[1]):''; },
      set(n,v,days=TIME_CONSTANTS.COOKIE_EXPIRE_DAYS){ const d=new Date(); d.setTime(d.getTime()+days*864e5); document.cookie = n + '=' + encodeURIComponent(v) + '; expires=' + d.toUTCString() + '; path=/'; }
    };

    const KEY = (shop,pid,zip,hash,colIds)=>{
      const ids = Array.isArray(colIds) ? Array.from(colIds).map(String).sort().join(',') : '';
      const normalizedZip = (zip || '').trim().toLowerCase();
      return shop + '|' + (pid||'') + '|' + normalizedZip + '|' + hash + '|c:' + ids;
    };
    
    // ---------- ZipState: Central ZIP validation store ----------
    const ZipState = {
      _currentZip: null,
      _verdictCache: new Map(),
      _changeCallbacks: new Set(),
      
      getZip() {
        const zip = this._currentZip || COOK.get('sac_lastzipcode') || '';
        // Ensure returned ZIP is normalized (trim + lowercase)
        return zip.trim().toLowerCase();
      },
      
      setZip(zip) {
        const normalizedZip = (zip || '').trim().toLowerCase();
        console.log('🔍 ZipState.setZip called with:', zip, 'normalized:', normalizedZip, 'current:', this._currentZip);
        if (normalizedZip !== this._currentZip) {
          console.log('🔍 ZipState: Updating from', this._currentZip, 'to', normalizedZip);
          this._currentZip = normalizedZip;
          if (normalizedZip) {
            COOK.set('sac_lastzipcode', normalizedZip);
          }
          this._notifyChange();
          
          // Don't dispatch ZIP changed event here - let the validators handle it
          // with the correct verdict from validation results
        } else {
          console.log('🔍 ZipState: ZIP unchanged, skipping update');
        }
      },
      
      key(productId, collectionIds) {
        const sortedCols = (collectionIds || []).sort().join(',');
        return (productId || '') + '|' + sortedCols;
      },
      
      getVerdict(key) {
        return this._verdictCache.get(key);
      },
      
      setVerdict(key, {zip, verdict}) {
        this._verdictCache.set(key, {zip, verdict, timestamp: Date.now()});
      },
      
      onChange(callback) {
        this._changeCallbacks.add(callback);
        return () => this._changeCallbacks.delete(callback);
      },
      
      _notifyChange() {
        this._changeCallbacks.forEach(cb => {
          try { cb(); } catch (e) { console.error('SAC ZipState callback error:', e); }
        });
      }
    };
    
    
    // ---------- Fresh verdict fetcher ----------
    // Unified function to get availability with comprehensive caching
    async function getAvailabilityWithEvents({shop, productId, zip, settingsHash, collectionIds}) {
      const currentZip = ZipState.getZip();
      if (!currentZip) {
        return {allowed: false, reason: 'no_zip', zip: '', verdict: 'unavailable'};
      }
      
      try {
        const res = await getAvailability({
          shop,
          productId,
          zip: currentZip,
          settingsHash,
          collectionIds
        }).catch(() => ({ verdict: 'soft', zip: currentZip }));
        
        // Normalize verdict
        const verdict = res.verdict === 'available' ? 'available' : 
                       res.verdict === 'unavailable' ? 'unavailable' : 'soft';
        
        // Dispatch sac:zip:changed event for popup script to listen to
        window.dispatchEvent(new CustomEvent('sac:zip:changed', {
          detail: {
            zip: res.zip || currentZip,
            verdict,
            productId,
            collectionIds,
            fullResult: res // Include the full validation result with messages
          }
        }));
        
        return {
          allowed: verdict !== 'unavailable',
          verdict,
          zip: res.zip || currentZip
        };
      } catch (error) {
        console.error('SAC: Error fetching verdict:', error);
        return {
          allowed: true, // Allow on error for UX
          verdict: 'soft',
          zip: currentZip
        };
      }
    }

    function getSacProductId(){ 
      return window.ShopifyAnalytics?.meta?.product?.id || 
             window.SAC_PAGE?.pid || 
             window.sacProdId || 
             null; 
    }

    function getSacCollectionId() {
      // Use SAC_PAGE as the primary source for collection context
      const sacPage = window.SAC_PAGE || {};
      
      // Check SAC_PAGE for standalone collection page (cid) - single collection
      if (sacPage.cid) {
        return String(sacPage.cid);
      }
      
      // Fallback to legacy sacCollectionIds for backward compatibility
      if (window.sacCollectionIds && Array.isArray(window.sacCollectionIds) && window.sacCollectionIds.length > 0) {
        return String(window.sacCollectionIds[0]); // Return first collection ID
      }
      
      // Fallback to body attribute
      const bodyCid = document.body?.getAttribute('data-collection-id');
      if (bodyCid) return String(bodyCid);
      
      return null;
    }

    function getCollectionContext(){
      // Use SAC_PAGE as the primary source for collection context
      const sacPage = window.SAC_PAGE || {};
      
      // Check SAC_PAGE for collection information (product page collections)
      if (sacPage.collections && Array.isArray(sacPage.collections) && sacPage.collections.length > 0) {
        return { collectionIds: sacPage.collections.map(id => String(id)) };
      }
      
      // Check SAC_PAGE for standalone collection page (cid)
      if (sacPage.cid) {
        return { collectionIds: [String(sacPage.cid)] };
      }
      
      // Fallback to legacy sacCollectionIds for backward compatibility
      if (window.sacCollectionIds && Array.isArray(window.sacCollectionIds) && window.sacCollectionIds.length > 0) {
        return { collectionIds: window.sacCollectionIds.map(id => String(id)) };
      }
      
      // Fallback to body attribute
      const bodyCid = document.body?.getAttribute('data-collection-id');
      if (bodyCid) return { collectionIds: [String(bodyCid)] };
      
      return { collectionIds: null };
    }
    
    function getCollectionContextForProduct(productId) {
      // For now, we use page-level collection context
      // This works for most cases (product pages, collection pages)
      // For related products in different collections, we'd need product-specific collection data
      // which would require server-side logic to determine which collections a product belongs to
      return getCollectionContext();
    }

    // ---------- Global Page Detection Functions ----------
    function isSacProductPage() {
      // Use the centralized product ID detection logic
      return !!getSacProductId();
    }

    function isSacCollectionPage() {
      // Use the centralized collection ID detection logic
      return !!getSacCollectionId();
    }

    function isSacGenericPage() {
      // Generic page is neither product nor collection page
      return !isSacProductPage() && !isSacCollectionPage();
    }

    async function fetchValidate(payload, idempotencyKey){
      const appUrl = window.SAC_APP_URL || '';
      const url = appUrl + '/api/zipprover/validate';
      const headers = {
        'Content-Type': 'application/json'
      };
      if (idempotencyKey) {
        headers['x-idempotency-key'] = idempotencyKey;
      }
      const r = await fetch(url, { method:'POST', headers, body: JSON.stringify(payload) });
      return r.json();
    }

    async function getAvailability({shop, productId, zip, settingsHash, collectionIds}){
      // Normalize ZIP code before processing
      const normalizedZip = (zip || '').trim().toLowerCase();
      const key = KEY(shop, productId, normalizedZip, settingsHash, collectionIds);
      console.log('SAC: getAvailability cache key:', key, 'for params:', {shop, productId, zip: normalizedZip, settingsHash, collectionIds});
      
      const now = Date.now();
      
      // Step 1: Check in-memory cache (fastest)
      const mem = STATE.cache.get(key);
      if (mem && mem.expiresAt > now) {
        console.log('SAC: Found in memory cache');
        return mem.data;
      }
      
      // Step 2: Check localStorage cache
      const raw = localStorage.getItem('sac:'+key);
      if (raw){
        try{ 
          const cached = JSON.parse(raw); 
          if (cached.expiresAt > now) {
            console.log('SAC: Found in localStorage cache');
            // Restore to memory cache
            STATE.cache.set(key, {data: cached.data, expiresAt: cached.expiresAt});
            return cached.data;
          }
        }catch(_){ }
      }
      
      // Step 3: Check ZipState cache (if available)
      const contextKey = ZipState.key(productId, collectionIds);
      const zipStateCached = ZipState.getVerdict(contextKey);
      if (zipStateCached && zipStateCached.zip === normalizedZip && (Date.now() - zipStateCached.timestamp) < TIME_CONSTANTS.VERDICT_CACHE_MAX_AGE_MS) {
        console.log('SAC: Found in ZipState cache');
        // Restore to both caches
        STATE.cache.set(key, {data: zipStateCached, expiresAt: zipStateCached.timestamp + TIME_CONSTANTS.VERDICT_CACHE_MAX_AGE_MS});
        try{ localStorage.setItem('sac:'+key, JSON.stringify({data: zipStateCached, expiresAt: zipStateCached.timestamp + TIME_CONSTANTS.VERDICT_CACHE_MAX_AGE_MS})); }catch(_){ }
        return zipStateCached;
      }
      
      // Step 4: Make API call (all caches failed)
      console.log('SAC: All caches missed, making API call');
      // Generate idempotency key for this attempt (reuse on retry to prevent double-counting)
      const idempotencyKey = crypto.randomUUID();
      const data = await fetchValidate({shop, zip: normalizedZip, productId, collectionIds, settingsHash}, idempotencyKey);
      const ttl = Math.max(TIME_CONSTANTS.TTL_MIN_SECONDS, Math.min(TIME_CONSTANTS.TTL_MAX_SECONDS, data.ttl||TIME_CONSTANTS.TTL_MAX_SECONDS));
      const exp = now + ttl*1000;
      
      // Step 5: Store in all caches
      STATE.cache.set(key, {data, expiresAt: exp});
      try{ localStorage.setItem('sac:'+key, JSON.stringify({data, expiresAt: exp})); }catch(_){ }
      ZipState.setVerdict(contextKey, { ...data, zip: normalizedZip, timestamp: now });
      
      if (data?.settingsHash && data.settingsHash !== settingsHash){ window.SAC_SETTINGS_HASH = data.settingsHash; }
      return data;
    }

    async function shouldMountPDP(){
      const H = window.SAC_SCOPE_HINT || {};
      
      // If we have global rules (either isOnlyGlobal or global), we can mount
      if (H.isOnlyGlobal || H.global) {
        console.log('SAC: Global rules detected, mounting without product/collection check');
        return true;
      }
      
      const pid = getSacProductId();
      const { collectionIds } = getCollectionContext();
      if (H.mode === 'list'){
        const inProducts = !!(pid && Array.isArray(H.products) && H.products.includes(String(pid)));
        const inCollections = !!(Array.isArray(collectionIds) && Array.isArray(H.collections) && collectionIds.some(id => H.collections.includes(String(id))));
        return inProducts || inCollections;
      }
      // probe mode
      const qs = new URLSearchParams({ shop: window.SAC_SHOP, pid: String(pid||''), cid: Array.isArray(collectionIds) ? String(collectionIds[0]||'') : '', hash: String(H.hash||'') }).toString();
      const key = 'sac:mount:'+qs;
      const r = await fetch(window.SAC_APP_URL+'/api/zipprover/can-mount?'+qs, { method:'GET' });
      const j = await r.json(); const ttl = Math.min(TIME_CONSTANTS.MOUNT_CACHE_TTL_MAX_SECONDS, j?.ttl||TIME_CONSTANTS.MOUNT_CACHE_TTL_DEFAULT_SECONDS);
      try{ localStorage.setItem(key, JSON.stringify({ v: !!j.shouldMount, exp: Date.now()+ttl*1000 })); }catch(_){ }
      return !!j.shouldMount;
    }

    function escapeHTML(s){
      const t=document.createElement('span');
      t.textContent=String(s??'');
      return t.innerHTML;
    }

    // Make page detection functions globally available (before popup/embed scripts)
    window.getSacProductId = getSacProductId;
    window.getSacCollectionId = getSacCollectionId;
    window.isSacProductPage = isSacProductPage;
    window.isSacCollectionPage = isSacCollectionPage;
    window.isSacGenericPage = isSacGenericPage;

    // Include embed functionality if needed
    
    // ---------- Embed Functionality ----------
    // Debug: Log the settings being passed
    console.log('SAC Embed: Settings check', {
      SAC_CAPS: window.SAC_CAPS,
      waitlist: window.SAC_CAPS?.waitlist,
      restrictAddToCart: window.SAC_CAPS?.restrictAddToCart
    });
    class PDPValidator{
      constructor(mount, form){
        this.mount = mount; this.form = form;
        this.mount.innerHTML = [
          '<div class="sac-validator sac-validator--pdp">',
          '  <div class="sac-checker" data-role="checker">',
          '    <label class="sac-label" data-role="label">' +
          '      <img src="' + (window.SAC_APP_URL || '') + '/media/sac/shipping-globe/' + ((window.SAC_DESIGN_SETTINGS?.sacCheckIcon) || '1.png') + '" alt="Delivery" class="sac-label-icon" />' +
          '      ' + (window.SAC_DESIGN_SETTINGS?.textConfig?.label || 'Check delivery') +
          '    </label>',
          '    <div class="sac-field">',
          '      <input class="sac-input" data-role="zip" maxlength="16" placeholder="' + (window.SAC_DESIGN_SETTINGS?.textConfig?.placeholder || 'Enter ZIP / PIN') + '" />',
          '      <button type="button" class="sac-btn" data-role="check">' + (window.SAC_DESIGN_SETTINGS?.textConfig?.checkBtn || 'Check') + '</button>',
          '    </div>' +
          (window.SAC_DESIGN_SETTINGS?.textConfig?.hint && window.SAC_DESIGN_SETTINGS.textConfig.hint.trim() !== '' 
            ? '    <div class="sac-hint">' + window.SAC_DESIGN_SETTINGS.textConfig.hint + '</div>' 
            : '') +
          '  </div>',
          '  <div class="sac-result" hidden aria-live="polite"></div>',
          '  <template data-tpl="ok">',
          '    <div class="sac-head">',
          '      <span class="sac-ico" aria-hidden="true">✅</span>',
          '      <span>' + (window.SAC_DESIGN_SETTINGS?.textConfig?.msgAvailable || 'Delivering to <strong class="sac-zip"></strong>').replace('{{zip}}', '<strong class="sac-zip"></strong>') + '</span>',
          '      <button class="sac-change" type="button">' + (window.SAC_DESIGN_SETTINGS?.textConfig?.changeBtn || 'Change') + '</button>',
          '    </div>',
          '    <div class="sac-components"></div>',
          '  </template>',
          '  <template data-tpl="no">',
          '    <div class="sac-head">',
          '      <span class="sac-ico" aria-hidden="true">❌</span>',
          '      <span>' + (window.SAC_DESIGN_SETTINGS?.textConfig?.msgUnavailable || 'Not available for <strong class="sac-zip"></strong>').replace('{{zip}}', '<strong class="sac-zip"></strong>') + '</span>',
          '      <button class="sac-change" type="button">' + (window.SAC_DESIGN_SETTINGS?.textConfig?.changeBtn || 'Change') + '</button>',
          '    </div>',
          '    <div class="sac-waitlist"></div>',
          '  </template>',
          window.SAC_POWERED_BY_HTML || '',
          '</div>'
        ].join('');
        this.root = this.mount.firstElementChild;
        this.ui = {
          checker: this.root.querySelector('.sac-checker'),
          input: this.root.querySelector('[data-role="zip"]'),
          checkBtn: this.root.querySelector('[data-role="check"]'),
          result: this.root.querySelector('.sac-result'),
          tplOk: this.root.querySelector('template[data-tpl="ok"]'),
          tplNo: this.root.querySelector('template[data-tpl="no"]'),
        };
        const cz = COOK.get('sac_lastzipcode'); 
        if (cz) {
          this.ui.input.value = cz;
          this.validateCachedZip(cz);
        }
        this.bindEvents();
        this.setupRestrictAddToCart();
        this.setupInitialState();
      }
      
      bindEvents() {
        if (this.ui.checkBtn) {
          this.ui.checkBtn.addEventListener('click', () => this.onCheckClick());
        }
        if (this.ui.input) {
          this.ui.input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              this.onCheckClick();
            }
          });
        }
      }
      
      async onCheckClick() {
        const zip = (this.ui.input.value || '').trim();
        if (!zip) {
          this.ui.input.focus();
          return;
        }
        await this.processZip(zip);
      }
      
      showChecker() {
        if (this.ui.checker) this.ui.checker.hidden = false;
        if (this.ui.result) this.ui.result.hidden = true;
      }
      
      hideChecker() {
        if (this.ui.checker) this.ui.checker.hidden = true;
        if (this.ui.result) this.ui.result.hidden = false;
      }
      
      setLoading(on){ 
        this.root.classList.toggle('sac--loading', !!on); 
        if (this.ui.checkBtn) this.ui.checkBtn.disabled = !!on; 
      }
      
      async validateCachedZip(zip){
        if (!zip) return;
        if (this.ui.input && !this.ui.input.value) {
          this.ui.input.value = zip;
        }
        await this.processZip(zip);
      }
      
      setupRestrictAddToCart() {
        console.log('SAC Embed: Setting up restrict add-to-cart', {
          restrictEnabled: window.SAC_CAPS?.restrictAddToCart,
          caps: window.SAC_CAPS
        });
        
        if (!window.SAC_CAPS?.restrictAddToCart) {
          console.log('SAC Embed: Restrict add-to-cart not enabled');
          return;
        }
        
        const pdpForm = this.findPDPForm();
        if (!pdpForm) {
          console.warn('SAC Embed: PDP form not found');
          return;
        }
        
        console.log('SAC Embed: PDP form found, setting up restrictions');
        
        this.pdpForm = pdpForm;
        
        // Initialize buttons right after finding the form
        this.initializeButtons();
        
        this.updateFormButtons(null, null);
        this.preventFormSubmission();
        this.setupBuyNowOverlay();
      }
      
      initializeButtons() {
        console.log('SAC Embed: Initializing buttons after form found');
        
        // Try multiple selectors for add-to-cart button
        const addToCartSelectors = [
          'button[type="submit"][name="add"]',
          'button[type="submit"]',
          'button[name="add"]',
          '.add-to-cart',
          '.product-form__cart-submit',
          '[data-add-to-cart]',
          'button[data-testid="add-to-cart"]'
        ];
        
        for (const selector of addToCartSelectors) {
          console.log('SAC Embed: Trying selector:', selector);
          this.addToCartBtn = this.pdpForm.querySelector(selector);
          if (this.addToCartBtn) {
            console.log('SAC Embed: Found add-to-cart button with selector:', selector);
            break;
          }
        }
          console.log(this.pdpForm,"this.pdpForm");
        
        if (!this.addToCartBtn) {
          console.warn('SAC Embed: No add-to-cart button found with any selector');
          // Try to find any submit button in the form
          this.addToCartBtn = this.pdpForm.querySelector('button[type="submit"]');
          if (this.addToCartBtn) {
            console.log('SAC Embed: Using fallback submit button');
          }
        }
        
        // Find buy-now button
        this.buyNowBtn = this.pdpForm.querySelector('.shopify-payment-button, .buy-now, .dynamic-checkout__button');
        
        console.log('SAC Embed: Button initialization complete', {
          hasAddToCartBtn: !!this.addToCartBtn,
          hasBuyNowBtn: !!this.buyNowBtn
        });
      }
      
      
      findPDPForm() {
        const selectors = [
          'form[action*="/cart/add"]',
          'form.product-form',
          '.product-form form',
        ];
        
        for (const selector of selectors) {
          const form = document.querySelector(selector);
          if (form && form.offsetParent !== null && !form.classList.contains('installment')) {
            console.log('SAC Embed: Found PDP form with selector:', selector, form);
            return form;
          }
        }
        
        const forms = document.querySelectorAll('form');
        for (const form of forms) {
          if (form.offsetParent !== null && 
              !form.classList.contains('installment') &&
              (form.querySelector('button[type="submit"][name="add"]') || form.querySelector('.add-to-cart'))) {
            console.log('SAC Embed: Found PDP form by scanning all forms:', form);
            return form;
          }
        }
        
        console.warn('SAC Embed: No PDP form found');
        return null;
      }
      
      updateFormButtons(verdict, zip) {
        this.currentVerdict = verdict;
        this.currentZip = zip;
        
        console.log('SAC Embed: updateFormButtons called', {
          verdict,
          zip,
          hasPdpForm: !!this.pdpForm,
          hasAddToCartBtn: !!this.addToCartBtn,
          hasBuyNowBtn: !!this.buyNowBtn
        });
        
        if (!this.pdpForm) return;
        
        const hasZip = zip && zip.trim().length > 0;
        const isUnavailable = verdict === 'unavailable';
        const shouldDisable = !hasZip || isUnavailable;
        
        if (this.addToCartBtn) {
          // Don't disable the button - use visual styling instead so clicks still work
          this.addToCartBtn.style.opacity = shouldDisable ? '0.6' : '1';
          this.addToCartBtn.style.cursor = shouldDisable ? 'not-allowed' : 'pointer';
          
          if (shouldDisable) {
            this.addToCartBtn.title = !hasZip ? 
              'Please check delivery availability first' : 
              'Product not available in your area';
            this.addToCartBtn.classList.add('sac-atc-disabled');
          } else {
            this.addToCartBtn.title = '';
            this.addToCartBtn.classList.remove('sac-atc-disabled');
          }
        }
        
        this.updateBuyNowOverlay();
      }
      
      preventFormSubmission() {
        console.log('SAC Embed: Form submission handling removed - let main client script handle all form logic');
        // Note: Form submission and click handlers removed to prevent conflicts with main client script
        // The embed script should only handle embed UI, not form submissions
      }
      
      setupBuyNowOverlay() {
        // Find all dynamic checkout buttons and buy-now buttons
        
        const defaultSelector = '.cart__dynamic-checkout-buttons, .shopify-payment-button, .dynamic-checkout__button, .buy-now';
        let dynamicButtons = document.querySelectorAll(defaultSelector);
        const configuredSelector = window.SAC_DESIGN_SETTINGS?.buyNowSelector;
        const customSelector = typeof configuredSelector === 'string' ? configuredSelector.trim() : '';

        if (customSelector) {
          try {
            dynamicButtons = Array.from(new Set([
              ...dynamicButtons,
              ...document.querySelectorAll(customSelector)
            ]));
          } catch (error) {
            console.warn('SAC: Invalid custom buy-now selector; using default buttons', customSelector);
          }
        }
  
        
        this.dynamicButtonOverlays = [];
        
        dynamicButtons.forEach((buttonContainer) => {
          if (!buttonContainer || buttonContainer.offsetParent === null) return;
          
          const overlay = document.createElement('div');
          overlay.className = 'buy-now-overlay-sac';
          overlay.innerHTML = '&nbsp;';
          overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(255, 255, 255, 0);
            z-index: 9999;
            cursor: pointer;
            display: none;
          `;
          
          // Make container relative positioned
          const computedStyle = window.getComputedStyle(buttonContainer);
          if (computedStyle.position === 'static') {
            buttonContainer.style.position = 'relative';
          }
          
          buttonContainer.appendChild(overlay);
          
          overlay.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            // Check if popup is enabled and should open popup
            const shouldOpenPopup = window.SAC_CAPS?.uiMode === 'popup' || 
                                  window.SAC_CAPS?.uiMode === 'both';
            
            if (shouldOpenPopup) {
              console.log('SAC Embed: Opening popup for dynamic button click');
              window.dispatchEvent(new CustomEvent('sac:open'));
            } else {
              console.log('SAC Embed: Scrolling to validator for dynamic button');
              this.scrollToValidator();
            }
            return false;
          });
          
          this.dynamicButtonOverlays.push({
            container: buttonContainer,
            overlay: overlay
          });
        });
        
        this.updateDynamicButtonOverlays();
      }
      
      updateBuyNowOverlay() {
        this.updateDynamicButtonOverlays();
      }
      
      updateDynamicButtonOverlays() {
        if (!this.dynamicButtonOverlays) return;
        
        const hasZip = this.currentZip && this.currentZip.trim() !== '';
        const isUnavailable = this.currentVerdict === 'unavailable';
        const shouldShowOverlay = !hasZip || isUnavailable;
        
        this.dynamicButtonOverlays.forEach(({ overlay }) => {
          overlay.style.display = shouldShowOverlay ? 'block' : 'none';
        });
      }
      
      setupInitialState() {
        console.log('SAC Embed: Setting up initial state', {
          hasZip: !!COOK.get('sac_lastzipcode'),
          restrictEnabled: window.SAC_CAPS?.restrictAddToCart,
          waitlistEnabled: window.SAC_CAPS?.waitlist
        });
        
        // If no ZIP and restrict is enabled, disable buttons immediately
        if (window.SAC_CAPS?.restrictAddToCart && !COOK.get('sac_lastzipcode')) {
          this.updateFormButtons(null, null);
        }
      }
      
      scrollToValidator() {
        console.log('SAC Embed: scrollToValidator called');
        try {
          const validator = this.mount.querySelector('.sac-validator');
          if (validator) {
            console.log('SAC Embed: Scrolling to validator');
            validator.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center',
              inline: 'nearest'
            });
            
            validator.style.transition = 'box-shadow 0.3s ease';
            validator.style.boxShadow = '0 0 0 3px rgba(255, 193, 7, 0.5)';
            
            setTimeout(() => {
              validator.style.boxShadow = '';
            }, 3000);
          }
        } catch (error) {
          if (this.mount) {
            this.mount.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
          }
        }
      }
      
      renderOk(res){
        const box = this.ui.result; if (!box) return;
        this.hideChecker();
        box.hidden = false; 
        box.className = 'sac-result sac-result--ok'; box.innerHTML = '';
        const frag = this.ui.tplOk.content.cloneNode(true);
        const zipElement = frag.querySelector('.sac-zip');
        if (zipElement) {
          zipElement.textContent = res.zip;
        }
        frag.querySelector('.sac-change').addEventListener('click', ()=>{ this.showChecker(); this.ui.input.focus(); this.ui.input.select?.(); });
        const wrap = frag.querySelector('.sac-components');
        const c = res.components||{};
        const add = (cls, text, icon) => { 
          if (!text) return; 
          const d=document.createElement('div'); 
          d.className='sac-comp '+cls; 
          if (icon) {
            const iconSpan = document.createElement('span');
            iconSpan.className = 'sac-ico';
            iconSpan.setAttribute('aria-hidden', 'true');
            iconSpan.textContent = icon;
            d.appendChild(iconSpan);
          }
          const textSpan = document.createElement('span');
          textSpan.textContent = text;
          d.appendChild(textSpan);
          wrap.appendChild(d); 
        };
        
        // Handle delivery message (text or calculated)
        if (c.delivery?.enabled) {
          if (c.delivery.mode === 'calculated' && c.delivery.eta && c.delivery.text) {
            if (window.renderSACEta) {
              const ctx = {
                remaining: c.delivery.eta.remaining || "",
                etaStart: c.delivery.eta.etaStartFmt || "",
                etaEnd: c.delivery.eta.etaEndFmt || "",
                zip: res.zip || ""
              };
              const renderedText = window.renderSACEta(c.delivery.text, ctx);
              if (renderedText) {
                add('sac-delivery', renderedText, '🚚');
              }
            }
            // If renderSACEta is not available, skip rendering to avoid showing placeholder text
          } else if (c.delivery.text) {
            add('sac-delivery', c.delivery.text, '🚚');
          }
        }
        if (c.cod?.enabled && c.cod.text) add('sac-cod', c.cod.text, '💵');
        if (c.returns?.enabled && c.returns.text) add('sac-returns', c.returns.text, '↩️');
        if (c.custom?.enabled && c.custom.html){ const d=document.createElement('div'); d.className='sac-comp sac-custom'; d.innerHTML=c.custom.html; wrap.appendChild(d); }
        box.appendChild(frag);
        this.updateFormButtons('available', res.zip);
        this.updateBuyNowOverlay();
      }
      
      renderNo(res){
        const box = this.ui.result; if (!box) return;
        this.hideChecker();
        box.hidden = false; 
        box.className = 'sac-result sac-result--no'; box.innerHTML = '';
        const frag = this.ui.tplNo.content.cloneNode(true);
        const zipElement = frag.querySelector('.sac-zip');
        if (zipElement) {
          zipElement.textContent = res.zip;
        }
        frag.querySelector('.sac-change').addEventListener('click', ()=>{ this.showChecker(); this.ui.input.focus(); this.ui.input.select?.(); });
        
        const canWaitlist = !!window.SAC_CAPS.waitlist;
        console.log('SAC Embed: Waitlist debug in renderNo', {
          waitlistEnabled: window.SAC_CAPS.waitlist,
          canWaitlist: canWaitlist,
          hasGlobalFunctions: !!(window.getWaitlistHtml && window.setupWaitlistEvents),
          response: res
        });
        
        const waitlistContainer = frag.querySelector('.sac-waitlist');
        if (canWaitlist) {
          console.log('SAC Embed: Waitlist container found:', !!waitlistContainer);
          if (waitlistContainer && window.getWaitlistHtml && window.setupWaitlistEvents) {
            console.log('SAC Embed: Setting up waitlist form');
            waitlistContainer.innerHTML = window.getWaitlistHtml();
            window.setupWaitlistEvents(waitlistContainer, res.zip);
          } else {
            console.warn('SAC Embed: Waitlist setup failed', {
              hasContainer: !!waitlistContainer,
              hasGetWaitlistHtml: !!window.getWaitlistHtml,
              hasSetupWaitlistEvents: !!window.setupWaitlistEvents
            });
          }
        } else {
          // Hide the waitlist container completely when waitlist feature is not available
          if (waitlistContainer) {
            waitlistContainer.style.display = 'none';
          }
        }
        
        box.appendChild(frag);
        this.updateFormButtons('unavailable', res.zip);
        this.updateBuyNowOverlay();
      }
      
      renderSoft(zip){
        const box = this.ui.result; if (!box) return;
        this.hideChecker();
        box.hidden = false; box.className = 'sac-result sac-result--ok';
        box.innerHTML = '<div class="sac-head"><span class="sac-ico" aria-hidden="true">ℹ️</span><span>' + (window.SAC_DESIGN_SETTINGS?.textConfig?.msgAvailable || 'We\'ll deliver to <strong>' + (zip||'') + '</strong>.').replace('{{zip}}', '<strong>' + (zip||'') + '</strong>') + '</span><button class="sac-change" type="button">' + (window.SAC_DESIGN_SETTINGS?.textConfig?.changeBtn || 'Change') + '</button></div>';
        const btn = box.querySelector('.sac-change'); if (btn){ btn.addEventListener('click', ()=>{ this.showChecker(); this.ui.input.focus(); this.ui.input.select?.(); }); }
        this.updateFormButtons('available', zip);
        this.updateBuyNowOverlay();
      }
      
      async processZip(zip){
        const pid = getSacProductId(); const { collectionIds } = getCollectionContext();
        try {
          this.setLoading(true);
          const res = await getAvailability({ shop: window.SAC_SHOP, productId: pid, zip, settingsHash: window.SAC_SETTINGS_HASH, collectionIds }).catch(()=>({verdict:'error', zip}));
          if (res?.zip){ 
            COOK.set('sac_lastzipcode', res.zip); 
            // Dispatch the correct event for form updates on all page types
            window.dispatchEvent(new CustomEvent('sac:zip:changed', { 
              detail: { 
                zip: res.zip, 
                verdict: res.verdict || 'error'
              } 
            })); 
          }
          // Render results on all page types
          if (res?.verdict === 'available'){ 
            this.renderOk(res); 
            if (window.SAC_RESUME_INTENT) {
              window.SAC_RESUME_INTENT();
            }
          }
          else if (res?.verdict === 'unavailable'){ this.renderNo(res); }
          else { this.renderSoft(zip); }
        } catch(error) {
          this.renderSoft(zip);
        } finally {
          this.setLoading(false);
        }
      }
    }

    function injectPDP(){
      // Check if this is a cart page - don't embed on cart page when uimode is embed
      const sacPage = window.SAC_PAGE || {};
      const uiMode = window.SAC_CAPS?.uiMode || 'embed';
      const designSettings = window.SAC_DESIGN_SETTINGS || {};
      const pos = designSettings.embedPosition || 'above';
      const customSelector = (designSettings.embedTargetSelector || '').trim();

      // Allow embed on any page when custom placement is configured and valid.
      if (pos === 'custom' && customSelector) {
        const customTarget = document.querySelector(customSelector);
        if (customTarget) {
          if (customTarget.dataset.sacMounted === '1') return true;
          customTarget.dataset.sacMounted = '1';
          const mount = document.createElement('div'); mount.className='sac-mount';
          customTarget.appendChild(mount);
          new PDPValidator(mount, null);
          return true;
        }
      }
      
      // Check if cart page using SAC_PAGE.isCartPage (from liquid)
      let isCartPage = sacPage.isCartPage === true;
      
      // JS fallback: check window.location.pathname if SAC_PAGE.isCartPage is not available
      if (!isCartPage && window.location.pathname === '/cart') {
        isCartPage = true;
        console.log('SAC Embed: Cart page detected via JS fallback (window.location.pathname)');
      }
      
      // If it's a cart page and uimode is embed or both, skip embedding
      if (isCartPage && (uiMode === 'embed' || uiMode === 'both')) {
        console.log('SAC Embed: Skipping embed on cart page (uimode:', uiMode + ')');
        return false;
      }
      
      // Collection, home, and search pages share the collection-page visibility setting.
      const embedOnCollectionPage = designSettings.embedOnCollectionPage === true;
      const isCollectionPage = sacPage.isCollection === true;
      const isHomePage = sacPage.isHomePage === true;
      const isSearchPage = sacPage.isSearchPage === true;
      
      // Skip automatic mounting on these pages unless the setting is explicitly enabled.
      if ((isCollectionPage || isHomePage || isSearchPage) && !embedOnCollectionPage) {
        console.log('SAC Embed: Skipping embed on collection, home, or search page (embedOnCollectionPage setting is not enabled)');
        return false;
      }
      
      // Find candidate add-to-cart forms, excluding hidden and installment forms
      const allForms = Array.from(document.querySelectorAll('form[action*="/cart/add"]'));
      const forms = allForms.filter(f => {
        const id = String(f.id || '').toLowerCase();
        const hasInstallmentId = id.includes('installment');
        const hasInstallmentClass = f.classList.contains('installment');
        const isVisible = f.offsetParent !== null;
        return isVisible && !hasInstallmentId && !hasInstallmentClass;
      });
      if (!forms.length) return false;
      const form = forms.find(f => f.closest('[id*="Product"]')) || forms[0];
      if (form.dataset.sacMounted === '1') return true;
      form.dataset.sacMounted = '1';
      const mount = document.createElement('div'); mount.className='sac-mount';
      let mountedToCustom = false;

      if (pos === 'custom') {
        if (customSelector) {
          const customTarget = document.querySelector(customSelector);
          if (customTarget) {
            customTarget.appendChild(mount);
            mountedToCustom = true;
          } else {
            console.warn('SAC Embed: Custom selector not found, falling back to default placement', customSelector);
          }
        } else {
          console.warn('SAC Embed: Custom placement selected without selector, falling back to default placement');
        }
      }

      if (!mountedToCustom) {
        if (pos === 'below'){
          form.insertAdjacentElement('afterend', mount);
        } else if (form.parentNode){
          form.parentNode.insertBefore(mount, form);
        } else {
          form.insertAdjacentElement('beforebegin', mount);
        }
      }
      new PDPValidator(mount, form);
      return true;
    }
    
    // Inject embed-specific CSS
    function injectEmbedCSS(){
      if (document.getElementById('sac-v3-embed-css')) return;
      const css = '.sac-label{display:flex;align-items:center;gap:.5rem;margin-bottom:.5rem} .sac-label-icon{width:24px;height:24px;flex-shrink:0}';
      const el = document.createElement('style'); 
      el.id='sac-v3-embed-css'; 
      el.textContent = css; 
      document.head.appendChild(el);
    }
    
    // Make injectPDP available globally
    window.injectPDP = injectPDP;
    
    // Inject CSS when embed script loads
    injectEmbedCSS();
  

    // Include popup functionality if needed
    
    
    // Shared waitlist functionality
    function getWaitlistHtml() {
      const textConfig = window.SAC_DESIGN_SETTINGS?.textConfig?.waitlist || {};
      return '<div class="sac-waitlist-form">' +
        '<p class="sac-waitlist-text">' + (textConfig.cta || 'Enter your email to be notified when this product becomes available in your area') + '</p>' +
        '<div class="sac-waitlist-form-inner">' +
          '<div class="sac-waitlist-field">' +
            '<input type="email" class="sac-waitlist-email" placeholder="' + (textConfig.emailPlaceholder || 'Enter your email') + '" required />' +
            '<button type="button" class="sac-waitlist-btn">' + (textConfig.button || 'Join Waitlist') + '</button>' +
          '</div>' +
        '</div>' +
        '<div class="sac-waitlist-message" style="display: none;"></div>' +
      '</div>';
    }
    
    function setupWaitlistEvents(container, zip) {
      const waitlistForm = container.querySelector('.sac-waitlist-form-inner');
      const waitlistMessage = container.querySelector('.sac-waitlist-message');
      
      if (waitlistForm && waitlistMessage) {
        const emailInput = waitlistForm.querySelector('.sac-waitlist-email');
        const submitBtn = waitlistForm.querySelector('.sac-waitlist-btn');
        
        if (!emailInput || !submitBtn) return;
        
        submitBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          
          const email = emailInput.value.trim();
          if (!email) return;
          
          submitBtn.disabled = true;
          submitBtn.textContent = 'Joining...';
          
          try {
            const response = await fetch(window.SAC_APP_URL + '/api/zipprover/waitlist', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                shop: window.SAC_SHOP,
                email: email,
                zip: zip,
                productId: getSacProductId()
              })
            });
            
            const result = await response.json();
            if (result.success) {
              const textConfig = window.SAC_DESIGN_SETTINGS?.textConfig?.waitlist || {};
              waitlistMessage.textContent = textConfig.success || 'Thank you! We\'ll notify you when this product becomes available.';
              waitlistMessage.style.color = '#28a745';
              waitlistForm.style.display = 'none';
            } else {
              const textConfig = window.SAC_DESIGN_SETTINGS?.textConfig?.waitlist || {};
              waitlistMessage.textContent = result.message || textConfig.alreadySubscribed || 'You\'re already on the waitlist for this product!';
              waitlistMessage.style.color = '#ffc107';
            }
            waitlistMessage.style.display = 'block';
          } catch (error) {
            waitlistMessage.textContent = 'Something went wrong. Please try again.';
            waitlistMessage.style.color = '#dc3545';
            waitlistMessage.style.display = 'block';
          } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Join Waitlist';
          }
        });
      }
    }
    
    // Make waitlist functions globally available
    window.getWaitlistHtml = getWaitlistHtml;
    window.setupWaitlistEvents = setupWaitlistEvents;
    
    // Render ETA utility function (shared between popup and embed)
    function renderSACEta(templateText, ctx) {
      let out = templateText || "";
      return out
        .replace(/{{timeLeft}}/g, ctx.remaining || "")
        .replace(/{{etaMin}}/g, ctx.etaStart || "")
        .replace(/{{etaMax}}/g, ctx.etaEnd || "")
        .replace(/{{zip}}/g, ctx.zip || "")
        .replace(/s{2,}/g, " ")
        .trim()
        .replace(/-s*$/, "");
    }
    
    // Make renderSACEta globally available
    window.renderSACEta = renderSACEta;
    
    console.log('SAC: Global waitlist functions created', {
      getWaitlistHtml: typeof window.getWaitlistHtml,
      setupWaitlistEvents: typeof window.setupWaitlistEvents,
      SAC_CAPS: window.SAC_CAPS
    });
    
    // ---------- Global form management ----------
    const FORM_REGISTRY = new Map();
    const FORM_VALIDATION_STATES = new Map(); // Track current validation state for each form
    const QUICK_ADD_REGISTRY = new Map(); // Track quick-add-bulk elements
    let SAC_STORED_INTENT = null;
    
    // Get page context from SAC_PAGE
    function getPageContext() {
      const sacPage = window.SAC_PAGE || {};
      return {
        type: sacPage.type || 'unknown',
        isIndex: sacPage.isIndex || false,
        isCollection: sacPage.isCollection || false,
        isProduct: sacPage.type === 'product',
        productId: sacPage.pid || null,
        productCollections: sacPage.collections || [],
        collectionId: sacPage.cid || null,
        collectionHandle: sacPage.chandle || null
      };
    }

    // Check if this is a page that needs just-in-time validation (neither specific collection nor product page)
    function needsJustInTimeValidation() {
      const pageContext = getPageContext();
      const sacPage = window.SAC_PAGE || {};
      
      // If both cid and pid are null, it's either homepage or "all products" collection
      const isGenericPage = !sacPage.cid && !sacPage.pid;
      
      console.log('SAC: Checking if needs just-in-time validation', {
        pageContext,
        sacPage,
        isGenericPage
      });
      
      return isGenericPage;
    }

    // Check if a specific product has any applicable rules
    function hasApplicableRules(productId, collectionIds) {
      const scopeHint = window.SAC_SCOPE_HINT || {};
      
      console.log('SAC: hasApplicableRules called with:', {
        productId,
        collectionIds,
        scopeHint,
        isOnlyGlobal: scopeHint.isOnlyGlobal,
        global: scopeHint.global,
        products: scopeHint.products,
        collections: scopeHint.collections
      });
      
      // If isOnlyGlobal is true, all products are affected by global rules
      if (scopeHint.isOnlyGlobal) {
        console.log('SAC: isOnlyGlobal=true, returning true');
        return true;
      }
      
      // If global rules exist, all products are affected
      if (scopeHint.global) {
        console.log('SAC: global=true, returning true');
        return true;
      }
      
      // Check if this specific product has rules (works for both 'list' and 'probe' modes)
      if (productId && scopeHint.products) {
        const productIdStr = String(productId);
        const hasProductRule = scopeHint.products.includes(productIdStr);
        console.log('SAC: Checking product rules:', {
          productIdStr,
          products: scopeHint.products,
          hasProductRule
        });
        if (hasProductRule) {
          return true;
        }
      }
      
      // Check if any of the product's collections have rules (works for both 'list' and 'probe' modes)
      if (collectionIds && collectionIds.length > 0 && scopeHint.collections) {
        for (const collectionId of collectionIds) {
          const collectionIdStr = String(collectionId);
          const hasCollectionRule = scopeHint.collections.includes(collectionIdStr);
          console.log('SAC: Checking collection rules:', {
            collectionIdStr,
            collections: scopeHint.collections,
            hasCollectionRule
          });
          if (hasCollectionRule) {
            return true;
          }
        }
      }
      
      console.log('SAC: No applicable rules found, returning false');
      return false;
    }

    function registerForm(form, productId, collectionIds) {
      const formId = form.dataset.sacFormId || (form.dataset.sacFormId = 'form_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
      const needsJIT = needsJustInTimeValidation();
      const hasRules = hasApplicableRules(productId, collectionIds);
      
      FORM_REGISTRY.set(formId, {
        form, 
        productId, 
        collectionIds,
        needsJustInTimeValidation: needsJIT,
        hasApplicableRules: hasRules
      });
      console.log('SAC: Registered form:', formId, {
        productId, 
        collectionIds, 
        needsJustInTimeValidation: needsJIT,
        hasApplicableRules: hasRules
      });
      return formId;
    }
    
    function getFormContext(formId) {
      return FORM_REGISTRY.get(formId);
    }
    
    function registerQuickAddBulk(element, productId, collectionIds) {
      const elementId = element.id || element.dataset.sacQuickAddId || ('quickadd_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
      if (!element.id) element.dataset.sacQuickAddId = elementId;
      
      QUICK_ADD_REGISTRY.set(elementId, {
        element,
        productId,
        collectionIds,
        needsJustInTimeValidation: needsJustInTimeValidation(),
        hasApplicableRules: hasApplicableRules(productId, collectionIds)
      });
      
      console.log('SAC: Registered quick-add-bulk:', elementId, {
        productId,
        collectionIds,
        needsJustInTimeValidation: needsJustInTimeValidation(),
        hasApplicableRules: hasApplicableRules(productId, collectionIds)
      });
      
      return elementId;
    }
    
    function getQuickAddContext(elementId) {
      return QUICK_ADD_REGISTRY.get(elementId);
    }
    
    function updateQuickAddButtons(elementId, allowed, verdict, zip) {
      const context = getQuickAddContext(elementId);
      if (!context) {
        console.log('🔍 updateQuickAddButtons: No context found for elementId:', elementId);
        return;
      }
      
      const {element, productId, collectionIds} = context;
      updateButtons(element, allowed, verdict, zip, productId, collectionIds);
      
      console.log('SAC: Updated quick-add-bulk state', elementId, {allowed, verdict, zip});
    }
    
    function updateButtons(container, allowed, verdict, zip, productId, collectionIds) {
      // Update buttons in any container (form or quick-add-bulk)
      const buttons = container.querySelectorAll('button[type="submit"], [name="add"], [data-shopify="payment-button"] button, .quantity__button[name="plus"], .quantity__button[name="minus"]');
      
      console.log('🔍 updateButtons: Updating buttons with:', {
        allowed,
        verdict,
        zip,
        productId,
        collectionIds,
        buttonCount: buttons.length,
        buttons: Array.from(buttons).map(btn => ({
          tagName: btn.tagName,
          type: btn.type,
          name: btn.name,
          className: btn.className,
          currentOpacity: btn.style.opacity,
          currentCursor: btn.style.cursor
        }))
      });
      
      buttons.forEach((btn, index) => {
        if (allowed) {
          btn.style.opacity = '1';
          btn.style.cursor = 'pointer';
          btn.classList.remove('sac-atc-disabled');
          btn.title = '';
          console.log('🔍 updateButtons: Button', index, 'enabled:', btn);
        } else {
          btn.style.opacity = '0.6';
          btn.style.cursor = 'not-allowed';
          btn.classList.add('sac-atc-disabled');
          btn.title = verdict === 'unavailable' ? 
            'Not available for ' + zip : 
            'Please enter a ZIP code';
          console.log('🔍 updateButtons: Button', index, 'disabled:', btn);
        }
      });
      
      // Update dynamic checkout overlays
      const overlays = container.querySelectorAll('.sac-dynamic-overlay');
      overlays.forEach(overlay => {
        overlay.style.display = allowed ? 'none' : 'block';
      });
    }
    
    function updateFormButtons(formId, allowed, verdict, zip) {
      // Reduced logging - only log when state changes
      const context = getFormContext(formId);
      if (!context) {
        console.log('🔍 updateFormButtons: No context found for formId:', formId);
        return;
      }
      
      // Only log if this is a state change
      const currentState = context.lastState || {};
      if (currentState.allowed !== allowed || currentState.verdict !== verdict) {
        console.log('🔍 updateFormButtons state change:', {formId, allowed, verdict, zip, previous: currentState});
        context.lastState = {allowed, verdict, zip};
      }
      
      const {form, productId, collectionIds} = context;
      
      // Only log button details on first run
      if (!context.lastState) {
        console.log('🔍 updateFormButtons: Found buttons in form:', form);
      }
      
      // Update validation state for this form
      FORM_VALIDATION_STATES.set(formId, {
        allowed,
        verdict,
        zip,
        timestamp: Date.now()
      });
      
      console.log('🔍 updateFormButtons: Updating buttons with:', {formId, allowed, verdict, zip, productId, collectionIds});
      
      // Update buttons in the form
      updateButtons(form, allowed, verdict, zip, productId, collectionIds);
      
      if (!context.lastState) console.log('SAC: Updated form state', formId, {allowed, verdict, zip});
    }
    
    // Note: We no longer subscribe to ZipState.onChange to avoid using old ZIP
    // Instead, we rely on sac:zip:changed events from validators with correct ZIP and verdict
    
    // Listen for any ZIP change and update forms based on optimization strategy
    window.addEventListener('sac:zip:changed', async (event) => {
      console.log('🔍 SAC: Received ZIP changed event', event.detail);
      console.log('🔍 SAC: Current ZipState ZIP:', window.ZipState?.getZip());
      console.log('🔍 SAC: FORM_REGISTRY size:', FORM_REGISTRY.size);
      console.log('🔍 SAC: FORM_REGISTRY contents:', Array.from(FORM_REGISTRY.entries()));
      
      const { zip, verdict } = event.detail;
      console.log('🔍 SAC: Using ZIP from event detail:', zip, 'verdict:', verdict);
      console.log('🔍 SAC: Event ZIP vs ZipState ZIP:', { eventZip: zip, zipStateZip: window.ZipState?.getZip() });
      
      // Update ZipState with the new ZIP
      if (window.ZipState) {
        console.log('🔍 SAC: Updating ZipState with:', {zip});
        window.ZipState.setZip(zip);
      }
      
      // Check if we have only global rules (special case for immediate validation)
      const scopeHint = window.SAC_SCOPE_HINT || {};
      const hasOnlyGlobalRules = scopeHint.isOnlyGlobal;
      
      if (hasOnlyGlobalRules) {
        console.log('🔍 SAC: Only global rules detected (isOnlyGlobal=true), using broadcast verdict for all forms');
        
        // For only global rules, use the broadcast verdict for all forms and quick-add elements
        if (window.ZipState) {
          // Update verdict cache for all forms
          for (const [formId, context] of FORM_REGISTRY) {
            const contextKey = window.ZipState.key(context.productId, context.collectionIds);
            window.ZipState.setVerdict(contextKey, {zip, verdict});
          }
          // Update verdict cache for all quick-add elements
          for (const [elementId, context] of QUICK_ADD_REGISTRY) {
            const contextKey = window.ZipState.key(context.productId, context.collectionIds);
            window.ZipState.setVerdict(contextKey, {zip, verdict});
          }
        }
        
        // Immediately update ALL forms with the new ZIP and verdict
        for (const [formId, context] of FORM_REGISTRY) {
          console.log('🔍 SAC: Immediately updating form', formId, 'with only global rules verdict');
          // Only update button states if restrictAddToCart is enabled
          if (window.SAC_CAPS?.restrictAddToCart) {
            updateFormButtons(formId, verdict !== 'unavailable', verdict, zip);
          } else {
            // If restriction is disabled, always allow buttons but still update form state
            updateFormButtons(formId, true, verdict, zip);
          }
        }
        
        // Immediately update ALL quick-add elements with the new ZIP and verdict
        for (const [elementId, context] of QUICK_ADD_REGISTRY) {
          console.log('🔍 SAC: Immediately updating quick-add-bulk', elementId, 'with only global rules verdict');
          // Only update button states if restrictAddToCart is enabled
          if (window.SAC_CAPS?.restrictAddToCart) {
            updateQuickAddButtons(elementId, verdict !== 'unavailable', verdict, zip);
          } else {
            // If restriction is disabled, always allow buttons but still update form state
            updateQuickAddButtons(elementId, true, verdict, zip);
          }
        }
      } else {
        console.log('🔍 SAC: Multiple rules or specific rules detected (isOnlyGlobal=false), deferring validation to add-to-cart click');
        
        // For all other cases, just update the ZIP but don't validate until add-to-cart click
        // This includes:
        // - Multiple global rules
        // - Specific product rules
        // - Specific collection rules
        // - Mixed rules (global + specific)
        
        // On collection pages or any non-product page, we should NOT restrict forms upfront
        // when isOnlyGlobal is false. Instead, validate on individual add-to-cart clicks.
        
        // Only update forms that have no applicable rules (always allow them)
        for (const [formId, context] of FORM_REGISTRY) {
          const { hasApplicableRules } = context;
          
          if (!hasApplicableRules) {
            // Product has no applicable rules, always allow - no ZIP validation needed
            console.log('🔍 SAC: Form', formId, 'has no applicable rules, always allowing without ZIP validation');
            updateFormButtons(formId, true, 'available', ''); // No ZIP needed
          } else {
            // For products with applicable rules, keep them enabled and validate on click
            // This is the key change: we don't restrict forms upfront on collection pages
            // when isOnlyGlobal is false
            console.log('🔍 SAC: Form', formId, 'has applicable rules, keeping enabled, will validate on add-to-cart click');
            // Keep the form enabled but still call updateFormButtons to dispatch the event
            // The validation will happen when user clicks add-to-cart
            updateFormButtons(formId, true, 'soft', zip);
          }
        }
        
        // Only update quick-add elements that have no applicable rules (always allow them)
        for (const [elementId, context] of QUICK_ADD_REGISTRY) {
          const { hasApplicableRules } = context;
          
          if (!hasApplicableRules) {
            // Product has no applicable rules, always allow - no ZIP validation needed
            console.log('🔍 SAC: Quick-add-bulk', elementId, 'has no applicable rules, always allowing without ZIP validation');
            updateQuickAddButtons(elementId, true, 'available', ''); // No ZIP needed
          } else {
            // For products with applicable rules, keep them enabled and validate on click
            console.log('🔍 SAC: Quick-add-bulk', elementId, 'has applicable rules, keeping enabled, will validate on click');
            updateQuickAddButtons(elementId, true, 'soft', zip);
          }
        }
      }
    });
    
    // Listen for validation events to immediately update UI
    window.addEventListener('sac:validation:success', (event) => {
      console.log('SAC: Received validation success event', event.detail);
      const { productId, collectionIds, zip, verdict } = event.detail;
      
      // Check if this is a generic page
      const sacPage = window.SAC_PAGE || {};
      const isGenericPage = !sacPage.cid && !sacPage.pid;
      
      if (isGenericPage) {
        console.log('SAC: Generic page - updating only forms with matching product ID and applicable rules');
        // For generic pages, only update forms with the exact product ID and applicable rules
        for (const [formId, context] of FORM_REGISTRY) {
          if (context.productId === productId && context.hasApplicableRules) {
            console.log('SAC: Immediately updating form', formId, 'with success result for product', productId);
            // Only update button states if restrictAddToCart is enabled
            if (window.SAC_CAPS?.restrictAddToCart) {
              updateFormButtons(formId, verdict !== 'unavailable', verdict, zip);
            } else {
              // If restriction is disabled, always allow buttons but still update form state
              updateFormButtons(formId, true, verdict, zip);
            }
          }
        }
      } else {
        // For non-generic pages, use the original logic
        for (const [formId, context] of FORM_REGISTRY) {
          if (context.productId === productId && 
              JSON.stringify(context.collectionIds?.sort()) === JSON.stringify(collectionIds?.sort())) {
            console.log('SAC: Immediately updating form', formId, 'with success result');
            // Only update button states if restrictAddToCart is enabled
            if (window.SAC_CAPS?.restrictAddToCart) {
              updateFormButtons(formId, verdict !== 'unavailable', verdict, zip);
            } else {
              // If restriction is disabled, always allow buttons but still update form state
              updateFormButtons(formId, true, verdict, zip);
            }
          }
        }
      }
    });
    
    window.addEventListener('sac:validation:unavailable', (event) => {
      console.log('SAC: Received validation unavailable event', event.detail);
      const { productId, collectionIds, zip, verdict } = event.detail;
      
      // Check if this is a generic page
      const sacPage = window.SAC_PAGE || {};
      const isGenericPage = !sacPage.cid && !sacPage.pid;
      
      if (isGenericPage) {
        console.log('SAC: Generic page - updating only forms with matching product ID and applicable rules');
        // For generic pages, only update forms with the exact product ID and applicable rules
        for (const [formId, context] of FORM_REGISTRY) {
          if (context.productId === productId && context.hasApplicableRules) {
            console.log('SAC: Immediately updating form', formId, 'with unavailable result for product', productId);
            updateFormButtons(formId, false, verdict, zip);
          }
        }
      } else {
        // For non-generic pages, use the original logic
        for (const [formId, context] of FORM_REGISTRY) {
          if (context.productId === productId && 
              JSON.stringify(context.collectionIds?.sort()) === JSON.stringify(collectionIds?.sort())) {
            console.log('SAC: Immediately updating form', formId, 'with unavailable result');
            updateFormButtons(formId, false, verdict, zip);
          }
        }
      }
    });
    
    
    // ---------- Form interceptors ----------
    function setupFormInterceptors() {
      console.log('SAC: Setting up form interceptors');
      
      // Always register forms for ZIP change events, even if restrictAddToCart is disabled
      const forms = Array.from(document.querySelectorAll('form[action*="/cart/add"]')).filter(f => 
        f.offsetParent !== null && 
        !f.classList.contains('installment') &&
        !f.dataset.sacIntercepted
      );
      
      if (forms.length === 0) {
        console.log('SAC: No new forms to intercept');
        return; // Early return to prevent unnecessary processing
      } else {
        forms.forEach((form, index) => {
          form.dataset.sacIntercepted = '1';
          
          // Get product context from form, collection context for this specific product
          const formProductId = getProductIdFromForm(form);
          const productId = formProductId || getSacProductId();
          const productContext = getCollectionContextForProduct(productId);
          const collectionIds = productContext.collectionIds;
          
          // Register form first
          const formId = registerForm(form, productId, collectionIds);
          
          console.log('SAC: Form context resolved', {
            formId: formId,
            formProductId,
            productCollectionIds: productContext.collectionIds,
            finalProductId: productId,
            finalCollectionIds: collectionIds,
            hasApplicableRules: hasApplicableRules(productId, collectionIds),
            scopeHint: window.SAC_SCOPE_HINT
          });
        });
      }
      
      // Set up quick-add-bulk elements
      const quickAddElements = Array.from(document.querySelectorAll('quick-add-bulk')).filter(el => 
        el.offsetParent !== null && 
        !el.dataset.sacIntercepted
      );
      
      if (quickAddElements.length === 0) {
        console.log('SAC: No new quick-add-bulk elements to intercept');
      } else {
        quickAddElements.forEach((element, index) => {
          element.dataset.sacIntercepted = '1';
          
          // Extract product ID from the element's data attributes or ID
          let productId = element.dataset.productId;
          if (!productId && element.id) {
            // Try to extract from ID like "quick-add-bulk-42362104316022-template--15623829127286__featured_collection"
            const idMatch = element.id.match(/quick-add-bulk-(d+)/);
            if (idMatch) {
              productId = idMatch[1];
            }
          }
          
          if (!productId) {
            productId = getSacProductId();
          }
          
          const productContext = getCollectionContextForProduct(productId);
          const collectionIds = productContext.collectionIds;
          
          // Register quick-add-bulk element
          const elementId = registerQuickAddBulk(element, productId, collectionIds);
          
          console.log('SAC: Quick-add-bulk context resolved', {
            elementId: elementId,
            productId,
            productCollectionIds: productContext.collectionIds,
            finalCollectionIds: collectionIds
          });
        });
      }
      
      // Only set up click/submit interceptors if restrictAddToCart is enabled
      if (!window.SAC_CAPS?.restrictAddToCart) return;
      
      // Now set up click/submit interceptors for the already registered forms
      for (const [formId, context] of FORM_REGISTRY) {
        const {form, productId, collectionIds} = context;
        
        // Find add-to-cart button
        const addToCartBtn = findAddToCartButton(form);
        console.log('SAC: Button search result for form', formId, ':', addToCartBtn);
        if (!addToCartBtn) {
          console.log('SAC: No add-to-cart button found for form', formId);
          continue;
        }
        
        console.log('SAC: Setting up interceptors for form', formId, {productId, collectionIds});
        
        // Click handler
        const clickHandler = async (e) => {
          console.log('SAC: Click handler triggered for form', formId, 'event:', e);
          
          if (form.__sacBypassOnce === true) {
            form.__sacBypassOnce = false;
            console.log('SAC: Bypassing validation for form', formId);
            return;
          }
          
          // Check if button is already validated to prevent infinite loop
          if (addToCartBtn.getAttribute('data-sac-validated') === 'true') {
            console.log('SAC: Button already validated, allowing natural click');
            return;
          }
          
          console.log('SAC: Intercepting click for form', formId);
          
          const context = getFormContext(formId);
          const { hasApplicableRules } = context;
          const zip = ZipState.getZip();
          
          // If this product has no applicable rules, allow it to proceed normally
          if (!hasApplicableRules) {
            console.log('SAC: Product has no applicable rules, allowing normal form submission');
            return; // Let the form submit normally
          }
          
          // Check if we have only global rules (special case - validation already done on ZIP change)
          const scopeHint = window.SAC_SCOPE_HINT || {};
          const hasOnlyGlobalRules = scopeHint.isOnlyGlobal;
          
          if (hasOnlyGlobalRules) {
            console.log('SAC: Only global rules detected (isOnlyGlobal=true), using cached verdict');
            
            // For only global rules, the validation was already done on ZIP change
            // Just check the cached verdict and proceed accordingly
            const cachedVerdict = window.ZipState?.getVerdict(window.ZipState.key(productId, collectionIds));
            console.log('SAC: Cached verdict check:', {cachedVerdict, productId, collectionIds, key: window.ZipState.key(productId, collectionIds)});
            console.log('SAC: ZipState cache contents:', Array.from(window.ZipState._verdictCache.entries()));
            if (cachedVerdict && cachedVerdict.verdict !== 'unavailable') {
              console.log('SAC: Cached verdict allows, proceeding with form submission');
              return; // Let the form submit normally
            } else {
              console.log('SAC: Cached verdict blocks, opening validator');
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              
              SAC_STORED_INTENT = {formEl: form, productId, collectionIds, formId};
              if (window.SAC_CAPS?.uiMode === 'popup' || window.SAC_CAPS?.uiMode === 'both') {
                window.dispatchEvent(new CustomEvent('sac:open'));
              } else {
                if (window.injectPDP) window.injectPDP();
              }
              return;
            }
          }
          
          // For all other cases (multiple rules, specific rules, etc.), validate on add-to-cart click
          console.log('SAC: Validating on add-to-cart click for product with applicable rules');
          
          // Re-extract product ID from form during click (more reliable than registered context)
          let formProductId = getProductIdFromForm(form);
          
          // If form extraction failed, try to get from button or other elements
          if (!formProductId) {
            console.log('SAC: Form extraction failed, trying alternative methods');
            // Try to get from button data attributes
            const buttonProductId = addToCartBtn.dataset.productId || addToCartBtn.dataset.productId;
            if (buttonProductId) {
              formProductId = buttonProductId;
              console.log('SAC: Found productId in button dataset:', formProductId);
            }
            
            // Try to get from button's closest product element
            if (!formProductId) {
              const productElement = addToCartBtn.closest('[data-product-id]');
              if (productElement?.dataset.productId) {
                formProductId = productElement.dataset.productId;
                console.log('SAC: Found productId in closest element:', formProductId);
              }
            }
          }
          
          const productContext = getCollectionContextForProduct(formProductId);
          const formCollectionIds = productContext.collectionIds;
          
          console.log('SAC: Form-specific context:', {
            formProductId,
            collectionIds: formCollectionIds,
            currentZip: zip
          });
          
          if (!zip) {
            console.log('SAC: No ZIP available, opening validator');
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            // Store the intent for this specific form with its product context BEFORE opening popup
            SAC_STORED_INTENT = {
              formEl: form, 
              productId: formProductId, 
              collectionIds: formCollectionIds, 
              formId
            };
            
            console.log('SAC: Stored intent before opening popup:', SAC_STORED_INTENT);
            
            if (window.SAC_CAPS?.uiMode === 'popup' || window.SAC_CAPS?.uiMode === 'both') {
              window.dispatchEvent(new CustomEvent('sac:open'));
            } else {
              if (window.injectPDP) window.injectPDP();
            }
            return;
          } else {
            // ZIP is available, validate this specific product
            console.log('SAC: ZIP available, validating specific product:', formProductId);
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            try {
              const result = await getAvailabilityWithEvents({shop: window.SAC_SHOP, productId: formProductId, zip: ZipState.getZip(), settingsHash: window.SAC_SETTINGS_HASH, collectionIds: formCollectionIds});
              console.log('SAC: Add-to-cart validation result:', result);
              
              if (result.allowed) {
                console.log('SAC: Product is available, allowing form submission');
                // Set a flag to prevent infinite loop
                addToCartBtn.setAttribute('data-sac-validated', 'true');
                // Remove our event listener to prevent re-triggering
                addToCartBtn.removeEventListener('click', clickHandler, true);
                // Trigger the natural button click to preserve AJAX cart functionality
                setTimeout(() => {
                  addToCartBtn.click();
                  // Re-add the listener after a short delay
                  setTimeout(() => {
                    addToCartBtn.removeAttribute('data-sac-validated');
                    addToCartBtn.addEventListener('click', clickHandler, true);
                  }, TIME_CONSTANTS.CLICK_REATTACH_DELAY_MS);
                }, TIME_CONSTANTS.CLICK_RETRY_DELAY_MS);
              } else {
                console.log('SAC: Product is not available, blocking form submission');
                
                // Store intent and open validator
                SAC_STORED_INTENT = {
                  formEl: form, 
                  productId: formProductId, 
                  collectionIds: formCollectionIds, 
                  formId
                };
                
                if (window.SAC_CAPS?.uiMode === 'popup' || window.SAC_CAPS?.uiMode === 'both') {
                  window.dispatchEvent(new CustomEvent('sac:open'));
                } else {
                  if (window.injectPDP) window.injectPDP();
                }
                return; // Ensure we don't proceed with form submission
              }
            } catch (error) {
              console.error('SAC: Error in add-to-cart validation:', error);
              // Block on error for debugging - change this back to allow for production
              console.log('SAC: Blocking form submission due to validation error');
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              
              SAC_STORED_INTENT = {
                formEl: form, 
                productId: formProductId, 
                collectionIds: formCollectionIds, 
                formId
              };
              
              if (window.SAC_CAPS?.uiMode === 'popup' || window.SAC_CAPS?.uiMode === 'both') {
                window.dispatchEvent(new CustomEvent('sac:open'));
              } else {
                if (window.injectPDP) window.injectPDP();
              }
              return; // Ensure we don't proceed with form submission
            }
            return;
          }
        };
        
        // Submit handler - commented out to support AJAX form submissions
        // const submitHandler = async (e) => {
        //   // ... submit handler code removed to support AJAX
        // };
        
        addToCartBtn.addEventListener('click', clickHandler, true);
        console.log('SAC: Click handler attached to button:', addToCartBtn, 'for form:', formId);
        console.log('SAC: Button details:', {
          tagName: addToCartBtn.tagName,
          type: addToCartBtn.type,
          id: addToCartBtn.id,
          className: addToCartBtn.className,
          textContent: addToCartBtn.textContent?.trim()
        });
        
        // Test if the handler is actually attached
        const testHandler = (e) => {
          console.log('SAC: TEST HANDLER TRIGGERED!', e.type, e.target);
        };
        addToCartBtn.addEventListener('click', testHandler, true);
        
        // Also add a listener to the form to catch any clicks
        form.addEventListener('click', (e) => {
          console.log('SAC: FORM CLICK DETECTED!', e.type, e.target, e.target.tagName);
        }, true);
        // Note: Not intercepting form submit events to support AJAX submissions
        
        // Add form submit listener for debugging
        form.addEventListener('submit', (e) => {
          console.log('SAC: FORM SUBMIT EVENT TRIGGERED!', e.type, e.target);
          console.log('SAC: Form submit event details:', {formId, productId, collectionIds});
        }, true);
        
        // Initial state update - check if product has applicable rules first
        const formContext = getFormContext(formId);
        const { hasApplicableRules } = formContext;
        
        if (!hasApplicableRules) {
          // Product has no applicable rules, always allow - no ZIP validation needed
          console.log('SAC: Product has no applicable rules, always allowing without ZIP validation');
          updateFormButtons(formId, true, 'available', ''); // No ZIP needed
        } else {
          // Product has applicable rules, check ZIP and cached verdict
          const initialZip = ZipState.getZip();
          const scopeHint = window.SAC_SCOPE_HINT || {};
          
          if (initialZip) {
            const contextKey = ZipState.key(productId, collectionIds);
            const cached = ZipState.getVerdict(contextKey);
            
            if (cached && cached.zip === initialZip && (Date.now() - cached.timestamp) < TIME_CONSTANTS.VERDICT_CACHE_MAX_AGE_MS) {
              // Use cached result for initial state
              console.log('SAC: Using cached result for initial form state', formId, cached);
              // Only update button states if restrictAddToCart is enabled
              if (window.SAC_CAPS?.restrictAddToCart) {
                updateFormButtons(formId, cached.verdict !== 'unavailable', cached.verdict, cached.zip);
              } else {
                // If restriction is disabled, always allow buttons but still update form state
                updateFormButtons(formId, true, cached.verdict, cached.zip);
              }
            } else {
              // No cached result - determine initial state based on isOnlyGlobal
              if (scopeHint.isOnlyGlobal) {
                // For isOnlyGlobal=true, we can apply global validation immediately
                console.log('SAC: isOnlyGlobal=true, will validate on ZIP change');
                // Only update button states if restrictAddToCart is enabled
                if (window.SAC_CAPS?.restrictAddToCart) {
                  updateFormButtons(formId, true, 'soft', initialZip);
                } else {
                  // If restriction is disabled, always allow buttons
                  updateFormButtons(formId, true, 'available', initialZip);
                }
              } else {
                // For mixed rules or specific rules, allow by default and validate on click
                console.log('SAC: Mixed/specific rules detected, allowing by default, will validate on click');
                // Only update button states if restrictAddToCart is enabled
                if (window.SAC_CAPS?.restrictAddToCart) {
                  updateFormButtons(formId, true, 'soft', initialZip);
                } else {
                  // If restriction is disabled, always allow buttons
                  updateFormButtons(formId, true, 'available', initialZip);
                }
              }
            }
          } else {
            // No ZIP - disable form only if restriction is enabled
            if (window.SAC_CAPS?.restrictAddToCart) {
              updateFormButtons(formId, false, 'no_zip', '');
            } else {
              // If restriction is disabled, allow buttons even without ZIP
              updateFormButtons(formId, true, 'available', '');
            }
          }
        }
      }
    }
    
    function getProductIdFromForm(form) {
      // Try multiple methods to get product ID (NOT variant ID)
      console.log('SAC: getProductIdFromForm called for form:', form);
      
      // Check data attributes first (most reliable for product ID)
      const productId = form.dataset.productId || form.dataset.productid;
      if (productId) {
        console.log('SAC: Found productId in form dataset:', productId);
        return productId;
      }
      
      // Check for product ID in hidden inputs or other elements
      const productIdInput = form.querySelector('input[name="product_id"], input[name="productId"], input[name="product-id"]');
      if (productIdInput?.value) {
        console.log('SAC: Found productId in hidden input:', productIdInput.value);
        return productIdInput.value;
      }
      
      // Check parent elements for product context
      const productElement = form.closest('[data-product-id]');
      if (productElement?.dataset.productId) {
        console.log('SAC: Found productId in parent element:', productElement.dataset.productId);
        return productElement.dataset.productId;
      }
      
      // Check form ID for embedded product ID (common in collection pages)
      // Access the literal attribute so we don't accidentally grab the control named "id"
      const formId = form.getAttribute('id');
      if (formId) {
        console.log('SAC: Checking form ID for product ID:', formId);
        // Pattern: quick-add-template--15623828897910__product-grid7773619290230
        const productIdMatch = formId.match(/product-grid(d+)/);
        if (productIdMatch) {
          console.log('SAC: Found productId in form ID (product-grid):', productIdMatch[1]);
          return productIdMatch[1];
        }
        
        // Pattern: product-form-template--15623830241398__main (for PDP)
        const pdpMatch = formId.match(/product-form-.*-(d+)/);
        if (pdpMatch) {
          console.log('SAC: Found productId in form ID (product-form):', pdpMatch[1]);
          return pdpMatch[1];
        }
        
        // Pattern: product-form-{template}-{productId} (alternative pattern)
        const altMatch = formId.match(/product-form-.*-(d+)$/);
        if (altMatch) {
          console.log('SAC: Found productId in form ID (alt pattern):', altMatch[1]);
          return altMatch[1];
        }
      }
      
      // Last resort: try to get from global context
      const globalProductId = getSacProductId();
      if (globalProductId) return globalProductId;
      
      // Don't use variant ID as it's not the product ID
      // const variantInput = form.querySelector('input[name="id"]');
      // if (variantInput?.value) return variantInput.value;
      
      // Check for Shopify product context
      const productContext = form.closest('.product-item, .product-card, [data-product]');
      if (productContext) {
        const productIdAttr = productContext.dataset.productId || productContext.dataset.product;
        if (productIdAttr) return productIdAttr;
      }
      
      return null;
    }
    
    
    function findAddToCartButton(form) {
      const selectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button[name="add"]',
        '[data-shopify="payment-button"] button',
        '.btn-cart',
        '.add-to-cart',
        '.product-form__cart-submit'
      ];
      
      for (const selector of selectors) {
        const btn = form.querySelector(selector);
        if (btn && btn.offsetParent !== null) return btn;
      }
      
      return null;
    }
    
    // ---------- Resume intent after successful validation ----------
    function resumeIntent() {
      if (SAC_STORED_INTENT) {
        const {formEl, productId, collectionIds, formId} = SAC_STORED_INTENT;
        console.log('SAC: Resuming intent for form', {productId, collectionIds, formId});
        
        if (!formEl) {
          console.warn('SAC: No form element available for stored intent, skipping resume');
          SAC_STORED_INTENT = null;
          return;
        }
        
        formEl.__sacBypassOnce = true;
        formEl.requestSubmit?.();
        SAC_STORED_INTENT = null;
      }
    }
    
    // Expose functions globally
    window.SAC_RESUME_INTENT = resumeIntent;
    window.ZipState = ZipState;
    window.getAvailabilityWithEvents = getAvailabilityWithEvents;
    window.updateFormButtons = updateFormButtons;
    window.FORM_REGISTRY = FORM_REGISTRY;
    window.FORM_VALIDATION_STATES = FORM_VALIDATION_STATES;
    
    // Create a global reference to SAC_STORED_INTENT
    Object.defineProperty(window, 'SAC_STORED_INTENT', {
      get: () => SAC_STORED_INTENT,
      set: (value) => { SAC_STORED_INTENT = value; }
    });
    
    // Ensure SAC_POPUP is available (fallback if popup script fails)
    if (!window.SAC_POPUP) {
      console.warn('SAC: SAC_POPUP not found, creating fallback');
      window.SAC_POPUP = {
        open: () => console.warn('SAC: Popup not available'),
        getPopup: () => null
      };
    }
    
    // Setup form interceptors immediately
    setupFormInterceptors();
    
    // Re-scan for dynamically added forms with debouncing
    let setupTimeout = null;
    let isProcessing = false; // Guard to prevent infinite loops
    
    const observer = new MutationObserver((mutations) => {
      // Only process if we're not already processing
      if (isProcessing) return;
      
      // Check if any mutations are relevant (new forms or quick-add elements)
      const hasRelevantChanges = mutations.some(mutation => {
        if (mutation.type === 'childList') {
          // Check if any added nodes contain forms or quick-add elements
          return Array.from(mutation.addedNodes).some(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node;
              // Check if it's a form or quick-add element, or contains them
              return element.matches?.('form[action*="/cart/add"], quick-add-bulk') ||
                     element.querySelector?.('form[action*="/cart/add"], quick-add-bulk');
            }
            return false;
          });
        }
        return false;
      });
      
      if (!hasRelevantChanges) return;
      
      if (setupTimeout) clearTimeout(setupTimeout);
      setupTimeout = setTimeout(() => {
        isProcessing = true;
        setupFormInterceptors();
        isProcessing = false;
      }, TIME_CONSTANTS.DEBOUNCE_MS);
    });
    
    // Only observe the body for new elements, not the entire document
    observer.observe(document.body, {childList: true, subtree: true});

    // Mount based on UI mode
    (async () => {
      if (uiMode === 'embed' || uiMode === 'both') {
        // Mount PDP embed if enabled
        if (await shouldMountPDP()) {
          if (!window.injectPDP || !window.injectPDP()) {
            const mo = new MutationObserver(() => {
              if (window.injectPDP && window.injectPDP()) mo.disconnect();
            });
            mo.observe(document.documentElement, { childList: true, subtree: true });
            window.addEventListener('DOMContentLoaded', () => {
              if (window.injectPDP) window.injectPDP();
            });
          }
        }
      }
      
      // Auto-open popup logic is handled in the popup script itself
      // No need to duplicate the logic here
    })();

    function injectOnceCSS(){
      if (document.getElementById('sac-v3-css')) return;
      const baseCSS = " .sac-validator{margin:.75rem 0;font:inherit} .sac-field{display:flex;gap:.5rem;align-items:center} .sac-input{flex:1 1 auto;padding:.5rem;border:1px solid #ccc;border-radius:6px} .sac-btn{padding:.5rem .75rem;border:1px solid #444;border-radius:6px;background:#fff;cursor:pointer} .sac-hint{margin-top:.25rem;font-size:.85em;opacity:.7} .sac-result{margin-top:.5rem;border-radius:.5rem;padding:.75rem} .sac-head{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap} .sac-head .sac-ico{flex-shrink:0} .sac-change{background:none;border:none;padding:0;margin:0;font:inherit;color:inherit;text-decoration:underline;cursor:pointer;text-align:left} .sac-change:hover{opacity:.8} .sac-components{display:flex;flex-direction:column;gap:.5rem;margin-top:.5rem;text-align:left} .sac-comp{display:flex;align-items:center;gap:.5rem;text-align:left} .sac-ico{margin-right:0;flex-shrink:0} .sac-waitlist{margin-top:.75rem;padding:.75rem;border:1px solid #e0e0e0;border-radius:6px;background:#f9f9f9} .sac-waitlist-text{margin:0 0 .5rem 0;font-size:.9em;color:#666} .sac-waitlist-field{display:flex;gap:.5rem;align-items:center} .sac-waitlist-email{flex:1 1 auto;padding:.5rem;border:1px solid #ccc;border-radius:6px} .sac-waitlist-btn{padding:.5rem .75rem;border-radius:6px;color:#fff;cursor:pointer} .sac-waitlist-btn:disabled{opacity:.6;cursor:not-allowed} .sac-waitlist-message{margin-top:.5rem;padding:.5rem;border-radius:4px;font-size:.9em}";
      
      // Get design settings for colors
      const designSettings = window.SAC_DESIGN_SETTINGS || {};
      const availColor = designSettings.serviceAvailMsgColor || '#28a745';
      const notAvailColor = designSettings.serviceNotAvailMsgColor || '#dc3545';
      const formFieldColor = designSettings.formFieldColor || '#444444';
      
      // Message colors CSS
      const messageColorsCSS = ' .sac-result--ok{color:' + availColor + '} .sac-result--no{color:' + notAvailColor + '}';
      
      // Button border color CSS
      const buttonColorsCSS = ' .sac-btn{border-color:' + formFieldColor + '} .sac-waitlist-btn{border:1px solid ' + formFieldColor + ';background:' + formFieldColor + '}';
      
      // Get custom CSS from design settings
      const customCSS = (window.SAC_DESIGN_SETTINGS && window.SAC_DESIGN_SETTINGS.customCSS) ? window.SAC_DESIGN_SETTINGS.customCSS : '';
      
      // Combine base CSS with message colors, button colors, and custom CSS
      const css = baseCSS + messageColorsCSS + buttonColorsCSS + (customCSS ? '\n/* Custom CSS */\n' + customCSS : '');
      const el = document.createElement('style'); el.id='sac-v3-css'; el.textContent = css; document.head.appendChild(el);
    }
    
    // Inject CSS immediately when client script loads
    injectOnceCSS();
  })();