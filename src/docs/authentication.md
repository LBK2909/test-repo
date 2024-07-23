# Shopify App Creation:

1. Go to [Shopify Partners](https://www.shopify.com/partners) and create a partner account.
2. Click on the `Apps` tab and then click on `Create app`.
3. Fill in the required details for the app and click on `Create app`.
4. You will be redirected to the app dashboard where you can find the API key and API secret key.
5. Use these keys to authenticate your app with the Shopify API.
6. You can now start building your app using the Shopify API.

# Shopify API Authentication:

1. To authenticate your app with the Shopify API, you need to use OAuth.
2. When a user installs your app, they will be redirected to the Shopify login page to authorize your app.
3. After authorization, Shopify will redirect the user back to your app with an access token.
4. You can use this access token to make API requests on behalf of the user.
5. Make sure to store the access token securely and use it to authenticate your API requests.

# Authentication Flow Documentation

## Overview:

This document outlines the authentication processes used in our application, including both manual authentication (register, login) and authentication via Shopify app installation. The purpose is to guide developers through the correct implementation and usage of these authentication mechanisms.

### Manual Authentication

1. Registration
2. Login

### Shopify App Installation Authentication

1. Initial Setup
   2.Handling the client app installation process in the client side

## Manual Authentication

### Registration

1. The user navigates to the registration page and fills in the required details (name, email, password).
2. The user submits the registration form.
3. The backend validates the user input and creates a new user account in the database.
4. The user is redirected to the login page to log in to their new account.

### Login

1. The user navigates to the login page and enters their email and password.
2. The user submits the login form.
3. The backend validates the user input and checks if the user exists in the database.
4. If the user exists, the backend generates a JWT token and sends it back to the client.
5. The client stores the JWT token in local storage and uses it to authenticate API requests.
6. The client is redirected to the organization page upon successful login.

## Shopify App Installation Authentication

### Initial Setup

1. The user navigates to the Shopify app installation page and clicks on the `Install App` button.
2. The user is redirected to the Shopify login page to authorize the app.
3. The user logs in to their Shopify account and authorizes the app to access their store data.
4. After the authorization the shopify will redirect the user the "/auth/shopify" installation page with some params {shop, hmac, code, state}.
   5.The the backend server will validate the hmac and code and will make a post request to the shopify to get the access token with the follwing params {client_id, client_secret, code}.
5. The shopify will respond with the access token and the shop name to the backend server endpoint ("/auth/shopify/callback")
6. The backend server will store the access token and the shop name in the database.
7. The user is redirected to the organization page upon successful installation.

### Handling the client app installation process in the client side

1. Once the Shop is installed, and stored in the database, the client will be redirected to the organization page to connect the shop with the organization.
2. The client will make a post request to the backend server with the shop name and connect the shop with the organization to the endpoint ("/connect-to-organization").
3. The client will be redirected to the organization page upon successful connection.

#### if the client is signedin/signedup on the client side

1.Once the shop is installed and stored in the database the client will be redirected to the organization page to connect the shop with the organization. 2. As the client is not signedin/signedup the client will be redirected to the login page. 3. The client will be redirected to the organization page upon successful login. 4. The organization page will have a button to connect the shop with the organization. 5. The client will make a post request to the backend server with the shop name and connect the shop with the organization. 6. The client will be redirected to the organization page upon successful connection.
