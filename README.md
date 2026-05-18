# Hive5

## Project Overview
The proposed system addresses the lack of a centralized platform for students across the Five College Consortium to share events, resources, and opportunities. Currently, information about campus events, clubs, study resources, and community activities is spread across multiple websites, mailing lists, and social media pages, making it difficult for students to stay informed or explore opportunities outside their own campus. This system aims to create a single platform where students can easily discover events, connect with others, and access useful academic and campus resources.

The primary users of the system include students across the five colleges, as well as campus organizations, faculty, and staff who want to share events or opportunities. The goal is to strengthen collaboration and communication across campuses by providing features such as a social media–style posting feed, a hub for clubs and activities, a study help page focused on tips and explanations, and a page for local community events. By bringing these features together in one place, the platform helps students connect with like-minded peers, discover opportunities across the consortium, and build a stronger sense of community within the Five Colleges.


## AI Tools
ChatGPT and Cursor AI were used during development to help brainstorm UI ideas, troubleshoot issues, improve styling, and speed up frontend implementation. The final code, organization, and integration decisions were reviewed and implemented by the team throughout the development process.

## Tech Stack
- **Frontend**: React Native, Expo
- **Backend**: Node.js, Express
- **Database**: PostgreSQL

## Prerequisites
- Node.js (version 22 or higher)
- PostgreSQL
- Expo CLI (install globally with `npm install -g @expo/cli`)

## Installation
1. Clone the repository:
   ```
   git clone https://github.com/Asefah/Social-App-Team3.git
   cd Social-App-Team3
   ```

2. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your PostgreSQL database credentials in `.env`

3. Install dependencies:
   ```
   npm install
   ```

## Database Setup
1. Ensure PostgreSQL is installed and running.
2. Create a database named `event_app`:
   ```
   createdb event_app
   ```
3. Run the schema file to set up tables:
   ```
   psql -U postgres -d event_app -f backend/database/schema.sql
   ```

## Running the App
1. Start the backend server:
   ```
   npm run api
   ```
   This will start the backend on the default port (likely 3000 or as configured).

2. In a new terminal, start the frontend:
   ```
   npm run dev
   ```
   This will start the Expo development server. You can then run the app on a simulator, emulator, or physical device using the Expo Go app.

## API Documentation

The backend API runs on `http://localhost:5050` and provides endpoints for authentication, user management, events, and forum posts. All responses follow the format `{ success: boolean, ...data }`.

### Authentication

#### POST /login
Authenticate a user.
- **Request Body**:
  ```json
  {
    "email": "user@umass.edu",
    "password": "password123"
  }
  ```
- **Response** (success):
  ```json
  {
    "success": true,
    "user": {
      "username": "johndoe",
      "email": "user@umass.edu",
      "full_name": "John Doe",
      // ... other user fields
    }
  }
  ```

#### POST /register
Register a new user.
- **Request Body**:
  ```json
  {
    "username": "johndoe",
    "email": "user@umass.edu",
    "password": "password123",
    "fullName": "John Doe",
    "userSchool": "UMass Amherst",
    "userMajor": "Computer Science",
    "userYear": "2024",
    "userBio": "Student at UMass"
  }
  ```
- **Response** (success): Same as login response.

### Users

#### GET /profile?username={username}
Get user profile by username.
- **Response**:
  ```json
  {
    "success": true,
    "user": { /* user object */ }
  }
  ```

#### GET /user-by-email?email={email}
Get user by email.
- **Response**: Same as profile.

#### PUT /update-profile
Update user profile.
- **Request Body**:
  ```json
  {
    "username": "johndoe",
    "fullName": "John Doe Updated",
    "userSchool": "UMass Amherst",
    "userMajor": "Computer Science",
    "userYear": "2024",
    "userBio": "Updated bio"
  }
  ```

#### PUT /update-password
Update user password.
- **Request Body**:
  ```json
  {
    "username": "johndoe",
    "oldPassword": "oldpassword",
    "newPassword": "newpassword"
  }
  ```

#### GET /user-followers-count?username={username}
Get follower count for a user.
- **Response**:
  ```json
  {
    "success": true,
    "count": 42
  }
  ```

#### GET /user-following-count?username={username}
Get following count for a user.
- **Response**: Same as followers count.

### Events

#### POST /events
Create a new event.
- **Request Body**:
  ```json
  {
    "username": "johndoe",
    "eventName": "Study Group",
    "eventDate": "2024-05-15",
    "eventTime": "14:00",
    "eventLocation": "Library",
    "category": "Academic"
  }
  ```

#### GET /events
Get all events (supports query parameters for filtering).
- **Response**:
  ```json
  {
    "success": true,
    "events": [ /* array of event objects */ ]
  }
  ```

#### GET /events/user/{username}
Get events created by a specific user.

#### GET /events/category/{category}
Get events by category.

#### GET /events/{id}
Get details of a specific event.

#### PUT /events/{id}
Update an event (requires event creator username in body).

#### DELETE /events/{id}
Delete an event (requires event creator username in body).

#### PUT /events/{id}/rsvp
RSVP to an event.
- **Request Body**:
  ```json
  {
    "username": "johndoe"
  }
  ```

#### DELETE /events/{id}/rsvp
Remove RSVP from an event.
- **Request Body**: Same as RSVP.

### Posts (Forum)

#### POST /posts
Create a new forum post.
- **Request Body**:
  ```json
  {
    "username": "johndoe",
    "title": "Help with CS homework",
    "category": "Academic",
    "content": "I'm stuck on this problem..."
  }
  ```

#### GET /posts
Get all forum posts.

#### GET /posts/category/{category}
Get posts by category.

#### GET /posts/{id}
Get details of a specific post.

#### PUT /posts/{id}
Update a post.

#### DELETE /posts/{id}
Delete a post.

#### PUT /posts/{id}/like
Like a post.

#### PUT /posts/{id}/dislike
Dislike a post.

## Features
- User authentication (login/signup)
- Event discovery and management
- Forum for discussions
- Study resources and tips
- Profile management
- Cross-campus community building

## Usage
- Open the app on your device or simulator.
- Sign up or log in to access features.
- Explore events, forums, and resources.
- Post and interact with community content.

## AI Tools
ChatGPT and Cursor AI were used during development to help brainstorm UI ideas, troubleshoot issues, improve styling, and speed up frontend implementation. The final code, organization, and integration decisions were reviewed and implemented by the team throughout the development process.

## License
This project is licensed under the MIT License.
