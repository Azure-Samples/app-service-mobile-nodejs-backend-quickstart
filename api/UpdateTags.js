var express = require('express');

// Create an express.js router for our custom API.
var router = express.Router();

// Define a POST operation that updates installation tags. 
router.post('/:id', function (request, response) {
	
	// Get the notification hub used by the mobile app.
	var push = request.azureMobile.push;
	var installationId = request.params.id;

	// Get the tags array from the request message.
	var tags = request.body;

	// Validate for and block any SID tags.
	for (i = 0; i < tags.length; i++) {
		if (tags[i].search("sid:") !== -1) {
				response.status(403)
				.send("You cannot set '" + tags[i] + "' as a tag.");
				return;
		}
	}
	
	// Define an update tags operation.
	var updateOperation = [{
		"op": "add",
		"path": "/tags",
		"value": tags.toString()
	}];		
	
	// Update the installation to add the new tags.
	push.patchInstallation(installationId, updateOperation, function(error, res){
		if(error){
			logger.error('An error occurred when adding tags', error);
			response.status(error.statusCode).send(error.detail);
		}
		else{
			response.status(200).send(tags);
		}
	});		
});
// Define GET operation that returns tags for an installation. 
router.get('/:id', function (request, response) {
	// Get the notification hub used by the mobile app.
	var push = request.azureMobile.push;
	var installationId = request.params.id;
	
	push.getInstallation(installationId, function(error, installation, res){
		if (error){					
			// Log the error and send an error response.
			logger.error('An error occurred when retrieving installation', error);
			response.status(error.statusCode).send(error.detail);					
		}
		else{
			// Return an array of current tags.
			response.json(installation.tags);	
		}				
	});
});

module.exports = router;