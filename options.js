const defaultOptions = {
    shrunkMode: {
        value: false
    },
    onDuplicateTabDetected: {
        value: "A",  // Changed to "A" for Auto-close
        locked: true  // Lock this setting
    },
    onRemainingTab: {
        value: "A",  // Already set to "A" for Activate
        locked: true  // Lock this setting
    },
    keepTabBasedOnAge: {
        value: "O",  // Keep "O" for Older tab
        locked: true  // Lock this setting
    },
    keepTabWithHttps: {
        value: true,  // Already true - HTTPS over HTTP
        locked: true  // Lock this setting
    },
    keepPinnedTab: {
        value: true,  // Already true - Protect pinned tabs
        locked: true  // Lock this setting
    },
    keepTabWithHistory: {
        value: false
    },
    scope: {
        value: "C"
    },
    ignoreHashPart: {
        value: false,
        locked: true  // Lock - always compare hash part
    },
    ignoreSearchPart: {
        value: false,
        locked: true  // Lock - always compare search part
    },
    ignorePathPart: {
        value: false,
        locked: true  // Lock - always compare path part
    },
    ignore3w: {
        value: true,  // Changed to true - always ignore "www"
        locked: true  // Lock this setting
    },
    caseInsensitive: {
        value: true,  // Changed to true - always case insensitive
        locked: true  // Lock this setting
    },
    compareWithTitle: {
        value: false,
        locked: true  // Lock - don't compare titles
    },
    onDuplicateTabDetectedPinned: {
        value: true
    },
    tabPriorityPinned: {
        value: true
    },
    matchingRulesPinned: {
        value: true
    },
    scopePinned: {
        value: true
    },
    customizationPinned: {
        value: true
    },
    whiteList: {
        value: ""
    },
    blackList: {
        value: ""
    },
    badgeColorDuplicateTabs: {
        value: "#f22121"
    },
    badgeColorNoDuplicateTabs: {
        value: "#1e90ff"
    },
    showBadgeIfNoDuplicateTabs: {
        value: true
    },
    closePopup: {
        value: false
    },
    environment: {
        value: "firefox",
        locked: true
    }
};

const setupDefaultOptions = async () => {
    const environment = await getEnvironment();
    const options = Object.assign({}, defaultOptions);
    options.environment = Object.assign({}, defaultOptions.environment, { value: environment });
    return options;
};

const getEnvironment = async () => {
    const info = await getPlatformInfo();
    const environment = (info.os === "android") ? "android" : (typeof InstallTrigger !== "undefined") ? "firefox" : "chrome";
    return environment;
};

const getNotInReferenceKeys = (referenceKeys, keys) => {
    const setKeys = new Set(keys);
    return Array.from(referenceKeys).filter(key => !setKeys.has(key));
};

// eslint-disable-next-line no-unused-vars
const initializeOptions = async () => {
    const storedResult = await getStoredOptions();
    const currentStoredOptions = storedResult.storedOptions || {};
    const defaultStoredOptions = await setupDefaultOptions();

    const defaultKeys = Object.keys(defaultStoredOptions).sort();
    const storedKeys = Object.keys(currentStoredOptions).sort();

    let mustPersist = false;
    const mergedOptions = {};

    defaultKeys.forEach(key => {
        const defaultOption = defaultStoredOptions[key];
        const storedOption = currentStoredOptions[key];

        if (defaultOption.locked) {
            mergedOptions[key] = { value: defaultOption.value, locked: true };
            if (!storedOption || storedOption.value !== defaultOption.value || storedOption.locked !== true) {
                mustPersist = true;
            }
        }
        else if (storedOption) {
            mergedOptions[key] = Object.assign({}, storedOption);
            if (Object.prototype.hasOwnProperty.call(defaultOption, "locked") && storedOption.locked !== defaultOption.locked) {
                mergedOptions[key].locked = defaultOption.locked;
                mustPersist = true;
            }
        }
        else {
            mergedOptions[key] = Object.assign({}, defaultOption);
            mustPersist = true;
        }
    });

    const obsoleteKeys = getNotInReferenceKeys(storedKeys, defaultKeys);
    if (obsoleteKeys.length > 0) mustPersist = true;

    const finalOptions = mustPersist
        ? await saveStoredOptions(mergedOptions, true)
        : mergedOptions;

    setOptions(finalOptions);
    setEnvironment(finalOptions);
};

