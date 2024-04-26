### Overview:

#### 1.Multi-Organization Management and Authentication Flow

#### 2.Authentication Flow Documentation

<br>

## 1.Multi-Organization Management and Authentication Flow Overview

Purpose: To define the authentication and organization management processes for a system that supports multiple organizations under a single email ID and enables staff to create new, independent organizations.

#### Scope

- User registration and initial organization setup.
- Management of multiple organizations under one user account.
- Role-based access control within organizations.
- Capability for staff to create new organizations externally.

#### Assumptions

- Users can have multiple roles across different organizations.
- Data isolation is maintained between organizations.
- Users and staff can operate across multiple organizations without security compromises.

### User Story

#### Epic 1: User Registration and Organization Creation

#### User Story 1.1: Signing Up

As a new user,
I want to sign up using my email,
So that I can create and manage my own organization.
**Acceptance Criteria:**

- User provides email, password, and optionally, organization name during sign-up.
- System creates a new user account and an associated organization.
- User receives a confirmation email to verify their account.

#### User Story 1.2: Initial Login and Dashboard Access

As a verified user,
I want to log into my dashboard,
So that I can start managing my organization.
**Acceptance Criteria:**

- User logs in using their email and password.
- On successful login, the user is directed to their dashboard showing their organization(s).

### Epic 2: Managing Multiple Organizations

#### User Story 2.1: Creating Additional Organizations

As a registered user,
I want to create additional organizations,
So that I can manage multiple businesses or projects under one account.
**Acceptance Criteria:**

- From their dashboard, the user can initiate the creation of a new organization.
- User enters necessary details for the new organization and submits.
- The new organization is created and added to the user's dashboard.

#### User Story 2.2: Switching Between Organizations

As a user with multiple organizations,
I want to switch between different organizations seamlessly,
So that I can manage multiple aspects of my businesses from one account.
**Acceptance Criteria:**

- User can see a list or dropdown of their organizations on the dashboard.
- User can select any organization to view or manage from the dashboard.

### Epic 3: Role-Based Access Control

#### User Story 3.1: Adding Staff to an Organization

As an organization admin,
I want to add staff members to my organization and assign roles,
So that they can perform tasks according to their responsibilities.
**Acceptance Criteria:**

- Admin accesses the 'Manage Staff' section in the dashboard.
- Admin invites staff by email and assigns roles.
- Invited staff receive an email to join the organization.

#### User Story 3.2: Staff Creating New Organizations

As a staff member,
I want to create a new organization externally,
So that I can start my own independent project.
**Acceptance Criteria:**

- Staff accesses a separate section to create a new organization.
- Staff enters details for the new organization and submits.
- New organization is created without affecting existing roles in other organizations.

## 2.Authentication Flow Documentation

#### Introduction

This document provides a detailed overview of the authentication flow for our application. It covers both manual authentication (register, login) and authentication via Shopify app installation. The purpose of this README is to guide developers, project managers, and stakeholders through the correct implementation and expected user interactions.

#### Contents

