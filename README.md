---
services: app-service\mobile
platforms: nodejs
author: ggailey777
---
# App Service Mobile completed quickstart for Node.js backend
This repository contains a Node.js Mobile App project based on the App Service Mobile Apps quickstart project, which you can download from the [Azure portal](https://portal.azure.com). This project has been enhanced by the addition of offline sync, authentication, and push notification functionality. This sample demonstrates how to best integrate the various Mobile Apps features. This readme topic contains the following information to help you run the sample app project and to better understand the design decisions.

+ [Overview](#overview)
+ [Create a new Node.js backend Mobile App](#create-a-new-node-backend-mobile-app)
+ [Configure authentication](#configure-authentication)
+ [Configure push notifications](#configure-push-notifications)
+ [Publish the project to Azure](#publish-the-project-to-azure)
+ [Implementation notes](#implementation-notes)
	+ [Push to users](#push-to-users)
	+ [Template push notification registration](#template-push-notification-registration)
	+ [Client-added push notification tags](#client-added-push-notification-tags)

To learn more about a Mobile Apps Node.js backend project, see [How to use the Azure Mobile Apps Node.js SDK](https://azure.microsoft.com/documentation/articles/app-service-mobile-node-backend-how-to-use-server-sdk/).

##Overview
The project in this repository is equivalent to creating a Node.js backend quickstart project from the portal and then completing the following Mobile Apps tutorials:

+ [Enable offline sync for your Windows app](https://azure.microsoft.com/documentation/articles/app-service-mobile-ios-get-started-offline-data/)
+ [Add authentication to your Windows app](https://azure.microsoft.com/en-us/documentation/articles/app-service-mobile-ios-get-started-users/)
+ [Add push notifications to your Windows app](https://azure.microsoft.com/en-us/documentation/articles/app-service-mobile-ios-get-started-push/) 

## <a name="create-a-new-node-backend-mobile-app"></a>Create a new Node.js backend Mobile App 

The first step is to create a new Mobile App backend in Azure. You can do this either by completing the [quickstart tutorial](https://azure.microsoft.com/documentation/articles/app-service-mobile-ios-get-started/) or by [following these steps](https://github.com/Azure/azure-content-pr/blob/master/includes/app-service-mobile-dotnet-backend-create-new-service.md).

## Configure authentication

Because both the client and backend are configured to use authentication, you must define an authentication provider for your app and register it with your Mobile App backend in the [portal](https://portal.azure.com).

Follow the instructions in the topic to configure the Mobile App backend to use one of the following authentication providers:

+ [AAD](https://azure.microsoft.com/documentation/articles/app-service-mobile-how-to-configure-active-directory-authentication/)
+ [Facebook](https://azure.microsoft.com/documentation/articles/app-service-mobile-how-to-configure-facebook-authentication/)
+ [Google](https://azure.microsoft.com/documentation/articles/app-service-mobile-how-to-configure-google-authentication/)
+ [Microsoft account](https://azure.microsoft.com/documentation/articles/app-service-mobile-how-to-configure-microsoft-authentication/)
+ [Twitter](https://azure.microsoft.com/documentation/articles/app-service-mobile-how-to-configure-twitter-authentication/)

Access to the TodoItem table is restricted to only authenticated users. Authorization for operations against the this table is defined in the [todoitem.json file](./tables/TodoItem.json). Access to the custom API is restricted by the authorization and authentication middleware. 

## Configure push notifications

To be able to support push notifications in your backend, you must create a new notification hub and connect it to your Mobile App. To do this complete the steps in the topic [Create a Notification Hub](https://github.com/Azure/azure-content-pr/blob/master/includes/app-service-mobile-create-notification-hub.md).

Once this is complete, you must complete additional configuration steps for each mobile platform you want to support. If you haven't see it before, a push notification topology looks something like this:

![Push notification topology](https://acom.azurecomcdn.net/80C57D/cdn/mediahandler/docarticles/dpsmedia-prod/azure.microsoft.com/en-us/documentation/articles/notification-hubs-diagnosing/20151223054713/architecture.png)

See the client sample readme files for instructions on how configure Notification Hubs to send push notifications using the PNS for a given platform.

## Publish the project to Azure

To be able to test this project with one of the corresponding client apps, you need to publish the project to your Mobile App backend in Azure. For information on deploying this Git repository to your Mobile App backend, see [Deploy your project](https://azure.microsoft.com/en-us/documentation/articles/web-sites-publish-source-control/#Step5) in Continuous deployment using GIT in Azure App Service.

After successful deployment, you are ready to test. Because authentication is enabled on this project, it is much harder to test using a REST client since you will need to present an X-ZUMO-AUTH header in the request that contains a valid access token.

## Implementation notes 
This section highlights changes made to the original tutorial samples and other design decisions were made when implementing all of the features or Mobile Apps in the same client app. 

###Push to users
The push notification tutorial sends broadcast push notifications to all registrations. Because authentication is enabled in the backed, all push notification registration requests handled by the backend from Mobile Apps clients get a userId tag added to the registration automatically. This tag can then be used to send push notifications to a specific user. The code below gets the userID for the logged in user and uses it to send a notification to only that user.

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
	            	// Do some error logic here...    				
	            });
	        }
	        // Don't forget to return the results from the context.execute()
	        return results;
	    });

If the user has registered on multiple devices, each device will get a notification.

###Template push notification registration
The original push notification tutorial used native registrations. This sample has been changed to use a template registration, which makes it easier to send push notifications to users on multiple clients from a single **send** method call. You can see in the above code that the **send()** method is called, which sends a notification to all platforms.

For more information, see [How to: Send push notifications](https://azure.microsoft.com/documentation/articles/app-service-mobile-node-backend-how-to-use-server-sdk/#push-user).

###Client-added push notification tags
When a mobile app registers for push notifications using an Azure App Service Mobile Apps backend, there are two default tags that can get added to the registration in Azure Notification Hubs: the installation ID, which is unique to the app on a given device, and the user ID, which is only added when the user has been previously authenticated. Any other tags that get supplied by the client are ignored, which is by design. (Note that this differs from Mobile Services, where the client could supply any tag and there were hooks into the registration process on the backend to validate tags on incoming registrations.) 

Because the client can’t add tags and at the same time there are no service-side hooks into the push notification registration process, the client needs to do the work of adding new tags to a given registration. In this sample, there is an **UpdateTags.js** custom API file that defines an `/updatetags` endpoint to enable clients to add tags to their push registration. The client calls that endpoint with its *installationId* to create new tags. 

The following code updates and installation to add user-supplied tags:

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

Note that due to the limitations of the default custom API implementation in Mobile Apps, we needed to use an express.js Router to handle passing the installation ID in the URL. This also required us to pass the authentication and authorization middleware to the router. For more information, see [Adding push notification tags from the client](https://blogs.msdn.microsoft.com/writingdata_services/2016/04/14/adding-push-notification-tags-from-a-node-js-backend/).