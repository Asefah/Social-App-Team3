# Social-App-Team3

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
