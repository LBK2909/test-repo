# Shipping Label Generation

This project implements a shipping label generation feature that allows clients to initiate bulk shipment processing requests. Upon request, the server immediately returns a response containing a unique Job ID, while the actual processing is handled asynchronously through a queuing system.
Then the client uses the polling mechanism to periodically check the status of the job.
This document outlines how clients can interact with the feature, initiate bulk shipment processing, and track the status of their request.

## Getting Started

To use the shipping label generation feature, clients need to follow these steps:

1. **Authentication**: Clients must authenticate themselves with the server to access the API endpoints.

2. **Initiate Bulk Shipment Processing**: Clients can initiate bulk shipment processing by sending a POST request to the `/shipments` endpoint. The request should include the necessary shipment details, such as sender information, recipient information, and package details.

3. **Response**: Upon successful request, the server will respond with a unique Job ID. Clients should store this ID for future reference.

4. **Track Request Status**: Clients can track the status of their shipment processing request by periodically sending GET requests to the `/shipments/{jobId}` endpoint. The server will respond with the current status of the request, such as "processing", "completed", or "failed". This polling mechanism allows clients to continuously check the status until the request is completed.

## API Endpoints

The shipping label generation feature provides the following API endpoints:

- `POST /shipments`: Initiates bulk shipment processing. Requires authentication and includes shipment details in the request body.

- `GET /shipments/{jobId}`: Retrieves the status of a shipment processing request. Requires authentication and includes the Job ID in the URL.

## Examples

### Initiating Bulk Shipment Processing

To initiate bulk shipment processing, send a POST request to the `/shipments` endpoint with the following payload:

````json
## Queueing Process

Once a request for shipping label generation is initiated, the server adds the request to a queue for processing. The queueing process ensures that requests are handled in the order they are received.

### Worker Process

The worker process is responsible for executing the queued requests and generating the shipping labels. It retrieves the necessary shipment details from the request payload and performs the label generation logic.

### Job Summary

After the job completion, the job document's completed count will be incremented by 1.


## Post Hooks Execution

After the job completion, a post-hook is executed to check and update the job status. The post-hook code verifies if the number of completed orders matches the sum of successful orders and failed orders. If they match, the job status is updated to "completed".

```javascript


````

## Client side polling:

//The client polls periodically to check the status of the job, if the job status is "successful" then updates the client side accordingly.
// Check job status and update client side accordingly
const checkJobStatus = (jobId) => {
// Make a GET request to the server to retrieve the job status
const response = await fetch(`/shipments/${jobId}`);
const data = await response.json();

      // Check if the job status is successful
      if (data.status === "successful") {
         // Update the client side appropriately
         // ...
      }

};
