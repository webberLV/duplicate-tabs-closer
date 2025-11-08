"use strict";

const handleMessage = (message, sender, response) => {
    switch (message.action) {
        case "setStoredOption": {
            setStoredOption(message.data.name, message.data.value, message.data.refresh);
            break;
        }
        case "getStoredOptions": {
            // Return both storedOptions and lockedKeys
            getStoredOptions().then(result => {
                response({ 
                    data: {
                        storedOptions: result.storedOptions,
                        lockedKeys: result.lockedKeys
                    }
                });
            });
            return true;
        }
        case "getDuplicateTabs": {
            requestDuplicateTabsFromPanel(message.data.windowId);
            break;
        }
        case "closeDuplicateTabs": {
            closeDuplicateTabs(message.data.windowId);
            break;
        }
    }
};

chrome.runtime.onMessage.addListener(handleMessage);
