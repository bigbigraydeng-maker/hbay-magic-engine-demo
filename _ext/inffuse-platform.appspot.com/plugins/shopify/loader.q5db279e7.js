async function inffuseLoader() {
	const currentInffuseLoaderRun = 1 * new Date();
	if (window.lastInffuseLoaderRun && currentInffuseLoaderRun - window.lastInffuseLoaderRun < 1000) {
		return;
	} else {
		window.lastInffuseLoaderRun = currentInffuseLoaderRun;
	}

	// const serverDomain = 'http://localhost:10099';
	// const snippetDomain = 'https://localhost:5002';
	const serverDomain = 'https://inffuse.eventscalendar.co';
	const snippetDomain = 'https://dist.eventscalendar.co';

	const welcomebarPlaceholders = getPlaceholders('welcomebar');
	if (welcomebarPlaceholders.length > 0) {
		loadScript(`${serverDomain}/plugins/shopify/loaderlegacy.js?app=welcomebar&shop=${Shopify.shop}`);
	}

	const calendarPlaceholders = getPlaceholders('calendar');
	if (calendarPlaceholders.length === 0) {
		return;
	}

	const firstPlaceholder = calendarPlaceholders[0];
	const projectId = firstPlaceholder.dataset.id || firstPlaceholder.getAttribute('id');
	const url = `${serverDomain}/js/v0.1/calendar/data?app=calendar&platform=web&id=${projectId}&shopifyLegacy=true`;
	const data = await fetch(url).then((response) => response.json());

	window.INFFUSE_CACHE = window.INFFUSE_CACHE || {};
	window.INFFUSE_CACHE[projectId] = data;

	if (isUsingVer2(data)) {
		console.log('[eventscalendar.co] Version 2, loading embed.js');
		calendarPlaceholders.forEach((placeholder) => renderVer2App(placeholder));
		loadScript(`${snippetDomain}/embed.js`);
	} else {
		console.log('[eventscalendar.co] Version 1, loading legacy script');
		loadScript(`${serverDomain}/plugins/shopify/loaderlegacy.js?app=calendar&shop=${Shopify.shop}`);
	}

	/*------------------------------------------*/

	function getPlaceholders(app_id) {
		const appsPlaceholders = [`app-${app_id}`, `[app-${app_id}]`].flatMap((selector) => {
			return Array.from(document.querySelectorAll(selector));
		});

		return appsPlaceholders;
	}

	async function renderVer2App(placeholder) {
		const projectId = placeholder.dataset.id || placeholder.getAttribute('id');
		let ver2html = `<div data-events-calendar-app data-project-id="${projectId}" data-legacy-loader="true"></div>`;

		const width = (() => {
			const w = placeholder.getAttribute('width');
			const digitsOnly = /^\d+$/.test(w);
			if (digitsOnly) {
				return `${w}px`;
			}

			return w;
		})();

		if (width) {
			const style = `width: ${width};`;
			ver2html = `<div style="${style}">${ver2html}</div>`;
		}

		const tempContainer = document.createElement('div');
		tempContainer.innerHTML = ver2html;

		// each loader replaces all placeholders, so it may not exist anymore
		placeholder.parentNode?.replaceChild(tempContainer.firstChild, placeholder);
	}

	function isUsingVer2(data) {
		const flags = data.project.flags;
		if (flags.manualVersion === '2') {
			return true;
		}

		const platform = data.site.meta.platform;
		const userCreatedTimestamp = data.user.meta.created;

		const cutoffDateStr = flags[`switchDateV2-${platform}`];
		if (cutoffDateStr) {
			const cutoffDate = new Date(cutoffDateStr);
			if (new Date(userCreatedTimestamp) > cutoffDate) {
				return true;
			}
		}

		const switchRate = 1 * (flags[`switchRateV2-${platform}`] ?? 0);
		if (isUserSelected(userCreatedTimestamp, switchRate)) {
			return true;
		}

		return false;
	}

	function loadScript(url) {
		const node = document.createElement('script');
		node.src = url;
		document.body.appendChild(node);
	}

	function isUserSelected(timestamp, percent) {
		if (!percent) {
			return false;
		}

		// Simple hash function on timestamp
		function hashTime(time) {
			var hash = 0;
			for (var i = 0; i < time.length; i++) {
				var ch = time.charCodeAt(i);
				hash = (hash << 5) - hash + ch;
				hash |= 0; // Convert to 32bit integer
			}
			return hash;
		}

		var hash = hashTime(timestamp.toString());
		var modulus = Math.abs(hash) % 100; // Use 100 for percentage
		return modulus < percent;
	}
}

setTimeout(inffuseLoader, 100);
