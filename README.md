# Bachelor Room Booking Web App

A modern, mobile-responsive web application for booking bachelor rooms, inspired by platforms like OYO and Airbnb. Built with React, Firebase, and Material-UI.

## Features

- 🔐 User Authentication (Sign up, Login, Logout)
- 🏠 Room Listing and Search
- 💰 Room Booking System
- ❤️ Favorite Rooms
- 👤 User Dashboard
- 🏢 Seller Dashboard
- 👨‍💼 Admin Dashboard with Analytics
- 📱 Mobile Responsive Design
- 🎨 Modern UI with Material-UI
- ⚡ Smooth Animations with Framer Motion

## Tech Stack

- **Frontend:**
  - React
  - TypeScript
  - Material-UI
  - Framer Motion
  - React Router
  - React Hook Form
  - Zod (Validation)

- **Backend:**
  - Firebase Authentication
  - Firestore Database
  - Firebase Hosting

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/iamgokulkannan/pg_and_bachelor_room_rental.git
   cd bachelor-room-booking
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your Firebase configuration:
   ```
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── components/         # Reusable components
│   ├── common/        # Common UI components
│   ├── forms/         # Form components
│   └── layout/        # Layout components
├── context/           # React context providers
├── hooks/             # Custom React hooks
├── pages/             # Page components
│   ├── admin/         # Admin dashboard pages
│   ├── auth/          # Authentication pages
│   ├── seller/        # Seller dashboard pages
│   └── user/          # User dashboard pages
├── services/          # Firebase and other services
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

## Features in Detail

### User Features
- Browse and search rooms
- View room details
- Book rooms
- Add rooms to favorites
- Manage bookings
- View booking history

### Seller Features
- Create room listings
- Edit room details
- Delete room listings
- View booking requests
- Manage listings

### Admin Features
- View all users
- View all rooms
- View all bookings
- Analytics dashboard
- User management

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License

## Acknowledgments

- Material-UI for the beautiful UI components
- Firebase for the backend services
- React community for the amazing ecosystem 