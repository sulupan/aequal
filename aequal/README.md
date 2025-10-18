# Aequal Project

## Overview
Aequal is an educational application designed to assist students with hearing and vision impairments. The application provides interactive lessons and assessments tailored to the needs of these students, utilizing Firebase for authentication and data storage, and the Gemini API for AI-driven assessments.

## Features
- **User Authentication**: Secure sign-in and registration using Firebase.
- **Learning Modes**: Two distinct modes for lessons:
  - **Ears Mode**: For students with hearing impairments, featuring video lessons with sign language interpretation and chatbot tests.
  - **Eyes Mode**: For students with vision impairments, offering audio lessons and conversational assessments.
- **Progress Tracking**: Users can view their progress through interactive charts and detailed results tables.
- **Responsive Design**: The application is designed to be accessible and user-friendly across various devices.

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm (Node Package Manager)

### Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   cd aequal
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up Firebase:
   - Create a Firebase project and configure authentication.
   - Replace the Firebase configuration in the `src/hooks/useFirebaseInit.js` file with your project's credentials.

4. Set up the Gemini API:
   - Obtain your API key and insert it into the `src/utils/geminiApi.js` file.

### Running the Application
To start the development server, run:
```
npm run dev
```
Open your browser and navigate to `http://localhost:3000` to view the application.

### Building for Production
To create a production build, run:
```
npm run build
```

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.