- [Epic: User Authentication](#epic-user-authentication)
  - [Story 1: User Registration](#story-1-user-registration)
  - [Story 2: User Login](#story-2-user-login)
- [Epic: Shopify App Installation](#epic-shopify-app-installation)
  - [Story 3: Initial Shopify App Installation](#story-3-initial-shopify-app-installation)
  - [Story 4: Post-Installation App Setup](#story-4-post-installation-app-setup)
  - [Story 5: Connecting Shopify to Organization](#story-5-connecting-shopify-to-organization)
  - [Story 6: Handling Non-Authenticated Users Post-Installation](#story-6-handling-non-authenticated-users-post-installation)

---

### Epic: User Authentication

#### Story 1: User Registration

**As a** new user,  
**I want** to register an account,  
**So that** I can access personalized features and settings.

#### Acceptance Criteria:

- **Given** I am on the registration page,
- **When** I enter my name, email, and password, and submit the form,
- **Then** my account is created, and I am redirected to the login page.

#### Story 2: User Login

**As a** registered user,  
**I want** to log in to my account,  
**So that** I can securely access my personal data and configurations.

#### Acceptance Criteria:

- **Given** I have an existing account,
- **When** I enter my correct email and password on the login page and submit,
- **Then** I receive a JWT token, my session starts, and I am redirected to the organization page.

### Epic: Shopify App Installation

#### Story 3: Initial Shopify App Installation

**As a** Shopify store owner,  
**I want** to install the app from the Shopify app store,  
**So that** I can integrate Shopify's capabilities into my daily operations.

#### Acceptance Criteria:

- **Given** I am viewing the app in the Shopify app store,
- **When** I click on the `Install App` button and authorize the app in Shopify,
- **Then** I am redirected back to the app with proper parameters, and the app is configured with my store details.

### Story 4: Post-Installation App Setup

**As a** user,  
**I want** to complete setting up the app after installation,  
**So that** the app is fully integrated with my Shopify store and ready to use.

#### Acceptance Criteria:

- **Given** I have authorized the app on Shopify and redirected to "/auth/shopify",
- **When** the app receives my shop data and obtains an access token,
- **Then** my store data is stored in the app's database, and I am redirected to the organization page.

### Story 5: Connecting Shopify to Organization

**As a** logged-in user with an installed Shopify app,  
**I want** to connect my Shopify store to my organization in the app,  
**So that** I can manage the store's data within my organizational workflows.

#### Acceptance Criteria:

- **Given** the Shopify app is installed and I am on the organization page,
- **When** I select an organization and click "Connect Shopify",
- **Then** the app links my Shopify store with the selected organization and shows confirmation on the organization page.

### Story 6: Handling Non-Authenticated Users Post-Installation

**As a** Shopify store owner who has installed the app but not signed in,  
**I want** to be directed appropriately to ensure I can manage my store within the app,  
**So that** I can seamlessly transition into the app's environment.

#### Acceptance Criteria:

- **Given** I have installed the Shopify app and not logged in,
- **When** I am redirected to the organization page,
- **Then** I am redirected to the login page, and upon logging in, I can connect my Shopify store to my organization.

---

## 1.Multi-Organization Management and Authentication Flow Overview

Purpose: To define the authentication and organization management processes for a system that supports multiple organizations under a single email ID and enables staff to create new, independent organizations.

#### Scope

- User registration and initial organization setup.
- Management of multiple organizations under one user account.
- Role-based access control within organizations.
- Capability for staff to create new organizations externally.

#### Assumptions

- Users can have multiple roles across different organizations.
- Data isolation is maintained between organizations.
- Users and staff can operate across multiple organizations without security compromises.

### User Story

#### Epic 1: User Registration and Organization Creation

#### User Story 1.1: Signing Up

As a new user,
I want to sign up using my email,
So that I can create and manage my own organization.

**Acceptance Criteria:**

- User provides email, password, and optionally, organization name during sign-up.
- System creates a new user account and an associated organization.
- User receives a confirmation email to verify their account.

#### User Story 1.2: Initial Login and Dashboard Access

As a verified user,
I want to log into my dashboard,
So that I can start managing my organization.

**Acceptance Criteria:**

- User logs in using their email and password.
- On successful login, the user is directed to their dashboard showing their organization(s).

### Epic 2: Managing Multiple Organizations

#### User Story 2.1: Creating Additional Organizations

As a registered user,
I want to create additional organizations,
So that I can manage multiple businesses or projects under one account.

**Acceptance Criteria:**

- From their dashboard, the user can initiate the creation of a new organization.
- User enters necessary details for the new organization and submits.
- The new organization is created and added to the user's dashboard.

#### User Story 2.2: Switching Between Organizations

As a user with multiple organizations,
I want to switch between different organizations seamlessly,
So that I can manage multiple aspects of my businesses from one account.

**Acceptance Criteria:**

- User can see a list or dropdown of their organizations on the dashboard.
- User can select any organization to view or manage from the dashboard.

### Epic 3: Role-Based Access Control

#### User Story 3.1: Adding Staff to an Organization

As an organization admin,
I want to add staff members to my organization and assign roles,
So that they can perform tasks according to their responsibilities.

**Acceptance Criteria:**

- Admin accesses the 'Manage Staff' section in the dashboard.
- Admin invites staff by email and assigns roles.
- Invited staff receive an email to join the organization.

#### User Story 3.2: Staff Creating New Organizations

As a staff member,
I want to create a new organization externally,
So that I can start my own independent project.

**Acceptance Criteria:**

- Staff accesses a separate section to create a new organization.
- Staff enters details for the new organization and submits.
- New organization is created without affecting existing roles in other organizations.

## 2.Authentication Flow Documentation

#### Introduction

This document provides a detailed overview of the authentication flow for our application. It covers both manual authentication (register, login) and authentication via Shopify app installation. The purpose of this README is to guide developers, project managers, and stakeholders through the correct implementation and expected user interactions.

#### Contents

- [Epic: User Authentication](#epic-user-authentication)
  - [Story 1: User Registration](#story-1-user-registration)
  - [Story 2: User Login](#story-2-user-login)
- [Epic: Shopify App Installation](#epic-shopify-app-installation)
  - [Story 3: Initial Shopify App Installation](#story-3-initial-shopify-app-installation)
  - [Story 4: Post-Installation App Setup](#story-4-post-installation-app-setup)
  - [Story 5: Connecting Shopify to Organization](#story-5-connecting-shopify-to-organization)
  - [Story 6: Handling Non-Authenticated Users Post-Installation](#story-6-handling-non-authenticated-users-post-installation)

---

### Epic: User Authentication

#### Story 1: User Registration

**As a** new user,  
**I want** to register an account,  
**So that** I can access personalized features and settings.

#### Acceptance Criteria:

- **Given** I am on the registration page,
- **When** I enter my name, email, and password, and submit the form,
- **Then** my account is created, and I am redirected to the login page.

#### Story 2: User Login

**As a** registered user,  
**I want** to log in to my account,  
**So that** I can securely access my personal data and configurations.

#### Acceptance Criteria:

- **Given** I have an existing account,
- **When** I enter my correct email and password on the login page and submit,
- **Then** I receive a JWT token, my session starts, and I am redirected to the organization page.

### Epic: Shopify App Installation

#### Story 3: Initial Shopify App Installation

**As a** Shopify store owner,  
**I want** to install the app from the Shopify app store,  
**So that** I can integrate Shopify's capabilities into my daily operations.

#### Acceptance Criteria:

- **Given** I am viewing the app in the Shopify app store,
- **When** I click on the `Install App` button and authorize the app in Shopify,
- **Then** I am redirected back to the app with proper parameters, and the app is configured with my store details.

### Story 4: Post-Installation App Setup

**As a** user,  
**I want** to complete setting up the app after installation,  
**So that** the app is fully integrated with my Shopify store and ready to use.

#### Acceptance Criteria:

- **Given** I have authorized the app on Shopify and redirected to "/auth/shopify",
- **When** the app receives my shop data and obtains an access token,
- **Then** my store data is stored in the app's database, and I am redirected to the organization page.

### Story 5: Connecting Shopify to Organization

**As a** logged-in user with an installed Shopify app,  
**I want** to connect my Shopify store to my organization in the app,  
**So that** I can manage the store's data within my organizational workflows.

#### Acceptance Criteria:

- **Given** the Shopify app is installed and I am on the organization page,
- **When** I select an organization and click "Connect Shopify",
- **Then** the app links my Shopify store with the selected organization and shows confirmation on the organization page.

### Story 6: Handling Non-Authenticated Users Post-Installation

**As a** Shopify store owner who has installed the app but not signed in,  
**I want** to be directed appropriately to ensure I can manage my store within the app,  
**So that** I can seamlessly transition into the app's environment.

#### Acceptance Criteria:

- **Given** I have installed the Shopify app and not logged in,
- **When** I am redirected to the organization page,
- **Then** I am redirected to the login page, and upon logging in, I can connect my Shopify store to my organization.

---
