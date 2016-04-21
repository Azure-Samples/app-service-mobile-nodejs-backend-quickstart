
var azureMobileApps = require('azure-mobile-apps'),
promises = require('azure-mobile-apps/src/utilities/promises'),
logger = require('azure-mobile-apps/src/logger');

var table = azureMobileApps.table();

table.insert(function (context) {

// Define the template payload and userId tag.
var payload = '{"messageParam":' + context.item.text + '}'; 

// Get the current user SID and create a tag for the current user.
var userTag = "_UserId:" + context.user.id;

// Execute the insert.  The insert returns the results as a Promise,
// Do the push as a post-execute action within the promise flow.
return context.execute()
    .then(function (results) {
        // Only do the push if configured.
        if (context.push) {
            // Send a template notification to the user ID.
            context.push.send(userTag, payload, function (error) {
                if (error) {
                    logger.error('Error while sending push notification: ', error);
                } else {
                    logger.info('Push notification sent successfully!');
                }
            });
        }
        // Don't forget to return the results from the context.execute()
        return results;
    })
    .catch(function (error) {
        logger.error('Error while running context.execute: ', error);
    });
});

module.exports = table;  