// eslint-disable-next-line no-unused-vars
const setStoredOption = async (name, value, refresh) => {
    const options = await getStoredOptions();
    const storedOptions = options.storedOptions;
    
    // Prevent changing locked settings
    if (!Object.prototype.hasOwnProperty.call(storedOptions, name)) {
        console.warn(`Setting "${name}" does not exist and cannot be changed`);
        return;
    }

    if (storedOptions[name].locked) {
        console.warn(`Setting "${name}" is locked and cannot be changed`);
        return;
    }
    
    storedOptions[name].value = value;
    saveStoredOptions(storedOptions);
    setOptions(storedOptions);
    if (refresh) refreshGlobalDuplicateTabsInfo();
    else if (name === "onDuplicateTabDetected") setBadgeIcon();
    else if (name === "showBadgeIfNoDuplicateTabs" || name === "badgeColorNoDuplicateTabs" || name === "badgeColorDuplicateTabs") updateBadgeStyle();
};

const options = {};

const setOptions = (storedOptions) => {
    options.autoCloseTab = storedOptions.onDuplicateTabDetected.value === "A";
    options.defaultTabBehavior = storedOptions.onRemainingTab.value === "B";
    options.activateKeptTab = storedOptions.onRemainingTab.value === "A";
    options.keepNewerTab = storedOptions.keepTabBasedOnAge.value === "N";
    options.keepReloadOlderTab = storedOptions.keepTabBasedOnAge.value === "R";
    options.keepTabWithHttps = storedOptions.keepTabWithHttps.value;
    options.keepPinnedTab = storedOptions.keepPinnedTab.value;
    options.ignoreHashPart = storedOptions.ignoreHashPart.value;
    options.ignoreSearchPart = storedOptions.ignoreSearchPart.value;
    options.ignorePathPart = storedOptions.ignorePathPart.value;
    options.compareWithTitle = storedOptions.compareWithTitle.value;
    options.ignore3w = storedOptions.ignore3w.value;
    options.caseInsensitive = storedOptions.caseInsensitive.value;
    options.searchInAllWindows = storedOptions.scope.value === "A" || storedOptions.scope.value === "CA";
    options.searchPerContainer = storedOptions.scope.value === "CC" || storedOptions.scope.value === "CA";
    options.whiteList = whiteListToPattern(storedOptions.whiteList.value);
    options.badgeColorDuplicateTabs = storedOptions.badgeColorDuplicateTabs.value;
    options.badgeColorNoDuplicateTabs = storedOptions.badgeColorNoDuplicateTabs.value;
    options.showBadgeIfNoDuplicateTabs = storedOptions.showBadgeIfNoDuplicateTabs.value;
};

const environment = {
    isAndroid: false,
    isFirefox: false,
    isChrome: false
};

const setEnvironment = (storedOptions) => {
    if (storedOptions.environment.value === "android") {
        environment.isAndroid = true;
        environment.isFirefox = false;
    } else if (storedOptions.environment.value === "firefox") {
        environment.isAndroid = false;
        environment.isFirefox = true;
        environment.isChrome = false;
    }
    else if (storedOptions.environment.value === "chrome") {
        environment.isAndroid = false;
        environment.isFirefox = false;
        environment.isChrome = true;
    }
};

// eslint-disable-next-line no-unused-vars
const isPanelOptionOpen = () => { 
    return false; //override for now, until replacement API comes in
    /* const popups = chrome.extension.getViews({ type: "popup" });
    if (popups.length) return true;
    const tabs = chrome.extension.getViews({ type: "tab" });
    return tabs.length > 0; */
};

const whiteListToPattern = (whiteList) => {
    const whiteListPatterns = new Set();
    const whiteListLines = whiteList.split("\n").map(line => line.trim());
    whiteListLines.forEach(whiteListLine => {
        const length = whiteListLine.length;
        let pattern = "^";
        for (let index = 0; index < length; index += 1) {
            const character = whiteListLine.charAt(index);
            pattern = (character === "*") ? `${pattern}.*` : pattern + character;
        }
        whiteListPatterns.add(new RegExp(`${pattern}$`));
    });
    return Array.from(whiteListPatterns);
};
